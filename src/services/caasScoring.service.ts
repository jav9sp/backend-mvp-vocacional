import type { CaasDimension } from "../data/caas.data.js";

type DimensionScore = {
  score: number;
  max: number;
  percentage: number;
};

export type CaasScoreResult = {
  totalScore: number;
  maxScore: number;
  percentage: number;
  scoresByDimension: Record<CaasDimension, DimensionScore>;
  level: "bajo" | "medio" | "alto";
};

export function computeCaasScores(args: {
  questionsById: Map<number, { dimension: CaasDimension }>;
  answers: Array<{ questionId: number; value: number }>;
}): CaasScoreResult {
  const { questionsById, answers } = args;

  let totalScore = 0;
  let maxScore = 0;

  const dimensionScores: Record<CaasDimension, { score: number; max: number }> =
    {
      preocupacion: { score: 0, max: 0 },
      control: { score: 0, max: 0 },
      curiosidad: { score: 0, max: 0 },
      confianza: { score: 0, max: 0 },
    };

  // 1) Calcular máximos por dimensión (5 puntos * 6 preguntas = 30 por dimensión)
  for (const q of questionsById.values()) {
    dimensionScores[q.dimension].max += 5;
    maxScore += 5;
  }

  // 2) Sumar puntajes de respuestas
  for (const { questionId, value } of answers) {
    const question = questionsById.get(questionId);
    if (!question) continue;

    dimensionScores[question.dimension].score += value;
    totalScore += value;
  }

  // 3) Calcular porcentaje general
  const percentage = maxScore === 0 ? 0 : (totalScore / maxScore) * 100;

  // 4) Determinar nivel
  let level: "bajo" | "medio" | "alto";
  if (percentage < 40) level = "bajo";
  else if (percentage < 70) level = "medio";
  else level = "alto";

  // 5) Calcular porcentajes por dimensión
  const scoresByDimension = Object.fromEntries(
    Object.entries(dimensionScores).map(([dim, data]) => [
      dim,
      {
        score: data.score,
        max: data.max,
        percentage:
          data.max === 0
            ? 0
            : Math.round((data.score / data.max) * 10000) / 100,
      },
    ]),
  ) as Record<CaasDimension, DimensionScore>;

  return {
    totalScore,
    maxScore,
    percentage: Math.round(percentage * 100) / 100,
    scoresByDimension,
    level,
  };
}
