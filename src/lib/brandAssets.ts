import { readFile } from "node:fs/promises";
import path from "node:path";

let cachedLogo: string | null = null;

/** Reads /public/Sahas.png once and returns it as a base64 data URL for
 *  embedding inside react-pdf documents. Returns "" if the file is missing. */
export async function getSahasLogoDataUrl(): Promise<string> {
  if (cachedLogo !== null) return cachedLogo;
  try {
    const buf = await readFile(path.join(process.cwd(), "public", "Sahas.png"));
    cachedLogo = `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    cachedLogo = "";
  }
  return cachedLogo;
}
