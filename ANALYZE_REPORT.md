# 🔎 Analyze Report

> Generado automáticamente: 2026-01-25T22:59:39.425Z

Este reporte resume:

- **Orphans**: archivos que no están conectados por imports (posibles no usados o scripts sueltos).
- **Circular deps**: ciclos de importación.
- **Dead exports**: exports no usados (según ts-prune).

## 🧩 Orphans (archivos no alcanzados por imports)

```txt
Processed 75 files (4.3s) (2 warnings)

index.ts
middlewares/errorHandler.ts
types/express.d.ts
```

## 🔁 Dependencias circulares

```txt
Processed 75 files (859ms) (2 warnings)

1) models/Attempt.model.ts > models/InapResult.model.ts
2) models/User.model.ts > models/Enrollment.model.ts
- Finding files
✖ Found 2 circular dependencies!
```

## 🪦 Dead exports (ts-prune)

```txt
\src\server.ts:13 - default
\src\data\careersMock.ts:1 - InapAreaKey (used in module)
\src\data\inapv.types.ts:1 - Dimension (used in module)
\src\data\inapvInterpretations.ts:10 - AreaInterpretation (used in module)
\src\errors\AppError.ts:1 - AppErrorCode (used in module)
\src\middlewares\auth.middleware.ts:4 - AuthContext (used in module)
\src\middlewares\errorHandler.ts:4 - errorHandler
\src\models\Attempt.model.ts:20 - AttemptStatus (used in module)
\src\models\Enrollment.model.ts:16 - EnrollmentStatus (used in module)
\src\models\Period.model.ts:17 - PeriodStatus (used in module)
\src\models\User.model.ts:19 - UserRole (used in module)
\src\services\adminGetPeriodResultsData.service.ts:8 - AreaDim (used in module)
\src\services\adminGetPeriodResultsData.service.ts:10 - AreaAggPct (used in module)
\src\services\adminGetPeriodResultsData.service.ts:17 - PeriodResultsRow (used in module)
\src\services\adminGetPeriodResultsData.service.ts:41 - AdminPeriodResultsData (used in module)
\src\services\adminGetPeriodResultsData.service.ts:76 - AdminGetPeriodResultsParams (used in module)
\src\services\attempt.service.ts:7 - getTestById
\src\services\attempt.service.ts:13 - getActiveEnrollment
\src\templates\period-report.template.ts:13 - renderPeriodReportHtml
\src\utils\inapv-areas.ts:1 - INAPV_AREA_NAME (used in module)
\src\utils\jwt.ts:9 - JwtUserPayload (used in module)
\src\utils\recommendCareers.ts:3 - PercentByAreaDim (used in module)
\src\utils\recommendCareers.ts:8 - RecommendMode (used in module)
\src\utils\recommendCareers.ts:10 - CareerRecommendation (used in module)
\src\validators\attempts.schemas.ts:17 - SaveAnswersBody
\src\controllers\admin\admin.enrollments.controller.ts:8 - adminListEnrollments
\src\controllers\admin\admin.export.controller.ts:15 - adminExportPeriodCSV
\src\controllers\admin\admin.periods.detail.controller.ts:7 - getPeriodSummary
\src\controllers\admin\admin.periods.detail.controller.ts:76 - getPeriodStudents
\src\controllers\admin\admin.students.controller.ts:43 - adminListStudents
\src\routes\auth\me.routes.ts:26 - default
```

## 🗺️ Grafo de dependencias

Se generó el archivo `deps.svg` (si tu entorno soporta Graphviz).

```txt
Processed 75 files (820ms) (2 warnings)


✖ Error: Graphviz could not be found. Ensure that "gvpr" is in your $PATH. Error: spawn gvpr ENOENT
    at checkGraphvizInstalled (C:\Users\psfue\Desktop\Portal Vocacional\backend-mvp-vocacional\node_modules\madge\lib\graph.js:33:10)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
- Finding files
```

## Notas

- En backends Express es normal que scripts como `seed.ts` o `alter.ts` aparezcan como _orphans_ si no se importan desde `server.ts`.
- Archivos `.d.ts` (como `src/types/express.d.ts`) pueden no aparecer como “usados” por estas herramientas aunque TypeScript sí los incluya.
