import { NextFunction, Request, Response } from "express";
import { z } from "zod";

import Attempt from "../../models/Attempt.model.js";
import InapResult from "../../models/InapResult.model.js";
import CaasResult from "../../models/CaasResult.model.js";
import Test from "../../models/Test.model.js";
import User from "../../models/User.model.js";
import Period from "../../models/Period.model.js";

import { generateInapvPdfBuffer } from "../../services/generateInapvPdfBuffer.service.js";
import { InapvReportData } from "../../reports/inapv/renderInapvReportHtml.js";
import { recommendCareers } from "../../utils/recommendCareers.js";
import {
  INAPV_GENERAL_EXPLANATION,
  INAPV_AREA_INTERPRETATIONS,
  FINAL_CONSIDERATIONS,
  INTEREST_LINKS,
} from "../../data/inapvInterpretations.js";
import { CAREERS_MOCK } from "../../data/careersMock.js";

function toFiniteNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function listStudentResults(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.auth!.userId;

    const [inapResults, caasResults] = await Promise.all([
      InapResult.findAll({
        attributes: [
          "id",
          "scoresByAreaDim",
          "maxByAreaDim",
          "percentByAreaDim",
          "topAreas",
          "createdAt",
        ],
        include: [
          {
            model: Attempt,
            as: "attempt",
            required: true,
            attributes: ["id", "createdAt", "finishedAt", "periodId", "status"],
            where: { userId, status: "finished" },
            include: [
              {
                model: Period,
                as: "period",
                required: true,
                attributes: ["id", "name", "testId", "startAt", "endAt"],
                include: [
                  {
                    model: Test,
                    as: "test",
                    required: true,
                    attributes: ["id", "key", "version", "name"],
                  },
                ],
              },
            ],
          },
        ],
      }),
      CaasResult.findAll({
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
            attributes: ["id", "createdAt", "finishedAt", "periodId", "status"],
            where: { userId, status: "finished" },
            include: [
              {
                model: Period,
                as: "period",
                required: true,
                attributes: ["id", "name", "testId", "startAt", "endAt"],
                include: [
                  {
                    model: Test,
                    as: "test",
                    required: true,
                    attributes: ["id", "key", "version", "name"],
                  },
                ],
              },
            ],
          },
        ],
      }),
    ]);

    const normalizedInap = inapResults.map((r: any) => ({
      id: r.id,
      resultType: "inapv" as const,
      createdAt: r.createdAt,

      scoresByAreaDim: r.scoresByAreaDim,
      maxByAreaDim: r.maxByAreaDim,
      percentByAreaDim: r.percentByAreaDim,
      topAreas: r.topAreas,

      totalScore: null,
      maxScore: null,
      percentage: null,
      scoresByDimension: null,
      level: null,

      attempt: {
        id: r.attempt.id,
        status: r.attempt.status,
        createdAt: r.attempt.createdAt,
        finishedAt: r.attempt.finishedAt,
      },
      period: {
        id: r.attempt.period.id,
        name: r.attempt.period.name,
        startAt: r.attempt.period.startAt,
        endAt: r.attempt.period.endAt,
      },
      test: {
        id: r.attempt.period.test.id,
        key: r.attempt.period.test.key,
        version: r.attempt.period.test.version,
        name: r.attempt.period.test.name,
      },
    }));

    const normalizedCaas = caasResults.map((r: any) => ({
      id: r.id,
      resultType: "caas" as const,
      createdAt: r.createdAt,

      scoresByAreaDim: null,
      maxByAreaDim: null,
      percentByAreaDim: null,
      topAreas: [],

      totalScore: toFiniteNumber(r.totalScore),
      maxScore: toFiniteNumber(r.maxScore),
      percentage: toFiniteNumber(r.percentage),
      scoresByDimension: r.scoresByDimension ?? {},
      level: r.level ?? null,

      attempt: {
        id: r.attempt.id,
        status: r.attempt.status,
        createdAt: r.attempt.createdAt,
        finishedAt: r.attempt.finishedAt,
      },
      period: {
        id: r.attempt.period.id,
        name: r.attempt.period.name,
        startAt: r.attempt.period.startAt,
        endAt: r.attempt.period.endAt,
      },
      test: {
        id: r.attempt.period.test.id,
        key: r.attempt.period.test.key,
        version: r.attempt.period.test.version,
        name: r.attempt.period.test.name,
      },
    }));

    const results = [...normalizedInap, ...normalizedCaas].sort((a, b) => {
      const da = new Date(a.createdAt ?? 0).getTime();
      const db = new Date(b.createdAt ?? 0).getTime();
      return db - da;
    });

    // Return [] para evitar retries del front
    return res.json({
      ok: true,
      results,
    });
  } catch (error) {
    return next(error);
  }
}

const ParamsSchema = z.object({
  resultsId: z.coerce.number().int().positive(),
});
const ResultDetailsQuerySchema = z.object({
  testKey: z.enum(["inapv", "caas"]).optional(),
});

export async function getResultDetails(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId } = req.auth;

    const parsed = ParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: "Invalid resultsId" });
    }

    const { resultsId } = parsed.data;
    const parsedQuery = ResultDetailsQuerySchema.safeParse(req.query);
    const testKey = parsedQuery.success ? parsedQuery.data.testKey : undefined;

    const findInap = async () =>
      InapResult.findByPk(resultsId, {
        attributes: [
          "id",
          "scoresByAreaDim",
          "maxByAreaDim",
          "percentByAreaDim",
          "topAreas",
          "createdAt",
        ],
        include: [
          {
            model: Attempt,
            as: "attempt",
            required: true,
            attributes: ["id", "createdAt", "finishedAt", "status"],
            where: { userId, status: "finished" },
            include: [
              {
                model: Period,
                as: "period",
                required: true,
                attributes: ["id", "name", "startAt", "endAt"],
                include: [
                  {
                    model: Test,
                    as: "test",
                    required: true,
                    attributes: ["id", "key", "version", "name"],
                  },
                ],
              },
            ],
          },
        ],
      });

    const findCaas = async () =>
      CaasResult.findByPk(resultsId, {
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
            attributes: ["id", "createdAt", "finishedAt", "status"],
            where: { userId, status: "finished" },
            include: [
              {
                model: Period,
                as: "period",
                required: true,
                attributes: ["id", "name", "startAt", "endAt"],
                include: [
                  {
                    model: Test,
                    as: "test",
                    required: true,
                    attributes: ["id", "key", "version", "name"],
                  },
                ],
              },
            ],
          },
        ],
      });

    let inapResult: any = null;
    let caasResult: any = null;

    if (testKey === "inapv") {
      inapResult = await findInap();
    } else if (testKey === "caas") {
      caasResult = await findCaas();
    } else {
      inapResult = await findInap();
      if (!inapResult) {
        caasResult = await findCaas();
      }
    }

    if (!inapResult && !caasResult) {
      return res.status(404).json({
        ok: false,
        error: "Result not found for this user.",
      });
    }

    if (inapResult) {
      return res.json({
        ok: true,
        result: {
          id: inapResult.id,
          resultType: "inapv",
          createdAt: inapResult.createdAt,
          scoresByAreaDim: inapResult.scoresByAreaDim,
          maxByAreaDim: inapResult.maxByAreaDim,
          percentByAreaDim: inapResult.percentByAreaDim,
          topAreas: inapResult.topAreas,

          totalScore: null,
          maxScore: null,
          percentage: null,
          scoresByDimension: null,
          level: null,

          attempt: {
            id: inapResult.attempt.id,
            status: inapResult.attempt.status,
            createdAt: inapResult.attempt.createdAt,
            finishedAt: inapResult.attempt.finishedAt,
          },
          period: {
            id: inapResult.attempt.period.id,
            name: inapResult.attempt.period.name,
            startAt: inapResult.attempt.period.startAt,
            endAt: inapResult.attempt.period.endAt,
          },
          test: {
            id: inapResult.attempt.period.test.id,
            key: inapResult.attempt.period.test.key,
            version: inapResult.attempt.period.test.version,
            name: inapResult.attempt.period.test.name,
          },
        },
      });
    }

    const result = caasResult!;
    return res.json({
      ok: true,
      result: {
        id: result.id,
        resultType: "caas",
        createdAt: result.createdAt,

        scoresByAreaDim: null,
        maxByAreaDim: null,
        percentByAreaDim: null,
        topAreas: [],

        totalScore: toFiniteNumber(result.totalScore),
        maxScore: toFiniteNumber(result.maxScore),
        percentage: toFiniteNumber(result.percentage),
        scoresByDimension: result.scoresByDimension ?? {},
        level: result.level ?? null,

        attempt: {
          id: result.attempt.id,
          status: result.attempt.status,
          createdAt: result.attempt.createdAt,
          finishedAt: result.attempt.finishedAt,
        },
        period: {
          id: result.attempt.period.id,
          name: result.attempt.period.name,
          startAt: result.attempt.period.startAt,
          endAt: result.attempt.period.endAt,
        },
        test: {
          id: result.attempt.period.test.id,
          key: result.attempt.period.test.key,
          version: result.attempt.period.test.version,
          name: result.attempt.period.test.name,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
}

const byArea = Object.fromEntries(
  Object.entries(INAPV_AREA_INTERPRETATIONS).map(([k, v]) => [
    k,
    {
      interes: v.interes.high,
      aptitud: v.aptitud.high,
    },
  ]),
);

// opcional: limpia markdown simple (** **), porque tu render hace escapeHtml
const finalConsiderationsPlain = FINAL_CONSIDERATIONS.replaceAll("**", "");

export async function getResultPdf(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = ParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: "Invalid resultsId" });
    }

    const { resultsId } = parsed.data;
    const userId = req.auth!.userId;
    const orgId = req.auth!.organizationId;

    // 🔒 Trae solo si:
    // - result pertenece al attempt del usuario
    // - attempt está finished (opcional pero recomendable para PDF)
    // - el period pertenece a la org del user (scoping)
    const result = await InapResult.findOne({
      where: { id: resultsId },
      attributes: ["id", "topAreas", "percentByAreaDim", "createdAt"],
      include: [
        {
          model: Attempt,
          as: "attempt",
          required: true,
          attributes: ["id", "userId", "status", "createdAt", "finishedAt"],
          where: { userId, status: "finished" },
          include: [
            {
              model: Period,
              as: "period",
              required: true,
              attributes: [
                "id",
                "organizationId",
                "name",
                "testId",
                "startAt",
                "endAt",
              ],
              where: { organizationId: orgId },
              include: [
                {
                  model: Test,
                  as: "test",
                  required: true,
                  attributes: ["id", "key", "version", "name"],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!result) {
      return res.status(404).json({ ok: false, error: "Result not found" });
    }

    // opcional: datos del estudiante
    const student = await User.findByPk(userId, {
      attributes: ["id", "name", "email"],
    });

    const topAreas = (result.topAreas ?? []).slice(0, 3);

    const careers = recommendCareers({
      percentByAreaDim: (result.percentByAreaDim ?? {}) as any,
      careers: CAREERS_MOCK,
      topAreas,
      mode: "combined",
      limit: 6,
      minPerArea: 2,
    });

    const attempt = (result as any).attempt;
    const period = attempt.period;
    const test = period.test;

    const reportData: InapvReportData = {
      student: {
        name: student?.name ?? "Estudiante",
        email: student?.email ?? null,
      },

      attempt: {
        id: attempt.id,
        finishedAt: attempt.finishedAt ?? attempt.createdAt,
        period: {
          id: period.id,
          name: period.name,
          startAt: period.startAt,
          endAt: period.endAt ?? null,
          test: {
            id: test.id,
            name: test.name,
            version: test.version,
          },
        },
      },

      result: {
        id: result.id,
        createdAt: result.createdAt,
        topAreas: topAreas as any,
        percentByAreaDim: (result.percentByAreaDim ?? {}) as any,
      },

      interpretations: {
        interes: INAPV_GENERAL_EXPLANATION.interes,
        aptitud: INAPV_GENERAL_EXPLANATION.aptitud,
        combined: INAPV_GENERAL_EXPLANATION.combined,
        byArea,
      },

      careers: careers.map((c) => ({
        id: Number(String(c.id).replace(/\D/g, "")) || 0,
        name: c.name,
        areaKey: c.areaKey,
        score: c.score,
      })),

      links: INTEREST_LINKS,
      finalConsiderations: finalConsiderationsPlain,
      logoDataUri: null,
    };

    const pdf = await generateInapvPdfBuffer(reportData);

    const safeKey = test.key ?? "test";
    const safeVersion = test.version ?? "v1";
    const filename = `${safeKey}_${safeVersion}_result_${result.id}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    return res.send(pdf);
  } catch (err) {
    return next(err);
  }
}
