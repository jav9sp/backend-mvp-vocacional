import { Op } from "sequelize";
import Enrollment from "../models/Enrollment.model.js";
import Attempt from "../models/Attempt.model.js";
import InapResult from "../models/InapResult.model.js";
import User from "../models/User.model.js";
import Test from "../models/Test.model.js";

export type AreaDim = { interes: number; aptitud: number; total: number };

export type AreaAggPct = {
  area: string;
  scoreSum: AreaDim;
  maxSum: AreaDim;
  pctAvg: AreaDim; // 0..100 con decimales
};

export type PeriodResultsRow = {
  resultId: number;
  attemptId: number;
  createdAt: string;
  topAreas: string[];
  attempt: {
    id: number;
    answeredCount: number;
    finishedAt: string | null;
  };
  student: {
    id: number;
    rut: string;
    name: string;
    email: string | null;
  } | null;
  test: {
    id: number;
    name: string;
    version: string | null;
    key: string | null;
  } | null;
};

export type AdminPeriodResultsData = {
  counts: {
    studentsCount: number;
    finishedCount: number;
    inProgressCount: number;
    notStartedCount: number;
  };
  resultsAvailableCount: number;
  aggregate: {
    topAreas: string[];
    byArea: AreaAggPct[];
  };
  page: number;
  pageSize: number;
  total: number;
  rows: PeriodResultsRow[];
};

function safeNum(n: any) {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

function emptyAreaDim(): AreaDim {
  return { interes: 0, aptitud: 0, total: 0 };
}

function pct(score: number, max: number) {
  return max === 0 ? 0 : (score / max) * 100;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export type AdminGetPeriodResultsParams = {
  periodId: number;

  // filtros
  q?: string;

  // paginación
  page?: number;
  pageSize?: number;
};

export async function adminGetPeriodResultsData(
  params: AdminGetPeriodResultsParams,
): Promise<AdminPeriodResultsData> {
  const periodId = params.periodId;

  const q = String(params.q ?? "").trim();
  const page = Math.max(Number(params.page ?? 1), 1);
  const pageSizeRaw = Number(params.pageSize ?? 25);
  const pageSize = Math.min(Math.max(pageSizeRaw, 1), 200);
  const offset = (page - 1) * pageSize;

  // filtro sobre estudiante (para la tabla)
  const userWhere: any = {};
  if (q) {
    userWhere[Op.or] = [
      { rut: { [Op.iLike]: `%${q}%` } },
      { name: { [Op.iLike]: `%${q}%` } },
      { email: { [Op.iLike]: `%${q}%` } },
    ];
  }

  // 1) COUNTS (globales)
  const [studentsCount, finishedCount, inProgressCount] = await Promise.all([
    Enrollment.count({ where: { periodId } }),
    Attempt.count({ where: { periodId, status: "finished" } }),
    Attempt.count({ where: { periodId, status: "in_progress" } }),
  ]);

  const notStartedCount = Math.max(
    studentsCount - finishedCount - inProgressCount,
    0,
  );

  // 2) resultsAvailableCount (cuántos InapResult existen para attempts finished del periodo)
  const resultsAvailableCount = await InapResult.count({
    include: [
      {
        model: Attempt,
        as: "attempt",
        required: true,
        attributes: [],
        where: { periodId, status: "finished" },
      },
    ],
  });

  // 3) Agregación ponderada por área (Σscore / Σmax)
  const resultsForAgg = await InapResult.findAll({
    attributes: ["scoresByAreaDim", "maxByAreaDim"],
    include: [
      {
        model: Attempt,
        as: "attempt",
        required: true,
        attributes: [],
        where: { periodId, status: "finished" },
      },
    ],
  });

  const aggMap = new Map<string, { scoreSum: AreaDim; maxSum: AreaDim }>();

  const ensure = (area: string) => {
    if (!aggMap.has(area)) {
      aggMap.set(area, { scoreSum: emptyAreaDim(), maxSum: emptyAreaDim() });
    }
    return aggMap.get(area)!;
  };

  for (const r of resultsForAgg as any[]) {
    const scores = (r.scoresByAreaDim ?? {}) as Record<string, AreaDim>;
    const maxes = (r.maxByAreaDim ?? {}) as Record<string, AreaDim>;

    const areas = new Set([...Object.keys(scores), ...Object.keys(maxes)]);
    for (const area of areas) {
      const acc = ensure(area);

      const s = scores[area] ?? emptyAreaDim();
      const m = maxes[area] ?? emptyAreaDim();

      acc.scoreSum.interes += safeNum(s.interes);
      acc.scoreSum.aptitud += safeNum(s.aptitud);
      acc.scoreSum.total += safeNum(s.total);

      acc.maxSum.interes += safeNum(m.interes);
      acc.maxSum.aptitud += safeNum(m.aptitud);
      acc.maxSum.total += safeNum(m.total);
    }
  }

  const byArea: AreaAggPct[] = Array.from(aggMap.entries())
    .map(([area, v]) => ({
      area,
      scoreSum: v.scoreSum,
      maxSum: v.maxSum,
      pctAvg: {
        interes: round2(pct(v.scoreSum.interes, v.maxSum.interes)),
        aptitud: round2(pct(v.scoreSum.aptitud, v.maxSum.aptitud)),
        total: round2(pct(v.scoreSum.total, v.maxSum.total)),
      },
    }))
    .sort((a, b) => b.pctAvg.total - a.pctAvg.total);

  const topAreasPeriod = byArea.slice(0, 5).map((x) => x.area);

  // 4) Tabla paginada (solo alumnos con resultado, para drill-down)
  const { rows: resultRows, count: total } = await InapResult.findAndCountAll({
    attributes: ["id", "attemptId", "topAreas", "createdAt"],
    include: [
      {
        model: Attempt,
        as: "attempt",
        required: true,
        attributes: ["id", "answeredCount", "finishedAt", "userId"],
        where: { periodId, status: "finished" },
        include: [
          {
            model: User,
            as: "user",
            required: true,
            attributes: ["id", "rut", "name", "email"],
            where: userWhere,
          },
          {
            model: Test,
            as: "test",
            required: false,
            attributes: ["id", "name", "version", "key"],
          },
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit: pageSize,
    offset,
    distinct: true,
  });

  const rows: PeriodResultsRow[] = (resultRows as any[]).map((r) => ({
    resultId: r.id,
    attemptId: r.attemptId,
    createdAt: new Date(r.createdAt).toISOString(),
    topAreas: r.topAreas ?? [],
    attempt: {
      id: r.attempt.id,
      answeredCount: r.attempt.answeredCount,
      finishedAt: r.attempt.finishedAt
        ? new Date(r.attempt.finishedAt).toISOString()
        : null,
    },
    student: r.attempt.user
      ? {
          id: r.attempt.user.id,
          rut: r.attempt.user.rut,
          name: r.attempt.user.name,
          email: r.attempt.user.email,
        }
      : null,
    test: r.attempt.test
      ? {
          id: r.attempt.test.id,
          name: r.attempt.test.name,
          version: r.attempt.test.version,
          key: r.attempt.test.key,
        }
      : null,
  }));

  return {
    counts: {
      studentsCount,
      finishedCount,
      inProgressCount,
      notStartedCount,
    },
    resultsAvailableCount,
    aggregate: {
      topAreas: topAreasPeriod,
      byArea,
    },
    page,
    pageSize,
    total: Number(total ?? 0),
    rows,
  };
}
