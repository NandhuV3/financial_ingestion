const ephemeralFiles = new Map<string, string>();

export function writeEphemeralFile(path: string, content: string): void {
  ephemeralFiles.set(normalizePath(path), content);
}

export function readEphemeralFile(path: string): string | null {
  return ephemeralFiles.get(normalizePath(path)) ?? null;
}

export function ephemeralFileExists(path: string): boolean {
  return ephemeralFiles.has(normalizePath(path));
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/");
}
