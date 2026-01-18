import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware.js";

import { adminGetAttemptResult } from "../../controllers/admin.results.controller.js";

import {
  adminGetStudentDetail,
  adminGetStudents,
  adminPatchStudent,
  adminResetStudentPassword,
} from "../../controllers/admin.students.controller.js";

import { adminGetDashboard } from "../../controllers/admin.dashboard.controller.js";
import { adminListTests } from "../../controllers/admin.tests.controller.js";

import periodsRouter from "./admin.periods.routes.js";
import studentsRouter from "./admin.students.routes.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/dashboard", adminGetDashboard);

router.use("/periods", periodsRouter);

router.use("/students", studentsRouter);

router.get("/tests", adminListTests);

router.get("/attempts/:attemptId/result", adminGetAttemptResult);

export default router;
