import puppeteer from "puppeteer";
import { Buffer } from "node:buffer";

type GeneratePdfFromHtmlParams = {
  html: string;
  footerLabel: string;
};

export async function generatePdfFromHtml({
  html,
  footerLabel,
}: GeneratePdfFromHtmlParams): Promise<Buffer> {
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
      headerTemplate: "<div></div>",
      footerTemplate: `
        <div style="font-size:9px; color:#64748b; width:100%; padding:0 14mm; display:flex; justify-content:space-between; align-items:center;">
          <span>${footerLabel}</span>
          <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
        </div>
      `,
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
