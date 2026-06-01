export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

export function formatTimestamp(value: string | number | Date): string {
  return new Date(value).toISOString();
}
