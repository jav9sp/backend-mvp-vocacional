import { escapeHtml } from "../../utils/scapeHtml.js";
import { CAAS_DIMENSIONS } from "../../data/caas.data.js";
import type { AdminPeriodResultsData } from "../../services/adminGetPeriodResultsData.service.js";

type CaasPeriodReportData = {
  ok: true;
  period: { id: number; name: string; status: string; testId: number };
  data: AdminPeriodResultsData;
  generatedAt: Date;
  logoDataUri?: string | null;
};

function clampPct(n: number) {
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0;
}

function fmtPct(n: number | null | undefined) {
  if (n === null || n === undefined) return "—";
  return `${Math.round(clampPct(n))}%`;
}

function fmtDateCL(d: Date | string) {
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleString("es-CL");
}

function dimName(key: string) {
  return CAAS_DIMENSIONS.find((d) => d.key === key)?.name ?? key;
}

function dimColor(key: string) {
  return CAAS_DIMENSIONS.find((d) => d.key === key)?.color ?? "#0f172a";
}

function renderLogo(logoDataUri?: string | null) {
  if (!logoDataUri) return `<div class="logoFallback">Portal Vocacional</div>`;
  return `<img alt="Logo" src="${logoDataUri}" class="logoImg" />`;
}

const REPORT_CSS = `
@page { size: A4; margin: 14mm; }
html, body { margin: 0; padding: 0; }
body {
  --ink: #0f172a;
  --muted: #64748b;
  --border: #e2e8f0;
  --soft: #f8fafc;
  color: var(--ink);
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Noto Sans", "Helvetica Neue", sans-serif;
}
.muted { color: var(--muted); }
.small { font-size: 12px; }
.h1 { font-size: 30px; font-weight: 900; letter-spacing: -0.02em; margin: 0; }
.h2 { font-size: 20px; font-weight: 900; margin: 0 0 8px; }
.top {
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  gap:16px;
  padding-bottom:10px;
  border-bottom:1px solid var(--border);
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
.kpis{ display:grid; grid-template-columns:repeat(5,1fr); gap:10px; margin-top:12px;}
.kpi{ border:1px solid var(--border); border-radius:4px; padding:10px; background:#fff;}
.kpiLabel{ font-size:11px; color:var(--muted); }
.kpiValue{ font-size:18px; font-weight:900; margin-top:4px; }
.section{ margin-top:14px; }
.chart { border:1px solid var(--border); border-radius:4px; padding:12px; background:#fff; }
.row { display:grid; grid-template-columns:220px 1fr; gap:12px; align-items:center; padding:8px 0; border-top:1px solid #f1f5f9; }
.row:first-child { border-top:none; }
.barWrap { height:24px; background:#f1f5f9; border-radius:999px; overflow:hidden; position:relative; }
.barFill { height:100%; border-radius:999px; display:flex; align-items:center; justify-content:flex-end; padding-right:8px; color:#fff; font-weight:800; font-size:11px; }
.table{ width:100%; border-collapse:collapse; margin-top:10px; font-size:12px; }
.table th{ text-align:left; font-size:11px; color:var(--muted); padding:8px; border-bottom:1px solid var(--border); }
.table td{ padding:8px; border-bottom:1px solid #f1f5f9; vertical-align:top; }
.badge { display:inline-block; border:1px solid var(--border); border-radius:999px; padding:3px 8px; font-size:11px; font-weight:700; background:var(--soft); }
.pageBreak { break-before: page; page-break-before: always; }
`;

export function renderCaasPeriodReportHtml(payload: CaasPeriodReportData) {
  const { period, data, generatedAt, logoDataUri } = payload;
  const dimRows = (data.aggregate.byDimension ?? [])
    .map((d) => {
      const color = dimColor(d.dimension);
      const pct = Math.round(clampPct(d.pctAvg));
      return `
      <div class="row">
        <div><strong>${escapeHtml(dimName(d.dimension))}</strong></div>
        <div class="barWrap">
          <div class="barFill" style="width:${pct}%; background:${color};">${pct}%</div>
        </div>
      </div>
    `;
    })
    .join("");

  const studentsTable = (data.rows ?? [])
    .map(
      (r) => `
    <tr>
      <td>
        <strong>${escapeHtml(r.student?.name ?? "—")}</strong>
        <div class="small muted">${escapeHtml(r.student?.rut ?? "")}</div>
      </td>
      <td>${escapeHtml(String(r.attemptId))}</td>
      <td>${escapeHtml(fmtDateCL(r.createdAt))}</td>
      <td>${escapeHtml(fmtPct(r.percentage))}</td>
      <td><span class="badge">${escapeHtml(String(r.level ?? "—").toUpperCase())}</span></td>
      <td>${escapeHtml(String(r.totalScore ?? 0))}/${escapeHtml(String(r.maxScore ?? 0))}</td>
    </tr>
  `,
    )
    .join("");

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Reporte CAAS por periodo</title>
  <style>${REPORT_CSS}</style>
</head>
<body>
  <div class="top">
    <div>
      <h1 class="h1">Reporte de Resultados · Periodo</h1>
      <div class="small muted" style="margin-top:8px;">
        Periodo: <b>${escapeHtml(period.name)}</b> · Estado: <b>${escapeHtml(period.status)}</b>
      </div>
      <div class="small muted">Generado: ${escapeHtml(fmtDateCL(generatedAt))}</div>
    </div>
    <div>${renderLogo(logoDataUri)}</div>
  </div>

  <div class="kpis">
    <div class="kpi"><div class="kpiLabel">Total estudiantes</div><div class="kpiValue">${data.counts.studentsCount}</div></div>
    <div class="kpi"><div class="kpiLabel">Finalizados</div><div class="kpiValue">${data.counts.finishedCount}</div></div>
    <div class="kpi"><div class="kpiLabel">En progreso</div><div class="kpiValue">${data.counts.inProgressCount}</div></div>
    <div class="kpi"><div class="kpiLabel">No iniciados</div><div class="kpiValue">${data.counts.notStartedCount}</div></div>
    <div class="kpi"><div class="kpiLabel">Promedio CAAS</div><div class="kpiValue">${fmtPct(data.aggregate.avgPercentage)}</div></div>
  </div>

  <div class="section chart">
    <h2 class="h2">Promedio por dimensión (%)</h2>
    ${dimRows || `<div class="small muted">—</div>`}
  </div>

  <div class="section pageBreak">
    <h2 class="h2">Estudiantes con resultados</h2>
    <table class="table">
      <thead>
        <tr>
          <th>Estudiante</th>
          <th>Attempt</th>
          <th>Fecha</th>
          <th>%</th>
          <th>Nivel</th>
          <th>Puntaje</th>
        </tr>
      </thead>
      <tbody>
        ${studentsTable || `<tr><td colspan="6" class="small muted">—</td></tr>`}
      </tbody>
    </table>
  </div>
</body>
</html>`;
}
