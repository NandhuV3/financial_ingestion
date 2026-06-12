import type { HarnessDimension, HarnessScorecard } from "./harness.types.js";

export function createScorecard(params: {
  artifact: string;
  dimensions: HarnessDimension[];
  warnings?: string[];
  failures?: string[];
}): HarnessScorecard {
  const dimensions = params.dimensions.map((dimension) => ({
    ...dimension,
    score: clampScore(dimension.score),
  }));

  return {
    artifact: params.artifact,
    overall_score: average(dimensions.map((dimension) => dimension.score)),
    dimensions,
    warnings: params.warnings ?? [],
    failures: params.failures ?? [],
  };
}

export function scoreCoverage(populated: number, total: number): number {
  return total === 0 ? 1 : round(populated / total);
}

export function countDuplicateValues(values: string[]): number {
  const seen = new Set<string>();
  let duplicates = 0;

  for (const value of values) {
    const key = normalize(value);

    if (!key) {
      continue;
    }

    if (seen.has(key)) {
      duplicates += 1;
      continue;
    }

    seen.add(key);
  }

  return duplicates;
}

export function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

export function flattenText(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap(flattenText);
  }

  if (value && typeof value === "object") {
    return Object.values(value).flatMap(flattenText);
  }

  return [];
}

export function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function clampScore(value: number): number {
  return Math.min(1, Math.max(0, round(value)));
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
