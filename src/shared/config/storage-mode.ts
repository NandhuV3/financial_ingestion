export type StorageMode =
  | "development"
  | "production";

export function getStorageMode(): StorageMode {
  return process.env.STORAGE_MODE === "production"
    ? "production"
    : "development";
}

export function shouldPersistProcessedArtifacts(): boolean {
  return getStorageMode() === "development";
}

export function shouldPersistNormalizedArtifacts(): boolean {
  return getStorageMode() === "development";
}

export function shouldPersistChunkArtifacts(): boolean {
  return getStorageMode() === "development";
}
