export type PercentByAreaDim = Record<
  string,
  { interes?: number; aptitud?: number; total?: number }
>;

export function getTopAreasByDimension(percentByAreaDim: PercentByAreaDim) {
  const safe = percentByAreaDim ?? {};

  const sortAreasByDim = (dim: "interes" | "aptitud") => {
    const otherDim = dim === "interes" ? "aptitud" : "interes";

    return Object.keys(safe)
      .sort((a, b) => {
        const A = safe[a] ?? {};
        const B = safe[b] ?? {};

        const ad = Number(A[dim] ?? 0);
        const bd = Number(B[dim] ?? 0);
        if (bd !== ad) return bd - ad;

        const ao = Number(A[otherDim] ?? 0);
        const bo = Number(B[otherDim] ?? 0);
        if (bo !== ao) return bo - ao;

        return a.localeCompare(b);
      })
      .slice(0, 3);
  };

  return {
    topAreasByInteres: sortAreasByDim("interes"),
    topAreasByAptitud: sortAreasByDim("aptitud"),
  };
}

export function mergeTopAreas(args: {
  topAreasByInteres?: string[] | null;
  topAreasByAptitud?: string[] | null;
}) {
  return Array.from(
    new Set([...(args.topAreasByInteres ?? []), ...(args.topAreasByAptitud ?? [])]),
  );
}
