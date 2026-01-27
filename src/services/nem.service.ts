import NemConversion from "../models/NemConversion.model.js";
import { EducationType } from "../types/EducationType.js";

export async function resolveNemScore(params: {
  year: number;
  educationType: EducationType;
  nemAvg: number; // 4.00 - 7.00
}) {
  const nemAvgStr = params.nemAvg.toFixed(2);

  const row = await NemConversion.findOne({
    where: {
      year: params.year,
      educationType: params.educationType,
      nemAvg: nemAvgStr,
    },
  });

  if (!row) {
    throw new Error(
      `No NEM conversion to ${params.educationType} ${nemAvgStr} (${params.year})`,
    );
  }

  return {
    nemScore: row.nemScore,
    rankingScore: row.nemScore,
  };
}
