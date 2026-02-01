import { Router } from "express";

import { requireAuth } from "../../middlewares/auth.middleware.js";

import demreOffersRoutes from "./offers.routes.js";

const router = Router();

router.use("/", requireAuth);

router.use("/offers", demreOffersRoutes);

export default router;
