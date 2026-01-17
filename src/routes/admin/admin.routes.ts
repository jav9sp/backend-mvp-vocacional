import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware.ts";

import { adminGetAttemptResult } from "../../controllers/admin.results.controller.ts";

import {
  adminGetStudentDetail,
  adminGetStudents,
  adminPatchStudent,
  adminResetStudentPassword,
} from "../../controllers/admin.students.controller.ts";

import { adminGetDashboard } from "../../controllers/admin.dashboard.controller.ts";
import { adminListTests } from "../../controllers/admin.tests.controller.ts";

import periodsRouter from "./admin.periods.routes.ts";
import studentsRouter from "./admin.students.routes.ts";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/dashboard", adminGetDashboard);

router.use("/periods", periodsRouter);

router.use("/students", studentsRouter);

router.get("/tests", adminListTests);

router.get("/attempts/:attemptId/result", adminGetAttemptResult);

export default router;
