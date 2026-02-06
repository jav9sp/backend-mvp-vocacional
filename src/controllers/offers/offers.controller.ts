import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { Op } from "sequelize";
import OfferFlat from "../../models/OfferFlat.model.js";
import { zInt, zStr } from "../../schemas/demreOffers.schema.js";

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

const AREA_KEYS = [
  "adm",
  "agr",
  "art",
  "csn",
  "soc",
  "edu",
  "ing",
  "sal",
  "seg",
  "tec",
] as const;

const offersByAreaSchema = z
  .object({
    areaKey: z.enum(AREA_KEYS),
    year: zInt.optional(),
    q: zStr.optional(),
    locationId: z.coerce.number().int().optional(),
    institutionId: zInt.optional(),
    onlyPace: z.coerce.boolean().optional(),
    onlyGratuity: z.coerce.boolean().optional(),
    onlySpecialTest: z.coerce.boolean().optional(),
    minCut: zInt.optional(),
    maxCut: zInt.optional(),
    mode: z.enum(["offers", "careers"]).optional().default("offers"),
    limit: zInt.optional().default(50),
    offset: zInt.optional().default(0),
  })
  .strict();

const locationsQuerySchema = z.object({
  year: z.coerce.number().int().optional(),
  institutionId: z.coerce.number().int().optional(),
});

const institutionsQuerySchema = z.object({
  year: z.coerce.number().int().optional(),
});

export async function getAllOffers(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
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
  } catch (error) {
    return next(error);
  }
}

export async function getInstitutions(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
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
  } catch (error) {
    return next(error);
  }
}

export async function getLocations(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
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
  } catch (error) {
    return next(error);
  }
}

export async function getOffersByArea(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = offersByAreaSchema.safeParse({
      ...req.query,
      areaKey: req.params.areaKey,
    });

    if (!parsed.success) {
      return res
        .status(400)
        .json({ ok: false, error: z.treeifyError(parsed.error) });
    }

    const q = parsed.data;

    // ✅ regla UX/performance: el param areaKey ya es filtro válido
    const hasUserFilter = Boolean(
      q.areaKey || q.institutionId || q.q || q.locationId,
    );
    if (!hasUserFilter) {
      return res.json({ ok: true, data: [] });
    }

    const where: any = {};

    // este nombre es el del CAMPO en el Model, Sequelize lo mapea a field: vocational_area_key
    where.vocationalAreaKey = q.areaKey;

    if (q.year) where.year = q.year;
    if (q.institutionId) where.institutionId = q.institutionId;
    if (q.locationId) where.locationId = q.locationId;

    if (q.onlyPace) where.institutionIsPace = true;
    if (q.onlyGratuity) where.institutionHasGratuity = true;
    if (q.onlySpecialTest) where.hasSpecialTest = true;

    // cutScore puede ser null: al filtrar con gte/lte, null queda fuera automáticamente
    if (q.minCut) where.cutScore = { [Op.gte]: q.minCut };
    if (q.maxCut)
      where.cutScore = { ...(where.cutScore ?? {}), [Op.lte]: q.maxCut };

    if (q.q) {
      where.career = { [Op.iLike]: `%${q.q}%` };
    }

    const limit = Math.min(q.limit ?? 50, 250);
    const offset = q.offset ?? 0;

    // 🔹 Modo: carreras únicas (recomendado para exploración)
    if (q.mode === "careers") {
      const rows = await OfferFlat.findAll({
        where,
        attributes: [
          "careerId",
          "career",
          "vocationalAreaKey",
          "vocationalAreaName",
        ],
        group: [
          "careerId",
          "career",
          "vocationalAreaKey",
          "vocationalAreaName",
        ],
        order: [["career", "ASC"]],
        raw: true,
        limit,
        offset,
      });

      return res.json({ ok: true, data: rows });
    }

    // 🔹 Modo: ofertas completas (tu formato actual)
    const rows = await OfferFlat.findAll({
      where,
      limit,
      offset,
      order: [["career", "ASC"]],
    });

    return res.json({ ok: true, data: rows });
  } catch (error) {
    return next(error);
  }
}
