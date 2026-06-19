export function isPeriodAfter(currentPeriod: string, comparisonPeriod: string): boolean {
  return currentPeriod.localeCompare(comparisonPeriod) > 0;
}
