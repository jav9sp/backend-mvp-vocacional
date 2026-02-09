// npx tsx src/scripts/seed-caas.ts

import "dotenv/config";
import "reflect-metadata";

import { sequelize } from "../config/sequelize.js";
import Test from "../models/Test.model.js";
import CaasQuestion from "../models/CaasQuestion.model.js";
import { CAAS_CLOSED_QUESTIONS } from "../data/caas.data.js";

async function main() {
  // (Opcional pero recomendado) Seguridad local, copia el patrón de tu seed NEM
  const url = process.env.DATABASE_DEV ?? process.env.DATABASE_URL ?? "";
  if (!url) throw new Error("DATABASE_URL / DATABASE_DEV no está definido.");
  if (!url.includes("localhost") && !url.includes("127.0.0.1")) {
    throw new Error("🚨 Seed bloqueado: DATABASE_URL no es local");
  }

  console.log("🌱 Seed CAAS starting…");
  console.log("   questions:", CAAS_CLOSED_QUESTIONS.length);

  await sequelize.authenticate();
  console.log("✓ DB conectada");
  // NO sync: tu verdad es SQL/migraciones

  await sequelize.transaction(async (t) => {
    // 1) Crear/encontrar test CAAS
    const [test] = await Test.findOrCreate({
      where: { key: "caas", version: "1.0" },
      defaults: {
        key: "caas",
        version: "1.0",
        name: "Escala de Adaptabilidad a la Carrera",
        isActive: true,
      },
      transaction: t,
    });

    console.log(`✓ Test CAAS creado/encontrado: ID ${test.id}`);

    // 2) Insertar preguntas (idempotente)
    let createdOrFound = 0;

    for (const q of CAAS_CLOSED_QUESTIONS) {
      await CaasQuestion.findOrCreate({
        where: { testId: test.id, externalId: q.id },
        defaults: {
          testId: test.id,
          externalId: q.id,
          text: q.text,
          dimension: q.dimension,
          orderIndex: q.id,
        },
        transaction: t,
      });

      createdOrFound++;
    }

    console.log(`✓ ${createdOrFound} preguntas CAAS creadas/encontradas`);
  });

  console.log("✅ Seed CAAS completed!");
  await sequelize.close();
}

main().catch(async (e) => {
  console.error("❌ Seed failed:", e);
  try {
    await sequelize.close();
  } catch {}
  process.exit(1);
});
