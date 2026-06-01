import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export async function ensureDirectory(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

export async function writeTextFile(path: string, content: string): Promise<void> {
  await ensureDirectory(dirname(path));
  await writeFile(path, content, "utf8");
}

export async function writeJsonFile(path: string, data: unknown): Promise<void> {
  await writeTextFile(path, `${JSON.stringify(data, null, 2)}\n`);
}
