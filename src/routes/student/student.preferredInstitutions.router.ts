import { Router } from "express";
import { z } from "zod";
import { Op } from "sequelize";
import StudentPreferredInstitution from "../../models/StudentPreferredInstitution.model.js";
import OfferFlat from "../../models/OfferFlat.model.js";
import { sequelize } from "../../config/sequelize.js";

const router = Router();

// GET /student/preferred-institutions
router.get("/", async (req, res, next) => {
  try {
    const userId = req.auth!.userId;

    const prefs = await StudentPreferredInstitution.findAll({
      where: { userId },
      attributes: ["institutionId"],
      raw: true,
      order: [["createdAt", "DESC"]],
    });

    if (prefs.length === 0) {
      return res.json({ ok: true, data: [] });
    }

    // Traer detalle de instituciones desde v_offers_flat (nombres únicos)
    const institutionIds = prefs.map((p) => p.institutionId);
    const rows = await OfferFlat.findAll({
      where: { institutionId: { [Op.in]: institutionIds } },
      attributes: [
        [sequelize.fn("DISTINCT", sequelize.col("institution_id")), "institutionId"],
        "institutionName",
        "institutionIsPace",
        "institutionHasGratuity",
      ],
      group: ["institution_id", "institution_name", "institution_is_pace", "institution_has_gratuity"],
      raw: true,
    });

    return res.json({ ok: true, data: rows });
  } catch (error) {
    return next(error);
  }
});

const bulkSetSchema = z.object({
  institutionIds: z.array(z.coerce.number().int()).max(50),
});

// PUT /student/preferred-institutions  (bulk set)
router.put("/", async (req, res, next) => {
  try {
    const parsed = bulkSetSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ ok: false, error: z.treeifyError(parsed.error) });
    }

    const userId = req.auth!.userId;
    const { institutionIds } = parsed.data;

    await sequelize.transaction(async (t) => {
      await StudentPreferredInstitution.destroy({
        where: { userId },
        transaction: t,
      });

      if (institutionIds.length > 0) {
        await StudentPreferredInstitution.bulkCreate(
          institutionIds.map((institutionId) => ({ userId, institutionId })),
          { transaction: t },
        );
      }
    });

    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

const deleteSchema = z.object({
  institutionId: z.coerce.number().int(),
});

// DELETE /student/preferred-institutions
router.delete("/", async (req, res, next) => {
  try {
    const parsed = deleteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ ok: false, error: z.treeifyError(parsed.error) });
    }

    const userId = req.auth!.userId;
    const { institutionId } = parsed.data;

    await StudentPreferredInstitution.destroy({
      where: { userId, institutionId },
    });

    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

export default router;
