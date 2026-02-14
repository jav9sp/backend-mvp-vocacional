import { readFile } from "node:fs/promises";
import path from "node:path";

let cachedLogoDataUri: string | null = null;

export async function getLogoDataUri() {
  if (cachedLogoDataUri) return cachedLogoDataUri;

  const logoPath = path.resolve(process.cwd(), "src/assets/logo.png");
  const logoBuffer = await readFile(logoPath);
  cachedLogoDataUri = `data:image/png;base64,${logoBuffer.toString("base64")}`;
  return cachedLogoDataUri;
}
