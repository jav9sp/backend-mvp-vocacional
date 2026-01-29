import { Request, Response, NextFunction } from "express";
import puppeteer from "puppeteer";

import { renderInapvPeriodReportHtml } from "../../reports/inapv/renderInapvPeriodReportHtml.js";
import { adminGetPeriodResultsData } from "../../services/adminGetPeriodResultsData.service.js";
import { safeFileName } from "../../utils/safeFileName.js";

export async function adminGetPeriodResults(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const period = (req as any).period;
    if (!period) {
      return res.status(404).json({ ok: false, error: "Period not found" });
    }

    const { organizationId } = req.auth!;
    if (period.organizationId !== organizationId) {
      return res.status(403).json({ ok: false, error: "Forbidden" });
    }

    const periodId = period.id;

    const data = await adminGetPeriodResultsData({
      periodId,
      q: String(req.query.q ?? "").trim(),
      page: Math.max(Number(req.query.page ?? 1), 1),
      pageSize: Math.min(Math.max(Number(req.query.pageSize ?? 25), 1), 200),
    });

    return res.json({
      ok: true,
      period: {
        id: period.id,
        name: period.name,
        status: period.status,
        testId: period.testId,
      },
      test: period.test
        ? {
            id: period.test.id,
            key: period.test.key,
            name: period.test.name,
            version: period.test.version,
          }
        : null,
      ...data,
    });
  } catch (error) {
    return next(error);
  }
}

export async function adminGetPeriodResultsPdf(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    // ✅ lo carga tu middleware
    const period = (req as any).period;
    if (!period) {
      return res.status(500).json({ ok: false, error: "Period not loaded" });
    }

    const periodId = period.id;

    // Para PDF conviene traer "todas" las filas (solo los que tienen result).
    // 1000 es razonable para tu caso (dijiste hasta 1000 enrollments; results <= finished).
    const data = await adminGetPeriodResultsData({
      periodId,
      q: "", // en PDF normalmente no filtramos
      page: 1,
      pageSize: 2000, // margen
    });

    const html = renderInapvPeriodReportHtml({
      ok: true,
      period: {
        id: period.id,
        name: period.name,
        status: period.status,
        testId: period.testId,
      },
      ...data,
      generatedAt: new Date(),
      logoDataUri: null, // si luego metes logo por org, se conecta acá
    });

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1200, height: 800 });
      await page.setContent(html, { waitUntil: "networkidle0" });

      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: true,
        margin: { top: "14mm", right: "14mm", bottom: "16mm", left: "14mm" },
        headerTemplate: `<div></div>`,
        footerTemplate: `
          <div style="font-size:9px; color:#64748b; width:100%; padding:0 14mm; display:flex; justify-content:space-between; align-items:center;">
            <span>Portal Vocacional · INAP-V</span>
            <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
          </div>
        `,
      });

      const filename = `reporte-periodo-${safeFileName(period.name ?? `periodo-${periodId}`)}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      // inline para vista previa; si quieres descarga directa: attachment
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
      res.setHeader("Content-Length", String(pdf.length));
      return res.status(200).send(pdf);
    } finally {
      await browser.close();
    }
  } catch (err) {
    return next(err);
  }
}
