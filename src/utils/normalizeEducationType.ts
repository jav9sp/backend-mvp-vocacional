import { EducationType } from "../types/EducationType.js";

export function normalizeEducationType(input: string): EducationType {
  // Normalizamos a enum DB (NemConversion): hc | hc_adults | tp
  const s = input.trim().toLowerCase();
  if (s === "hc" || s === "ch") return "hc" as EducationType;
  if (s === "hc_adults" || s === "ch_adultos")
    return "hc_adults" as EducationType;
  if (s === "tp") return "tp" as EducationType;
  // Por si EducationType tiene más cosas, pero no debería:
  throw new Error(`educationType inválido: ${input}`);
}
