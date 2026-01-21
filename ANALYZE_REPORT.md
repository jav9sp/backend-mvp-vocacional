# 🔎 Analyze Report

> Generado automáticamente: 2026-01-19T16:17:41.342Z

Este reporte resume:
- **Orphans**: archivos que no están conectados por imports (posibles no usados o scripts sueltos).
- **Circular deps**: ciclos de importación.
- **Dead exports**: exports no usados (según ts-prune).

## 🧩 Orphans (archivos no alcanzados por imports)

```txt
Processed 60 files (20s) 

alter.ts
index.ts
router.ts
routes/auth/me.routes.ts
seed.ts
server.ts
services/results.service.ts
types/express.d.ts
```
## 🔁 Dependencias circulares

```txt
Processed 60 files (722ms) 

1) models/Attempt.model.ts > models/Result.model.ts
2) models/User.model.ts > models/Enrollment.model.ts
- Finding files
✖ Found 2 circular dependencies!
```
## 🪦 Dead exports (ts-prune)

```txt
\src\server.ts:13 - default
\src\controllers\admin.students.controller.ts:43 - adminListStudents
\src\controllers\student.results.controller.ts:116 - getMyLatestResult
\src\data\inapv.types.ts:1 - Dimension (used in module)
\src\middlewares\auth.middleware.ts:4 - AuthContext (used in module)
\src\models\Attempt.model.ts:20 - AttemptStatus (used in module)
\src\models\Enrollment.model.ts:16 - EnrollmentStatus (used in module)
\src\models\Period.model.ts:17 - PeriodStatus (used in module)
\src\models\User.model.ts:19 - UserRole (used in module)
\src\services\attempt.service.ts:7 - getTestById
\src\services\attempt.service.ts:13 - getActiveEnrollment
\src\services\results.service.ts:21 - findResultByAttemptId
\src\services\results.service.ts:28 - serializeResult
\src\services\results.service.ts:37 - serializeStudentAttempt
\src\services\results.service.ts:45 - serializeAdminAttempt
\src\utils\inapv-areas.ts:1 - INAPV_AREA_NAME (used in module)
\src\utils\jwt.ts:9 - JwtUserPayload (used in module)
\src\validators\attempts.schemas.ts:17 - SaveAnswersBody
\src\routes\auth\me.routes.ts:26 - default
```
## 🗺️ Grafo de dependencias
Se generó el archivo `deps.svg` (si tu entorno soporta Graphviz).

```txt
Processed 60 files (730ms) 


✖ Error: Graphviz could not be found. Ensure that "gvpr" is in your $PATH. Error: spawn gvpr ENOENT
    at checkGraphvizInstalled (C:\Users\psfue\Desktop\Portal Vocacional\backend-mvp-vocacional\node_modules\madge\lib\graph.js:33:10)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
- Finding files
```

## Notas
- En backends Express es normal que scripts como `seed.ts` o `alter.ts` aparezcan como *orphans* si no se importan desde `server.ts`.
- Archivos `.d.ts` (como `src/types/express.d.ts`) pueden no aparecer como “usados” por estas herramientas aunque TypeScript sí los incluya.
