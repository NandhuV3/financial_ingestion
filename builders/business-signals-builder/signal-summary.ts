import { SIGNAL_CATEGORIES, SIGNAL_MAGNITUDES } from "./contract.js";
import type { BusinessSignal, BusinessSignalSummary } from "./types.js";

export function buildSignalSummary(signals: BusinessSignal[]): BusinessSignalSummary {
  return {
    total_signals: signals.length,
    by_category: countBy(signals, SIGNAL_CATEGORIES, (signal) => signal.category),
    by_magnitude: countBy(signals, SIGNAL_MAGNITUDES, (signal) => signal.magnitude),
  };
}

function countBy<T extends string>(
  signals: BusinessSignal[],
  keys: readonly T[],
  selector: (signal: BusinessSignal) => T,
): Record<string, number> {
  const counts = Object.fromEntries(keys.map((key) => [key, 0])) as Record<string, number>;

  for (const signal of signals) {
    counts[selector(signal)] += 1;
  }

  return counts;
}

