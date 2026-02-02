import { Router } from "express";
import { z } from "zod";
import { Op } from "sequelize";
import StudentFavoriteOffer from "../../models/StudentFavoriteOffer.model.js";
import OfferFlat from "../../models/OfferFlat.model.js";

const router = Router();

const favoritePayloadSchema = z.object({
  admissionProcessId: z.coerce.number().int(),
  demreCode: z.coerce.number().int(),
});

// GET /student/favorites
router.get("/", async (req, res) => {
  const userId = req.auth!.userId;

  const favs = await StudentFavoriteOffer.findAll({
    where: { userId },
    attributes: ["admissionProcessId", "demreCode"],
    raw: true,
    order: [["createdAt", "DESC"]],
  });

  if (favs.length === 0) {
    return res.json({ ok: true, data: [] });
  }

  // Traer detalle desde la vista
  // WHERE (admission_process_id, demre_code) IN (...)
  const rows = await OfferFlat.findAll({
    where: {
      [Op.or]: favs.map((f) => ({
        admissionProcessId: f.admissionProcessId,
        demreCode: f.demreCode,
      })),
    },
    order: [["career", "ASC"]],
  });

  return res.json({ ok: true, data: rows });
});

// POST /student/favorites
router.post("/", async (req, res) => {
  const parsed = favoritePayloadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ ok: false, error: z.treeifyError(parsed.error) });
  }

  const userId = req.auth!.userId;
  const { admissionProcessId, demreCode } = parsed.data;

  // idempotente (si ya existe, no falla)
  await StudentFavoriteOffer.findOrCreate({
    where: { userId, admissionProcessId, demreCode },
    defaults: { userId, admissionProcessId, demreCode },
  });

  return res.json({ ok: true });
});

// DELETE /student/favorites
router.delete("/", async (req, res) => {
  const parsed = favoritePayloadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ ok: false, error: z.treeifyError(parsed.error) });
  }

  const userId = req.auth!.userId;
  const { admissionProcessId, demreCode } = parsed.data;

  await StudentFavoriteOffer.destroy({
    where: { userId, admissionProcessId, demreCode },
  });

  return res.json({ ok: true });
});

export default router;
