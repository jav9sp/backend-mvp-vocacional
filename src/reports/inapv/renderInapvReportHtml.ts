import { INAPV_AREA_COLORS, INAPV_AREAS } from "../../data/inapv.data.js";
import { escapeHtml } from "../../utils/scapeHtml.js";

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
  student: { name: string; email?: string | null };
  attempt: {
    id: number;
    finishedAt: string | Date;
    test: { name: string; version?: string | null };
  };
  result: {
    id: number;
    createdAt: string | Date;
    topAreas: AreaKey[];
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
  links: Array<{ label: string; url: string; description: string }>;
  finalConsiderations: string;
  logoDataUri?: string | null; // opcional
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
@page { size: A4; margin: 14mm; }

/* reset */
html, body { margin: 0; padding: 0; }
body {
  --ink: #0f172a;
  --muted: #64748b;
  --border: #e2e8f0;
  --soft: #f8fafc;
  --grid: #e2e8f0;

  --radius-sm: 4px;

  color: var(--ink);
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Noto Sans", "Helvetica Neue", sans-serif;
}

.muted { color: var(--muted); }
.small { font-size: 12px; }
.h1 { font-size: 30px; font-weight: 900; letter-spacing: -0.02em; margin: 0; }
.h2 { font-size: 20px; font-weight: 900; margin: 0 0 8px; }

.avoidBreak { break-inside: avoid; page-break-inside: avoid; }

/* sections */
.doc { }
.pageSection { }
.pageBreak { break-before: page; page-break-before: always; }

.divider { height: 1px; background: var(--border); margin: 14px 0; }

/* header */
.top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border);
}

.badges {
  margin-top: 8px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.badge {
  display: inline-block;
  padding: 4px 10px;
  border: 1px solid var(--border);
  border-radius: 999px;
  font-size: 12px;
  background: var(--soft);
}

.logoImg { height: 42px; object-fit: contain; }
.logoFallback {
  font-size: 12px;
  font-weight: 900;
  color: #334155;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #fff;
}

/* info boxes */
.grid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.box {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 12px;
  background: #fff;
}

.note {
  font-size: 12px;
  color: #475569;
  line-height: 1.45;
}

/* top cards */
.cards {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
}

.card {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 12px;
  background: #fff;
}

.cardTitleContainer {
  height: 4ch;
}

.cardTitle { font-weight: 900; font-size: 14px; }

.pills { display: flex; justify-content: space-between; gap: 12px; margin-block: 16px; }

.pill {
  font-size: 11px;
  padding: 4px 10px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--soft);
  white-space: nowrap;
  width: 6.2rem;
  text-align: center;
}

.subhead {
  font-size: 11px;
  font-weight: 900;
  color: var(--ink);
  margin-top: 10px;
}

.text {
  font-size: 12px;
  color: #334155;
  line-height: 1.45;
}

/* charts */
.chart {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 12px;
  background: #fff;
  margin-top: 12px;
}

.chartLabel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.row {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 12px;
  align-items: center;
  padding: 6px;
  padding-right: 36px;
  border-top: 1px solid #f1f5f9;
}

.row:first-child { border-top: none; padding-top: 0; }

.labelTitle {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.barWrap { position: relative; height: 30px; opacity: 0.95; }
.grid {
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, var(--grid) 1px, transparent 1px) 0 0 / 10% 100%;
}
.bar { position: absolute; left: 0; top: 0; bottom: 0; border-radius: var(--radius-sm); }
.barValue {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  right: -50px;
  font-weight: 900;
  font-size: 12px;
  width: 42px;
  text-align: left;
}

/* careers */
.careersGrid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
.careerCard {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 12px;
  background: #fff;
}

.careerTop { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
.careerName { font-weight: 900; font-size: 13px; line-height: 1.2; }
.careerScore { font-weight: 900; font-size: 13px; white-space: nowrap; }

.careerMeta {
  margin-top: 8px;
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  color: #fff;
  font-weight: 900;
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 999px;
  letter-spacing: 0.04em;
}

.group {
  margin-block: 16px;
}

.careerWhy { margin-top: 8px; font-size: 12px; color: #334155; line-height: 1.35; }

/* links */
.linksGrid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
.linkCard { border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 12px; background: #fff; }
.linkTitle { font-weight: 900; font-size: 13px; }
.linkDesc { margin-top: 6px; font-size: 12px; color: #334155; line-height: 1.35; }
.linkUrl { margin-top: 6px; font-size: 11px; color: #2563eb; word-break: break-all; }

`;

export function renderInapvReportHtml(data: InapvReportData) {
  const topAreas = (data.result.topAreas ?? []).slice(0, 3);

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
  <style>${REPORT_CSS}</style>
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
            <span class="badge">${escapeHtml(data.attempt.test.name)}</span>
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
