import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import User from "../../models/User.model.js";

const ChangePasswordBodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6).max(200),
});

const UpdateMyProfileBodySchema = z.object({
  name: z.string().min(2).max(120).optional(),
  email: z.email().max(180).optional(),
});

export async function adminGetMyProfile(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = req.userModel;
    if (!user) {
      return res.status(500).json({ ok: false, error: "User not loaded" });
    }

    return res.json({
      ok: true,
      user: {
        id: user.id,
        rut: user.rut,
        name: user.name,
        email: user.email,
        mustChangePassword: user.mustChangePassword,
        role: user.role,
      },
      organization: {
        id: req.auth!.organizationId,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function adminUpdateMyProfile(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = (req as any).userModel;
    if (!user) {
      return res.status(500).json({ ok: false, error: "User not loaded" });
    }

    const parsed = UpdateMyProfileBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid body",
      });
    }

    const { name, email } = parsed.data;

    const wantsUserUpdate = name !== undefined || email !== undefined;

    if (!wantsUserUpdate) {
      return res.status(400).json({ ok: false, error: "No fields to update" });
    }

    // 1) Update base user fields
    if (wantsUserUpdate) {
      if (typeof name === "string") user.name = name;
      if (typeof email === "string") user.email = email;
      await user.save();
    }

    return res.json({
      ok: true,
      user: {
        id: user.id,
        rut: user.rut,
        name: user.name,
        email: user.email,
        mustChangePassword: user.mustChangePassword,
        role: user.role,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function adminChangeMyPassword(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = ChangePasswordBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: "Invalid body" });
    }

    const { currentPassword, newPassword } = parsed.data;

    const userId = req.auth?.userId;
    const orgId = req.auth?.organizationId;
    if (!userId || !orgId) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const user = await User.findOne({
      where: { id: userId, role: "admin", organizationId: orgId },
      attributes: ["id", "passwordHash", "mustChangePassword"],
    });

    if (!user) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) {
      return res
        .status(400)
        .json({ ok: false, error: "Current password is incorrect" });
    }

    // Evitar que ponga la misma
    const same = await bcrypt.compare(newPassword, user.passwordHash);
    if (same) {
      return res
        .status(400)
        .json({ ok: false, error: "New password must be different" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    user.passwordHash = hashed;
    user.mustChangePassword = false;
    await user.save();

    return res.json({ ok: true });
  } catch (e) {
    return next(e);
  }
}
