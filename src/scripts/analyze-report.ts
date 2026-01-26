import { execSync } from "node:child_process";
import fs from "node:fs";

function run(cmd: string) {
  try {
    return execSync(cmd, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (err: any) {
    // Si el comando falla, igual devolvemos stdout/stderr para reportarlo
    const stdout = (err?.stdout?.toString?.() ?? "").trim();
    const stderr = (err?.stderr?.toString?.() ?? "").trim();
    const combined = [stdout, stderr].filter(Boolean).join("\n");
    return combined || `Error ejecutando: ${cmd}`;
  }
}

function codeBlock(text: string, lang = "txt") {
  const safe = text?.trim() ? text.trim() : "(sin resultados)";
  return `\n\`\`\`${lang}\n${safe}\n\`\`\`\n`;
}

const date = new Date().toISOString();

const header = `# 🔎 Analyze Report

> Generado automáticamente: ${date}

Este reporte resume:
- **Orphans**: archivos que no están conectados por imports (posibles no usados o scripts sueltos).
- **Circular deps**: ciclos de importación.
- **Dead exports**: exports no usados (según ts-prune).

`;

const madgeBase = `npx madge src --extensions ts --exclude "node_modules|dist|build|coverage"`;

const orphans = run(`${madgeBase} --orphans`);
const circular = run(`${madgeBase} --circular`);
const graph = run(`${madgeBase} --image deps.svg`);

const prune = run(`npx ts-prune --project tsconfig.json`);

let md = header;

md += `## 🧩 Orphans (archivos no alcanzados por imports)\n`;
md += codeBlock(orphans);

md += `## 🔁 Dependencias circulares\n`;
md += codeBlock(circular);

md += `## 🪦 Dead exports (ts-prune)\n`;
md += codeBlock(prune);

md += `## 🗺️ Grafo de dependencias\n`;
md += `Se generó el archivo \`deps.svg\` (si tu entorno soporta Graphviz).\n`;
md += codeBlock(graph);

md += `\n## Notas\n`;
md += `- En backends Express es normal que scripts como \`seed.ts\` o \`alter.ts\` aparezcan como *orphans* si no se importan desde \`server.ts\`.\n`;
md += `- Archivos \`.d.ts\` (como \`src/types/express.d.ts\`) pueden no aparecer como “usados” por estas herramientas aunque TypeScript sí los incluya.\n`;

fs.writeFileSync("ANALYZE_REPORT.md", md, "utf8");
console.log("✅ ANALYZE_REPORT.md generado");
