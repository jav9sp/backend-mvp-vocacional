import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import Attempt from "../../models/Attempt.model.js";
import InapResult from "../../models/InapResult.model.js";
import Test from "../../models/Test.model.js";

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
