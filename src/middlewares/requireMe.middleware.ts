import { Request, Response, NextFunction } from "express";
import User from "../models/User.model.js";

type AllowedRole = "student" | "admin" | "super_admin";

export function requireMe(allowedRoles?: AllowedRole | AllowedRole[]) {
  const roles = Array.isArray(allowedRoles)
    ? allowedRoles
    : allowedRoles
      ? [allowedRoles]
      : null;

  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      const auth = req.auth;

      if (!auth?.userId || !auth?.organizationId) {
        return res.status(401).json({ ok: false, error: "Unauthorized" });
      }

      if (roles && (!auth.role || !roles.includes(auth.role as AllowedRole))) {
        return res.status(403).json({ ok: false, error: "Forbidden" });
      }

      const where: any = {
        id: auth.userId,
        organizationId: auth.organizationId,
      };

      // Si se especificaron roles, filtra por role en DB también
      if (roles) where.role = auth.role;

      const user = await User.findOne({
        where,
        attributes: [
          "id",
          "rut",
          "name",
          "email",
          "role",
          "passwordHash",
          "mustChangePassword",
        ],
      });

      if (!user) {
        return res.status(404).json({ ok: false, error: "User not found" });
      }

      req.userModel = user;
      req.me = user.get({ plain: true });

      return next();
    } catch (err) {
      return next(err);
    }
  };
}
