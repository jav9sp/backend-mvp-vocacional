import { INAPV_AREA_COLORS, INAPV_AREAS } from "../../data/inapv.data.js";
import { escapeHtml } from "../../utils/scapeHtml.js";
import { mergeTopAreas } from "../../utils/inapTopAreas.js";

type PeriodReportData = {
  ok: true;
  period: { id: number; name: string; status: string; testId: number };
  counts: {
    studentsCount: number;
    finishedCount: number;
    inProgressCount: number;
    notStartedCount: number;
  };
  resultsAvailableCount: number;
  aggregate: {
    topAreas: string[];
    byArea: Array<{
      area: string;
      scoreSum: { interes: number; aptitud: number; total: number };
      maxSum: { interes: number; aptitud: number; total: number };
      pctAvg: { interes: number; aptitud: number; total: number };
    }>;
  };
  rows: Array<{
    resultId: number;
    attemptId: number;
    createdAt: string;
    topAreasByInteres: string[];
    topAreasByAptitud: string[];
    student: { rut: string; name: string; email?: string | null } | null;
  }>;
  generatedAt: Date;
  logoDataUri?: string | null;
};

const INAPV_AREAS_MAP = Object.fromEntries(INAPV_AREAS.map((a) => [a.key, a]));
const areaName = (k: string) => INAPV_AREAS_MAP[k]?.name ?? k;

function clampPct(n: number) {
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0;
}
function fmtPct(n: number) {
  return `${Math.round(clampPct(n))}%`;
}
function fmtDateCL(d: Date | string) {
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleString("es-CL");
}

function renderLogo(logoDataUri?: string | null) {
  if (!logoDataUri) return `<div class="logoFallback">Portal Vocacional</div>`;
  return `<img alt="Logo" src="${logoDataUri}" class="logoImg" />`;
}

function renderChartRows(rows: Array<{ key: string; value: number }>) {
  return rows
    .map((r) => {
      const pct = Math.round(clampPct(r.value));
      const color = INAPV_AREA_COLORS[r.key] ?? "#111827";
      return `
      <div class="row avoidBreak">
        <div><div class="labelTitle">${escapeHtml(areaName(r.key).toUpperCase())}</div></div>
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
}

function renderChart(
  title: string,
  subtitle: string,
  rows: Array<{ key: string; value: number }>,
) {
  return `
    <div class="chart avoidBreak">
      <div class="chartLabel">
        <div class="h2">${escapeHtml(title)}</div>
        <div class="small muted">${escapeHtml(subtitle)}</div>
      </div>
      <div>${renderChartRows(rows)}</div>
    </div>
  `;
}

// ✅ Reusa tu REPORT_CSS casi igual (puedes agregar .kpis grid y table)
const REPORT_CSS = `
/* pega tu CSS y agrega lo de abajo */ 

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

.kpis{ display:grid; grid-template-columns:repeat(5,1fr); gap:10px; margin-top:12px;}
.kpi{ border:1px solid var(--border); border-radius:var(--radius-sm); padding:10px; background:#fff;}
.kpiLabel{ font-size:11px; color:var(--muted); }
.kpiValue{ font-size:18px; font-weight:900; margin-top:4px; }

.table{ width:100%; border-collapse:collapse; margin-top:10px; font-size:12px; }
.table th{ text-align:left; font-size:11px; color:var(--muted); padding:8px; border-bottom:1px solid var(--border); }
.table td{ padding:8px; border-bottom:1px solid #f1f5f9; vertical-align:top; }
.mono{ font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono","Courier New", monospace; }
.chips{ display:flex; gap:6px; flex-wrap:wrap; margin-top:8px;}
.chip{ border:1px solid var(--border); background:var(--soft); padding:3px 8px; border-radius:999px; font-size:11px; font-weight:700;}
`;

// export principal
export function renderInapvPeriodReportHtml(data: {
  ok: true;
  period: { id: number; name: string; status: string; testId: number };
  counts: {
    studentsCount: number;
    finishedCount: number;
    inProgressCount: number;
    notStartedCount: number;
  };
  resultsAvailableCount: number;
  aggregate: {
    topAreas: string[];
    byArea: Array<{
      area: string;
      pctAvg: { interes: number; aptitud: number; total: number };
      scoreSum: any;
      maxSum: any;
    }>;
  };
  rows: Array<{
    attemptId: number;
    topAreasByInteres: string[];
    topAreasByAptitud: string[];
    createdAt: string;
    student: any;
  }>;
  generatedAt: Date;
  logoDataUri?: string | null;
}) {
  const byAreaSorted = [...(data.aggregate.byArea ?? [])].sort(
    (a, b) => (b.pctAvg?.total ?? 0) - (a.pctAvg?.total ?? 0),
  );

  const interestRows = byAreaSorted.map((a) => ({
    key: a.area,
    value: a.pctAvg?.interes ?? 0,
  }));
  const aptitudeRows = byAreaSorted.map((a) => ({
    key: a.area,
    value: a.pctAvg?.aptitud ?? 0,
  }));

  const topAreaChips = (data.aggregate.topAreas ?? [])
    .slice(0, 5)
    .map((k) => `<span class="chip">${escapeHtml(areaName(k))}</span>`)
    .join("");

  const areasTable = byAreaSorted
    .map(
      (a) => `
    <tr>
      <td><b>${escapeHtml(areaName(a.area))}</b><div class="mono muted small">${escapeHtml(a.area)}</div></td>
      <td><b>${escapeHtml(fmtPct(a.pctAvg?.total ?? 0))}</b></td>
      <td>${escapeHtml(fmtPct(a.pctAvg?.interes ?? 0))}</td>
      <td>${escapeHtml(fmtPct(a.pctAvg?.aptitud ?? 0))}</td>
      <td class="mono small muted">
        ${a.scoreSum.total}/${a.maxSum.total}
        <div class="small muted">T/I/A: ${a.scoreSum.total}/${a.scoreSum.interes}/${a.scoreSum.aptitud}</div>
      </td>
    </tr>
  `,
    )
    .join("");

  const studentsTable = (data.rows ?? [])
    .map(
      (r) => `
    <tr>
      <td>
        <b>${escapeHtml(r.student?.name ?? "—")}</b>
        <div class="small muted mono">${escapeHtml(r.student?.rut ?? "")}</div>
        <div class="small muted">${escapeHtml(r.student?.email ?? "")}</div>
      </td>
      <td class="mono">${escapeHtml(String(r.attemptId))}</td>
      <td>${escapeHtml(fmtDateCL(r.createdAt))}</td>
      <td>${mergeTopAreas({
        topAreasByInteres: r.topAreasByInteres,
        topAreasByAptitud: r.topAreasByAptitud,
      })
        .slice(0, 3)
        .map((k) => `<span class="chip">${escapeHtml(k.toUpperCase())}</span>`)
        .join(" ")}</td>
    </tr>
  `,
    )
    .join("");

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Reporte de periodo</title>
  <style>${REPORT_CSS}</style>
</head>
<body>
  <div class="doc">

    <!-- PAGE 1 -->
    <section class="pageSection">
      <div class="top avoidBreak">
        <div>
          <h1 class="h1">Reporte de Resultados · Periodo</h1>
          <div class="small muted" style="margin-top:8px;">
            Periodo: <b>${escapeHtml(data.period.name)}</b> · Estado: <b>${escapeHtml(data.period.status)}</b>
          </div>
          <div class="small muted">Generado: ${escapeHtml(fmtDateCL(data.generatedAt))}</div>

          <div class="chips">
            ${topAreaChips || `<span class="small muted">—</span>`}
          </div>
        </div>
        <div>${renderLogo(data.logoDataUri)}</div>
      </div>

      <div class="kpis avoidBreak">
        <div class="kpi"><div class="kpiLabel">Total estudiantes</div><div class="kpiValue">${data.counts.studentsCount}</div></div>
        <div class="kpi"><div class="kpiLabel">Finalizados</div><div class="kpiValue">${data.counts.finishedCount}</div></div>
        <div class="kpi"><div class="kpiLabel">En progreso</div><div class="kpiValue">${data.counts.inProgressCount}</div></div>
        <div class="kpi"><div class="kpiLabel">No iniciados</div><div class="kpiValue">${data.counts.notStartedCount}</div></div>
        <div class="kpi"><div class="kpiLabel">Resultados</div><div class="kpiValue">${data.resultsAvailableCount}</div></div>
      </div>

      ${renderChart("Interés promedio por área (%)", "Promedio ponderado según máximos por área.", interestRows)}
      ${renderChart("Aptitud promedio por área (%)", "Promedio ponderado según máximos por área.", aptitudeRows)}
    </section>

    <!-- PAGE 2 -->
    <section class="pageSection pageBreak">
      <h2 class="h2">Detalle por área</h2>
      <p class="small muted">Porcentajes promedio (ponderados) y auditoría de puntos acumulados.</p>

      <table class="table">
        <thead>
          <tr>
            <th>Área</th>
            <th>Total %</th>
            <th>Interés %</th>
            <th>Aptitud %</th>
            <th>Auditoría</th>
          </tr>
        </thead>
        <tbody>
          ${areasTable || `<tr><td colspan="5" class="small muted">—</td></tr>`}
        </tbody>
      </table>

      <div class="divider"></div>

      <h2 class="h2">Estudiantes con resultados</h2>
      <p class="small muted">Listado de estudiantes que finalizaron y tienen resultado generado.</p>

      <table class="table">
        <thead>
          <tr>
            <th>Estudiante</th>
            <th>Attempt</th>
            <th>Fecha</th>
            <th>Top áreas</th>
          </tr>
        </thead>
        <tbody>
          ${studentsTable || `<tr><td colspan="4" class="small muted">—</td></tr>`}
        </tbody>
      </table>

    </section>

  </div>
</body>
</html>`;
}
