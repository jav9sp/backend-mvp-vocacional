import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";

import User from "../../models/User.model.js";
import StudentProfile from "../../models/StudentProfile.model.js";
import NemConversion from "../../models/NemConversion.model.js";

import { normalizeEducationType } from "../../utils/normalizeEducationType.js";

import { EducationType } from "../../types/EducationType.js";

const EducationTypeInputSchema = z.enum(["hc", "hc_adults", "tp"]);

const UpdateMyProfileBodySchema = z.object({
  name: z.string().min(2).max(120).optional(),
  email: z.email().max(180).optional(),
  educationType: EducationTypeInputSchema.optional(),
  nemAvg: z.number().min(4.0).max(7.0).optional(),
});

export async function studentGetMyProfile(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = req.userModel;
    if (!user) {
      return res.status(500).json({ ok: false, error: "User not loaded" });
    }

    let studentProfile: any = null;

    const sp = await StudentProfile.findOne({ where: { userId: user.id } });
    studentProfile = sp
      ? {
          userId: sp.userId,
          educationType: sp.educationType,
          nemAvg: sp.nemAvg,
          nemScore: sp.nemScore,
          rankingScore: sp.rankingScore,
        }
      : null;

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
      studentProfile,
    });
  } catch (error) {
    return next(error);
  }
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

async function resolveNemScore(params: {
  educationType: EducationType; // hc | hc_adults | tp
  nemAvg: number; // 4.00 - 7.00
}) {
  const nemAvgStr = round2(params.nemAvg).toFixed(2);

  const row = await NemConversion.findOne({
    where: {
      educationType: params.educationType,
      nemAvg: nemAvgStr,
    },
  });

  if (!row) {
    const msg = `No existe conversión NEM para educationType=${params.educationType}, nemAvg=${nemAvgStr}`;
    const err = new Error(msg);
    (err as any).status = 400;
    throw err;
  }

  return { nemAvgStr, nemScore: row.nemScore, rankingScore: row.nemScore };
}

export async function studentUpdateMyProfile(
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

    const { name, email, educationType, nemAvg } = parsed.data;

    const wantsUserUpdate = name !== undefined || email !== undefined;
    const wantsStudentUpdate =
      educationType !== undefined || nemAvg !== undefined;

    if (!wantsUserUpdate && !wantsStudentUpdate) {
      return res.status(400).json({ ok: false, error: "No fields to update" });
    }

    // 1) Update base user fields
    if (wantsUserUpdate) {
      if (typeof name === "string") user.name = name;
      if (typeof email === "string") user.email = email;
      await user.save();
    }

    let studentProfilePayload: any = null;

    // 2) Student profile update
    if (wantsStudentUpdate) {
      if (user.role !== "student") {
        return res.status(403).json({
          ok: false,
          error: "Only students can update educationType/nem fields",
        });
      }

      // Busca perfil existente (NO crees aún)
      const existing = await StudentProfile.findOne({
        where: { userId: user.id },
      });

      // Resolver valores finales usando: body > existing > defaults (solo para año)
      const finalEducationType =
        educationType !== undefined
          ? normalizeEducationType(educationType as any)
          : existing?.educationType;

      const finalNemAvgNum =
        nemAvg !== undefined
          ? round2(nemAvg)
          : existing
            ? Number(existing.nemAvg)
            : undefined;

      const missing: string[] = [];
      if (!finalEducationType) missing.push("educationType");
      if (finalNemAvgNum === undefined || Number.isNaN(finalNemAvgNum))
        missing.push("nemAvg");

      if (missing.length) {
        return res.status(400).json({
          ok: false,
          error: `Faltan campos para calcular NEM: ${missing.join(", ")}`,
        });
      }

      // Ahora sí: crea si no existe, o actualiza si existe
      const profile =
        existing ??
        (await StudentProfile.create({
          userId: user.id,
          educationType: finalEducationType,
          nemAvg: finalNemAvgNum.toFixed(2),
          nemScore: 0,
          rankingScore: 0,
        } as any));

      // Recalcular siempre que cambie algo relevante (o si score=0)
      const needsRecalc =
        profile.educationType !== finalEducationType ||
        round2(Number(profile.nemAvg)) !== round2(finalNemAvgNum) ||
        profile.nemScore === 0;

      profile.educationType = finalEducationType;
      profile.nemAvg = finalNemAvgNum.toFixed(2);

      if (needsRecalc) {
        const { nemAvgStr, nemScore, rankingScore } = await resolveNemScore({
          educationType: finalEducationType,
          nemAvg: finalNemAvgNum,
        });

        profile.nemAvg = nemAvgStr;
        profile.nemScore = nemScore;
        profile.rankingScore = rankingScore; // ranking = nem
      }

      await profile.save();

      studentProfilePayload = {
        userId: profile.userId,
        educationType: profile.educationType,
        nemAvg: profile.nemAvg,
        nemScore: profile.nemScore,
        rankingScore: profile.rankingScore,
      };
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
      studentProfile: studentProfilePayload, // si no se tocó, queda null
    });
  } catch (error) {
    return next(error);
  }
}

const ChangePasswordBodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6).max(200),
});

export async function studentChangeMyPassword(
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

    const userId = req.auth?.userId; // como lo tengas en auth
    const orgId = req.auth?.organizationId;
    if (!userId || !orgId) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const user = await User.findOne({
      where: { id: userId, role: "student", organizationId: orgId },
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
