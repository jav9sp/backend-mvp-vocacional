import "../config/env.js";
import "reflect-metadata";
import path from "node:path";
import xlsx from "xlsx";
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
  return n.toFixed(2); // exacto a 2 decimales
}

function toInt(v: unknown, label: string): number {
  const n = Number(String(v).trim());
  if (!Number.isFinite(n)) throw new Error(`${label} inválido: ${v}`);
  return Math.round(n);
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("🚨 No se permite ejecutar seed en producción");
  }

  const url = process.env.DATABASE_URL ?? "";
  if (!url.includes("localhost") && !url.includes("127.0.0.1")) {
    throw new Error("🚨 Seed bloqueado: DB no es local");
  }

  const reset =
    argFlag("--reset") ||
    process.env.SEED_RESET === "1" ||
    process.env.SEED_RESET === "true";

  const wipe =
    argFlag("--wipe") ||
    process.env.SEED_WIPE === "1" ||
    process.env.SEED_WIPE === "true" ||
    true; // por defecto: wipe por año para que sea idempotente

  const yearArg = argValue("--year") ?? process.env.SEED_NEM_YEAR;
  const year = yearArg ? Number(yearArg) : new Date().getFullYear();
  if (!Number.isFinite(year)) {
    throw new Error(
      `YEAR inválido. Usa: --year 2026 o SEED_NEM_YEAR=2026 (recibí: ${yearArg})`,
    );
  }

  const excelPath =
    argValue("--file") ??
    process.env.SEED_NEM_FILE ??
    path.resolve(process.cwd(), "nem_conversion.xlsx");

  console.log("🌱 Seed NEM conversions starting…");
  console.log("   reset:", reset);
  console.log("   wipe year:", wipe);
  console.log("   year:", year);
  console.log("   file:", excelPath);

  await sequelize.authenticate();

  // Ojo: sync no es necesario si ya corres migraciones,
  // pero te lo dejo igual al estilo de tu seed existente.
  if (reset) {
    await sequelize.sync({ force: true });
  } else {
    await sequelize.sync();
  }

  // Leer excel
  const wb = xlsx.readFile(excelPath);
  const firstSheetName = wb.SheetNames[0];
  if (!firstSheetName) throw new Error("El Excel no tiene hojas.");
  const ws = wb.Sheets[firstSheetName];
  if (!ws) throw new Error("No se pudo leer la primera hoja.");

  const rows = xlsx.utils.sheet_to_json<any>(ws, { defval: "" });

  if (rows.length === 0) {
    throw new Error("El Excel está vacío (0 filas).");
  }

  // Validación headers (toma primera fila)
  const sample = rows[0] ?? {};
  const required = ["NEM", "HC", "HC_AD", "TP"];
  const missing = required.filter((k) => !(k in sample));
  if (missing.length) {
    throw new Error(
      `Faltan columnas: ${missing.join(", ")}. Headers detectados: ${Object.keys(sample).join(", ")}`,
    );
  }

  // Construir payload normalizado
  const now = new Date();
  const payload: Array<{
    year: number;
    educationType: EducationType;
    nemAvg: string;
    nemScore: number;
    createdAt: Date;
    updatedAt: Date;
  }> = [];

  for (const r of rows) {
    // Saltar filas vacías (por si hay líneas al final)
    if (String(r.NEM ?? "").trim() === "") continue;

    const nemAvg = normalizeNemAvg(r.NEM);

    payload.push(
      {
        year,
        educationType: "hc",
        nemAvg,
        nemScore: toInt(r.HC, "HC"),
        createdAt: now,
        updatedAt: now,
      },
      {
        year,
        educationType: "hc_adults",
        nemAvg,
        nemScore: toInt(r.HC_AD, "HC_AD"),
        createdAt: now,
        updatedAt: now,
      },
      {
        year,
        educationType: "tp",
        nemAvg,
        nemScore: toInt(r.TP, "TP"),
        createdAt: now,
        updatedAt: now,
      },
    );
  }

  if (payload.length === 0) {
    throw new Error("No se generaron filas para insertar (payload vacío).");
  }

  if (wipe) {
    const deleted = await NemConversion.destroy({ where: { year } });
    console.log(`   deleted rows (year=${year}):`, deleted);
  }

  // Insertar
  // Para Postgres, bulkCreate sin updateOnDuplicate.
  // Como borramos por año antes, queda idempotente.
  await NemConversion.bulkCreate(payload as any, { validate: true });

  console.log("✅ Seed NEM conversions completed!");
  console.log("   sheet:", firstSheetName);
  console.log("   inserted:", payload.length);

  await sequelize.close();
}

main().catch(async (e) => {
  console.error("❌ Seed failed:", e);
  try {
    await sequelize.close();
  } catch {}
  process.exit(1);
});
