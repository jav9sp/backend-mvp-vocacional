import { escapeHtml } from "../../utils/scapeHtml.js";
import { CAAS_DIMENSIONS } from "../../data/caas.data.js";
import type { CaasDimension } from "../../data/caas.data.js";

export type CaasReportData = {
  student: {
    name: string;
    email?: string | null;
  };
  attempt: {
    id: number;
    finishedAt: string | Date;
    period: {
      name: string;
      test: {
        name: string;
      };
    };
  };
  result: {
    totalScore: number;
    maxScore: number;
    percentage: number;
    level: "bajo" | "medio" | "alto";
    scoresByDimension: Record<
      CaasDimension,
      { score: number; max: number; percentage: number }
    >;
  };
  interpretation: {
    title: string;
    description: string;
    recommendations: string[];
  };
  dimensionDescriptions: Record<CaasDimension, string>;
  logoDataUri?: string | null;
};

function fmtDate(d: string | Date) {
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleDateString("es-CL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getLevelColor(level: string) {
  const colors = {
    bajo: "#EF4444",
    medio: "#F59E0B",
    alto: "#10B981",
  };
  return colors[level as keyof typeof colors] || "#64748b";
}

export function renderCaasReportHtml(data: CaasReportData): string {
  const { student, attempt, result, interpretation, dimensionDescriptions, logoDataUri } = data;

  const levelColor = getLevelColor(result.level);
  const percentage = Math.round(result.percentage);

  // Gauge circular SVG
  const gaugeHTML = `
    <div class="gauge">
      <svg viewBox="0 0 200 120" class="gaugeSvg">
        <path d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none" stroke="#e2e8f0" stroke-width="20" />
        <path d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none" stroke="${levelColor}" stroke-width="20"
              stroke-dasharray="${percentage * 2.51} 251.2"
              stroke-linecap="round" />
        <text x="100" y="75" text-anchor="middle" font-size="40" font-weight="900" fill="${levelColor}">
          ${percentage}%
        </text>
        <text x="100" y="100" text-anchor="middle" font-size="14" fill="#64748b" text-transform="uppercase">
          ${result.level}
        </text>
      </svg>
    </div>
  `;

  // Barras por dimensión
  const dimensionBars = CAAS_DIMENSIONS.map((dim) => {
    const score = result.scoresByDimension[dim.key as CaasDimension];
    const pct = Math.round(score.percentage);
    return `
      <div class="dimRow">
        <div class="dimLabel" style="color: ${dim.color}">
          <strong>${escapeHtml(dim.name)}</strong>
        </div>
        <div class="dimBar">
          <div class="dimBarFill" style="width:${pct}%; background:${dim.color};">
            ${pct}%
          </div>
        </div>
        <div class="dimScore">${score.score}/${score.max}</div>
      </div>
    `;
  }).join("");

  // Descripciones de dimensiones
  const dimensionDescHTML = CAAS_DIMENSIONS.map((dim) => {
    const desc = dimensionDescriptions[dim.key as CaasDimension];
    return `
      <div class="dimDesc">
        <h3 style="color: ${dim.color}">${escapeHtml(dim.name)}</h3>
        <p>${escapeHtml(desc)}</p>
      </div>
    `;
  }).join("");

  // Recomendaciones
  const recommendationsHTML = interpretation.recommendations
    .map((rec) => `<li>${escapeHtml(rec)}</li>`)
    .join("");

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Reporte CAAS - ${escapeHtml(student.name)}</title>
  <style>${CAAS_REPORT_CSS}</style>
</head>
<body>
  <div class="doc">
    <!-- Header -->
    <div class="header">
      <div>
        <h1>${escapeHtml(attempt.period.test.name)}</h1>
        <div class="meta">
          <span>${escapeHtml(student.name)}</span>
          ${student.email ? `<span>·</span><span>${escapeHtml(student.email)}</span>` : ""}
          <span>·</span>
          <span>${fmtDate(attempt.finishedAt)}</span>
        </div>
      </div>
      ${logoDataUri ? `<img src="${logoDataUri}" class="logo" alt="Logo" />` : ""}
    </div>

    <!-- Puntaje General -->
    <div class="section">
      <h2>Tu Resultado General</h2>
      ${gaugeHTML}
      <div class="scoreDetail">
        <span>Puntaje Total: <strong>${result.totalScore} / ${result.maxScore}</strong></span>
      </div>
    </div>

    <!-- Resultados por Dimensión -->
    <div class="section">
      <h2>Resultados por Dimensión</h2>
      <div class="dimensions">${dimensionBars}</div>
    </div>

    <!-- PAGE BREAK -->
    <div class="pageBreak"></div>

    <!-- Interpretación General -->
    <div class="section">
      <h2>${escapeHtml(interpretation.title)}</h2>
      <p class="interpText">${escapeHtml(interpretation.description)}</p>
    </div>

    <!-- Descripciones de Dimensiones -->
    <div class="section">
      <h2>¿Qué significan estas dimensiones?</h2>
      <div class="dimDescContainer">${dimensionDescHTML}</div>
    </div>

    <!-- Recomendaciones -->
    <div class="section">
      <h2>Recomendaciones</h2>
      <ul class="recommendations">${recommendationsHTML}</ul>
    </div>
  </div>
</body>
</html>
  `;
}

const CAAS_REPORT_CSS = `
@page { size: A4; margin: 14mm; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #0f172a;
  font-size: 13px;
  line-height: 1.6;
}
.doc { max-width: 100%; }
.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 16px;
  border-bottom: 2px solid #e2e8f0;
  margin-bottom: 24px;
}
h1 { font-size: 22px; font-weight: 900; margin-bottom: 6px; color: #1e293b; }
.meta { font-size: 12px; color: #64748b; }
.logo { height: 48px; object-fit: contain; }
.section { margin-bottom: 28px; break-inside: avoid; }
h2 {
  font-size: 17px;
  font-weight: 700;
  margin-bottom: 14px;
  color: #1e293b;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 6px;
}
h3 { font-size: 14px; font-weight: 700; margin-bottom: 8px; }

/* Gauge */
.gauge {
  display: flex;
  justify-content: center;
  margin: 20px 0;
}
.gaugeSvg { width: 200px; height: 120px; }
.scoreDetail {
  text-align: center;
  font-size: 15px;
  color: #475569;
  margin-top: 8px;
}

/* Dimensiones */
.dimensions { margin-top: 14px; }
.dimRow {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.dimLabel {
  min-width: 110px;
  font-size: 13px;
  font-weight: 600;
}
.dimBar {
  flex: 1;
  height: 26px;
  background: #f1f5f9;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}
.dimBarFill {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
  font-size: 11px;
  font-weight: 700;
  color: white;
  transition: width 0.3s ease;
}
.dimScore {
  min-width: 50px;
  text-align: right;
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
}

/* Interpretación */
.interpText {
  font-size: 13px;
  line-height: 1.7;
  color: #334155;
  text-align: justify;
}

/* Descripciones de dimensiones */
.dimDescContainer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 14px;
}
.dimDesc {
  padding: 12px;
  background: #f8fafc;
  border-radius: 6px;
  border-left: 3px solid currentColor;
}
.dimDesc p {
  font-size: 12px;
  color: #475569;
  line-height: 1.5;
}

/* Recomendaciones */
.recommendations {
  list-style: disc;
  padding-left: 20px;
  margin-top: 10px;
}
.recommendations li {
  margin-bottom: 8px;
  font-size: 13px;
  color: #334155;
  line-height: 1.6;
}

/* Page break */
.pageBreak {
  break-before: page;
  page-break-before: always;
}

/* Print optimization */
@media print {
  .section { break-inside: avoid; }
  .dimRow { break-inside: avoid; }
  .dimDesc { break-inside: avoid; }
}
`;
