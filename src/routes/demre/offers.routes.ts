import { Router } from "express";
import { Op } from "sequelize";
import { z } from "zod";
import OfferFlat from "../../models/OfferFlat.model.js";
import { zInt, zStr } from "../../schemas/demreOffers.schema.js";

const router = Router();

const offersQuerySchema = z
  .object({
    year: zInt.optional(),
    q: zStr.optional(),
    locationId: z.coerce.number().int().optional(),
    locationName: zStr.optional(),
    institutionId: zInt.optional(),
    onlyPace: z.coerce.boolean().optional(),
    onlyGratuity: z.coerce.boolean().optional(),
    onlySpecialTest: z.coerce.boolean().optional(),
    minCut: zInt.optional(),
    maxCut: zInt.optional(),
    limit: zInt.optional().default(50),
    offset: zInt.optional().default(0),
  })
  .strict();

// const offersQuerySchema = z.object({
//   year: z.coerce.number().int().optional(),
//   institution_id: z.coerce.number().int().optional(),
//   location_id: z.coerce.number().int().optional(),
//   q: z.string().trim().min(1).optional(),
//   only_pace: z.coerce.boolean().optional(),
//   only_gratuity: z.coerce.boolean().optional(),
//   only_special_test: z.coerce.boolean().optional(),
// });

router.get("/", async (req, res) => {
  const parsed = offersQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ ok: false, error: z.treeifyError(parsed.error) });
  }

  const q = parsed.data;

  // ✅ regla UX/performance: no devolver nada hasta que filtre
  const hasUserFilter = Boolean(q.institutionId || q.q);
  if (!hasUserFilter) {
    return res.json({ ok: true, data: [] });
    // alternativa: return res.status(400).json({ ok:false, error:"MISSING_FILTER" })
  }

  const where: any = {};

  if (q.year) where.year = q.year;
  if (q.institutionId) where.institution_id = q.institutionId;
  if (q.locationId) where.location_id = q.locationId;

  if (q.onlyPace) where.institution_is_pace = true;
  if (q.onlyGratuity) where.institution_has_gratuity = true;
  if (q.onlySpecialTest) where.has_special_test = true;

  if (q.q) {
    // busca por nombre de carrera (y puedes extender a institución si quieres)
    where.career = { [Op.iLike]: `%${q.q}%` };
  }

  const rows = await OfferFlat.findAll({
    where,
    // como máximo 60 por institución, pero igual deja un “safety cap”
    limit: 250,
    order: [["career", "ASC"]],
  });

  return res.json({ ok: true, data: rows });
});

const institutionsQuerySchema = z.object({
  year: z.coerce.number().int().optional(),
});

router.get("/institutions", async (req, res) => {
  const parsed = institutionsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ ok: false, error: z.treeifyError(parsed.error) });
  }
  const { year } = parsed.data;

  const where: any = {};
  if (year) where.year = year;

  const rows = await OfferFlat.findAll({
    where,
    attributes: [
      ["institution_id", "id"],
      ["institution_name", "name"],
      ["institution_url", "url"],
      ["institution_is_pace", "isPace"],
      ["institution_has_gratuity", "hasGratuity"],
    ],
    group: [
      "institution_id",
      "institution_name",
      "institution_url",
      "institution_is_pace",
      "institution_has_gratuity",
    ],
    order: [["institution_name", "ASC"]],
    raw: true,
  });

  return res.json({ ok: true, data: rows });
});

const locationsQuerySchema = z.object({
  year: z.coerce.number().int().optional(),
  institutionId: z.coerce.number().int().optional(),
});

router.get("/locations", async (req, res) => {
  const parsed = locationsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ ok: false, error: z.treeifyError(parsed.error) });
  }
  const q = parsed.data;

  const where: any = {};
  if (q.year) where.year = q.year;
  if (q.institutionId) where.institution_id = q.institutionId;

  const rows = await OfferFlat.findAll({
    where,
    attributes: [
      ["location_id", "id"],
      ["location_name", "name"],
    ],
    group: ["location_id", "location_name"],
    order: [["location_name", "ASC"]],
    raw: true,
  });

  return res.json({ ok: true, data: rows });
});

export default router;
