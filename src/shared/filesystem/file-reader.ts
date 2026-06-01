import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";

export async function readTextFile(path: string): Promise<string> {
  return readFile(path, "utf8");
}

export async function readJsonFile<T>(path: string): Promise<T> {
  return JSON.parse(await readTextFile(path)) as T;
}

export function fileExists(path: string): boolean {
  return existsSync(path);
}
