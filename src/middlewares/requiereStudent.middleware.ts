import { Request, Response, NextFunction } from "express";
import User from "../models/User.model.js";
import { SafeUser } from "../types/dtos.js";

const SAFE_ATTRS = ["id", "rut", "name", "email", "role"] as const;

export async function requireStudent(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const orgId = req.auth?.organizationId;
  if (!orgId) return res.status(401).json({ ok: false, error: "Unauthorized" });

  const id = Number(req.params.studentId);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ ok: false, error: "Invalid studentId" });
  }

  const user = await User.findOne({
    where: { id, role: "student", organizationId: orgId },
    attributes: [...SAFE_ATTRS, "passwordHash", "mustChangePassword"],
  });

  if (!user)
    return res.status(404).json({ ok: false, error: "Student not found" });

  req.studentModel = user;
  req.student = user.get({ plain: true }) as SafeUser;

  next();
}
