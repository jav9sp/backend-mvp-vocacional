import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import Period from "../models/Period.model.ts";

const PeriodIdParamsSchema = z.object({
  periodId: z.coerce.number().int().positive(),
});

export async function requireAdminPeriod(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const orgId = req.auth?.organizationId;
  if (!orgId) return res.status(401).json({ ok: false, error: "Unauthorized" });

  const parsed = PeriodIdParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "Invalid periodId" });
  }

  const { periodId } = parsed.data;

  const period = await Period.findByPk(periodId);
  if (!period)
    return res.status(404).json({ ok: false, error: "Period not found" });

  if (period.organizationId !== orgId) {
    return res.status(403).json({ ok: false, error: "Forbidden" });
  }

  req.period = period;

  return next();
}
