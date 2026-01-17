import { Router } from "express";
import {
  adminGetStudentDetail,
  adminGetStudents,
  adminPatchStudent,
  adminResetStudentPassword,
} from "../../controllers/admin.students.controller.ts";
import { requiereStudent } from "../../middlewares/requiereStudent.middleware.ts";

const router = Router();

router.get("/", adminGetStudents);

router.use("/:studentId", requiereStudent);

router.get("/:studentId", adminGetStudentDetail);
router.patch("/:studentId", adminPatchStudent);
router.post("/:studentId/reset-password", adminResetStudentPassword);

export default router;
