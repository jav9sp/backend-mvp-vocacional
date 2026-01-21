import { Request, Response, NextFunction } from "express";
import User from "../models/User.model.js";

export async function requireStudentMe(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const auth = req.auth;
  if (!auth?.userId || !auth?.organizationId) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }
  if (auth.role !== "student") {
    return res.status(403).json({ ok: false, error: "Forbidden" });
  }

  const user = await User.findOne({
    where: {
      id: auth.userId,
      role: "student",
      organizationId: auth.organizationId,
    },
    // lo mínimo + lo que necesitas para password-change
    attributes: [
      "id",
      "rut",
      "name",
      "email",
      "passwordHash",
      "mustChangePassword",
    ],
  });

  if (!user) {
    return res.status(404).json({ ok: false, error: "Student not found" });
  }

  req.userModel = user;
  req.student = user.get({ plain: true }); // SafeUser si quieres
  return next();
}
