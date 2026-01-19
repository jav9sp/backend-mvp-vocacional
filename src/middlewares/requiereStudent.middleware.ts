import { Request, Response, NextFunction } from "express";
import User from "../models/User.model.js";
import { SafeUser } from "../types/dtos.js";

const SAFE_ATTRS = ["id", "rut", "name", "email"] as const;

export async function requiereStudent(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const orgId = req.auth?.organizationId;
  if (!orgId) return res.status(401).json({ ok: false, error: "Unauthorized" });

  const id = Number(req.params.studentId);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "Invalid studentId" });
  }

  const user = await User.findOne({
    where: { id, role: "student", organizationId: orgId },
    // trae lo mínimo + lo que necesitas internamente
    attributes: [...SAFE_ATTRS, "passwordHash", "mustChangePassword"], // o incluso sin estos si no los usas
  });

  if (!user) return res.status(404).json({ message: "Student not found" });

  req.userModel = user;
  req.student = user.get({ plain: true }) as SafeUser;

  next();
}
