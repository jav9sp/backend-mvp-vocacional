import { Request, Response } from "express";
import { Op, fn, col } from "sequelize";
import Organization from "../../models/Organization.model.js";
import User from "../../models/User.model.js";
import Period from "../../models/Period.model.js";

const SUPERADMIN_ORG_NAME = "Servicios Vocacionales SpA";

export async function superadminGetDashboard(req: Request, res: Response) {
  try {
    // KPIs globales - Excluir organización especial
    const totalOrgs = await Organization.count({
      where: {
        deletedAt: null,
        name: { [Op.ne]: SUPERADMIN_ORG_NAME },
      },
    });

    const totalAdmins = await User.count({
      where: { role: "admin" },
    });

    const totalStudents = await User.count({
      where: { role: "student" },
    });

    const activePeriods = await Period.count({
      where: { status: "active" },
    });

    // Organizaciones con estadísticas - Excluir org especial
    const orgs = await Organization.findAll({
      where: {
        deletedAt: null,
        name: { [Op.ne]: SUPERADMIN_ORG_NAME },
      },
      attributes: ["id", "name", "createdAt"],
      order: [["createdAt", "DESC"]],
    });

    const orgIds = orgs.map((o) => o.id);

    // Contar admins por organización
    const adminAgg =
      orgIds.length > 0
        ? await User.findAll({
            where: { organizationId: { [Op.in]: orgIds }, role: "admin" },
            attributes: [
              "organizationId",
              [fn("COUNT", col("id")), "adminsCount"],
            ],
            group: ["organizationId"],
            raw: true,
          })
        : [];

    const adminsByOrg = new Map<number, number>();
    for (const r of adminAgg as any[]) {
      adminsByOrg.set(Number(r.organizationId), Number(r.adminsCount));
    }

    // Contar estudiantes por organización
    const studentAgg =
      orgIds.length > 0
        ? await User.findAll({
            where: { organizationId: { [Op.in]: orgIds }, role: "student" },
            attributes: [
              "organizationId",
              [fn("COUNT", col("id")), "studentsCount"],
            ],
            group: ["organizationId"],
            raw: true,
          })
        : [];

    const studentsByOrg = new Map<number, number>();
    for (const r of studentAgg as any[]) {
      studentsByOrg.set(Number(r.organizationId), Number(r.studentsCount));
    }

    // Contar períodos por organización
    const periodAgg =
      orgIds.length > 0
        ? await Period.findAll({
            where: { organizationId: { [Op.in]: orgIds } },
            attributes: [
              "organizationId",
              [fn("COUNT", col("id")), "periodsCount"],
            ],
            group: ["organizationId"],
            raw: true,
          })
        : [];

    const periodsByOrg = new Map<number, number>();
    for (const r of periodAgg as any[]) {
      periodsByOrg.set(Number(r.organizationId), Number(r.periodsCount));
    }

    const organizationRows = orgs.map((o) => ({
      id: o.id,
      name: o.name,
      createdAt: o.createdAt,
      adminsCount: adminsByOrg.get(o.id) ?? 0,
      studentsCount: studentsByOrg.get(o.id) ?? 0,
      periodsCount: periodsByOrg.get(o.id) ?? 0,
    }));

    return res.json({
      ok: true,
      kpis: {
        totalOrganizations: totalOrgs,
        totalAdmins,
        totalStudents,
        activePeriods,
      },
      organizations: organizationRows,
    });
  } catch (error) {
    console.error("Error in superadminGetDashboard:", error);
    return res.status(500).json({
      ok: false,
      error: "Internal server error",
    });
  }
}
