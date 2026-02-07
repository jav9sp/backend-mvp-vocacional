import { Router } from "express";
import {
  createMyPaesScore,
  deleteMyPaesScore,
  listMyPaesScores,
  updateMyPaesScore,
} from "../../controllers/student/student.paesScores.controller.js";
import { requireMe } from "../../middlewares/requireMe.middleware.js";

const router = Router();

router.use(requireMe());

router.get("/", listMyPaesScores);

router.post("/", createMyPaesScore);

router.patch("/:scoreId", updateMyPaesScore);

router.delete("/:scoreId", deleteMyPaesScore);

export default router;
