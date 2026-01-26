type ScoresByAreaDim = Record<
  string,
  { interes: number; aptitud: number; total: number }
>;

type MaxByAreaDim = Record<
  string,
  { interes: number; aptitud: number; total: number }
>;

type PercentByAreaDim = Record<
  string,
  { interes: number; aptitud: number; total: number }
>;

export function computeInapvScores(args: {
  questionsById: Map<number, { area: string; dim: string[] }>;
  answers: Array<{ questionId: number; value: boolean }>;
}) {
  const { questionsById, answers } = args;

  const scoresByAreaDim: ScoresByAreaDim = {};
  const maxByAreaDim: MaxByAreaDim = {};

  const ensureArea = (area: string) => {
    if (!scoresByAreaDim[area]) {
      scoresByAreaDim[area] = { interes: 0, aptitud: 0, total: 0 };
    }
    if (!maxByAreaDim[area]) {
      maxByAreaDim[area] = { interes: 0, aptitud: 0, total: 0 };
    }
  };

  // 1) Precalcular máximos posibles por área y por dimensión
  for (const q of questionsById.values()) {
    const { area, dim: dims } = q;
    ensureArea(area);

    const maxI = dims.includes("interes") ? 1 : 0;
    const maxA = dims.includes("aptitud") ? 1 : 0;

    maxByAreaDim[area].interes += maxI;
    maxByAreaDim[area].aptitud += maxA;
    maxByAreaDim[area].total += maxI + maxA;
  }

  // 2) Sumar puntajes efectivos según respuestas "sí"
  for (const { questionId, value } of answers) {
    if (!value) continue;

    const question = questionsById.get(questionId);
    if (!question) continue;

    const { area, dim: dims } = question;
    ensureArea(area);

    if (dims.includes("interes")) scoresByAreaDim[area].interes += 1;
    if (dims.includes("aptitud")) scoresByAreaDim[area].aptitud += 1;

    scoresByAreaDim[area].total =
      scoresByAreaDim[area].interes + scoresByAreaDim[area].aptitud;
  }

  // 3) Porcentajes (0..100) por área, calculados por dimensión con su propio máximo
  const percentByAreaDim: PercentByAreaDim = {};
  for (const area of Object.keys(scoresByAreaDim)) {
    const s = scoresByAreaDim[area];
    const m = maxByAreaDim[area] ?? { interes: 0, aptitud: 0, total: 0 };

    const toPct = (v: number, max: number) => (max === 0 ? 0 : (v / max) * 100);

    percentByAreaDim[area] = {
      interes: toPct(s.interes, m.interes),
      aptitud: toPct(s.aptitud, m.aptitud),
      // "total" opcional: porcentaje sobre el total posible del área
      total: toPct(s.total, m.total),
    };
  }

  // 4) Top 3 (si el ranking debe basarse en TOTAL en puntos, dejamos esto igual)
  const topAreas = Object.keys(scoresByAreaDim)
    .sort((a, b) => {
      const A = scoresByAreaDim[a];
      const B = scoresByAreaDim[b];

      if (B.total !== A.total) return B.total - A.total;
      if (B.interes !== A.interes) return B.interes - A.interes;
      if (B.aptitud !== A.aptitud) return B.aptitud - A.aptitud;
      return a.localeCompare(b);
    })
    .slice(0, 3);

  return { scoresByAreaDim, maxByAreaDim, percentByAreaDim, topAreas };
}
