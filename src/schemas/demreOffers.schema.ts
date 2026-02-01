import { z } from "zod";

export const zInt = z.preprocess((v) => {
  if (typeof v !== "string") return v;
  const s = v.trim();
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? Math.trunc(n) : v;
}, z.number().int());

export const zStr = z.preprocess((v) => {
  if (v == null) return undefined;
  const s = String(v).trim();
  return s ? s : undefined;
}, z.string());

const zBool01 = z.preprocess((v) => {
  if (v == null) return undefined;
  const s = String(v).toLowerCase();
  if (s === "1" || s === "true") return true;
  if (s === "0" || s === "false") return false;
  return v;
}, z.boolean());

export const offersQuerySchema = z
  .object({
    year: zInt.optional(),
    q: zStr.optional(), // search carrera contains
    lugar: zStr.optional(),
    institutionId: zInt.optional(),

    minCut: zInt.optional(),
    maxCut: zInt.optional(),

    hasBea: zBool01.optional(),
    hasMc: zBool01.optional(),
    hasPace: zBool01.optional(),

    m1Gte: zInt.optional(),
    m2Gte: zInt.optional(),

    intake: z.enum(["ALL", "S1", "S2"]).optional(),
    cuposMin: zInt.optional(),

    limit: zInt.optional().default(50),
    offset: zInt.optional().default(0),
    orderBy: z
      .enum(["cut_score", "carrera", "lugar", "cupos"])
      .optional()
      .default("cut_score"),
    orderDir: z.enum(["asc", "desc"]).optional().default("desc"),
  })
  .strict();

export const offerParamsSchema = z.object({
  year: z.preprocess((v) => Number(v), z.number().int()),
  demreCode: z.preprocess((v) => Number(v), z.number().int()),
});
