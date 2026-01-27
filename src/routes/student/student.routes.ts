import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware.js";

import enrollmentsRouter from "./student.enrollments.router.js";
import attemptsRouter from "./student.attempts.routes.js";
import resultsRouter from "./student.results.routes.js";
import profileRouter from "./student.profile.routes.js";
import paesScoresRouter from "./student.paesScores.router.js";

const router = Router();

router.use(requireAuth, requireRole("student"));

router.use("/enrollments", enrollmentsRouter);

router.use("/attempts", attemptsRouter);

router.use("/results", resultsRouter);

router.use("/profile", profileRouter);

router.use("/paes-scores", paesScoresRouter);

export default router;
