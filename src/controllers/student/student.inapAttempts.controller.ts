import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { sequelize } from "../../config/sequelize.js";
import { QueryTypes } from "sequelize";

import InapAnswer from "../../models/InapAnswer.model.js";
import InapQuestion from "../../models/InapQuestion.model.js";
import InapResult from "../../models/InapResult.model.js";
import Period from "../../models/Period.model.js";
import Test from "../../models/Test.model.js";

import { INAPV_AREAS } from "../../data/inapv.data.js";
import { computeInapvScores } from "../../services/inapScoring.service.js";
import { SaveAnswersBodySchema } from "../../validators/attempts.schemas.js";

export async function getAttemptContext(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const orgId = req.auth?.organizationId;
    const { attempt } = req;
    if (!attempt) {
      return res.status(500).json({ ok: false, error: "Attempt not loaded" });
    }

    const period = await Period.findByPk(attempt.periodId, {
      attributes: [
        "id",
        "organizationId",
        "testId",
        "name",
        "status",
        "startAt",
        "endAt",
      ],
    });

    if (!period) {
      return res
        .status(500)
        .json({ ok: false, error: "Period missing for attempt" });
    }

    if (period.organizationId !== orgId) {
      return res.status(403).json({ ok: false, error: "Forbidden" });
    }

    const test = await Test.findByPk(period.testId, {
      attributes: ["id", "key", "version", "name"],
    });

    if (!test) {
      return res
        .status(500)
        .json({ ok: false, error: "Test not configured for period" });
    }

    const questions = await InapQuestion.findAll({
      where: { testId: test.id },
      attributes: ["id", "externalId", "text", "area", "dim", "orderIndex"],
      order: [["orderIndex", "ASC"]],
    });

    return res.json({
      ok: true,
      test,
      period: {
        id: period.id,
        name: period.name,
        status: period.status,
        startAt: period.startAt,
        endAt: period.endAt,
      },
      attempt: {
        id: attempt.id,
        periodId: attempt.periodId,
        status: attempt.status,
        answeredCount: attempt.answeredCount,
        finishedAt: attempt.finishedAt,
      },
      areas: INAPV_AREAS,
      questions,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getAttemptAnswers(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { attempt } = req;
    if (!attempt) {
      return res.status(500).json({ ok: false, error: "Attempt not loaded" });
    }

    // Org scoping (igual que en otros endpoints)
    const period = await Period.findByPk(attempt.periodId, {
      attributes: ["id", "organizationId", "testId"],
    });
    if (!period) {
      return res
        .status(500)
        .json({ ok: false, error: "Period missing for attempt" });
    }
    if (period.organizationId !== req.auth!.organizationId) {
      return res.status(403).json({ ok: false, error: "Forbidden" });
    }

    const answers = await InapAnswer.findAll({
      where: { attemptId: attempt.id },
      attributes: ["questionId", "value"],
      order: [["questionId", "ASC"]],
    });

    return res.json({
      ok: true,
      attempt: {
        id: attempt.id,
        status: attempt.status,
        answeredCount: attempt.answeredCount,
      },
      meta: { testId: period.testId },
      answers: answers.map((a) => ({
        questionId: a.questionId,
        value: a.value,
      })),
    });
  } catch (error) {
    return next(error);
  }
}

export async function saveAttemptAnswers(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { attempt } = req;
    if (!attempt) {
      return res.status(500).json({ ok: false, error: "Attempt not loaded" });
    }

    const bodyParsed = SaveAnswersBodySchema.safeParse(req.body);
    if (!bodyParsed.success) {
      return res.status(400).json({
        ok: false,
        error: "Invalid body",
        details: z.treeifyError(bodyParsed.error),
      });
    }

    if (attempt.status !== "in_progress") {
      return res.status(409).json({ ok: false, error: "Attempt is finished" });
    }

    // Dedup por questionId (si viene repetido, nos quedamos con el último)
    const map = new Map<number, boolean>();
    for (const a of bodyParsed.data.answers) map.set(a.questionId, a.value);
    const answers = Array.from(map.entries()).map(([questionId, value]) => ({
      questionId,
      value,
    }));

    const period = await Period.findByPk(attempt.periodId, {
      attributes: ["id", "organizationId", "testId"],
    });
    if (!period) {
      return res
        .status(500)
        .json({ ok: false, error: "Period missing for attempt" });
    }
    if (period.organizationId !== req.auth!.organizationId) {
      return res.status(403).json({ ok: false, error: "Forbidden" });
    }

    // Validar que las preguntas pertenezcan al test del period
    const questionIds = answers.map((a) => a.questionId);
    const validCount = await InapQuestion.count({
      where: { id: questionIds, testId: period.testId },
    });
    if (validCount !== questionIds.length) {
      return res.status(400).json({
        ok: false,
        error: "Some questionIds are invalid for this test",
      });
    }

    await sequelize.transaction(async (t) => {
      // batch upsert + count inserts reales (solo suma answered_count si eran nuevas)
      const rows = await sequelize.query<{ inserted_count: number }>(
        `
        WITH input AS (
          SELECT
            $1::int AS attempt_id,
            unnest($2::int[]) AS question_id,
            unnest($3::boolean[]) AS value
        ),
        upserted AS (
          INSERT INTO inap_answers (attempt_id, question_id, value)
          SELECT attempt_id, question_id, value
          FROM input
          ON CONFLICT (attempt_id, question_id)
          DO UPDATE SET value = EXCLUDED.value, updated_at = now()
          RETURNING (xmax = 0) AS inserted
        )
        SELECT COALESCE(SUM(CASE WHEN inserted THEN 1 ELSE 0 END), 0)::int AS inserted_count
        FROM upserted;
        `,
        {
          transaction: t,
          type: QueryTypes.SELECT,
          bind: [
            attempt.id,
            answers.map((a) => a.questionId),
            answers.map((a) => a.value),
          ],
        },
      );

      const insertedCount = rows[0]?.inserted_count ?? 0;

      if (insertedCount > 0) {
        await sequelize.query(
          `
          UPDATE attempts
          SET answered_count = answered_count + $2::int,
              updated_at = now()
          WHERE id = $1::int;
          `,
          { transaction: t, bind: [attempt.id, insertedCount] },
        );
      }
    });

    await attempt.reload({ attributes: ["id", "status", "answeredCount"] });

    return res.json({
      ok: true,
      attempt: {
        id: attempt.id,
        status: attempt.status,
        answeredCount: attempt.answeredCount,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function finishAttempt(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { attempt } = req;
    if (!attempt) {
      return res.status(500).json({ ok: false, error: "Attempt not loaded" });
    }

    const period = await Period.findByPk(attempt.periodId, {
      attributes: ["id", "organizationId", "testId"],
    });
    if (!period) {
      return res
        .status(500)
        .json({ ok: false, error: "Period missing for attempt" });
    }
    if (period.organizationId !== req.auth!.organizationId) {
      return res.status(403).json({ ok: false, error: "Forbidden" });
    }

    // Idempotencia: si ya está finished, devuelve result existente
    if (attempt.status === "finished") {
      const existingResult = await InapResult.findOne({
        where: { attemptId: attempt.id },
        attributes: [
          "scoresByAreaDim",
          "maxByAreaDim",
          "percentByAreaDim",
          "topAreasByInteres",
          "topAreasByAptitud",
          "createdAt",
        ],
      });

      if (existingResult) {
        return res.json({
          ok: true,
          status: "finished",
          attempt: {
            id: attempt.id,
            answeredCount: attempt.answeredCount,
            finishedAt: attempt.finishedAt,
          },
          result: {
            scoresByAreaDim: existingResult.scoresByAreaDim,
            maxByAreaDim: existingResult.maxByAreaDim,
            percentByAreaDim: existingResult.percentByAreaDim,
            topAreasByInteres: existingResult.topAreasByInteres ?? [],
            topAreasByAptitud: existingResult.topAreasByAptitud ?? [],
            createdAt: existingResult.createdAt,
          },
        });
      }
      // finished pero sin result -> recalculamos
    } else if (attempt.status !== "in_progress") {
      return res
        .status(409)
        .json({ ok: false, error: "Attempt is not finishable" });
    }

    // Compleción: total preguntas del test vs respuestas del attempt
    const expectedCount = await InapQuestion.count({
      where: { testId: period.testId },
    });
    const answerCount = await InapAnswer.count({
      where: { attemptId: attempt.id },
    });

    if (answerCount !== expectedCount) {
      return res.status(400).json({
        ok: false,
        error: `Attempt not complete ${answerCount} / ${expectedCount}`,
        answeredCount: answerCount,
        expected: expectedCount,
      });
    }

    const answers = await InapAnswer.findAll({
      where: { attemptId: attempt.id },
      attributes: ["questionId", "value"],
    });

    const questions = await InapQuestion.findAll({
      where: { testId: period.testId },
      attributes: ["id", "area", "dim"],
    });

    const questionsById = new Map<number, { area: string; dim: string[] }>();
    for (const q of questions) {
      questionsById.set(q.id, { area: q.area, dim: q.dim });
    }

    const computed = computeInapvScores({
      questionsById,
      answers: answers.map((a) => ({
        questionId: a.questionId,
        value: a.value,
      })),
    });

    try {
      await sequelize.transaction(async (t) => {
        const [result, created] = await InapResult.findOrCreate({
          where: { attemptId: attempt.id },
          defaults: {
            attemptId: attempt.id,
            scoresByAreaDim: computed.scoresByAreaDim,
            maxByAreaDim: computed.maxByAreaDim,
            percentByAreaDim: computed.percentByAreaDim,
            topAreasByInteres: computed.topAreasByInteres,
            topAreasByAptitud: computed.topAreasByAptitud,
          },
          transaction: t,
        });

        if (!created) {
          result.scoresByAreaDim = computed.scoresByAreaDim;
          result.maxByAreaDim = computed.maxByAreaDim;
          result.percentByAreaDim = computed.percentByAreaDim;
          result.topAreasByInteres = computed.topAreasByInteres;
          result.topAreasByAptitud = computed.topAreasByAptitud;
          await result.save({ transaction: t });
        }

        attempt.status = "finished";
        attempt.finishedAt = attempt.finishedAt ?? new Date();
        attempt.answeredCount = answerCount;
        await attempt.save({ transaction: t });
      });
    } catch (error: any) {
      console.error("finishAttempt error:", error);
      console.error("finishAttempt error.parent:", error?.parent);
      console.error("finishAttempt error.original:", error?.original);
      return res.status(500).json({
        ok: false,
        error: error?.message || "finishAttempt failed",
        sqlMessage: error?.parent?.sqlMessage || error?.original?.sqlMessage,
        code: error?.parent?.code || error?.original?.code,
      });
    }

    const savedResult = await InapResult.findOne({
      where: { attemptId: attempt.id },
      attributes: [
        "scoresByAreaDim",
        "maxByAreaDim",
        "percentByAreaDim",
        "topAreasByInteres",
        "topAreasByAptitud",
        "createdAt",
      ],
    });

    if (!savedResult) {
      return res
        .status(500)
        .json({ ok: false, error: "Result missing after finish" });
    }

    await attempt.reload({
      attributes: ["id", "status", "answeredCount", "finishedAt"],
    });

    return res.json({
      ok: true,
      status: "finished",
      attempt: {
        id: attempt.id,
        answeredCount: attempt.answeredCount,
        finishedAt: attempt.finishedAt,
      },
      result: {
        scoresByAreaDim: savedResult.scoresByAreaDim,
        maxByAreaDim: savedResult.maxByAreaDim,
        percentByAreaDim: savedResult.percentByAreaDim,
        topAreasByInteres: savedResult.topAreasByInteres ?? [],
        topAreasByAptitud: savedResult.topAreasByAptitud ?? [],
        createdAt: savedResult.createdAt,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function getAttemptResult(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { attempt } = req;
    if (!attempt) {
      return res.status(500).json({ ok: false, error: "Attempt not loaded" });
    }

    // Org scoping
    const period = await Period.findByPk(attempt.periodId, {
      attributes: ["id", "organizationId", "testId"],
    });
    if (!period) {
      return res
        .status(500)
        .json({ ok: false, error: "Period missing for attempt" });
    }
    if (period.organizationId !== req.auth!.organizationId) {
      return res.status(403).json({ ok: false, error: "Forbidden" });
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

    const result = await InapResult.findOne({
      where: { attemptId: attempt.id },
      attributes: [
        "scoresByAreaDim",
        "maxByAreaDim",
        "percentByAreaDim",
        "topAreasByInteres",
        "topAreasByAptitud",
        "createdAt",
      ],
    });

    if (!result) {
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
        scoresByAreaDim: result.scoresByAreaDim,
        maxByAreaDim: result.maxByAreaDim,
        percentByAreaDim: result.percentByAreaDim,
        topAreasByInteres: result.topAreasByInteres ?? [],
        topAreasByAptitud: result.topAreasByAptitud ?? [],
        createdAt: result.createdAt,
      },
    });
  } catch (error) {
    return next(error);
  }
}
