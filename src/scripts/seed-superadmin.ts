// npx tsx src/scripts/seed-superadmin.ts

import "reflect-metadata";
import "dotenv/config";
import bcrypt from "bcrypt";
import { sequelize } from "../config/sequelize.js";
import User from "../models/User.model.js";
import Organization from "../models/Organization.model.js";

const SUPERADMIN_ORG_NAME = "Servicios Vocacionales SpA";

async function main() {
  // Configuración de credenciales (usar variables de entorno o defaults)
  const email = process.env.SUPERADMIN_EMAIL || "superadmin@vocacional.com";
  const password = process.env.SUPERADMIN_PASSWORD || "SuperAdmin123!";
  const name = process.env.SUPERADMIN_NAME || "SuperAdmin";
  const rut = process.env.SUPERADMIN_RUT || "11111111-1";

  console.log("🔧 Inicializando seed de superadmin...\n");

  await sequelize.authenticate();

  // 1. Crear organización especial
  console.log(`📦 Creando organización especial: "${SUPERADMIN_ORG_NAME}"`);
  const [org, orgCreated] = await Organization.findOrCreate({
    where: { name: SUPERADMIN_ORG_NAME },
    defaults: { name: SUPERADMIN_ORG_NAME },
  });

  if (orgCreated) {
    console.log(`✅ Organización creada con ID: ${org.id}`);
  } else {
    console.log(`ℹ️  Organización ya existía con ID: ${org.id}`);
  }

  // 2. Crear usuario superadmin
  console.log(`\n👤 Creando usuario superadmin...`);
  const passwordHash = await bcrypt.hash(password, 10);

  const [superadmin, superCreated] = await User.findOrCreate({
    where: { email },
    defaults: {
      email,
      name,
      rut,
      role: "superadmin",
      organizationId: org.id,
      passwordHash,
      mustChangePassword: false,
    },
  });

  if (superCreated) {
    console.log("✅ Usuario superadmin creado exitosamente!");
  } else {
    console.log("⚠️  Usuario superadmin ya existía. Actualizando...");
    await superadmin.update({
      role: "superadmin",
      organizationId: org.id,
      passwordHash,
      mustChangePassword: false,
    });
    console.log("✅ Usuario superadmin actualizado!");
  }

  // 3. Logging de credenciales
  console.log("\n" + "=".repeat(60));
  console.log("🎉 SEED COMPLETADO");
  console.log("=".repeat(60));
  console.log(`\n📧 Email:        ${email}`);
  console.log(`🔑 Password:     ${password}`);
  console.log(`👤 Nombre:       ${name}`);
  console.log(`🆔 RUT:          ${rut}`);
  console.log(`🏢 Organización: ${SUPERADMIN_ORG_NAME} (ID: ${org.id})`);
  console.log(`\n💡 Puedes hacer login con estas credenciales en /auth/login`);
  console.log("=".repeat(60) + "\n");

  await sequelize.close();
}

main().catch(async (e) => {
  console.error("❌ Error en seed de superadmin:", e);
  try {
    await sequelize.close();
  } catch {}
  process.exit(1);
});
