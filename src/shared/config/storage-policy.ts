import { sep } from "node:path";
import { getStorageMode } from "./storage-mode.js";

export const STORAGE_POLICY = {
  raw: true,
  metadata: true,
  processed: true,
  normalized: true,
  chunks: true,
  intelligence: true,
  reports: true,
};

const productionSkippedFolders = new Set([
  "processed",
  "normalized",
  "chunks",
]);

export function shouldPersistPath(path: string): boolean {
  if (getStorageMode() === "development") {
    return true;
  }

  return !pathSegments(path).some((segment) => productionSkippedFolders.has(segment));
}

function pathSegments(path: string): string[] {
  return path
    .split(/[\\/]/)
    .flatMap((segment) => segment.split(sep))
    .filter(Boolean);
}
