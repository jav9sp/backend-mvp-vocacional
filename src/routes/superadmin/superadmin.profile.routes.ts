import { Router } from "express";
import {
  superadminChangeMyPassword,
  superadminGetMyProfile,
  superadminUpdateMyProfile,
} from "../../controllers/superadmin/superadmin.profile.controller.js";
import { requireMe } from "../../middlewares/requireMe.middleware.js";

const router = Router();

router.use(requireMe());

router.get("/", superadminGetMyProfile);
router.patch("/", superadminUpdateMyProfile);
router.patch("/password", superadminChangeMyPassword);

export default router;
