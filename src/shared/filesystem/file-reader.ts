import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { ephemeralFileExists, readEphemeralFile } from "./ephemeral-artifact-store.js";

export async function readTextFile(path: string): Promise<string> {
  const ephemeral = readEphemeralFile(path);

  if (ephemeral !== null) {
    return ephemeral;
  }

  return readFile(path, "utf8");
}

export async function readJsonFile<T>(path: string): Promise<T> {
  return JSON.parse(await readTextFile(path)) as T;
}

export function fileExists(path: string): boolean {
  return ephemeralFileExists(path) || existsSync(path);
}
