import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware.js";

import { adminGetDashboard } from "../../controllers/admin/admin.dashboard.controller.js";
import { adminListTests } from "../../controllers/admin/admin.tests.controller.js";

import periodsRouter from "./admin.periods.routes.js";
import studentsRouter from "./admin.students.routes.js";
import attemptsRouter from "./admin.attempts.routes.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/dashboard", adminGetDashboard);

router.get("/tests", adminListTests);

router.use("/periods", periodsRouter);

router.use("/students", studentsRouter);

router.use("/attempts", attemptsRouter);

export default router;
