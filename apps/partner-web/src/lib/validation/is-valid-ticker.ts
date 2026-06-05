export function isValidTicker(value: string): boolean {
  return /^[A-Z]{1,6}$/.test(value.trim().toUpperCase());
}
