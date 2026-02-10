import { Request, Response } from "express";
import { z } from "zod";
import * as XLSX from "xlsx";
import Enrollment from "../../models/Enrollment.model.js";
import User from "../../models/User.model.js";
import { normalizeRut } from "../../utils/rut.js";
import bcrypt from "bcrypt";

const RowSchema = z.object({
  rut: z.string().min(3, "RUT inválido / vacío"),
  nombre: z.string().min(1, "Nombre vacío"),
  email: z.email("Email inválido"),
  curso: z.string().optional().or(z.literal("")),
});

function normalizeHeaderKey(k: string) {
  return (k || "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "");
}

// mapea sinónimos → canonical
const HEADER_MAP: Record<string, "rut" | "nombre" | "email" | "curso"> = {
  rut: "rut",
  run: "rut",
  "rut/dv": "rut",
  nombre: "nombre",
  name: "nombre",
  alumno: "nombre",
  estudiante: "nombre",
  email: "email",
  correo: "email",
  mail: "email",
  curso: "curso",
  course: "curso",
  cursoactual: "curso",
};

function canonicalizeRowKeys(row: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(row)) {
    const nk = normalizeHeaderKey(k);
    const canonical = HEADER_MAP[nk];
    if (canonical) out[canonical] = v;
  }
  return out;
}

function getPresentCanonicalHeaders(rows: Record<string, any>[]) {
  const set = new Set<string>();
  for (const r of rows) {
    for (const k of Object.keys(r)) {
      const canonical = HEADER_MAP[normalizeHeaderKey(k)];
      if (canonical) set.add(canonical);
    }
  }
  return set;
}

export async function adminImportEnrollmentsXlsx(req: Request, res: Response) {
  const { period } = req;
  if (!period) {
    return res.status(500).json({ ok: false, error: "Period not loaded" });
  }

  const file = req.file as Express.Multer.File | undefined;
  if (!file)
    return res.status(400).json({ ok: false, error: "Missing file (xlsx)" });

  const workbook = XLSX.read(file.buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
    defval: "",
  });

  if (!rows.length) {
    return res.status(400).json({ ok: false, error: "Empty sheet" });
  }

  const present = getPresentCanonicalHeaders(rows);

  const required = ["rut", "nombre", "email"] as const;
  const missing = required.filter((k) => !present.has(k));

  if (missing.length) {
    return res.status(422).json({
      ok: false,
      error: "Plantilla inválida",
      details: {
        missingColumns: missing,
        expected: ["rut", "nombre", "email", "curso (opcional)"],
      },
    });
  }

  const orgId = req.auth!.organizationId;

  let createdUsers = 0;
  let updatedUsers = 0;
  let enrolled = 0;
  let alreadyEnrolled = 0;

  let blockedOtherOrg = 0; // ✅ nuevo contador

  const errors: Array<{ row: number; message: string; field?: string }> = [];
  const MAX_ERRORS = 200;

  const seenEmails = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i];
    const canon = canonicalizeRowKeys(raw);

    const parsedRow = RowSchema.safeParse({
      rut: normalizeRut(String(canon.rut ?? "")),
      nombre: String(canon.nombre ?? "").trim(),
      email: String(canon.email ?? "")
        .trim()
        .toLocaleLowerCase(),
      curso: String(canon.curso ?? "").trim(),
    });

    if (!parsedRow.success) {
      for (const issue of parsedRow.error.issues) {
        errors.push({
          row: i + 2,
          field: String(issue.path?.[0] ?? ""),
          message: issue.message,
        });
        if (errors.length >= MAX_ERRORS) break;
      }
      if (errors.length >= MAX_ERRORS) break;
      continue;
    }

    const { rut, nombre: name, email, curso: course } = parsedRow.data;

    // Detectar email duplicado dentro del mismo archivo
    if (email) {
      if (seenEmails.has(email)) {
        errors.push({
          row: i + 2,
          field: "email",
          message: `Email duplicado en el archivo: ${email}`,
        });
        if (errors.length >= MAX_ERRORS) break;
        continue;
      }
      seenEmails.add(email);
    }

    // 1) Buscar user por rut
    let user = await User.findOne({
      where: { rut },
      attributes: [
        "id",
        "rut",
        "name",
        "email",
        "organizationId",
        "passwordHash",
      ],
    });

    // ✅ BLOQUEO: existe pero pertenece a otra organización
    if (user && user.organizationId !== orgId) {
      blockedOtherOrg++;
      errors.push({
        row: i + 2,
        field: "rut",
        message:
          "Este estudiante ya existe en otra institución. No puedes importarlo en tu organización.",
      });
      if (errors.length >= MAX_ERRORS) break;
      continue;
    }

    if (!user) {
      const passwordHash = await bcrypt.hash(rut, 10);

      try {
        user = await User.create({
          role: "student",
          name,
          organizationId: orgId,
          email: email || null,
          rut,
          passwordHash,
        } as any);

        createdUsers++;
      } catch (e: any) {
        if (e?.name === "SequelizeUniqueConstraintError") {
          // Determinar qué campo causó el conflicto
          const conflictFields: string[] =
            e.errors?.map((err: any) => err.path) ?? [];
          const isEmailConflict = conflictFields.includes("email");

          if (isEmailConflict) {
            errors.push({
              row: i + 2,
              field: "email",
              message: `El email "${email}" ya está registrado por otro usuario.`,
            });
            if (errors.length >= MAX_ERRORS) break;
            continue;
          }

          // Conflicto de RUT (race condition: otro proceso creó el mismo rut)
          const existing = await User.findOne({ where: { rut } });
          if (existing && existing.organizationId !== orgId) {
            blockedOtherOrg++;
            errors.push({
              row: i + 2,
              field: "rut",
              message:
                "Este estudiante ya existe en otra institución. No puedes importarlo en tu organización.",
            });
            if (errors.length >= MAX_ERRORS) break;
            continue;
          }
          user = existing as any;
        } else {
          throw e;
        }
      }
    } else {
      // update info básica si cambió (solo si es de la misma org)
      let changed = false;

      if (user.name !== name) {
        user.name = name;
        changed = true;
      }
      if (email && user.email !== email) {
        user.email = email;
        changed = true;
      }
      if (!user.rut) {
        user.rut = rut;
        changed = true;
      }

      if (changed) {
        try {
          await user.save();
          updatedUsers++;
        } catch (e: any) {
          if (e?.name === "SequelizeUniqueConstraintError") {
            const conflictFields: string[] =
              e.errors?.map((err: any) => err.path) ?? [];
            errors.push({
              row: i + 2,
              field: conflictFields.includes("email") ? "email" : "rut",
              message: conflictFields.includes("email")
                ? `El email "${email}" ya está registrado por otro usuario.`
                : "Conflicto de unicidad al actualizar.",
            });
            if (errors.length >= MAX_ERRORS) break;
            await user.reload();
            continue;
          }
          throw e;
        }
      }
    }

    if (!user) continue; // paranoia

    // 2) Enrollment
    const [enr, wasCreated] = await Enrollment.findOrCreate({
      where: { periodId: period.id, studentUserId: user.id },
      defaults: {
        periodId: period.id,
        studentUserId: user.id,
        status: "active",
        meta: course ? { course } : null,
      },
    });

    if (wasCreated) {
      enrolled++;
    } else {
      alreadyEnrolled++;
      if (course) {
        const meta = (enr.meta || {}) as any;
        if (!meta.course) {
          enr.meta = { ...meta, course };
          await enr.save();
        }
      }
    }
  }

  return res.json({
    ok: true,
    period: { id: period.id, name: period.name },
    summary: {
      rows: rows.length,
      createdUsers,
      updatedUsers,
      enrolled,
      alreadyEnrolled,
      blockedOtherOrg, // ✅
      errors: errors.length,
    },
    errors,
  });
}
