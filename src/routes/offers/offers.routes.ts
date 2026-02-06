import { Router } from "express";

import { requireAuth } from "../../middlewares/auth.middleware.js";

import {
  getAllOffers,
  getInstitutions,
  getLocations,
  getOffersByArea,
} from "../../controllers/offers/offers.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/", getAllOffers);

router.get("/institutions", getInstitutions);

router.get("/locations", getLocations);

router.get("/area/:areaKey", getOffersByArea);

export default router;
