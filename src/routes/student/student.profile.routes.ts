import { Router } from "express";
import {
  studentChangeMyPassword,
  studentGetMyProfile,
  studentUpdateMyProfile,
} from "../../controllers/student/student.profile.controller.js";
import { requireMe } from "../../middlewares/requireMe.middleware.js";

const router = Router();

router.use(requireMe());

router.get("/", studentGetMyProfile);

router.patch("/", studentUpdateMyProfile);

router.patch("/password", studentChangeMyPassword);

export default router;
