import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware.js";

import enrollmentsRouter from "./student.enrollments.router.js";
import inapAttemptsRouter from "./student.inapAttempts.routes.js";
import caasAttemptsRouter from "./student.caasAttempts.routes.js";
import resultsRouter from "./student.results.routes.js";
import profileRouter from "./student.profile.routes.js";
import paesScoresRouter from "./student.paesScores.router.js";
import favoriteOffersRouter from "./student.favoriteOffers.router.js";

const router = Router();

router.use(requireAuth, requireRole("student"));

router.use("/enrollments", enrollmentsRouter);

router.use("/inap-attempts", inapAttemptsRouter);

router.use("/caas-attempts", caasAttemptsRouter);

router.use("/results", resultsRouter);

router.use("/profile", profileRouter);

router.use("/paes-scores", paesScoresRouter);

router.use("/favorites", favoriteOffersRouter);

export default router;
