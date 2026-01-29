// npx tsx src/scripts/seed-general.ts

import "reflect-metadata";
import "dotenv/config";
import bcrypt from "bcrypt";
import { sequelize } from "../config/sequelize.js";
import Organization from "../models/Organization.model.js";
import Test from "../models/Test.model.js";
import { INAPV_QUESTIONS } from "../data/inapv.data.js";
import InapQuestion from "../models/InapQuestion.model.js";
import User from "../models/User.model.js";
import Period from "../models/Period.model.js";
import Enrollment from "../models/Enrollment.model.js";

type AnyModelStatic = { rawAttributes?: Record<string, any> };

function onlyExistingAttrs<T extends Record<string, any>>(
  Model: AnyModelStatic,
  data: T,
): Partial<T> {
  const attrs = (Model.rawAttributes && Object.keys(Model.rawAttributes)) || [];
  const out: Partial<T> = {};
  for (const k of Object.keys(data)) {
    if (attrs.includes(k)) (out as any)[k] = data[k];
  }
  return out;
}

function argFlag(name: string) {
  return process.argv.includes(name);
}

/**
 * Calcula dígito verificador RUT chileno.
 * Base: número sin DV (ej: 12345678) -> DV: 0-9 o K
 */
function rutDv(base: number): string {
  let sum = 0;
  let mul = 2;
  let n = base;

  while (n > 0) {
    sum += (n % 10) * mul;
    n = Math.floor(n / 10);
    mul = mul === 7 ? 2 : mul + 1;
  }

  const mod = 11 - (sum % 11);
  if (mod === 11) return "0";
  if (mod === 10) return "K";
  return String(mod);
}

/**
 * Genera un RUT válido con 8 dígitos + DV.
 * baseStart debe ser >= 10_000_000 para garantizar 8 dígitos.
 */
function makeRut(base: number): string {
  const baseStr = String(base);
  if (baseStr.length !== 8) {
    throw new Error(`Base de RUT debe ser de 8 dígitos. Recibí: ${base}`);
  }
  return `${baseStr}-${rutDv(base)}`;
}

async function main() {
  const studentCount = Number(process.env.SEED_STUDENTS || 10);

  // Puedes personalizar estos nombres/emails desde env si quieres
  const orgs = [
    {
      name: process.env.SEED_ORG1_NAME || "Colegio Alpha",
      adminEmail: process.env.SEED_ORG1_ADMIN_EMAIL || "admin.alpha@test.com",
      adminName: "Admin Alpha",
      periodName: process.env.SEED_ORG1_PERIOD_NAME || "Periodo Alpha 1",
    },
    {
      name: process.env.SEED_ORG2_NAME || "Colegio Beta",
      adminEmail: process.env.SEED_ORG2_ADMIN_EMAIL || "admin.beta@test.com",
      adminName: "Admin Beta",
      periodName: process.env.SEED_ORG2_PERIOD_NAME || "Periodo Beta 1",
    },
  ];

  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin1234!";
  const studentPassword = process.env.SEED_STUDENT_PASSWORD || "estudiante123";

  console.log("🌱 Seed starting…");
  console.log("   orgs:", orgs.map((o) => o.name).join(" | "));
  console.log("   students per org:", studentCount);

  await sequelize.authenticate();

  // 1) Test INAP-V (único, compartido)
  await Test.update({ isActive: false }, { where: {} });

  const [test] = await Test.findOrCreate({
    where: { key: "inapv", version: "v1" },
    defaults: {
      key: "inapv",
      version: "v1",
      name: "INAP-V",
      isActive: true,
    },
  });

  if (!test.isActive) {
    test.isActive = true;
    await test.save();
  }

  // 2) Preguntas INAP
  const questionRows = INAPV_QUESTIONS.map((q) => ({
    testId: (test as any).id,
    externalId: q.id,
    text: q.text,
    area: q.area,
    dim: q.dim, // string[]
    orderIndex: q.id,
  }));

  await InapQuestion.bulkCreate(questionRows, {
    updateOnDuplicate: ["text", "area", "dim", "order_index", "updated_at"],
  });

  // Hashes
  const adminHash = await bcrypt.hash(adminPassword, 10);
  const studentHash = await bcrypt.hash(studentPassword, 10);

  // Generador de RUTs válidos y únicos
  // Usamos un rango alto para evitar colisiones con datos reales.
  let rutBase = 70000000; // 8 dígitos
  const usedRuts = new Set<string>();

  function nextRut(): string {
    while (true) {
      rutBase += 1;
      const rut = makeRut(rutBase);
      if (!usedRuts.has(rut)) {
        usedRuts.add(rut);
        return rut;
      }
    }
  }

  let totalEnrollmentsCreated = 0;

  for (let orgIndex = 0; orgIndex < orgs.length; orgIndex++) {
    const orgCfg = orgs[orgIndex];

    // 3) Org
    const [org] = await Organization.findOrCreate({
      where: onlyExistingAttrs(Organization as any, {
        name: orgCfg.name,
      }) as any,
      defaults: onlyExistingAttrs(Organization as any, {
        name: orgCfg.name,
      }) as any,
    });

    // 4) Admin por org
    const [admin, adminCreated] = await User.findOrCreate({
      where: onlyExistingAttrs(User as any, {
        email: orgCfg.adminEmail,
      }) as any,
      defaults: onlyExistingAttrs(User as any, {
        organizationId: (org as any).id,
        email: orgCfg.adminEmail,
        name: orgCfg.adminName,
        rut: nextRut(),
        role: "admin",
        passwordHash: adminHash,
        mustChangePassword: false,
      }) as any,
    });

    if (!adminCreated) {
      // Asegura rol y organización si ya existía
      await (admin as any).update(
        onlyExistingAttrs(User as any, {
          organizationId: (org as any).id,
          role: "admin",
        }),
      );
    }

    // 5) Period por org
    const [period] = await Period.findOrCreate({
      where: onlyExistingAttrs(Period as any, {
        organizationId: (org as any).id,
        name: orgCfg.periodName,
      }) as any,
      defaults: onlyExistingAttrs(Period as any, {
        organizationId: (org as any).id,
        name: orgCfg.periodName,
        status: "active",
        startAt: new Date(),
        testId: (test as any).id,
      }) as any,
    });

    // 6) Students por org
    const students: any[] = [];
    for (let i = 1; i <= studentCount; i++) {
      const email = `estudiante${orgIndex + 1}_${i}@test.com`; // único entre orgs
      const [student] = await User.findOrCreate({
        where: onlyExistingAttrs(User as any, { email }) as any,
        defaults: onlyExistingAttrs(User as any, {
          organizationId: (org as any).id,
          email,
          name: `Estudiante ${orgIndex + 1}-${i}`,
          rut: nextRut(),
          role: "student",
          passwordHash: studentHash,
          mustChangePassword: false,
        }) as any,
      });
      students.push(student);
    }

    // 7) Enrollments (uno por estudiante)
    const studentIds = students.map((s) => (s as any).id).filter(Boolean);

    let createdEnrollments = 0;
    for (const studentId of studentIds) {
      const [enr, wasCreated] = await Enrollment.findOrCreate({
        where: onlyExistingAttrs(Enrollment as any, {
          periodId: (period as any).id,
          studentUserId: studentId,
        }) as any,
        defaults: onlyExistingAttrs(Enrollment as any, {
          periodId: (period as any).id,
          studentUserId: studentId,
          status: "active",
          meta: null,
        }) as any,
      });
      if (wasCreated) createdEnrollments++;
    }

    totalEnrollmentsCreated += createdEnrollments;

    console.log("—");
    console.log("✅ Org seeded:", (org as any).id, (org as any).name);
    console.log("   Period:", (period as any).id, (period as any).name);
    console.log(
      "   Admin:",
      (admin as any).email,
      "| password:",
      adminPassword,
    );
    console.log("   Students:", studentCount, "| password:", studentPassword);
    console.log("   Enrollments created:", createdEnrollments);
  }

  console.log("—");
  console.log("✅ Seed completed!");
  console.log(
    "   Test:",
    (test as any).id,
    (test as any).key,
    (test as any).version,
  );
  console.log("   Total enrollments created:", totalEnrollmentsCreated);

  await sequelize.close();
}

main().catch(async (e) => {
  console.error("❌ Seed failed:", e);
  try {
    await sequelize.close();
  } catch {}
  process.exit(1);
});
