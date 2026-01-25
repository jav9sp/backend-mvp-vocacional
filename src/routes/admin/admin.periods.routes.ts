import { Router } from "express";

import {
  adminCreatePeriod,
  adminGetPeriodById,
  adminListPeriods,
  adminUpdatePeriod,
} from "../../controllers/admin/admin.periods.controller.js";
import { getPeriodDashboard } from "../../controllers/admin/admin.period.dashboard.controller.js";
import { adminImportEnrollmentsXlsx } from "../../controllers/admin/admin.import.controller.js";
import {
  adminGetPeriodResults,
  adminGetPeriodResultsPdf,
} from "../../controllers/admin/admin.period.results.controller.js";

import { requireAdminPeriod } from "../../middlewares/requierePeriod.middleware.js";
import { uploadXlsx } from "../../middlewares/upload.middleware.js";

const router = Router();

router.get("/", adminListPeriods);
router.post("/", adminCreatePeriod);

router.use("/:periodId", requireAdminPeriod);

router.get("/:periodId", adminGetPeriodById);
router.patch("/:periodId", adminUpdatePeriod);

router.get("/:periodId/dashboard", getPeriodDashboard);

router.post(
  "/:periodId/import-xlsx",
  uploadXlsx.single("file"),
  adminImportEnrollmentsXlsx,
);

router.get("/:periodId/results", adminGetPeriodResults);

router.get("/:periodId/results/pdf", adminGetPeriodResultsPdf);

// * Deprecated: no se exporta a csv, solo reporte pdf
// router.get("/:periodId/export/csv", adminExportPeriodCSV);
// router.get("/:periodId/report/pdf", adminGetPeriodReportPdf);

// * Deprecated: reemplazados por /:periodId/dashboard
// router.get("/:periodId/enrollments", adminListEnrollments);
// router.get("/:periodId/summary", getPeriodSummary);
// router.get("/:periodId/students", getPeriodStudents);

export default router;
