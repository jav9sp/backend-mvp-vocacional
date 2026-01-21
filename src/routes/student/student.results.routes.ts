import { Router } from "express";
import {
  getResultDetails,
  listStudentResults,
} from "../../controllers/student/student.results.controller.js";

const router = Router();

/**
 * @openapi
 * /results/me/latest:
 *   get:
 *     tags: [Results]
 *     security: [{ bearerAuth: [] }]
 *     summary: Devuelve el último resultado del estudiante (atajo)
 *     responses:
 *       200:
 *         description: Último resultado o estado no iniciado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: true }
 *                 status: { type: string, example: "not_started" }
 *                 attempt: { nullable: true, example: null }
 *                 result: { nullable: true, example: null }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get("/", listStudentResults);

router.get("/:resultsId/details", getResultDetails);

export default router;
