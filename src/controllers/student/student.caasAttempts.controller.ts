import { Request, Response } from "express";
import { QueryTypes } from "sequelize";
import { sequelize } from "../../config/sequelize.js";
import Attempt from "../../models/Attempt.model.js";
import Period from "../../models/Period.model.js";
import Test from "../../models/Test.model.js";
import User from "../../models/User.model.js";
import CaasQuestion from "../../models/CaasQuestion.model.js";
import CaasAnswer from "../../models/CaasAnswer.model.js";
import CaasOpenAnswer from "../../models/CaasOpenAnswer.model.js";
import CaasResult from "../../models/CaasResult.model.js";
import { computeCaasScores } from "../../services/caasScoring.service.js";
import { generateCaasPdfBuffer } from "../../services/generateCaasPdfBuffer.service.js";
import {
  CAAS_DIMENSIONS,
  CAAS_SCALE_LABELS,
  CAAS_OPEN_QUESTIONS,
} from "../../data/caas.data.js";
import { CAAS_INTERPRETATIONS } from "../../data/caasInterpretations.js";
import {
  SaveCaasAnswersBodySchema,
  SaveCaasOpenAnswersBodySchema,
} from "../../validators/caasAttempts.schemas.js";
import type { CaasReportData } from "../../reports/caas/renderCaasReportHtml.js";
import { getLogoDataUri } from "../../utils/getLogoDataUri.js";

function toFiniteNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function serializeCaasResult(result: CaasResult | null) {
  if (!result) return null;

  const scoresByDimension = Object.fromEntries(
    Object.entries(result.scoresByDimension ?? {}).map(([dim, score]) => [
      dim,
      {
        max: toFiniteNumber(score.max),
        score: toFiniteNumber(score.score),
        percentage: toFiniteNumber(score.percentage),
      },
    ]),
  );

  return {
    id: result.id,
    attemptId: result.attemptId,
    totalScore: toFiniteNumber(result.totalScore),
    maxScore: toFiniteNumber(result.maxScore),
    percentage: toFiniteNumber(result.percentage),
    scoresByDimension,
    level: result.level,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  };
}

// GET /:attemptId - Obtener contexto del test CAAS
export async function getCaasAttemptContext(req: Request, res: Response) {
  const attempt = req.attempt!; // Cargado por middleware

  const period = await Period.findByPk(attempt.periodId, {
    include: [{ model: Test, as: "test" }],
  });

  if (!period) {
    throw new Error("Period not found");
  }

  if (period.organizationId !== req.auth!.organizationId) {
    throw new Error("Forbidden");
  }

  const questions = await CaasQuestion.findAll({
    where: { testId: period.testId },
    attributes: ["id", "externalId", "text", "dimension", "orderIndex"],
    order: [["orderIndex", "ASC"]],
  });

  res.json({
    ok: true,
    test: {
      id: period.test!.id,
      key: period.test!.key,
      version: period.test!.version,
      name: period.test!.name,
    },
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
    dimensions: CAAS_DIMENSIONS,
    scaleLabels: CAAS_SCALE_LABELS,
    closedQuestions: questions,
    openQuestions: CAAS_OPEN_QUESTIONS,
  });
}

// GET /:attemptId/answers - Obtener respuestas guardadas
export async function getCaasAttemptAnswers(req: Request, res: Response) {
  const attempt = req.attempt!;

  const closedAnswers = await CaasAnswer.findAll({
    where: { attemptId: attempt.id },
    attributes: ["questionId", "value"],
  });

  const openAnswers = await CaasOpenAnswer.findAll({
    where: { attemptId: attempt.id },
    attributes: ["questionKey", "answerText"],
  });

  res.json({
    ok: true,
    closedAnswers: closedAnswers.map((a) => ({
      questionId: a.questionId,
      value: a.value,
    })),
    openAnswers: openAnswers.map((a) => ({
      questionKey: a.questionKey,
      answerText: a.answerText,
    })),
  });
}

// PUT /:attemptId/answers - Guardar respuestas cerradas
export async function saveCaasAttemptAnswers(req: Request, res: Response) {
  const attempt = req.attempt!;

  if (attempt.status !== "in_progress") {
    throw new Error("Attempt is not in progress");
  }

  const body = SaveCaasAnswersBodySchema.parse(req.body);
  const { answers } = body;

  await sequelize.transaction(async (t) => {
    // Upsert con SQL puro (idempotente)
    const rows = await sequelize.query<{ inserted_count: number }>(
      `
      WITH input AS (
        SELECT
          $1::int AS attempt_id,
          unnest($2::int[]) AS question_id,
          unnest($3::int[]) AS value
      ),
      upserted AS (
        INSERT INTO caas_answers (attempt_id, question_id, value, created_at, updated_at)
        SELECT attempt_id, question_id, value, now(), now()
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
      await Attempt.update(
        {
          answeredCount: sequelize.literal(`answered_count + ${insertedCount}`),
        },
        { where: { id: attempt.id }, transaction: t },
      );
    }
  });

  const updated = await Attempt.findByPk(attempt.id);

  res.json({
    ok: true,
    attempt: {
      id: updated!.id,
      status: updated!.status,
      answeredCount: updated!.answeredCount,
    },
  });
}

// PUT /:attemptId/open-answers - Guardar respuestas abiertas
export async function saveCaasOpenAnswers(req: Request, res: Response) {
  const attempt = req.attempt!;

  if (attempt.status !== "in_progress") {
    throw new Error("Attempt is not in progress");
  }

  const body = SaveCaasOpenAnswersBodySchema.parse(req.body);
  const { openAnswers } = body;

  await sequelize.transaction(async (t) => {
    for (const { questionKey, answerText } of openAnswers) {
      await CaasOpenAnswer.upsert(
        {
          attemptId: attempt.id,
          questionKey,
          answerText,
        },
        { transaction: t },
      );
    }
  });

  res.json({ ok: true });
}

// POST /:attemptId/finish - Finalizar test y calcular resultados
export async function finishCaasAttempt(req: Request, res: Response) {
  const attempt = req.attempt!;

  // Idempotencia: si ya está finished, retornar resultado
  if (attempt.status === "finished") {
    const result = await CaasResult.findOne({
      where: { attemptId: attempt.id },
    });
    return res.json({
      ok: true,
      status: "finished",
      attempt: {
        id: attempt.id,
        answeredCount: attempt.answeredCount,
        finishedAt: attempt.finishedAt,
      },
      result: serializeCaasResult(result),
    });
  }

  if (attempt.status !== "in_progress") {
    throw new Error("Attempt is not in correct status");
  }

  const period = await Period.findByPk(attempt.periodId);
  if (!period) throw new Error("Period not found");

  // Validar completitud (24 preguntas cerradas)
  const expectedCount = await CaasQuestion.count({
    where: { testId: period.testId },
  });
  const answerCount = await CaasAnswer.count({
    where: { attemptId: attempt.id },
  });

  if (answerCount !== expectedCount) {
    throw new Error(
      `Incomplete test: ${answerCount}/${expectedCount} questions answered`,
    );
  }

  // Cargar datos para scoring
  const questions = await CaasQuestion.findAll({
    where: { testId: period.testId },
  });
  const answers = await CaasAnswer.findAll({
    where: { attemptId: attempt.id },
  });

  const questionsById = new Map(
    questions.map((q) => [q.id, { dimension: q.dimension }]),
  );

  // Calcular scores
  const computed = computeCaasScores({
    questionsById,
    answers: answers.map((a) => ({ questionId: a.questionId, value: a.value })),
  });

  // Guardar resultado
  await sequelize.transaction(async (t) => {
    const [result, created] = await CaasResult.findOrCreate({
      where: { attemptId: attempt.id },
      defaults: {
        attemptId: attempt.id,
        totalScore: computed.totalScore,
        maxScore: computed.maxScore,
        percentage: computed.percentage,
        scoresByDimension: computed.scoresByDimension,
        level: computed.level,
      },
      transaction: t,
    });

    if (!created) {
      await result.update(
        {
          totalScore: computed.totalScore,
          maxScore: computed.maxScore,
          percentage: computed.percentage,
          scoresByDimension: computed.scoresByDimension,
          level: computed.level,
        },
        { transaction: t },
      );
    }

    await Attempt.update(
      { status: "finished", finishedAt: new Date() },
      { where: { id: attempt.id }, transaction: t },
    );
  });

  const updated = await Attempt.findByPk(attempt.id);
  const result = await CaasResult.findOne({ where: { attemptId: attempt.id } });

  res.json({
    ok: true,
    status: "finished",
    attempt: {
      id: updated!.id,
      answeredCount: updated!.answeredCount,
      finishedAt: updated!.finishedAt,
    },
    result: serializeCaasResult(result),
  });
}

// GET /:attemptId/result - Obtener resultado (o progreso)
export async function getCaasAttemptResult(req: Request, res: Response) {
  const attempt = req.attempt!;

  if (attempt.status !== "finished") {
    return res.json({
      ok: true,
      status: "in_progress",
      attempt: {
        id: attempt.id,
        answeredCount: attempt.answeredCount,
      },
      result: null,
    });
  }

  const result = await CaasResult.findOne({ where: { attemptId: attempt.id } });

  res.json({
    ok: true,
    status: "finished",
    attempt: {
      id: attempt.id,
      answeredCount: attempt.answeredCount,
      finishedAt: attempt.finishedAt,
    },
    result: serializeCaasResult(result),
  });
}

// GET /:attemptId/pdf - Descargar reporte PDF
export async function getCaasAttemptPdf(req: Request, res: Response) {
  const attempt = req.attempt!;

  if (attempt.status !== "finished") {
    throw new Error("Attempt is not finished yet");
  }

  const period = await Period.findByPk(attempt.periodId, {
    include: [{ model: Test, as: "test" }],
  });

  const user = await User.findByPk(attempt.userId);
  const result = await CaasResult.findOne({ where: { attemptId: attempt.id } });

  if (!result) {
    throw new Error("Result not found");
  }

  // Armar datos para el reporte
  const interpretation = CAAS_INTERPRETATIONS.general[result.level!];
  const dimensionDescriptions = Object.fromEntries(
    Object.entries(CAAS_INTERPRETATIONS.byDimension).map(([key, val]) => [
      key,
      val.description,
    ]),
  );

  const logoDataUri = await getLogoDataUri();

  const reportData: CaasReportData = {
    student: {
      name: user!.name,
      email: user!.email,
    },
    attempt: {
      id: attempt.id,
      finishedAt: attempt.finishedAt!,
      period: {
        name: period!.name,
        test: {
          name: period!.test!.name,
        },
      },
    },
    result: {
      totalScore: result.totalScore,
      maxScore: result.maxScore,
      percentage: toFiniteNumber(result.percentage),
      level: result.level!,
      scoresByDimension: result.scoresByDimension,
    },
    interpretation: {
      title: interpretation.title,
      description: interpretation.description,
      recommendations: interpretation.recommendations,
    },
    dimensionDescriptions: dimensionDescriptions as any,
    logoDataUri,
  };

  const pdfBuffer = await generateCaasPdfBuffer(reportData);

  const fileName = `caas_${user!.name.replace(/\s+/g, "_")}_${attempt.id}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
  res.send(pdfBuffer);
}
