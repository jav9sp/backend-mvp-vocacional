import { Router } from "express";
import {
  changeMyPassword,
  getMyProfile,
  updateMyProfile,
} from "../../controllers/student/student.profile.controller.js";
import { requireStudentMe } from "../../middlewares/requiereStudentMe.middleware.js";

const router = Router();

router.use("/", requireStudentMe);

router.get("/", getMyProfile);

router.patch("/", updateMyProfile);

router.patch("/password", changeMyPassword);

export default router;
