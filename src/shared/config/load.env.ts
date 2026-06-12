import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

let loaded = false;

export function loadEnv(): void {
  if (loaded) {
    return;
  }

  const envPath = join(process.cwd(), ".env");

  if (!existsSync(envPath)) {
    loaded = true;
    return;
  }

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^["']|["']$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }

  loaded = true;
}