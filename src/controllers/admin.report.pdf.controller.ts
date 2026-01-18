import { Request, Response } from "express";
import { buildPeriodReport } from "../services/period-report.service.js";
import { renderPeriodReportHtml } from "../templates/period-report.template.js";

export async function adminGetPeriodReportPdf(req: Request, res: Response) {
  const { period } = req;
  if (!period) {
    return res.status(500).json({ message: "Period not loaded" });
  }

  try {
    const report = await buildPeriodReport(period.id);
    const html = renderPeriodReportHtml(report);

    // Import dinámico (ESM-friendly)
    const puppeteer = await import("puppeteer");

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });

      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "14mm", right: "14mm", bottom: "14mm", left: "14mm" },
      });

      const safe = report.period.name.replace(/[^\w\-]+/g, "_");
      const filename = `period_${report.period.id}_${safe}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`,
      );
      return res.status(200).send(pdf);
    } finally {
      await browser.close();
    }
  } catch (e: any) {
    if (e.message === "Period not found")
      return res.status(404).json({ ok: false, error: e.message });
    console.error("PDF report failed:", e);
    return res.status(500).json({ ok: false, error: "PDF report failed" });
  }
}
