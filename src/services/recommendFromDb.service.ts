import { Op } from "sequelize";
import StudentPreferredInstitution from "../models/StudentPreferredInstitution.model.js";
import OfferFlat from "../models/OfferFlat.model.js";
import type { PercentByAreaDim, RecommendMode } from "../utils/recommendCareers.js";

export type DbCareerRecommendation = {
  careerId: number;
  name: string;
  areaKey: string;
  score: number;
  institutionId: number;
  institutionName: string;
  locationName: string;
  cutScore: number | null;
  institutionIsPace: boolean;
  institutionHasGratuity: boolean;
  demreCode: number;
};

export type RecommendFromDbResult = {
  data: DbCareerRecommendation[];
  hasPreferences: boolean;
};

export async function recommendFromDb(args: {
  percentByAreaDim: PercentByAreaDim;
  topAreas: string[];
  userId: number;
  mode?: RecommendMode;
  limit?: number;
  weights?: { interes: number; aptitud: number };
  minPerArea?: number;
  maxPerInstitution?: number;
}): Promise<RecommendFromDbResult> {
  const {
    percentByAreaDim,
    topAreas,
    userId,
    mode = "combined",
    limit = 9,
    weights = { interes: 0.6, aptitud: 0.4 },
    minPerArea = 1,
    maxPerInstitution = 3,
  } = args;

  // 1. Obtener instituciones preferidas del estudiante
  const prefs = await StudentPreferredInstitution.findAll({
    where: { userId },
    attributes: ["institutionId"],
    raw: true,
  });

  if (prefs.length === 0) {
    return { data: [], hasPreferences: false };
  }

  const preferredIds = prefs.map((p) => p.institutionId);

  // 2. Consultar ofertas filtradas por áreas top + instituciones preferidas
  if (!topAreas.length) {
    return { data: [], hasPreferences: true };
  }

  const rows = await OfferFlat.findAll({
    where: {
      vocationalAreaKey: { [Op.in]: topAreas },
      institutionId: { [Op.in]: preferredIds },
    },
    attributes: [
      "careerId",
      "career",
      "vocationalAreaKey",
      "institutionId",
      "institutionName",
      "locationName",
      "cutScore",
      "institutionIsPace",
      "institutionHasGratuity",
      "demreCode",
    ],
    raw: true,
    limit: 200,
  });

  if (rows.length === 0) {
    return { data: [], hasPreferences: true };
  }

  // 3. Deduplicar por (careerId, institutionId) - queda el primero
  const seen = new Set<string>();
  const unique: typeof rows = [];
  for (const row of rows) {
    const key = `${row.careerId}-${row.institutionId}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(row);
    }
  }

  // 4. Scoring (misma lógica que recommendCareers.ts)
  const scoreArea = (areaKey: string) => {
    const v = percentByAreaDim[areaKey];
    const interes = Number(v?.interes ?? 0);
    const aptitud = Number(v?.aptitud ?? 0);

    if (mode === "interes") return interes;
    if (mode === "aptitud") return aptitud;
    return interes * weights.interes + aptitud * weights.aptitud;
  };

  const scored: DbCareerRecommendation[] = unique
    .map((row) => ({
      careerId: row.careerId,
      name: row.career,
      areaKey: row.vocationalAreaKey,
      score: scoreArea(row.vocationalAreaKey),
      institutionId: row.institutionId,
      institutionName: row.institutionName,
      locationName: row.locationName,
      cutScore: row.cutScore ?? null,
      institutionIsPace: row.institutionIsPace,
      institutionHasGratuity: row.institutionHasGratuity,
      demreCode: row.demreCode,
    }))
    .sort((a, b) => b.score - a.score);

  // 5. Diversidad: mínimo por área + cap por institución
  const out: DbCareerRecommendation[] = [];
  const perAreaCount: Record<string, number> = {};
  const perInstCount: Record<number, number> = {};

  const canAdd = (item: DbCareerRecommendation) =>
    (perInstCount[item.institutionId] ?? 0) < maxPerInstitution;

  // Primer pase: garantiza mínimos por área
  for (const areaKey of topAreas) {
    for (const item of scored) {
      if (out.length >= limit) break;
      if (item.areaKey !== areaKey) continue;
      if ((perAreaCount[areaKey] ?? 0) >= minPerArea) break;
      if (out.some((x) => x.careerId === item.careerId && x.institutionId === item.institutionId)) continue;
      if (!canAdd(item)) continue;

      out.push(item);
      perAreaCount[areaKey] = (perAreaCount[areaKey] ?? 0) + 1;
      perInstCount[item.institutionId] = (perInstCount[item.institutionId] ?? 0) + 1;
    }
  }

  // Segundo pase: completa por score
  for (const item of scored) {
    if (out.length >= limit) break;
    if (out.some((x) => x.careerId === item.careerId && x.institutionId === item.institutionId)) continue;
    if (!canAdd(item)) continue;
    out.push(item);
    perInstCount[item.institutionId] = (perInstCount[item.institutionId] ?? 0) + 1;
  }

  return { data: out, hasPreferences: true };
}
