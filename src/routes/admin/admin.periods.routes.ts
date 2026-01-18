import { Router } from "express";

import {
  adminCreatePeriod,
  adminGetPeriodById,
  adminListPeriods,
  adminUpdatePeriod,
} from "../../controllers/admin.periods.controller.js";
import { adminListEnrollments } from "../../controllers/admin.enrollments.controller.js";
import { adminExportPeriodCSV } from "../../controllers/admin.export.controller.js";
import { uploadXlsx } from "../../middlewares/upload.middleware.js";
import { adminImportEnrollmentsXlsx } from "../../controllers/admin.import.controller.js";
import { adminGetPeriodReport } from "../../controllers/admin.report.controller.js";
import { adminGetPeriodReportPdf } from "../../controllers/admin.report.pdf.controller.js";
import {
  getPeriodStudents,
  getPeriodSummary,
} from "../../controllers/admin.periods.detail.controller.js";
import { requireAdminPeriod } from "../../middlewares/requierePeriod.middleware.js";

const router = Router();

router.get("/", adminListPeriods);
router.post("/", adminCreatePeriod);

router.use("/:periodId", requireAdminPeriod);

router.get("/:periodId", adminGetPeriodById);
router.patch("/:periodId", adminUpdatePeriod);

router.get("/:periodId/enrollments", adminListEnrollments);
router.get("/:periodId/export/csv", adminExportPeriodCSV);
router.post(
  "/:periodId/import-xlsx",
  uploadXlsx.single("file"),
  adminImportEnrollmentsXlsx,
);
router.get("/:periodId/report", adminGetPeriodReport);
router.get("/:periodId/report/pdf", adminGetPeriodReportPdf);
router.get("/:periodId/summary", getPeriodSummary);
router.get("/:periodId/students", getPeriodStudents);

export default router;
