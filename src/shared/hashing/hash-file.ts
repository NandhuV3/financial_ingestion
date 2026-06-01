import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

export async function calculateFileHash(path: string): Promise<string> {
  return calculateStringHash(await readFile(path, "utf8"));
}

export function calculateStringHash(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}
