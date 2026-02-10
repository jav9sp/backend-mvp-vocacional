import type { AdminPeriodResultsData } from "./adminGetPeriodResultsData.service.js";
import { renderCaasPeriodReportHtml } from "../reports/caas/renderCaasPeriodReportHtml.js";
import { generatePdfFromHtml } from "./generatePdfFromHtml.service.js";

type CaasPeriodPdfPayload = {
  period: { id: number; name: string; status: string; testId: number };
  data: AdminPeriodResultsData;
  generatedAt: Date;
  logoDataUri?: string | null;
};

export async function generateCaasPeriodPdfBuffer({
  period,
  data,
  generatedAt,
  logoDataUri = null,
}: CaasPeriodPdfPayload) {
  const html = renderCaasPeriodReportHtml({
    ok: true,
    period,
    data,
    generatedAt,
    logoDataUri,
  });

  return generatePdfFromHtml({
    html,
    footerLabel: "Portal Vocacional · CAAS",
  });
}
