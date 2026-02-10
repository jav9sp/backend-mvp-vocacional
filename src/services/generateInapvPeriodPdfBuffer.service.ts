import { renderInapvPeriodReportHtml } from "../reports/inapv/renderInapvPeriodReportHtml.js";
import { generatePdfFromHtml } from "./generatePdfFromHtml.service.js";
import type { AdminPeriodResultsData } from "./adminGetPeriodResultsData.service.js";

type InapPeriodPdfPayload = {
  period: { id: number; name: string; status: string; testId: number };
  data: AdminPeriodResultsData;
  generatedAt: Date;
  logoDataUri?: string | null;
};

export async function generateInapvPeriodPdfBuffer({
  period,
  data,
  generatedAt,
  logoDataUri = null,
}: InapPeriodPdfPayload) {
  const html = renderInapvPeriodReportHtml({
    ok: true,
    period,
    ...data,
    generatedAt,
    logoDataUri,
  });

  return generatePdfFromHtml({
    html,
    footerLabel: "Portal Vocacional · INAP-V",
  });
}
