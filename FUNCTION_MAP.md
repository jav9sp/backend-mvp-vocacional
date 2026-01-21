# 🗺️ Function Map + Usos (TypeScript)

> Generado automáticamente: 2026-01-19T16:48:22.331Z
> Incluye **tipo de retorno** (estático) y **archivos donde se referencia** (call graph simple).

## Cómo leer esto
- **export/local**: si la función está exportada o es interna del archivo.
- **retorno**: tipo inferido por TypeScript.
- **usada en**: lista de archivos que la referencian (imports/llamadas/uso como callback, etc.).

## src/alter.ts

- `main` (**local**) → `Promise<void>`
  - firma: `typeof main`
  - usada en:
    - `src/alter.ts`

## src/config/sequelize.ts

- `connectDB` (**export**) → `Promise<void>`
  - firma: `typeof connectDB`
  - usada en:
    - `src/index.ts`

## src/controllers/admin.dashboard.controller.ts

- `adminGetDashboard` (**export**) → `Promise<Response<any, Record<string, any>>>`
  - firma: `typeof adminGetDashboard`
  - usada en:
    - `src/routes/admin/admin.routes.ts`

## src/controllers/admin.enrollments.controller.ts

- `adminListEnrollments` (**export**) → `Promise<Response<any, Record<string, any>>>`
  - firma: `typeof adminListEnrollments`
  - usada en:
    - `src/routes/admin/admin.periods.routes.ts`

## src/controllers/admin.export.controller.ts

- `adminExportPeriodCSV` (**export**) → `Promise<Response<any, Record<string, any>>>`
  - firma: `typeof adminExportPeriodCSV`
  - usada en:
    - `src/routes/admin/admin.periods.routes.ts`
- `csvEscape` (**local**) → `any`
  - firma: `typeof csvEscape`
  - usada en:
    - `src/controllers/admin.export.controller.ts`

## src/controllers/admin.import.controller.ts

- `adminImportEnrollmentsXlsx` (**export**) → `Promise<Response<any, Record<string, any>>>`
  - firma: `typeof adminImportEnrollmentsXlsx`
  - usada en:
    - `src/routes/admin/admin.periods.routes.ts`
- `canonicalizeRowKeys` (**local**) → `Record<string, any>`
  - firma: `typeof canonicalizeRowKeys`
  - usada en:
    - `src/controllers/admin.import.controller.ts`
- `getPresentCanonicalHeaders` (**local**) → `Set<string>`
  - firma: `typeof getPresentCanonicalHeaders`
  - usada en:
    - `src/controllers/admin.import.controller.ts`
- `normalizeHeaderKey` (**local**) → `string`
  - firma: `typeof normalizeHeaderKey`
  - usada en:
    - `src/controllers/admin.import.controller.ts`

## src/controllers/admin.periods.controller.ts

- `adminCreatePeriod` (**export**) → `Promise<Response<any, Record<string, any>>>`
  - firma: `typeof adminCreatePeriod`
  - usada en:
    - `src/routes/admin/admin.periods.routes.ts`
- `adminGetPeriodById` (**export**) → `Promise<Response<any, Record<string, any>>>`
  - firma: `typeof adminGetPeriodById`
  - usada en:
    - `src/routes/admin/admin.periods.routes.ts`
- `adminListPeriods` (**export**) → `Promise<Response<any, Record<string, any>>>`
  - firma: `typeof adminListPeriods`
  - usada en:
    - `src/routes/admin/admin.periods.routes.ts`
- `adminUpdatePeriod` (**export**) → `Promise<Response<any, Record<string, any>>>`
  - firma: `typeof adminUpdatePeriod`
  - usada en:
    - `src/routes/admin/admin.periods.routes.ts`

## src/controllers/admin.periods.detail.controller.ts

- `getPeriodStudents` (**export**) → `Promise<Response<any, Record<string, any>>>`
  - firma: `typeof getPeriodStudents`
  - usada en:
    - `src/routes/admin/admin.periods.routes.ts`
- `getPeriodSummary` (**export**) → `Promise<Response<any, Record<string, any>>>`
  - firma: `typeof getPeriodSummary`
  - usada en:
    - `src/routes/admin/admin.periods.routes.ts`
- `normalizeStatus` (**local**) → `"in_progress" | "finished" | "not_started"`
  - firma: `typeof normalizeStatus`
  - usada en:
    - `src/controllers/admin.periods.detail.controller.ts`

## src/controllers/admin.report.controller.ts

- `adminGetPeriodReport` (**export**) → `Promise<Response<any, Record<string, any>>>`
  - firma: `typeof adminGetPeriodReport`
  - usada en:
    - `src/routes/admin/admin.periods.routes.ts`

## src/controllers/admin.report.pdf.controller.ts

- `adminGetPeriodReportPdf` (**export**) → `Promise<Response<any, Record<string, any>>>`
  - firma: `typeof adminGetPeriodReportPdf`
  - usada en:
    - `src/routes/admin/admin.periods.routes.ts`

## src/controllers/admin.results.controller.ts

- `adminGetAttemptResult` (**export**) → `Promise<void | Response<any, Record<string, any>>>`
  - firma: `typeof adminGetAttemptResult`
  - usada en:
    - `src/routes/admin/admin.routes.ts`

## src/controllers/admin.students.controller.ts

- `adminGetStudentDetail` (**export**) → `Promise<void | Response<any, Record<string, any>>>`
  - firma: `typeof adminGetStudentDetail`
  - usada en:
    - `src/routes/admin/admin.students.routes.ts`
- `adminGetStudents` (**export**) → `Promise<Response<any, Record<string, any>>>`
  - firma: `typeof adminGetStudents`
  - usada en:
    - `src/routes/admin/admin.students.routes.ts`
- `adminListStudents` (**export**) → `Promise<Response<any, Record<string, any>>>`
  - firma: `typeof adminListStudents`
  - usada en: _(sin referencias detectadas)_
- `adminPatchStudent` (**export**) → `Promise<void | Response<any, Record<string, any>>>`
  - firma: `typeof adminPatchStudent`
  - usada en:
    - `src/routes/admin/admin.students.routes.ts`
- `adminResetStudentPassword` (**export**) → `Promise<void | Response<any, Record<string, any>>>`
  - firma: `typeof adminResetStudentPassword`
  - usada en:
    - `src/routes/admin/admin.students.routes.ts`
- `deriveStatus` (**local**) → `"in_progress" | "finished" | "not_started"`
  - firma: `typeof deriveStatus`
  - usada en:
    - `src/controllers/admin.students.controller.ts`
- `getCourseFromMeta` (**local**) → `string`
  - firma: `typeof getCourseFromMeta`
  - usada en:
    - `src/controllers/admin.students.controller.ts`
- `normalizeStatusFromAttempt` (**local**) → `DerivedStatus`
  - firma: `typeof normalizeStatusFromAttempt`
  - usada en:
    - `src/controllers/admin.students.controller.ts`

## src/controllers/admin.tests.controller.ts

- `adminListTests` (**export**) → `Promise<Response<any, Record<string, any>>>`
  - firma: `typeof adminListTests`
  - usada en:
    - `src/routes/admin/admin.routes.ts`

## src/controllers/attempts.controller.ts

- `finishAttempt` (**export**) → `Promise<void | Response<any, Record<string, any>>>`
  - firma: `typeof finishAttempt`
  - usada en:
    - `src/routes/student/student.attempts.routes.ts`
- `getAttemptAnswers` (**export**) → `Promise<void | Response<any, Record<string, any>>>`
  - firma: `typeof getAttemptAnswers`
  - usada en:
    - `src/routes/student/student.attempts.routes.ts`
- `getAttemptContext` (**export**) → `Promise<void | Response<any, Record<string, any>>>`
  - firma: `typeof getAttemptContext`
  - usada en:
    - `src/routes/student/student.attempts.routes.ts`
- `saveAttemptAnswers` (**export**) → `Promise<void | Response<any, Record<string, any>>>`
  - firma: `typeof saveAttemptAnswers`
  - usada en:
    - `src/routes/student/student.attempts.routes.ts`

## src/controllers/auth.controller.ts

- `login` (**export**) → `Promise<Response<any, Record<string, any>>>`
  - firma: `typeof login`
  - usada en:
    - `src/routes/auth/auth.routes.ts`

## src/controllers/results.controller.ts

- `getAttemptResult` (**export**) → `Promise<void | Response<any, Record<string, any>>>`
  - firma: `typeof getAttemptResult`
  - usada en:
    - `src/routes/student/student.attempts.routes.ts`

## src/controllers/student.enrollment.controller.ts

- `getOrCreateAttemptForEnrollment` (**export**) → `Promise<void | Response<any, Record<string, any>>>`
  - firma: `typeof getOrCreateAttemptForEnrollment`
  - usada en:
    - `src/routes/student/student.enrollments.router.ts`
- `listMyActiveEnrollments` (**export**) → `Promise<void | Response<any, Record<string, any>>>`
  - firma: `typeof listMyActiveEnrollments`
  - usada en:
    - `src/routes/student/student.enrollments.router.ts`

## src/controllers/student.results.controller.ts

- `getResultDetails` (**export**) → `Promise<void | Response<any, Record<string, any>>>`
  - firma: `typeof getResultDetails`
  - usada en:
    - `src/routes/student/student.results.routes.ts`
- `listStudentResults` (**export**) → `Promise<void | Response<any, Record<string, any>>>`
  - firma: `typeof listStudentResults`
  - usada en:
    - `src/routes/student/student.results.routes.ts`

## src/index.ts

- `bootstrap` (**local**) → `Promise<void>`
  - firma: `typeof bootstrap`
  - usada en:
    - `src/index.ts`

## src/middlewares/auth.middleware.ts

- `requireAuth` (**export**) → `void | Response<any, Record<string, any>>`
  - firma: `typeof requireAuth`
  - usada en:
    - `src/routes/admin/admin.routes.ts`
    - `src/routes/auth/auth.routes.ts`
    - `src/routes/auth/me.routes.ts`
    - `src/routes/student/student.enrollments.router.ts`
    - `src/routes/student/student.routes.ts`
- `requireRole` (**export**) → `(req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>`
  - firma: `typeof requireRole`
  - usada en:
    - `src/routes/admin/admin.routes.ts`
    - `src/routes/student/student.enrollments.router.ts`
    - `src/routes/student/student.routes.ts`

## src/middlewares/requiereAttempt.ts

- `requiereStudentAttempt` (**export**) → `Promise<void | Response<any, Record<string, any>>>`
  - firma: `typeof requiereStudentAttempt`
  - usada en:
    - `src/routes/student/student.attempts.routes.ts`

## src/middlewares/requierePeriod.middleware.ts

- `requireAdminPeriod` (**export**) → `Promise<void | Response<any, Record<string, any>>>`
  - firma: `typeof requireAdminPeriod`
  - usada en:
    - `src/routes/admin/admin.periods.routes.ts`

## src/middlewares/requiereStudent.middleware.ts

- `requiereStudent` (**export**) → `Promise<Response<any, Record<string, any>>>`
  - firma: `typeof requiereStudent`
  - usada en:
    - `src/routes/admin/admin.students.routes.ts`

## src/scripts/analyze-report.ts

- `codeBlock` (**local**) → `string`
  - firma: `typeof codeBlock`
  - usada en:
    - `src/scripts/analyze-report.ts`
- `run` (**local**) → `string`
  - firma: `typeof run`
  - usada en:
    - `src/scripts/analyze-report.ts`

## src/scripts/function-map.ts

- `addFn` (**local**) → `void`
  - firma: `typeof addFn`
  - usada en:
    - `src/scripts/function-map.ts`
- `isInSrc` (**local**) → `boolean`
  - firma: `typeof isInSrc`
  - usada en:
    - `src/scripts/function-map.ts`
- `makeId` (**local**) → `string`
  - firma: `typeof makeId`
  - usada en:
    - `src/scripts/function-map.ts`
- `rel` (**local**) → `string`
  - firma: `typeof rel`
  - usada en:
    - `src/scripts/function-map.ts`

## src/scripts/generate-structure.ts

- `toMarkdown` (**local**) → `string`
  - firma: `typeof toMarkdown`
  - usada en:
    - `src/scripts/generate-structure.ts`

## src/seed.ts

- `argFlag` (**local**) → `boolean`
  - firma: `typeof argFlag`
  - usada en:
    - `src/seed.ts`
- `main` (**local**) → `Promise<void>`
  - firma: `typeof main`
  - usada en:
    - `src/seed.ts`
- `onlyExistingAttrs` (**local**) → `Partial<T>`
  - firma: `typeof onlyExistingAttrs`
  - usada en:
    - `src/seed.ts`

## src/services/attempt.service.ts

- `getActiveEnrollment` (**export**) → `Promise<Enrollment>`
  - firma: `typeof getActiveEnrollment`
  - usada en: _(sin referencias detectadas)_
- `getOrCreateActiveAttempt` (**export**) → `Promise<Attempt>`
  - firma: `typeof getOrCreateActiveAttempt`
  - usada en:
    - `src/controllers/student.enrollment.controller.ts`
- `getTestById` (**export**) → `Promise<Test>`
  - firma: `typeof getTestById`
  - usada en: _(sin referencias detectadas)_

## src/services/period-report.service.ts

- `buildPeriodReport` (**export**) → `Promise<PeriodReport>`
  - firma: `typeof buildPeriodReport`
  - usada en:
    - `src/controllers/admin.report.controller.ts`
    - `src/controllers/admin.report.pdf.controller.ts`
- `getCourse` (**local**) → `string`
  - firma: `typeof getCourse`
  - usada en:
    - `src/services/period-report.service.ts`

## src/services/scoring.service.ts

- `computeInapvScores` (**export**) → `{ scoresByArea: ScoresByArea; scoresByAreaDim: ScoresByAreaDim; topAreas: string[]; }`
  - firma: `typeof computeInapvScores`
  - usada en:
    - `src/controllers/attempts.controller.ts`

## src/templates/period-report.template.ts

- `esc` (**local**) → `any`
  - firma: `typeof esc`
  - usada en:
    - `src/templates/period-report.template.ts`
- `renderPeriodReportHtml` (**export**) → `string`
  - firma: `typeof renderPeriodReportHtml`
  - usada en:
    - `src/controllers/admin.report.pdf.controller.ts`

## src/utils/inapv-areas.ts

- `areaName` (**export**) → `string`
  - firma: `typeof areaName`
  - usada en:
    - `src/controllers/admin.export.controller.ts`
    - `src/services/period-report.service.ts`

## src/utils/jwt.ts

- `required` (**local**) → `string`
  - firma: `typeof required`
  - usada en:
    - `src/utils/jwt.ts`
- `signAccessToken` (**export**) → `string`
  - firma: `typeof signAccessToken`
  - usada en:
    - `src/controllers/auth.controller.ts`
- `verifyAccessToken` (**export**) → `any`
  - firma: `typeof verifyAccessToken`
  - usada en:
    - `src/middlewares/auth.middleware.ts`

## src/utils/rut.ts

- `normalizeRut` (**export**) → `string`
  - firma: `typeof normalizeRut`
  - usada en:
    - `src/controllers/admin.import.controller.ts`
    - `src/controllers/admin.students.controller.ts`

