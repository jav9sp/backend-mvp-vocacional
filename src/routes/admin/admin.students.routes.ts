import { Router } from "express";
import {
  adminGetStudentDetail,
  adminGetStudents,
  adminPatchStudent,
  adminResetStudentPassword,
} from "../../controllers/admin/admin.students.controller.js";
import { requiereStudent } from "../../middlewares/requiereStudent.middleware.js";

const router = Router();

router.get("/", adminGetStudents);

router.use("/:studentId", requiereStudent);

router.get("/:studentId", adminGetStudentDetail);
router.patch("/:studentId", adminPatchStudent);
router.post("/:studentId/reset-password", adminResetStudentPassword);

export default router;
