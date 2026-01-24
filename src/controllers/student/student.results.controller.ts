import { NextFunction, Request, Response } from "express";
import { z } from "zod";

import Attempt from "../../models/Attempt.model.js";
import InapResult from "../../models/InapResult.model.js";
import Test from "../../models/Test.model.js";
import User from "../../models/User.model.js";

import { generateInapvPdfBuffer } from "../../services/generateInapvPdfBuffer.js";
import { InapvReportData } from "../../reports/inapv/renderInapvReportHtml.js";
import { recommendCareers } from "../../utils/recommendCareers.js";
import {
  INAPV_GENERAL_EXPLANATION,
  INAPV_AREA_INTERPRETATIONS,
  FINAL_CONSIDERATIONS,
  INTEREST_LINKS,
} from "../../data/inapvInterpretations.js";
import { CAREERS_MOCK } from "../../data/careersMock.js";

export async function listStudentResults(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId } = req.auth;

    const results = await InapResult.findAll({
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
          attributes: ["id", "createdAt", "finishedAt"],
          where: { userId, status: "finished" },
          include: [
            {
              model: Test,
              as: "test",
              required: true,
              attributes: ["id", "name", "version"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Return [] para evitar retries del front
    if (results.length === 0) {
      return res.json({
        ok: true,
        results,
      });
    }

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

    const result = await InapResult.findByPk(resultsId, {
      include: [
        {
          model: Attempt,
          as: "attempt",
          required: true,
          where: {
            userId,
          },
          attributes: ["id", "status", "createdAt"],
          include: [
            {
              model: Test,
              as: "test",
              required: true,
              attributes: ["id", "name", "version"],
            },
          ],
        },
      ],
    });

    if (!result) {
      return res.status(404).json({
        ok: false,
        error: "Result not found for this user.",
      });
    }

    return res.json({
      ok: true,
      result,
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

    const result = await InapResult.findByPk(resultsId, {
      include: [
        {
          model: Attempt,
          as: "attempt",
          required: true,
          attributes: ["id", "userId", "status", "createdAt", "finishedAt"],
          include: [
            {
              model: Test,
              as: "test",
              required: true,
              attributes: ["id", "name", "version"],
            },
          ],
        },
      ],
    });

    if (!result || !result.attempt) {
      return res.status(404).json({ ok: false, error: "Result not found" });
    }

    if (result.attempt.userId !== userId) {
      return res.status(403).json({ ok: false, error: "Forbidden" });
    }

    // opcional: datos del estudiante
    const student = await User.findByPk(userId, {
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
        id: result.attempt.id,
        finishedAt: result.attempt.finishedAt ?? result.attempt.createdAt,
        test: {
          name: result.attempt.test?.name ?? "INAP-V",
          version: result.attempt.test?.version ?? "v1",
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
        id: Number(String(c.id).replace(/\D/g, "")) || 0, // si tu template exige number
        name: c.name,
        areaKey: c.areaKey,
        score: c.score,
      })),

      links: INTEREST_LINKS,

      finalConsiderations: finalConsiderationsPlain,

      logoDataUri: null,
    };

    // ✅ generar PDF con tu service
    const pdf = await generateInapvPdfBuffer(reportData);

    const filename = `inapv_result_${result.id}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    return res.send(pdf);
  } catch (err) {
    return next(err);
  }
}
