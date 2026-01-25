import { Router } from "express";
import {
  adminGetAttemptReportPdf,
  adminGetAttemptResult,
} from "../../controllers/admin/admin.results.controller.js";

const router = Router();

router.get("/:attemptId/results", adminGetAttemptResult);

router.get("/:attemptId/results/pdf", adminGetAttemptReportPdf);

export default router;
