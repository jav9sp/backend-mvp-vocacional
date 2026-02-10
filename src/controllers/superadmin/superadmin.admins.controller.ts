import { Request, Response } from "express";
import { z } from "zod";
import { Op } from "sequelize";
import bcrypt from "bcrypt";
import User from "../../models/User.model.js";
import Organization from "../../models/Organization.model.js";

const SUPERADMIN_ORG_NAME = "Servicios Vocacionales SpA";

const CreateAdminSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().email().max(180),
  rut: z.string().trim().min(3).max(20),
  organizationId: z.number().int().positive(),
  password: z.string().min(8).optional(),
});

const UpdateAdminSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: z.string().email().max(180).optional(),
  rut: z.string().trim().min(3).max(20).optional(),
  organizationId: z.number().int().positive().optional(),
  mustChangePassword: z.boolean().optional(),
});

function generatePassword(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
  let pwd = "";
  for (let i = 0; i < 12; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

export async function superadminListAdmins(req: Request, res: Response) {
  try {
    const admins = await User.findAll({
      where: { role: "admin" },
      attributes: [
        "id",
        "name",
        "email",
        "rut",
        "organizationId",
        "mustChangePassword",
        "createdAt",
      ],
      include: [
        {
          model: Organization,
          as: "organization",
          attributes: ["id", "name"],
          where: {
            deletedAt: null,
            name: { [Op.ne]: SUPERADMIN_ORG_NAME },
          },
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.json({ ok: true, admins });
  } catch (error) {
    console.error("Error in superadminListAdmins:", error);
    return res.status(500).json({
      ok: false,
      error: "Internal server error",
    });
  }
}

export async function superadminGetAdmin(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const admin = await User.findOne({
      where: { id, role: "admin" },
      include: [
        {
          model: Organization,
          as: "organization",
          attributes: ["id", "name"],
        },
      ],
    });

    if (!admin) {
      return res.status(404).json({ ok: false, error: "Admin not found" });
    }

    return res.json({ ok: true, admin });
  } catch (error) {
    console.error("Error in superadminGetAdmin:", error);
    return res.status(500).json({
      ok: false,
      error: "Internal server error",
    });
  }
}

export async function superadminCreateAdmin(req: Request, res: Response) {
  try {
    const parsed = CreateAdminSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: "Invalid body",
        details: z.treeifyError(parsed.error),
      });
    }

    const { name, email, rut, organizationId, password } = parsed.data;

    // Verificar que la organización existe y NO es la especial
    const org = await Organization.findOne({
      where: { id: organizationId, deletedAt: null },
    });

    if (!org) {
      return res
        .status(404)
        .json({ ok: false, error: "Organization not found" });
    }

    if (org.name === SUPERADMIN_ORG_NAME) {
      return res.status(400).json({
        ok: false,
        error: "Cannot assign admins to special organization",
      });
    }

    // Verificar unicidad de email y rut
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(409).json({ ok: false, error: "Email already in use" });
    }

    const existingRut = await User.findOne({ where: { rut } });
    if (existingRut) {
      return res.status(409).json({ ok: false, error: "RUT already in use" });
    }

    // Generar password si no se provee
    const passwordHash = await bcrypt.hash(rut, 10);

    const admin = await User.create({
      name,
      email,
      rut,
      organizationId,
      role: "admin",
      passwordHash,
      mustChangePassword: true,
    });

    return res.status(201).json({
      ok: true,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        rut: admin.rut,
        organizationId: admin.organizationId,
        mustChangePassword: admin.mustChangePassword,
      },
      generatedPassword: passwordHash,
    });
  } catch (error) {
    console.error("Error in superadminCreateAdmin:", error);
    return res.status(500).json({
      ok: false,
      error: "Internal server error",
    });
  }
}

export async function superadminUpdateAdmin(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const parsed = UpdateAdminSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: "Invalid body",
        details: z.treeifyError(parsed.error),
      });
    }

    const admin = await User.findOne({
      where: { id, role: "admin" },
    });

    if (!admin) {
      return res.status(404).json({ ok: false, error: "Admin not found" });
    }

    const patch = parsed.data;

    // Verificar organización si se cambia
    if (patch.organizationId) {
      const org = await Organization.findOne({
        where: { id: patch.organizationId, deletedAt: null },
      });

      if (!org) {
        return res
          .status(404)
          .json({ ok: false, error: "Organization not found" });
      }

      if (org.name === SUPERADMIN_ORG_NAME) {
        return res.status(400).json({
          ok: false,
          error: "Cannot assign admins to special organization",
        });
      }
    }

    // Verificar unicidad
    if (patch.email && patch.email !== admin.email) {
      const exists = await User.findOne({ where: { email: patch.email } });
      if (exists) {
        return res
          .status(409)
          .json({ ok: false, error: "Email already in use" });
      }
    }

    if (patch.rut && patch.rut !== admin.rut) {
      const exists = await User.findOne({ where: { rut: patch.rut } });
      if (exists) {
        return res.status(409).json({ ok: false, error: "RUT already in use" });
      }
    }

    await admin.update(patch);

    return res.json({ ok: true, admin });
  } catch (error) {
    console.error("Error in superadminUpdateAdmin:", error);
    return res.status(500).json({
      ok: false,
      error: "Internal server error",
    });
  }
}

export async function superadminResetAdminPassword(
  req: Request,
  res: Response
) {
  try {
    const id = Number(req.params.id);
    const admin = await User.findOne({
      where: { id, role: "admin" },
    });

    if (!admin) {
      return res.status(404).json({ ok: false, error: "Admin not found" });
    }

    const newPassword = generatePassword();
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await admin.update({
      passwordHash,
      mustChangePassword: true,
    });

    return res.json({
      ok: true,
      message: "Password reset successfully",
      newPassword,
    });
  } catch (error) {
    console.error("Error in superadminResetAdminPassword:", error);
    return res.status(500).json({
      ok: false,
      error: "Internal server error",
    });
  }
}
