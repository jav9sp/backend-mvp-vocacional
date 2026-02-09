import { Request, Response } from "express";
import { z } from "zod";
import { Op } from "sequelize";
import Organization from "../../models/Organization.model.js";

const SUPERADMIN_ORG_NAME = "Servicios Vocacionales SpA";

const CreateOrgSchema = z.object({
  name: z.string().trim().min(3).max(180),
});

const UpdateOrgSchema = z.object({
  name: z.string().trim().min(3).max(180),
});

export async function superadminListOrganizations(
  req: Request,
  res: Response
) {
  try {
    const orgs = await Organization.findAll({
      where: {
        deletedAt: null,
        name: { [Op.ne]: SUPERADMIN_ORG_NAME },
      },
      attributes: ["id", "name", "createdAt", "updatedAt"],
      order: [["createdAt", "DESC"]],
    });

    return res.json({ ok: true, organizations: orgs });
  } catch (error) {
    console.error("Error in superadminListOrganizations:", error);
    return res.status(500).json({
      ok: false,
      error: "Internal server error",
    });
  }
}

export async function superadminGetOrganization(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    const org = await Organization.findOne({
      where: { id, deletedAt: null },
    });

    if (!org) {
      return res
        .status(404)
        .json({ ok: false, error: "Organization not found" });
    }

    // Validar que NO sea la org especial
    if (org.name === SUPERADMIN_ORG_NAME) {
      return res.status(403).json({
        ok: false,
        error: "Cannot access special organization",
      });
    }

    return res.json({ ok: true, organization: org });
  } catch (error) {
    console.error("Error in superadminGetOrganization:", error);
    return res.status(500).json({
      ok: false,
      error: "Internal server error",
    });
  }
}

export async function superadminCreateOrganization(
  req: Request,
  res: Response
) {
  try {
    const parsed = CreateOrgSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: "Invalid body",
        details: z.treeifyError(parsed.error),
      });
    }

    // Validar que el nombre no sea el reservado
    if (parsed.data.name === SUPERADMIN_ORG_NAME) {
      return res.status(400).json({
        ok: false,
        error: "Organization name is reserved",
      });
    }

    const org = await Organization.create({
      name: parsed.data.name,
    });

    return res.status(201).json({ ok: true, organization: org });
  } catch (error) {
    console.error("Error in superadminCreateOrganization:", error);
    return res.status(500).json({
      ok: false,
      error: "Internal server error",
    });
  }
}

export async function superadminUpdateOrganization(
  req: Request,
  res: Response
) {
  try {
    const id = Number(req.params.id);
    const parsed = UpdateOrgSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: "Invalid body",
        details: z.treeifyError(parsed.error),
      });
    }

    const org = await Organization.findOne({
      where: { id, deletedAt: null },
    });

    if (!org) {
      return res
        .status(404)
        .json({ ok: false, error: "Organization not found" });
    }

    // Validar que NO sea la org especial
    if (org.name === SUPERADMIN_ORG_NAME) {
      return res.status(403).json({
        ok: false,
        error: "Cannot modify special organization",
      });
    }

    // Validar que el nuevo nombre no sea el reservado
    if (parsed.data.name === SUPERADMIN_ORG_NAME) {
      return res.status(400).json({
        ok: false,
        error: "Organization name is reserved",
      });
    }

    await org.update({ name: parsed.data.name });

    return res.json({ ok: true, organization: org });
  } catch (error) {
    console.error("Error in superadminUpdateOrganization:", error);
    return res.status(500).json({
      ok: false,
      error: "Internal server error",
    });
  }
}

export async function superadminDeleteOrganization(
  req: Request,
  res: Response
) {
  try {
    const id = Number(req.params.id);
    const org = await Organization.findOne({
      where: { id, deletedAt: null },
    });

    if (!org) {
      return res
        .status(404)
        .json({ ok: false, error: "Organization not found" });
    }

    // Validar que NO sea la org especial
    if (org.name === SUPERADMIN_ORG_NAME) {
      return res.status(403).json({
        ok: false,
        error: "Cannot delete special organization",
      });
    }

    // Soft delete
    await org.update({ deletedAt: new Date() });

    return res.json({ ok: true, message: "Organization deleted" });
  } catch (error) {
    console.error("Error in superadminDeleteOrganization:", error);
    return res.status(500).json({
      ok: false,
      error: "Internal server error",
    });
  }
}
