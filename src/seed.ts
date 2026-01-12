import "reflect-metadata";
import { sequelize } from "./config/sequelize.ts";

import User from "./models/User.model.ts";
import Organization from "./models/Organization.model.ts";
import bcrypt from "bcrypt";

async function seed() {
  console.log("🌱 Seeding database...");

  await sequelize.sync({ force: true });

  const org = await Organization.create({
    name: "Colegio Demo",
  });

  const admin = await User.create({
    name: "Orientador",
    email: "orientador@test.com",
    rut: "12654891-9",
    role: "admin",
    passwordHash: await bcrypt.hash("orientador123", 10),
    organizationId: org.id,
  });

  let students: User[] = [];

  for (let i = 0; i <= 10; i++) {
    let student = await User.create({
      name: `Estudiante ${i + 1}`,
      email: `estudiante${i + 1}@test.com`,
      rut: `12345678-${i}`,
      role: "student",
      passwordHash: await bcrypt.hash("estudiante123", 10),
      organizationId: org.id,
    });
    students.push(student);
  }

  console.log("✅ Seed completed", org, admin, students);

  await sequelize.close();
}

seed().catch((e) => {
  console.error("❌ Seed failed", e);
  process.exit(1);
});
