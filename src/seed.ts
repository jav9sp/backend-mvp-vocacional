import "reflect-metadata";
import "dotenv/config";
import bcrypt from "bcrypt";
import { sequelize } from "./config/sequelize.js";

// Ajusta estos imports a tus rutas reales:
import Organization from "./models/Organization.model.js";
import User from "./models/User.model.js";
import Period from "./models/Period.model.js";
import Enrollment from "./models/Enrollment.model.js";
import Test from "./models/Test.model.js";
import Question from "./models/Question.model.js";

import { INAPV_QUESTIONS } from "./data/inapv.data.js";

type AnyModelStatic = { rawAttributes?: Record<string, any> };

function onlyExistingAttrs<T extends Record<string, any>>(
  Model: AnyModelStatic,
  data: T
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

async function main() {
  const reset =
    argFlag("--reset") ||
    process.env.SEED_RESET === "1" ||
    process.env.SEED_RESET === "true";

  const orgName = process.env.SEED_ORG_NAME || "Colegio Test";
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@test.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin1234!";
  const studentCount = Number(process.env.SEED_STUDENTS || 10);

  console.log("🌱 Seed starting…");
  console.log("   reset:", reset);
  console.log("   org:", orgName);
  console.log("   admin:", adminEmail);
  console.log("   students:", studentCount);

  await sequelize.authenticate();

  if (reset) {
    await sequelize.sync({ force: true });
  } else {
    await sequelize.sync();
  }

  // 1) Organization
  const [org] = await Organization.findOrCreate({
    where: onlyExistingAttrs(Organization as any, { name: orgName }) as any,
    defaults: onlyExistingAttrs(Organization as any, { name: orgName }) as any,
  });

  // 2) Test INAP-V
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

  // Preparar preguntas para bulkCreate
  const rows = INAPV_QUESTIONS.map((q) => ({
    testId: test.id,
    externalId: q.id, // 1..103
    text: q.text,
    area: q.area,
    dim: q.dim, // JSON array
    orderIndex: q.id, // mismo orden
  }));

  // Insertar / actualizar si existen
  // Requiere el índice único (testId, externalId)
  await Question.bulkCreate(rows, {
    updateOnDuplicate: ["text", "area", "dim", "orderIndex"],
  });

  // 3) Admin
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const [admin, adminCreated] = await User.findOrCreate({
    where: onlyExistingAttrs(User as any, { email: adminEmail }) as any,
    defaults: onlyExistingAttrs(User as any, {
      organizationId: (org as any).id,
      email: adminEmail,
      name: "Admin",
      rut: "12345678-9",
      role: "admin",
      passwordHash,
      mustChangePassword: false,
    }) as any,
  });

  // Si el admin existía, asegúrate que esté en la org y tenga pass (opcional)
  if (!adminCreated) {
    const patch = onlyExistingAttrs(User as any, {
      organizationId: (org as any).id,
      role: "admin",
    });
    await (admin as any).update(patch);
  }

  // 4) Period (activo)
  const periodName = process.env.SEED_PERIOD_NAME || "Periodo Test 1";
  const [period] = await Period.findOrCreate({
    where: onlyExistingAttrs(Period as any, {
      organizationId: (org as any).id,
      name: periodName,
    }) as any,
    defaults: onlyExistingAttrs(Period as any, {
      organizationId: (org as any).id,
      name: periodName,
      status: "active",
      startAt: Date.now(),
      testId: (test as any).id,
    }) as any,
  });

  // 5) Students
  const studentPassword = process.env.SEED_STUDENT_PASSWORD || "estudiante123";
  const studentHash = await bcrypt.hash(studentPassword, 10);

  const students: any[] = [];
  for (let i = 1; i <= studentCount; i++) {
    const email = `estudiante${i}@test.com`;
    const rut = `${10000000 + i}-0`; // rut demo
    const [student] = await User.findOrCreate({
      where: onlyExistingAttrs(User as any, { email }) as any,
      defaults: onlyExistingAttrs(User as any, {
        organizationId: (org as any).id,
        email,
        name: `Estudiante ${i}`,
        rut,
        role: "student",
        passwordHash: studentHash,
        mustChangePassword: false,
      }) as any,
    });
    students.push(student);
  }

  // 6) Enrollments (uno por student)
  // Evita IN (NULL) y dupes
  const studentIds = students.map((s) => (s as any).id).filter(Boolean);

  // Si quieres, puedes borrar enrollments previos del periodo cuando NO haces reset:
  // await Enrollment.destroy({ where: { periodId: (period as any).id } });

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

  console.log("✅ Seed completed!");
  console.log("   Organization:", (org as any).id, (org as any).name);
  console.log(
    "   Test:",
    (test as any).id,
    (test as any).key,
    (test as any).version
  );
  console.log("   Period:", (period as any).id, (period as any).name);
  console.log("   Admin:", (admin as any).email, "| password:", adminPassword);
  console.log("   Student password:", studentPassword);
  console.log("   Enrollments created:", createdEnrollments);

  await sequelize.close();
}

main().catch(async (e) => {
  console.error("❌ Seed failed:", e);
  try {
    await sequelize.close();
  } catch {}
  process.exit(1);
});
