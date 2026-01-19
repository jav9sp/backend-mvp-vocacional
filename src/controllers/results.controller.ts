import { Request, Response, NextFunction } from "express";
import Result from "../models/Result.model.js";

export async function getAttemptResult(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { attempt } = req;
    if (!attempt) {
      return res.status(500).json({ message: "Period not loaded" });
    }

    // Si no terminó, devuelve progreso
    if (attempt.status !== "finished") {
      return res.json({
        ok: true,
        status: attempt.status,
        attempt: {
          id: attempt.id,
          answeredCount: attempt.answeredCount,
        },
        result: null,
      });
    }

    // Buscar result persistido
    const result = await Result.findOne({
      where: { attemptId: attempt.id },
      attributes: ["scoresByArea", "scoresByAreaDim", "topAreas", "createdAt"],
    });

    if (!result) {
      // caso raro: finished sin result (inconsistencia)
      return res.status(500).json({
        ok: false,
        error: "Result missing for finished attempt",
      });
    }

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
