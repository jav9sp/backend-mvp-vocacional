import { Op } from "sequelize";
import Enrollment from "../models/Enrollment.model.js";
import Attempt from "../models/Attempt.model.js";
import InapResult from "../models/InapResult.model.js";
import CaasResult from "../models/CaasResult.model.js";
import User from "../models/User.model.js";
import Test from "../models/Test.model.js";
import Period from "../models/Period.model.js";
import type { CaasDimension } from "../data/caas.data.js";

export type AreaDim = { interes: number; aptitud: number; total: number };

export type AreaAggPct = {
  area: string;
  scoreSum: AreaDim;
  maxSum: AreaDim;
  pctAvg: AreaDim;
};

type CaasScore = { score: number; max: number; percentage: number };
type CaasScoresByDimension = Record<CaasDimension, CaasScore>;

export type CaasDimAgg = {
  dimension: string;
  scoreSum: number;
  maxSum: number;
  pctAvg: number;
};

export type PeriodResultType = "inapv" | "caas";

export type PeriodResultsRow = {
  resultId: number;
  attemptId: number;
  createdAt: string;
  topAreasByInteres: string[];
  topAreasByAptitud: string[];
  percentage: number | null;
  level: "bajo" | "medio" | "alto" | null;
  totalScore: number | null;
  maxScore: number | null;
  scoresByDimension: CaasScoresByDimension | null;
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
  resultType: PeriodResultType;
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
    byDimension: CaasDimAgg[];
    avgPercentage: number | null;
    levelCounts: {
      bajo: number;
      medio: number;
      alto: number;
    };
  };
  page: number;
  pageSize: number;
  total: number;
  rows: PeriodResultsRow[];
};

function safeNum(n: unknown) {
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

function normalizeTestKey(value?: string | null): PeriodResultType {
  const key = String(value ?? "")
    .trim()
    .toLowerCase();
  if (key === "caas") return "caas";
  return "inapv";
}

export type AdminGetPeriodResultsParams = {
  periodId: number;
  testKey?: string | null;
  q?: string;
  page?: number;
  pageSize?: number;
};

async function getCounts(periodId: number) {
  const [studentsCount, finishedCount, inProgressCount] = await Promise.all([
    Enrollment.count({ where: { periodId } }),
    Attempt.count({ where: { periodId, status: "finished" } }),
    Attempt.count({ where: { periodId, status: "in_progress" } }),
  ]);

  return {
    studentsCount,
    finishedCount,
    inProgressCount,
    notStartedCount: Math.max(studentsCount - finishedCount - inProgressCount, 0),
  };
}

async function getInapPeriodResultsData(args: {
  periodId: number;
  q: string;
  page: number;
  pageSize: number;
  offset: number;
  counts: AdminPeriodResultsData["counts"];
}): Promise<AdminPeriodResultsData> {
  const { periodId, q, page, pageSize, offset, counts } = args;

  const userWhere: any = {};
  if (q) {
    userWhere[Op.or] = [
      { rut: { [Op.iLike]: `%${q}%` } },
      { name: { [Op.iLike]: `%${q}%` } },
      { email: { [Op.iLike]: `%${q}%` } },
    ];
  }

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

  const { rows: resultRows, count: total } = await InapResult.findAndCountAll({
    attributes: [
      "id",
      "attemptId",
      "topAreasByInteres",
      "topAreasByAptitud",
      "createdAt",
    ],
    include: [
      {
        model: Attempt,
        as: "attempt",
        required: true,
        attributes: ["id", "answeredCount", "finishedAt", "userId", "periodId"],
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
            model: Period,
            as: "period",
            required: true,
            attributes: ["id", "name", "testId"],
            include: [
              {
                model: Test,
                as: "test",
                required: true,
                attributes: ["id", "key", "name", "version"],
              },
            ],
          },
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit: pageSize,
    offset,
    distinct: true,
  });

  const rows: PeriodResultsRow[] = (resultRows as any[]).map((r) => {
    const attempt = r.attempt;
    const student = attempt?.user ?? null;
    const period = attempt?.period ?? null;
    const test = period?.test ?? null;

    return {
      resultId: r.id,
      attemptId: r.attemptId,
      createdAt: new Date(r.createdAt).toISOString(),
      topAreasByInteres: r.topAreasByInteres ?? [],
      topAreasByAptitud: r.topAreasByAptitud ?? [],
      percentage: null,
      level: null,
      totalScore: null,
      maxScore: null,
      scoresByDimension: null,
      attempt: {
        id: attempt.id,
        answeredCount: attempt.answeredCount,
        finishedAt: attempt.finishedAt
          ? new Date(attempt.finishedAt).toISOString()
          : null,
      },
      student: student
        ? {
            id: student.id,
            rut: student.rut,
            name: student.name,
            email: student.email,
          }
        : null,
      test: test
        ? {
            id: test.id,
            name: test.name,
            version: test.version,
            key: test.key,
          }
        : null,
    };
  });

  return {
    resultType: "inapv",
    counts,
    resultsAvailableCount,
    aggregate: {
      topAreas: topAreasPeriod,
      byArea,
      byDimension: [],
      avgPercentage: null,
      levelCounts: { bajo: 0, medio: 0, alto: 0 },
    },
    page,
    pageSize,
    total: Number(total ?? 0),
    rows,
  };
}

async function getCaasPeriodResultsData(args: {
  periodId: number;
  q: string;
  page: number;
  pageSize: number;
  offset: number;
  counts: AdminPeriodResultsData["counts"];
}): Promise<AdminPeriodResultsData> {
  const { periodId, q, page, pageSize, offset, counts } = args;

  const userWhere: any = {};
  if (q) {
    userWhere[Op.or] = [
      { rut: { [Op.iLike]: `%${q}%` } },
      { name: { [Op.iLike]: `%${q}%` } },
      { email: { [Op.iLike]: `%${q}%` } },
    ];
  }

  const resultsAvailableCount = await CaasResult.count({
    include: [
      {
        model: Attempt,
        required: true,
        attributes: [],
        where: { periodId, status: "finished" },
      },
    ],
  });

  const resultsForAgg = await CaasResult.findAll({
    attributes: [
      "percentage",
      "level",
      "totalScore",
      "maxScore",
      "scoresByDimension",
    ],
    include: [
      {
        model: Attempt,
        required: true,
        attributes: [],
        where: { periodId, status: "finished" },
      },
    ],
  });

  const dimMap = new Map<string, { scoreSum: number; maxSum: number }>();
  const levelCounts = { bajo: 0, medio: 0, alto: 0 };
  let pctSum = 0;
  let pctCount = 0;

  for (const r of resultsForAgg as any[]) {
    const p = safeNum(r.percentage);
    if (p > 0 || r.percentage === 0) {
      pctSum += p;
      pctCount += 1;
    }

    const level = String(r.level ?? "").toLowerCase();
    if (level === "bajo" || level === "medio" || level === "alto") {
      levelCounts[level] += 1;
    }

    const dims = (r.scoresByDimension ?? {}) as Record<string, CaasScore>;
    for (const [key, score] of Object.entries(dims)) {
      if (!dimMap.has(key)) dimMap.set(key, { scoreSum: 0, maxSum: 0 });
      const acc = dimMap.get(key)!;
      acc.scoreSum += safeNum(score?.score);
      acc.maxSum += safeNum(score?.max);
    }
  }

  const byDimension: CaasDimAgg[] = Array.from(dimMap.entries())
    .map(([dimension, v]) => ({
      dimension,
      scoreSum: round2(v.scoreSum),
      maxSum: round2(v.maxSum),
      pctAvg: round2(pct(v.scoreSum, v.maxSum)),
    }))
    .sort((a, b) => b.pctAvg - a.pctAvg);

  const { rows: resultRows, count: total } = await CaasResult.findAndCountAll({
    attributes: [
      "id",
      "attemptId",
      "totalScore",
      "maxScore",
      "percentage",
      "scoresByDimension",
      "level",
      "createdAt",
    ],
    include: [
      {
        model: Attempt,
        required: true,
        attributes: ["id", "answeredCount", "finishedAt", "userId", "periodId"],
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
            model: Period,
            as: "period",
            required: true,
            attributes: ["id", "name", "testId"],
            include: [
              {
                model: Test,
                as: "test",
                required: true,
                attributes: ["id", "key", "name", "version"],
              },
            ],
          },
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit: pageSize,
    offset,
    distinct: true,
  });

  const rows: PeriodResultsRow[] = (resultRows as any[]).map((r) => {
    const attempt = r.attempt;
    const student = attempt?.user ?? null;
    const period = attempt?.period ?? null;
    const test = period?.test ?? null;

    return {
      resultId: r.id,
      attemptId: r.attemptId,
      createdAt: new Date(r.createdAt).toISOString(),
      topAreasByInteres: [],
      topAreasByAptitud: [],
      percentage: safeNum(r.percentage),
      level: r.level ?? null,
      totalScore: safeNum(r.totalScore),
      maxScore: safeNum(r.maxScore),
      scoresByDimension: (r.scoresByDimension ?? null) as CaasScoresByDimension | null,
      attempt: {
        id: attempt.id,
        answeredCount: attempt.answeredCount,
        finishedAt: attempt.finishedAt
          ? new Date(attempt.finishedAt).toISOString()
          : null,
      },
      student: student
        ? {
            id: student.id,
            rut: student.rut,
            name: student.name,
            email: student.email,
          }
        : null,
      test: test
        ? {
            id: test.id,
            name: test.name,
            version: test.version,
            key: test.key,
          }
        : null,
    };
  });

  return {
    resultType: "caas",
    counts,
    resultsAvailableCount,
    aggregate: {
      topAreas: [],
      byArea: [],
      byDimension,
      avgPercentage: pctCount > 0 ? round2(pctSum / pctCount) : null,
      levelCounts,
    },
    page,
    pageSize,
    total: Number(total ?? 0),
    rows,
  };
}

export async function adminGetPeriodResultsData(
  params: AdminGetPeriodResultsParams,
): Promise<AdminPeriodResultsData> {
  const periodId = params.periodId;
  const q = String(params.q ?? "").trim();
  const page = Math.max(Number(params.page ?? 1), 1);
  const pageSizeRaw = Number(params.pageSize ?? 25);
  const pageSize = Math.min(Math.max(pageSizeRaw, 1), 2000);
  const offset = (page - 1) * pageSize;

  const counts = await getCounts(periodId);
  const testType = normalizeTestKey(params.testKey);

  if (testType === "caas") {
    return getCaasPeriodResultsData({
      periodId,
      q,
      page,
      pageSize,
      offset,
      counts,
    });
  }

  return getInapPeriodResultsData({
    periodId,
    q,
    page,
    pageSize,
    offset,
    counts,
  });
}
