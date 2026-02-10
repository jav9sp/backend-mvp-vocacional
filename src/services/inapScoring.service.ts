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

  // 1) Precalculate maximums by area and dimension.
  for (const q of questionsById.values()) {
    const { area, dim: dims } = q;
    ensureArea(area);

    const maxI = dims.includes("interes") ? 1 : 0;
    const maxA = dims.includes("aptitud") ? 1 : 0;

    maxByAreaDim[area].interes += maxI;
    maxByAreaDim[area].aptitud += maxA;
    maxByAreaDim[area].total += maxI + maxA;
  }

  // 2) Add achieved points for "yes" answers.
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

  // 3) Percentages (0..100) by area and dimension.
  const percentByAreaDim: PercentByAreaDim = {};
  for (const area of Object.keys(scoresByAreaDim)) {
    const s = scoresByAreaDim[area];
    const m = maxByAreaDim[area] ?? { interes: 0, aptitud: 0, total: 0 };

    const toPct = (v: number, max: number) => (max === 0 ? 0 : (v / max) * 100);

    percentByAreaDim[area] = {
      interes: toPct(s.interes, m.interes),
      aptitud: toPct(s.aptitud, m.aptitud),
      total: toPct(s.total, m.total),
    };
  }

  // 4) Top 3 by dimension.
  const sortAreasByDim = (dim: "interes" | "aptitud") => {
    const otherDim = dim === "interes" ? "aptitud" : "interes";
    return Object.keys(percentByAreaDim)
      .sort((a, b) => {
        const A = percentByAreaDim[a];
        const B = percentByAreaDim[b];

        if (B[dim] !== A[dim]) return B[dim] - A[dim];
        if (B[otherDim] !== A[otherDim]) return B[otherDim] - A[otherDim];
        return a.localeCompare(b);
      })
      .slice(0, 3);
  };

  const topAreasByInteres = sortAreasByDim("interes");
  const topAreasByAptitud = sortAreasByDim("aptitud");

  return {
    scoresByAreaDim,
    maxByAreaDim,
    percentByAreaDim,
    topAreasByInteres,
    topAreasByAptitud,
  };
}
