import { escapeHtml } from "../../utils/scapeHtml.js";
import { CAAS_DIMENSIONS } from "../../data/caas.data.js";
import type { CaasDimension } from "../../data/caas.data.js";
import { PREMIUM_BASE_STYLES } from "../shared/premiumStyles.js";

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
  <style>
${PREMIUM_BASE_STYLES}
${CAAS_REPORT_CSS}
  </style>
</head>
<body>
  <div class="doc">
    <!-- Header -->
    <div class="header avoid-break">
      <div>
        <h1 class="header-title">${escapeHtml(attempt.period.test.name)}</h1>
        <div class="meta">
          <span><strong>${escapeHtml(student.name)}</strong></span>
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
/* CAAS-specific styles - extending premium base */

/* Enhanced header */
.header {
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  margin-bottom: var(--space-8);
  border: 1px solid var(--color-border);
}

.header-title {
  font-size: 26px;
  font-weight: 900;
  margin-bottom: 10px;
  background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.meta {
  font-size: 12px;
  color: var(--color-muted);
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.meta > span {
  display: inline-flex;
  align-items: center;
}

/* Premium gauge with enhanced styling */
.gauge {
  display: flex;
  justify-content: center;
  margin: var(--space-8) 0;
  padding: var(--space-6);
  background: linear-gradient(135deg, #ffffff 0%, var(--color-surface-2) 100%);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
}

.gaugeSvg {
  width: 220px;
  height: 130px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.08));
}

.scoreDetail {
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-fg);
  margin-top: var(--space-4);
  padding: var(--space-3) var(--space-5);
  background: var(--color-surface-2);
  border-radius: var(--radius-md);
  display: inline-block;
}

/* Dimensions with premium styling */
.dimensions {
  margin-top: var(--space-5);
  padding: var(--space-5);
  background: linear-gradient(135deg, #ffffff 0%, var(--color-surface-2) 100%);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.dimRow {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
  padding: var(--space-3);
  background: white;
  border-radius: var(--radius-md);
  transition: transform 0.2s ease;
}

.dimRow:last-child {
  margin-bottom: 0;
}

.dimLabel {
  min-width: 120px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.dimBar {
  flex: 1;
  height: 32px;
  background: var(--color-surface-3);
  border-radius: var(--radius-sm);
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
}

.dimBarFill {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 12px;
  font-size: 12px;
  font-weight: 900;
  color: white;
  transition: width 0.3s ease;
  border-radius: var(--radius-sm);
  box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.2);
}

.dimScore {
  min-width: 60px;
  text-align: right;
  font-size: 13px;
  color: var(--color-muted);
  font-weight: 700;
}

/* Interpretation section */
.interpText {
  font-size: 14px;
  line-height: 1.8;
  color: #334155;
  text-align: justify;
  padding: var(--space-5);
  background: var(--color-surface-2);
  border-radius: var(--radius-lg);
  border-left: 4px solid var(--color-primary);
}

/* Dimension descriptions */
.dimDescContainer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-5);
  margin-top: var(--space-5);
}

.dimDesc {
  padding: var(--space-5);
  background: linear-gradient(135deg, #ffffff 0%, var(--color-surface-2) 100%);
  border-radius: var(--radius-lg);
  border-left: 4px solid currentColor;
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s ease;
}

.dimDesc h3 {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 10px;
  letter-spacing: -0.01em;
}

.dimDesc p {
  font-size: 12px;
  color: #475569;
  line-height: 1.6;
}

/* Recommendations */
.recommendations {
  list-style: none;
  padding-left: 0;
  margin-top: var(--space-4);
}

.recommendations li {
  margin-bottom: var(--space-4);
  font-size: 13px;
  color: #334155;
  line-height: 1.7;
  padding-left: var(--space-6);
  position: relative;
}

.recommendations li::before {
  content: '✓';
  position: absolute;
  left: 0;
  top: 0;
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, var(--color-success) 0%, #22c55e 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 2px 6px rgba(22, 163, 74, 0.3);
}

/* Page break */
.pageBreak {
  break-before: page;
  page-break-before: always;
}

/* Print optimization */
@media print {
  body {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  .section {
    break-inside: avoid;
  }

  .dimRow {
    break-inside: avoid;
  }

  .dimDesc {
    break-inside: avoid;
  }

  .header,
  .gauge,
  .dimensions,
  .dimDesc {
    box-shadow: none;
  }
}
`;
