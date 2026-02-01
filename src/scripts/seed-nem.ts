// npx tsx src/scripts/seed-nem.ts

import "dotenv/config";
import "reflect-metadata";
import path from "node:path";
import fs from "node:fs/promises";
import { sequelize } from "../config/sequelize.js";

import NemConversion from "../models/NemConversion.model.js";
import { EducationType } from "../types/EducationType.js";

function argValue(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  if (i === -1) return undefined;
  return process.argv[i + 1];
}

function argFlag(name: string) {
  return process.argv.includes(name);
}

function normalizeNemAvg(v: unknown): string {
  const n = Number(String(v).trim().replace(",", "."));
  if (!Number.isFinite(n)) throw new Error(`NEM inválido: ${v}`);
  return n.toFixed(2); // "4.00"
}

function toInt(v: unknown, label: string): number {
  const n = Number(String(v).trim());
  if (!Number.isFinite(n)) throw new Error(`${label} inválido: ${v}`);
  return Math.round(n);
}

type NemJsonRow = {
  nem: string | number;
  hc: string | number;
  hc_ad: string | number; // en tu JSON
  tp: string | number;
};

async function main() {
  // Seguridad local (opcional)
  const url = process.env.DATABASE_DEV ?? "";
  if (!url) throw new Error("DATABASE_URL no está definido.");
  if (!url.includes("localhost") && !url.includes("127.0.0.1")) {
    throw new Error("🚨 Seed bloqueado: DATABASE_URL no es local");
  }

  const wipe =
    argFlag("--wipe") ||
    process.env.SEED_WIPE === "1" ||
    process.env.SEED_WIPE === "true";

  const jsonPath =
    argValue("--file") ??
    process.env.SEED_NEM_FILE ??
    path.resolve(process.cwd(), "src", "data", "nem_conversion.json");

  console.log("🌱 Seed NEM conversions (JSON) starting…");
  console.log("   wipe:", wipe);
  console.log("   file:", jsonPath);

  await sequelize.authenticate();
  // NO sync: tu verdad es SQL/migraciones

  const raw = await fs.readFile(jsonPath, "utf8");
  const data = JSON.parse(raw) as NemJsonRow[];

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("El JSON está vacío o no es un array.");
  }

  const now = new Date();

  const payload: Array<{
    educationType: EducationType;
    nemAvg: string;
    nemScore: number;
    createdAt: Date;
    updatedAt: Date;
  }> = [];

  for (const r of data) {
    const nemAvg = normalizeNemAvg(r.nem);

    payload.push(
      {
        educationType: "hc",
        nemAvg,
        nemScore: toInt(r.hc, "hc"),
        createdAt: now,
        updatedAt: now,
      },
      {
        educationType: "hc_adults", // mapeo desde hc_ad
        nemAvg,
        nemScore: toInt(r.hc_ad, "hc_ad"),
        createdAt: now,
        updatedAt: now,
      },
      {
        educationType: "tp",
        nemAvg,
        nemScore: toInt(r.tp, "tp"),
        createdAt: now,
        updatedAt: now,
      },
    );
  }

  if (payload.length === 0) {
    throw new Error("No se generaron filas para insertar (payload vacío).");
  }

  if (wipe) {
    const deleted = await NemConversion.destroy({ where: {} });
    console.log("   deleted rows:", deleted);
  }

  // Idempotencia real: necesitas UNIQUE(education_type, nem_avg)
  // Si lo tienes, puedes upsertear:
  await NemConversion.bulkCreate(payload as any, {
    validate: true,
    updateOnDuplicate: ["nemScore", "updatedAt"],
  });

  console.log("✅ Seed NEM conversions completed!");
  console.log("   json rows:", data.length);
  console.log("   inserted/upserted:", payload.length);

  await sequelize.close();
}

main().catch(async (e) => {
  console.error("❌ Seed failed:", e);
  try {
    await sequelize.close();
  } catch {}
  process.exit(1);
});
