import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import Attempt from "../models/Attempt.model.js";
import Result from "../models/Result.model.js";
import Period from "../models/Period.model.js";
import User from "../models/User.model.js";
import Test from "../models/Test.model.js";

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

    const result = await Result.findOne({
      where: { attemptId: attempt.id },
      attributes: ["scoresByArea", "scoresByAreaDim", "topAreas", "createdAt"],
    });

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
            scoresByArea: result.scoresByArea,
            scoresByAreaDim: result.scoresByAreaDim,
            topAreas: result.topAreas,
            createdAt: result.createdAt,
          }
        : null,
    });
  } catch (error) {
    return next(error);
  }
}
