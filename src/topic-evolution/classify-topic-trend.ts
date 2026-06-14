import type { TopicTrendClassification } from "./topic-trend.types.js";
import type { TrendState } from "./topic-evolution.types.js";

const significantAverageDeltaRatio = 0.08;
const stableAverageDeltaRatio = 0.05;
const stableVolatilityRatio = 0.08;
const highVolatilityRatio = 0.18;

export function classifyTopicTrend(strengthHistory: number[]): TopicTrendClassification {
  if (strengthHistory.length < 2) {
    return buildClassification("insufficient_history", strengthHistory);
  }

  const latestStrength = strengthHistory.at(-1) ?? 0;
  const averageStrength = average(strengthHistory);
  const deltaFromAverage = latestStrength - averageStrength;
  const volatility = coefficientOfVariation(strengthHistory, averageStrength);
  const trajectory = calculateTrajectory(strengthHistory);
  const significantDelta = Math.max(2, averageStrength * significantAverageDeltaRatio);
  const stableDelta = Math.max(1, averageStrength * stableAverageDeltaRatio);

  if (Math.abs(deltaFromAverage) <= stableDelta && volatility <= stableVolatilityRatio) {
    return buildClassification("stable", strengthHistory);
  }

  if (volatility >= highVolatilityRatio && !hasClearDirection(trajectory)) {
    return buildClassification("mixed", strengthHistory);
  }

  if (hasAlternatingDirection(strengthHistory)) {
    return buildClassification("mixed", strengthHistory);
  }

  if (deltaFromAverage >= significantDelta && trajectory > 0) {
    return buildClassification("strengthening", strengthHistory);
  }

  if (deltaFromAverage <= -significantDelta && trajectory < 0) {
    return buildClassification("weakening", strengthHistory);
  }

  if (Math.abs(deltaFromAverage) <= stableDelta) {
    return buildClassification("stable", strengthHistory);
  }

  return buildClassification("unknown", strengthHistory);
}

function buildClassification(trendState: TrendState, strengthHistory: number[]): TopicTrendClassification {
  const latestStrength = strengthHistory.at(-1) ?? 0;
  const averageStrength = average(strengthHistory);

  return {
    trend_state: trendState,
    latest_strength: latestStrength,
    average_strength: round(averageStrength),
    strength_delta_from_average: round(latestStrength - averageStrength),
    volatility: round(coefficientOfVariation(strengthHistory, averageStrength)),
  };
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function coefficientOfVariation(values: number[], averageValue: number): number {
  if (values.length < 2 || averageValue === 0) {
    return 0;
  }

  const variance = values.reduce((sum, value) => sum + ((value - averageValue) ** 2), 0) / values.length;
  return Math.sqrt(variance) / averageValue;
}

function calculateTrajectory(values: number[]): number {
  if (values.length < 2) {
    return 0;
  }

  const recentValues = values.slice(Math.max(0, values.length - 3));
  return recentValues.at(-1)! - recentValues[0];
}

function hasClearDirection(trajectory: number): boolean {
  return Math.abs(trajectory) >= 2;
}

function hasAlternatingDirection(values: number[]): boolean {
  if (values.length < 3) {
    return false;
  }

  const deltas = values
    .slice(1)
    .map((value, index) => Math.sign(value - values[index]))
    .filter((delta) => delta !== 0);

  return deltas.some((delta, index) => index > 0 && delta !== deltas[index - 1]);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
