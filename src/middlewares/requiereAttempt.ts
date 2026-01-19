import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import Attempt from "../models/Attempt.model.js";

const ParamsSchema = z.object({
  attemptId: z.coerce.number().int().positive(),
});

export async function requiereStudentAttempt(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { userId, organizationId } = req.auth!;
  if (!organizationId)
    return res.status(401).json({ ok: false, error: "Unauthorized" });

  const parsed = ParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "Invalid attemptId" });
  }

  const { attemptId } = parsed.data;

  const attempt = await Attempt.findByPk(attemptId, {
    attributes: [
      "id",
      "userId",
      "periodId",
      "testId",
      "status",
      "answeredCount",
      "finishedAt",
    ],
  });

  if (!attempt) {
    return res.status(404).json({ ok: false, error: "Attempt not found" });
  }

  if (attempt.userId !== userId) {
    return res.status(403).json({ ok: false, error: "Forbidden" });
  }

  req.attempt = attempt;

  return next();
}
