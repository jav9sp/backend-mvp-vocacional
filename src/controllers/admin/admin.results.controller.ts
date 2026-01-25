import { NextFunction, Request, Response } from "express";
import { z } from "zod";

import Attempt from "../../models/Attempt.model.js";
import InapResult from "../../models/InapResult.model.js";
import Period from "../../models/Period.model.js";
import User from "../../models/User.model.js";
import Test from "../../models/Test.model.js";

import { generateInapvPdfBuffer } from "../../services/generateInapvPdfBuffer.service.js";
import { InapvReportData } from "../../reports/inapv/renderInapvReportHtml.js";
import { recommendCareers } from "../../utils/recommendCareers.js";
import { CAREERS_MOCK } from "../../data/careersMock.js";
import {
  FINAL_CONSIDERATIONS,
  INAPV_AREA_INTERPRETATIONS,
  INAPV_GENERAL_EXPLANATION,
  INTEREST_LINKS,
} from "../../data/inapvInterpretations.js";

const ParamsSchema = z.object({
  attemptId: z.coerce.number().int().positive(),
});

export async function adminGetAttemptResult(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { organizationId } = req.auth!;

  try {
    const parsed = ParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: "Invalid attemptId" });
    }

    const { attemptId } = parsed.data;

    const attempt = await Attempt.findByPk(attemptId, {
      attributes: [
        "id",
        "status",
        "answeredCount",
        "finishedAt",
        "userId",
        "testId",
        "periodId",
      ],
      include: [
        {
          model: Period,
          as: "period",
          attributes: ["id", "organizationId", "name", "status", "testId"],
          where: { organizationId },
          required: true,
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "rut", "name", "email"],
          required: true,
        },
        {
          model: Test,
          as: "test",
          attributes: ["id", "name", "version"],
          required: true,
        },
      ],
    });

    if (!attempt) {
      return res.status(404).json({ ok: false, error: "Attempt not found" });
    }

    let result = null;

    if (attempt.status === "finished") {
      result = await InapResult.findOne({
        where: { attemptId: attempt.id },
        attributes: [
          "scoresByAreaDim",
          "percentByAreaDim",
          "topAreas",
          "createdAt",
        ],
      });
    }

    return res.json({
      ok: true,

      attempt: {
        id: attempt.id,
        status: attempt.status,
        answeredCount: attempt.answeredCount,
        finishedAt: attempt.finishedAt,
        userId: attempt.userId,
        testId: attempt.testId,
        periodId: attempt.periodId,
      },

      student: attempt.user
        ? {
            id: attempt.user.id,
            rut: attempt.user.rut,
            name: attempt.user.name,
            email: attempt.user.email,
          }
        : null,

      period: attempt.period
        ? {
            id: attempt.period.id,
            name: attempt.period.name,
            status: attempt.period.status,
            testId: attempt.period.testId,
          }
        : null,

      test: attempt.test
        ? {
            id: attempt.test.id,
            name: attempt.test.name,
            version: attempt.test.version,
          }
        : null,

      resultState: result ? "present" : "missing",

      result: result
        ? {
            scoresByAreaDim: result.scoresByAreaDim,
            percentByAreaDim: result.percentByAreaDim,
            topAreas: result.topAreas,
            createdAt: result.createdAt,
          }
        : null,
    });
  } catch (error) {
    return next(error);
  }
}

// ? Helpers para completar con los mock data
const byArea = Object.fromEntries(
  Object.entries(INAPV_AREA_INTERPRETATIONS).map(([k, v]) => [
    k,
    {
      interes: v.interes.high,
      aptitud: v.aptitud.high,
    },
  ]),
);

const finalConsiderationsPlain = FINAL_CONSIDERATIONS.replaceAll("**", "");

export async function adminGetAttemptReportPdf(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = ParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: "Invalid attemptId" });
    }

    const { attemptId } = parsed.data;
    const { organizationId } = req.auth!;

    // 1) Buscar attempt asegurando pertenencia a la organización vía Period
    const attempt = await Attempt.findByPk(attemptId, {
      attributes: [
        "id",
        "userId",
        "status",
        "createdAt",
        "finishedAt",
        "periodId",
      ],
      include: [
        {
          model: Period,
          as: "period",
          required: true,
          attributes: ["id", "organizationId"],
          where: { organizationId },
        },
        {
          model: Test,
          as: "test",
          required: true,
          attributes: ["id", "name", "version"],
        },
      ],
    });

    if (!attempt) {
      return res.status(404).json({ ok: false, error: "Attempt not found" });
    }

    // 2) Buscar result por attemptId (más robusto para admin)
    const result = await InapResult.findOne({
      where: { attemptId: attempt.id },
      attributes: ["id", "topAreas", "percentByAreaDim", "createdAt"],
    });

    if (!result) {
      return res.status(404).json({ ok: false, error: "Result not found" });
    }

    // 3) Traer estudiante (dueño del attempt)
    const student = await User.findByPk(attempt.userId, {
      attributes: ["id", "name", "email"],
    });

    const topAreas = (result.topAreas ?? []).slice(0, 3);

    const careers = recommendCareers({
      percentByAreaDim: result.percentByAreaDim ?? {},
      careers: CAREERS_MOCK,
      topAreas,
      mode: "combined",
      limit: 6,
      minPerArea: 2,
    });

    const reportData: InapvReportData = {
      student: {
        name: student?.name ?? "Estudiante",
        email: student?.email ?? null,
      },

      attempt: {
        id: attempt.id,
        finishedAt: attempt.finishedAt ?? attempt.createdAt,
        test: {
          name: attempt.test?.name ?? "INAP-V",
          version: attempt.test?.version ?? "v1",
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

    // nombre más user friendly
    const filename = `informe_inapv_attempt_${attempt.id}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    return res.send(pdf);
  } catch (err) {
    return next(err);
  }
}
