import { Router } from "express";
import {
  adminGetStudentDetail,
  adminGetStudents,
  adminPatchStudent,
  adminResetStudentPassword,
} from "../../controllers/admin/admin.students.controller.js";
import { requireStudent } from "../../middlewares/requiereStudent.middleware.js";

const router = Router();

router.get("/", adminGetStudents);

// TODO: Agregar endpoint para subir estudiantes desde la vista de estudiantes

router.use("/:studentId", requireStudent);

router.get("/:studentId", adminGetStudentDetail);

router.patch("/:studentId", adminPatchStudent);

router.post("/:studentId/reset-password", adminResetStudentPassword);

export default router;
