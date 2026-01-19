import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware.js";

import enrollmentsRouter from "./student.enrollments.router.js";
import attemptsRouter from "./student.attempts.routes.js";
import resultsRouter from "./student.results.routes.js";

const router = Router();

router.use(requireAuth, requireRole("student"));

router.use("/enrollments", enrollmentsRouter);

router.use("/attempts", attemptsRouter);

router.use("/results", resultsRouter);

export default router;
