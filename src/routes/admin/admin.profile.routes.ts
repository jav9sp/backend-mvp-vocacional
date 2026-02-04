import { Router } from "express";
import {
  adminChangeMyPassword,
  adminGetMyProfile,
  adminUpdateMyProfile,
} from "../../controllers/admin/admin.profile.controller.js";
import { requireMe } from "../../middlewares/requireMe.middleware.js";

const router = Router();

router.use(requireMe());

router.get("/", adminGetMyProfile);

router.patch("/", adminUpdateMyProfile);

router.patch("/password", adminChangeMyPassword);

export default router;
