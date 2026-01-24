import puppeteer from "puppeteer";
import type { InapvReportData } from "../reports/inapv/renderInapvReportHtml.js";
import { renderInapvReportHtml } from "../reports/inapv/renderInapvReportHtml.js";

export async function generateInapvPdfBuffer(data: InapvReportData) {
  const html = renderInapvReportHtml(data);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    // ayuda a que el layout sea consistente
    await page.setViewport({ width: 1200, height: 800 });

    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,

      // ✅ Header/Footer nativos => paginación y estabilidad
      displayHeaderFooter: true,

      // margen bottom un poco mayor para el footer
      margin: { top: "14mm", right: "14mm", bottom: "16mm", left: "14mm" },

      headerTemplate: `<div></div>`,
      footerTemplate: `
        <div style="font-size:9px; color:#64748b; width:100%; padding:0 14mm; display:flex; justify-content:space-between; align-items:center;">
          <span>Portal Vocacional · INAP-V</span>
          <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
        </div>
      `,
    });

    return pdf;
  } finally {
    await browser.close();
  }
}
