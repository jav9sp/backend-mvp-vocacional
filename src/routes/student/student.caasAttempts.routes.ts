import { Router } from "express";
import {
  getCaasAttemptContext,
  getCaasAttemptAnswers,
  saveCaasAttemptAnswers,
  saveCaasOpenAnswers,
  finishCaasAttempt,
  getCaasAttemptResult,
  getCaasAttemptPdf,
} from "../../controllers/student/student.caasAttempts.controller.js";
import { requiereStudentAttempt } from "../../middlewares/requiereAttempt.js";

const router = Router();

// Middleware: valida attemptId y ownership
router.use("/:attemptId", requiereStudentAttempt);

// Endpoints
router.get("/:attemptId", getCaasAttemptContext);

router.get("/:attemptId/result", getCaasAttemptResult);

router.get("/:attemptId/answers", getCaasAttemptAnswers);

router.put("/:attemptId/answers", saveCaasAttemptAnswers);

router.put("/:attemptId/open-answers", saveCaasOpenAnswers);

router.post("/:attemptId/finish", finishCaasAttempt);

router.get("/:attemptId/pdf", getCaasAttemptPdf);

export default router;
