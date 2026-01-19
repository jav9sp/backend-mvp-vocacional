import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import Attempt from "../models/Attempt.model.js";
import Result from "../models/Result.model.js";
import Test from "../models/Test.model.js";
import Period from "../models/Period.model.js";

export async function listStudentResults(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId } = req.auth;

    const results = await Result.findAll({
      attributes: [
        "id",
        "scoresByArea",
        "scoresByAreaDim",
        "topAreas",
        "createdAt",
      ],
      include: [
        {
          model: Attempt,
          as: "attempt",
          required: true,
          attributes: ["id", "createdAt"],
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

    if (results.length === 0) {
      return res
        .status(404)
        .json({ ok: false, error: "Not existing results for the student." });
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

    const result = await Result.findByPk(resultsId, {
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

export async function getMyLatestResult(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { userId, organizationId } = req.auth!;
  try {
    const activeTest = await Test.findOne({ where: { isActive: true } });
    if (!activeTest)
      return res.status(500).json({ ok: false, error: "No active test" });

    const period = await Period.findOne({
      where: { organizationId, status: "active" },
      order: [["createdAt", "DESC"]],
      attributes: ["id", "testId", "status"],
    });
    if (!period)
      res.status(404).json({
        ok: true,
        status: "no_active_period",
        attempt: null,
        result: null,
      });

    const attempt = await Attempt.findOne({
      where: { userId, periodId: period.id },
      order: [["createdAt", "DESC"]],
      attributes: ["id", "status", "answeredCount", "finishedAt"],
    });

    if (!attempt) {
      return res.json({
        ok: true,
        status: "not_started",
        attempt: null,
        result: null,
      });
    }

    if (attempt.status !== "finished") {
      return res.json({
        ok: true,
        status: attempt.status,
        attempt: { id: attempt.id, answeredCount: attempt.answeredCount },
        result: null,
      });
    }

    const result = await Result.findOne({
      where: { attemptId: attempt.id },
      attributes: ["scoresByArea", "scoresByAreaDim", "topAreas", "createdAt"],
    });

    if (!result)
      return res.status(500).json({ ok: false, error: "Result missing" });

    return res.json({
      ok: true,
      status: "finished",
      attempt: {
        id: attempt.id,
        answeredCount: attempt.answeredCount,
        finishedAt: attempt.finishedAt,
      },
      result: {
        scoresByArea: result.scoresByArea,
        scoresByAreaDim: result.scoresByAreaDim,
        topAreas: result.topAreas,
        createdAt: result.createdAt,
      },
    });
  } catch (error) {
    return next(error);
  }
}
