// npx tsx src/scripts/seed-nem-conversions.ts 2026

import path from "node:path";
import xlsx from "xlsx";
import { Op } from "sequelize";
import { sequelize } from "../config/sequelize.js";
import NemConversion from "../models/NemConversion.model.js";
import { EducationType } from "../types/EducationType.js";

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

async function run() {
  const yearArg = process.argv[2];
  const year = Number(yearArg);

  if (!Number.isFinite(year)) {
    console.error("Uso: ts-node scripts/seed-nem-conversions.ts <YEAR>");
    console.error("Ejemplo: ts-node scripts/seed-nem-conversions.ts 2026");
    process.exit(1);
  }

  const filepath = path.resolve(process.cwd(), "nem_conversion.xlsx");
  const wb = xlsx.readFile(filepath);

  const firstSheetName = wb.SheetNames[0];
  if (!firstSheetName) throw new Error("El Excel no tiene hojas.");
  const ws = wb.Sheets[firstSheetName];
  if (!ws) throw new Error("No se pudo leer la primera hoja.");

  const rows = xlsx.utils.sheet_to_json<any>(ws, { defval: "" });

  const now = new Date();
  const payload: Array<{
    year: number;
    educationType: EducationType;
    nemAvg: string;
    nemScore: number;
    createdAt: Date;
    updatedAt: Date;
  }> = [];

  // Validación mínima de headers esperados
  // (Si tu Excel tiene espacios o distinto casing, lo ajustamos)
  const sample = rows[0] ?? {};
  const hasHeaders =
    "NEM" in sample && "HC" in sample && "HC_AD" in sample && "TP" in sample;
  if (!hasHeaders) {
    throw new Error(
      `No encuentro columnas NEM/HC/HC_AD/TP. Headers detectados: ${Object.keys(sample).join(", ")}`,
    );
  }

  for (const r of rows) {
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

  // Re-seed seguro por año
  await sequelize.authenticate();

  await NemConversion.destroy({ where: { year: { [Op.eq]: year } } });
  await NemConversion.bulkCreate(payload as any, { validate: true });

  console.log(
    `OK: Insertadas ${payload.length} filas en nem_conversions (año ${year}) desde ${filepath} / hoja "${firstSheetName}".`,
  );

  await sequelize.close();
}

run().catch((err) => {
  console.error("ERROR seed nem conversions:", err);
  process.exit(1);
});
