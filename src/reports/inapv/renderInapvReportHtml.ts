import { INAPV_AREA_COLORS, INAPV_AREAS } from "../../data/inapv.data.js";
import { escapeHtml } from "../../utils/scapeHtml.js";
import { mergeTopAreas } from "../../utils/inapTopAreas.js";
import { PREMIUM_BASE_STYLES } from "../shared/premiumStyles.js";

type AreaKey =
  | "adm"
  | "agr"
  | "art"
  | "csn"
  | "soc"
  | "edu"
  | "ing"
  | "sal"
  | "seg"
  | "tec";

type Percent = { interes: number; aptitud: number; total: number };

export type InapvReportData = {
  student: {
    name: string;
    email?: string | null;
  };

  attempt: {
    id: number;
    finishedAt: string | Date;

    period: {
      id: number;
      name: string;
      startAt: string | Date;
      endAt?: string | Date | null;

      test: {
        id: number;
        name: string;
        version?: string | null;
      };
    };
  };

  result: {
    id: number;
    createdAt: string | Date;
    topAreasByInteres: AreaKey[];
    topAreasByAptitud: AreaKey[];
    percentByAreaDim: Record<string, Percent>;
  };

  interpretations: {
    interes: string;
    aptitud: string;
    combined: string;
    byArea: Record<string, { interes: string; aptitud: string }>;
  };

  careers: Array<{
    id: string | number;
    name: string;
    areaKey: AreaKey;
    score: number;
    level?: "universitario" | "tecnico";
  }>;

  links: Array<{
    label: string;
    url: string;
    description: string;
  }>;

  finalConsiderations: string;

  logoDataUri?: string | null;
};

const INAPV_AREAS_MAP = Object.fromEntries(
  INAPV_AREAS.map((area) => [area.key, area]),
);

function areaName(key: string) {
  return INAPV_AREAS_MAP[key]?.name ?? key;
}

function clampPct(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function fmtPct(n: number) {
  return `${Math.round(clampPct(n))}%`;
}

function fmtDateCL(d: string | Date) {
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleString("es-CL");
}

function renderLogo(logoDataUri?: string | null) {
  if (!logoDataUri) return `<div class="logoFallback">Portal Vocacional</div>`;
  return `<img alt="Logo" src="${logoDataUri}" class="logoImg" />`;
}

function renderChart(args: {
  title: string;
  subtitle: string;
  rows: Array<{ key: string; value: number }>;
}) {
  const { title, subtitle, rows } = args;

  const rowsHtml = rows
    .map((r) => {
      const pct = Math.round(clampPct(r.value));
      const color = INAPV_AREA_COLORS[r.key] ?? "#111827";
      return `
        <div class="row avoidBreak">
          <div>
            <div class="labelTitle">${escapeHtml(areaName(r.key).toUpperCase())}</div>
          </div>
          <div class="barWrap">
            <div class="grid"></div>
            <div class="bar" style="width:${pct}%; background:${color};">
              <div class="barValue" style="color:${color};">${pct}%</div>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  return `
    <div class="chart avoidBreak">
      <div class="chartLabel">
        <div class="h2">${escapeHtml(title)}</div>
        <div class="small muted">${escapeHtml(subtitle)}</div>
      </div>
      <div>${rowsHtml}</div>
    </div>
  `;
}

const REPORT_CSS = `
/* INAPV-specific styles - extending premium base */

/* Enhanced header/top section */
.top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-5);
  padding: var(--space-6);
  background: linear-gradient(135deg, #ffffff 0%, var(--color-surface-2) 100%);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  margin-bottom: var(--space-6);
  border: 1px solid var(--color-border);
}

.h1 {
  font-size: 30px;
  font-weight: 900;
  letter-spacing: -0.02em;
  margin: 0;
  background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.h2 {
  font-size: 20px;
  font-weight: 900;
  margin: 0 0 var(--space-3);
  color: var(--color-fg);
}

.badges {
  margin-top: var(--space-3);
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.logoImg {
  height: 48px;
  object-fit: contain;
}

.logoFallback {
  font-size: 13px;
  font-weight: 900;
  color: var(--color-primary);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, #ffffff 0%, var(--color-surface-2) 100%);
  box-shadow: var(--shadow-sm);
}

/* Info boxes */
.grid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.box {
  padding: var(--space-5);
  background: linear-gradient(135deg, #ffffff 0%, var(--color-surface-2) 100%);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

/* Top cards */
.cards {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--space-4);
}

.card {
  padding: var(--space-5);
  background: linear-gradient(135deg, #ffffff 0%, var(--color-surface-2) 100%);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.cardTitleContainer {
  min-height: 3.5rem;
  margin-bottom: var(--space-2);
}

.cardTitle {
  font-weight: 900;
  font-size: 15px;
  color: var(--color-fg);
  letter-spacing: -0.01em;
}

.pills {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  margin-block: var(--space-4);
}

.pill {
  font-size: 11px;
  font-weight: 600;
  padding: 6px 12px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: white;
  white-space: nowrap;
  flex: 1;
  text-align: center;
  box-shadow: var(--shadow-sm);
}

.subhead {
  font-size: 11px;
  font-weight: 900;
  color: var(--color-fg);
  margin-top: var(--space-3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.text {
  font-size: 12px;
  color: #334155;
  line-height: 1.6;
  margin-top: var(--space-2);
}

/* Charts - Optimized for compact layout */
.chart {
  padding: var(--space-4);
  background: linear-gradient(135deg, #ffffff 0%, var(--color-surface-2) 100%);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  margin-top: var(--space-3);
}

.chart:first-of-type {
  margin-top: var(--space-4);
}

.chartLabel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.row {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: var(--space-3);
  align-items: center;
  padding: 6px var(--space-2);
  padding-right: 36px;
  border-top: 1px solid var(--color-border);
  background: white;
  border-radius: var(--radius-sm);
  margin-bottom: 6px;
}

.row:first-child {
  border-top: none;
  padding-top: 0;
}

.row:last-child {
  margin-bottom: 0;
}

.labelTitle {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.barWrap {
  position: relative;
  height: 28px;
}

.grid {
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, var(--color-border) 1px, transparent 1px) 0 0 / 10% 100%;
  opacity: 0.5;
}

.bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  border-radius: var(--radius-sm);
  box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.2);
}

.barValue {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  right: -46px;
  font-weight: 900;
  font-size: 12px;
  width: 42px;
  text-align: left;
}

/* Careers */
.careersGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
  margin-top: var(--space-4);
}

.careerCard {
  padding: var(--space-5);
  background: linear-gradient(135deg, #ffffff 0%, var(--color-surface-2) 100%);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.careerTop {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-3);
}

.careerName {
  font-weight: 900;
  font-size: 14px;
  line-height: 1.3;
  color: var(--color-fg);
}

.careerScore {
  font-weight: 900;
  font-size: 14px;
  white-space: nowrap;
}

.careerMeta {
  margin-top: var(--space-3);
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.tag {
  color: #fff;
  font-weight: 900;
  font-size: 10px;
  padding: 4px 10px;
  border-radius: 999px;
  letter-spacing: 0.05em;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.group {
  margin-block: var(--space-6);
}

.careerWhy {
  margin-top: var(--space-3);
  font-size: 12px;
  color: #334155;
  line-height: 1.5;
}

/* Links */
.linksGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
  margin-top: var(--space-4);
}

.linkCard {
  padding: var(--space-5);
  background: linear-gradient(135deg, #ffffff 0%, var(--color-surface-2) 100%);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.linkTitle {
  font-weight: 900;
  font-size: 14px;
  color: var(--color-fg);
}

.linkDesc {
  margin-top: var(--space-2);
  font-size: 12px;
  color: #334155;
  line-height: 1.5;
}

.linkUrl {
  margin-top: var(--space-2);
  font-size: 11px;
  color: var(--color-primary);
  word-break: break-all;
  font-weight: 600;
}

/* Print optimization */
@media print {
  body {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  .top,
  .box,
  .card,
  .chart,
  .careerCard,
  .linkCard {
    box-shadow: none;
  }
}
`;

export function renderInapvReportHtml(data: InapvReportData) {
  const topAreas = mergeTopAreas({
    topAreasByInteres: data.result.topAreasByInteres,
    topAreasByAptitud: data.result.topAreasByAptitud,
  }).slice(0, 3);

  const topCardsHtml = topAreas
    .map((k) => {
      const pct = data.result.percentByAreaDim?.[k] ?? {
        interes: 0,
        aptitud: 0,
        total: 0,
      };
      const interp = data.interpretations.byArea?.[k] ?? {
        interes: "—",
        aptitud: "—",
      };

      return `
        <div class="card avoidBreak">
          <div class="cardTitleContainer">
            <div class="cardTitle">${escapeHtml(areaName(k))}</div>
          </div>
          <div class="pills">
            <div class="pill">Interés: <b>${escapeHtml(fmtPct(pct.interes))}</b></div>
            <div class="pill">Aptitud: <b>${escapeHtml(fmtPct(pct.aptitud))}</b></div>
          </div>

          <div class="subhead">Interés</div>
          <div class="text">${escapeHtml(interp.interes)}</div>

          <div class="subhead">Aptitud</div>
          <div class="text">${escapeHtml(interp.aptitud)}</div>
        </div>
      `;
    })
    .join("");

  const careersHtml = (data.careers ?? [])
    .map((c) => {
      const color = INAPV_AREA_COLORS[c.areaKey] ?? "#111827";
      const levelLabel =
        c.level === "tecnico"
          ? "Técnico"
          : c.level === "universitario"
            ? "Universitario"
            : null;

      return `
        <div class="careerCard avoidBreak">
          <div class="careerTop">
            <div class="careerName">${escapeHtml(c.name)}</div>
            <div class="careerScore" style="color:${color};">${escapeHtml(fmtPct(c.score))}</div>
          </div>

          <div class="careerMeta">
            <span class="tag" style="background:${color};">${escapeHtml(String(c.areaKey).toUpperCase())}</span>
            <span class="muted">${escapeHtml(areaName(c.areaKey))}</span>
            ${
              levelLabel
                ? `<span class="badge" style="padding:2px 8px; font-size:11px;">${escapeHtml(levelLabel)}</span>`
                : ""
            }
          </div>

          <div class="careerWhy">
            Sugerida por afinidad con tus resultados en <b>${escapeHtml(areaName(c.areaKey))}</b>.
          </div>
        </div>
      `;
    })
    .join("");

  const linksHtml = (data.links ?? [])
    .map(
      (l) => `
      <div class="linkCard avoidBreak">
        <div class="linkTitle">${escapeHtml(l.label)}</div>
        <div class="linkDesc">${escapeHtml(l.description)}</div>
        <div class="linkUrl">${escapeHtml(l.url)}</div>
      </div>
    `,
    )
    .join("");

  const interestRows = Object.entries(data.result.percentByAreaDim ?? {})
    .map(([key, v]) => ({ key, value: Number(v?.interes ?? 0) }))
    .sort((a, b) => b.value - a.value);

  const aptitudeRows = Object.entries(data.result.percentByAreaDim ?? {})
    .map(([key, v]) => ({ key, value: Number(v?.aptitud ?? 0) }))
    .sort((a, b) => b.value - a.value);

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Informe INAP-V</title>
  <style>
${PREMIUM_BASE_STYLES}
${REPORT_CSS}
  </style>
</head>
<body>
  <div class="doc">

    <!-- SECCIÓN 1 -->
    <section class="pageSection">
      <div class="top avoidBreak">
        <div>
          <h1 class="h1">Informe de Resultados</h1>
          <div class="small muted" style="margin-top:8px;">
            Estudiante: <b>${escapeHtml(data.student.name)}</b>${
              data.student.email ? ` · ${escapeHtml(data.student.email)}` : ""
            }
          </div>
          <div class="small muted">
            Fecha del test: ${escapeHtml(fmtDateCL(data.attempt.finishedAt))}
          </div>
          <div class="badges">
            <span class="badge">${escapeHtml(data.attempt.period.test.name)}</span>
          </div>
        </div>
        <div>${renderLogo(data.logoDataUri)}</div>
      </div>

      <div style="margin-top:12px;" class="avoidBreak">
        <div class="grid2">
          <div class="box">
            <div class="h2">¿Qué es Interés?</div>
            <div class="note">${escapeHtml(data.interpretations.interes)}</div>
          </div>
          <div class="box">
            <div class="h2">¿Qué es Aptitud?</div>
            <div class="note">${escapeHtml(data.interpretations.aptitud)}</div>
          </div>
        </div>

        <div class="box" style="margin-top:12px;">
          <div class="note">${escapeHtml(data.interpretations.combined)}</div>
        </div>
      </div>


      <div class="avoidBreak">
        <div class="group">
          <div class="h2">Áreas destacadas (Top 3)</div>
          <div class="small muted">Interpretación de tus áreas más altas.</div>

          <div class="cards" style="margin-top:10px;">
            ${topCardsHtml || `<div class="small muted">—</div>`}
          </div>
        </div>
      </div>
    </section>

    <!-- SECCIÓN 2 -->
    <section class="pageSection pageBreak">
      <h2 class="h2">Gráficos de Interés y Aptitud</h2>
      <p class="small muted">Porcentajes de interés y aptitud de acuerdo a tus respuestas.</p>

      ${renderChart({
        title: "Interés por área (%)",
        subtitle: "Porcentaje de interés en cada área.",
        rows: interestRows,
      })}

      ${renderChart({
        title: "Aptitud por área (%)",
        subtitle: "Porcentaje de aptitud en cada área.",
        rows: aptitudeRows,
      })}
    </section>

    <!-- SECCIÓN 3 -->
    <section class="pageSection pageBreak">
      <div class="avoidBreak">
        <div class="group">
          <div class="h2">Sugerencias de carreras para explorar</div>
          <div class="small muted">Sugeridas a partir de tus áreas con mayor afinidad.</div>

          <div class="careersGrid">
            ${careersHtml || `<div class="small muted">—</div>`}
          </div>
        </div>
      </div>
      
      <div class="avoidBreak">
        <div class="h2">Enlaces de interés</div>
        <p class="small muted">Sitios oficiales para seguir explorando.</p>

        <div class="linksGrid">
          ${linksHtml || `<div class="small muted">—</div>`}
        </div>
      </div>

      <div class="avoidBreak" style="margin-top:16px;">
        <h2 class="h2">Consideraciones finales</h2>
        <div class="box">
          <div class="note" style="white-space:pre-line;">${escapeHtml(
            data.finalConsiderations,
          )}</div>
        </div>
      </div>
    </section>

  </div>
</body>
</html>`;
}
