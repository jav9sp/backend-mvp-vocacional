import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const fontsDir = join(__dirname, "..", "assets", "fonts");
const outputPath = join(__dirname, "..", "reports", "shared", "fontStyles.ts");

const fonts = [
  { file: "plus-jakarta-sans-v12-latin-regular.woff2", weight: 400, style: "normal" },
  { file: "plus-jakarta-sans-v12-latin-600.woff2", weight: 600, style: "normal" },
  { file: "plus-jakarta-sans-v12-latin-700.woff2", weight: 700, style: "normal" },
  { file: "plus-jakarta-sans-v12-latin-700.woff2", weight: 900, style: "normal" }, // Using 700 as fallback for 900
];

function generateFontFaces() {
  const fontFaces = fonts.map(({ file, weight, style }) => {
    const filePath = join(fontsDir, file);
    const base64 = readFileSync(filePath).toString("base64");

    return `@font-face {
  font-family: 'Plus Jakarta Sans';
  font-style: ${style};
  font-weight: ${weight};
  font-display: swap;
  src: url(data:font/woff2;charset=utf-8;base64,${base64}) format('woff2');
}`;
  });

  const output = `/**
 * Premium font styles for PDF reports
 * Plus Jakarta Sans embedded as base64
 * Auto-generated - do not edit manually
 */

export const EMBEDDED_FONT_STYLES = \`
${fontFaces.join("\n\n")}
\`;
`;

  writeFileSync(outputPath, output, "utf-8");
  console.log(`✓ Font styles generated at: ${outputPath}`);
}

generateFontFaces();
