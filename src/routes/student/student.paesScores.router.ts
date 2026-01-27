import { Router } from "express";
import {
  createMyPaesScore,
  deleteMyPaesScore,
  listMyPaesScores,
  updateMyPaesScore,
} from "../../controllers/student/student.paesScores.controller.js";
import { requireStudentMe } from "../../middlewares/requiereStudentMe.middleware.js";

const router = Router();

router.use("/", requireStudentMe);

router.get("/", listMyPaesScores);

router.post("/", createMyPaesScore);

router.patch("/:scoreId", updateMyPaesScore);

router.delete("/:scoreId", deleteMyPaesScore);

export default router;
