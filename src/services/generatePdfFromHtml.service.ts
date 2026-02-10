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
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
      "--font-render-hinting=none",
    ],
  });

  try {
    const page = await browser.newPage();

    // Set higher viewport for better rendering quality
    await page.setViewport({ width: 1920, height: 1080 });

    // Emulate print media for better PDF rendering
    await page.emulateMediaType("print");

    // Load content with optimal settings
    await page.setContent(html, {
      waitUntil: ["networkidle0", "load", "domcontentloaded"],
      timeout: 30000,
    });

    // Wait a bit for fonts to fully load
    await page.evaluateHandle("document.fonts.ready");

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: true,
      margin: { top: "14mm", right: "14mm", bottom: "16mm", left: "14mm" },
      headerTemplate: "<div></div>",
      footerTemplate: `
        <div style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; font-size: 9px; color: #64748b; width: 100%; padding: 0 14mm; display: flex; justify-content: space-between; align-items: center;">
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
