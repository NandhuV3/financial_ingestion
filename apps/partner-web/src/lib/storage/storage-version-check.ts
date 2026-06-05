export type VersionedStorage<T> = {
  version: number;
  data: T;
};

export function storageVersionCheck<T>(
  value: unknown,
  expectedVersion: number,
  fallback: VersionedStorage<T>,
): VersionedStorage<T> {
  if (!value || typeof value !== "object" || !("version" in value) || !("data" in value)) {
    return fallback;
  }

  const candidate = value as VersionedStorage<T>;
  return candidate.version === expectedVersion ? candidate : fallback;
}
