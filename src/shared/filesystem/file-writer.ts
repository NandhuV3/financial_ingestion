import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { shouldPersistPath } from "../config/storage-policy.js";
import { writeEphemeralFile } from "./ephemeral-artifact-store.js";

export async function ensureDirectory(path: string): Promise<void> {
  if (!shouldPersistPath(path)) {
    return;
  }

  await mkdir(path, { recursive: true });
}

export async function writeTextFile(path: string, content: string): Promise<void> {
  if (!shouldPersistPath(path)) {
    writeEphemeralFile(path, content);
    return;
  }

  await ensureDirectory(dirname(path));
  await writeFile(path, content, "utf8");
}

export async function writeJsonFile(path: string, data: unknown): Promise<void> {
  await writeTextFile(path, `${JSON.stringify(data, null, 2)}\n`);
}
