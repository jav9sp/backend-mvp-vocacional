import type { Career } from "../data/careersMock.js";

export type PercentByAreaDim = Record<
  string,
  { interes: number; aptitud: number; total: number }
>;

export type RecommendMode = "interes" | "aptitud" | "combined";

export type CareerRecommendation = Career & {
  score: number; // 0..100 aprox
};

export function recommendCareers(args: {
  percentByAreaDim: PercentByAreaDim;
  careers: Career[];
  mode?: RecommendMode;
  limit?: number;
  topAreas?: string[]; // idealmente 3
  weights?: { interes: number; aptitud: number };
  // opcional: fuerza mínimo por área (útil para que salgan 1-2 por cada topArea)
  minPerArea?: number;
}) {
  const {
    percentByAreaDim,
    careers,
    mode = "combined",
    limit = 6,
    topAreas,
    weights = { interes: 0.6, aptitud: 0.4 },
    minPerArea = 1,
  } = args;

  // si vienen topAreas, restringimos a esas áreas
  const allowed = topAreas?.length ? new Set(topAreas) : null;

  const scoreArea = (areaKey: string) => {
    const v = percentByAreaDim[areaKey];
    const interes = Number(v?.interes ?? 0);
    const aptitud = Number(v?.aptitud ?? 0);

    if (mode === "interes") return interes;
    if (mode === "aptitud") return aptitud;

    // combined
    return interes * weights.interes + aptitud * weights.aptitud;
  };

  const scored: CareerRecommendation[] = careers
    .filter((c) => (allowed ? allowed.has(c.areaKey) : true))
    .map((c) => ({
      ...c,
      score: scoreArea(c.areaKey),
    }))
    .sort((a, b) => b.score - a.score);

  // ✅ diversidad simple: intenta asegurar al menos minPerArea por cada topArea
  // y luego completa por score.
  const out: CareerRecommendation[] = [];
  const perAreaCount: Record<string, number> = {};

  if (allowed) {
    // primer pase: garantiza mínimos por área
    for (const areaKey of topAreas ?? []) {
      for (const item of scored) {
        if (out.length >= limit) break;
        if (item.areaKey !== areaKey) continue;
        if ((perAreaCount[areaKey] ?? 0) >= minPerArea) break;
        if (out.some((x) => x.id === item.id)) continue;

        out.push(item);
        perAreaCount[areaKey] = (perAreaCount[areaKey] ?? 0) + 1;
      }
    }
  }

  // segundo pase: completa por score
  for (const item of scored) {
    if (out.length >= limit) break;
    if (out.some((x) => x.id === item.id)) continue;
    out.push(item);
  }

  return out;
}
