import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

import PaesScoreRecord from "../../models/PaesScoreRecord.model.js";

const ScoreIntSchema = z
  .number()
  .int("Debe ser entero")
  .min(100, "Rango sugerido: 100–1000")
  .max(1000, "Rango sugerido: 100–1000");

const CreatePaesScoreRecordBodySchema = z.object({
  name: z.string().min(2).max(120),
  notes: z.string().max(120).optional().nullable(),
  takenAt: z.iso.datetime().optional().nullable(),

  cl: ScoreIntSchema.optional().nullable(),
  m1: ScoreIntSchema.optional().nullable(),
  m2: ScoreIntSchema.optional().nullable(),
  ciencias: ScoreIntSchema.optional().nullable(),
  historia: ScoreIntSchema.optional().nullable(),
});

const UpdatePaesScoreRecordBodySchema =
  CreatePaesScoreRecordBodySchema.partial().refine(
    (v) => Object.keys(v).length > 0,
    {
      message: "No fields to update",
    },
  );

function toIso(d: Date | null): string | null {
  return d ? d.toISOString() : null;
}

function toPayload(row: PaesScoreRecord) {
  return {
    id: row.id,
    studentUserId: row.studentUserId,
    name: row.name,
    notes: row.notes ?? null,
    takenAt: toIso(row.takenAt ?? null),
    cl: row.cl ?? null,
    m1: row.m1 ?? null,
    m2: row.m2 ?? null,
    ciencias: row.ciencias ?? null,
    historia: row.historia ?? null,
    createdAt: row.createdAt?.toISOString?.() ?? new Date().toISOString(),
    updatedAt: row.updatedAt?.toISOString?.() ?? new Date().toISOString(),
  };
}

export async function listMyPaesScores(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = req.userModel;
    if (!user) {
      return res.status(500).json({ ok: false, error: "User not loaded" });
    }

    const rows = await PaesScoreRecord.findAll({
      where: { studentUserId: user.id },
      order: [
        ["takenAt", "DESC"],
        ["createdAt", "DESC"],
      ],
    });

    return res.json({ ok: true, items: rows.map(toPayload) });
  } catch (e) {
    return next(e);
  }
}

export async function createMyPaesScore(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = req.userModel;
    if (!user) {
      return res.status(500).json({ ok: false, error: "User not loaded" });
    }

    const parsed = CreatePaesScoreRecordBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid body",
      });
    }

    const b = parsed.data;

    const row = await PaesScoreRecord.create({
      studentUserId: user.id,
      name: b.name,
      notes: b.notes ?? null,
      takenAt: b.takenAt ? new Date(b.takenAt) : null,
      cl: b.cl ?? null,
      m1: b.m1 ?? null,
      m2: b.m2 ?? null,
      ciencias: b.ciencias ?? null,
      historia: b.historia ?? null,
    } as any);

    return res.status(201).json({ ok: true, item: toPayload(row) });
  } catch (e) {
    return next(e);
  }
}

export async function updateMyPaesScore(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = req.userModel;
    if (!user) {
      return res.status(500).json({ ok: false, error: "User not loaded" });
    }

    const id = Number(req.params.scoreId);

    if (!Number.isFinite(id)) {
      return res.status(400).json({ ok: false, error: "Invalid id" });
    }

    const parsed = UpdatePaesScoreRecordBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid body",
      });
    }

    const row = await PaesScoreRecord.findOne({
      where: { id, studentUserId: user.id },
    });

    if (!row) {
      return res.status(404).json({ ok: false, error: "Not found" });
    }

    const b = parsed.data;

    if (b.name !== undefined) row.name = b.name;
    if (b.notes !== undefined) row.notes = b.notes ?? null;
    if (b.takenAt !== undefined)
      row.takenAt = b.takenAt ? new Date(b.takenAt) : null;

    if (b.cl !== undefined) row.cl = b.cl ?? null;
    if (b.m1 !== undefined) row.m1 = b.m1 ?? null;
    if (b.m2 !== undefined) row.m2 = b.m2 ?? null;
    if (b.ciencias !== undefined) row.ciencias = b.ciencias ?? null;
    if (b.historia !== undefined) row.historia = b.historia ?? null;

    await row.save();

    return res.json({ ok: true, item: toPayload(row) });
  } catch (e) {
    return next(e);
  }
}

export async function deleteMyPaesScore(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = req.userModel;
    if (!user) {
      return res.status(500).json({ ok: false, error: "User not loaded" });
    }

    const id = Number(req.params.scoreId);

    if (!Number.isFinite(id)) {
      return res.status(400).json({ ok: false, error: "Invalid id" });
    }

    const row = await PaesScoreRecord.findOne({
      where: { id, studentUserId: user.id },
    });

    if (!row) {
      return res.status(404).json({ ok: false, error: "Not found" });
    }

    await row.destroy();
    return res.json({ ok: true });
  } catch (e) {
    return next(e);
  }
}
