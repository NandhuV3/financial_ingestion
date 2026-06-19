export function comparePeriods(left: string, right: string): number {
  return left.localeCompare(right);
}

export function isPeriodBefore(left: string, right: string): boolean {
  return comparePeriods(left, right) < 0;
}

export function isPeriodAfter(left: string, right: string): boolean {
  return comparePeriods(left, right) > 0;
}
