import type { TrendState } from "./topic-evolution.types.js";

export type TopicStrengthInput = {
  importance_score: number;
  evidence_count: number;
  theme_count: number;
};

export type TopicTrendClassification = {
  trend_state: TrendState;
  latest_strength: number;
  average_strength: number;
  strength_delta_from_average: number;
  volatility: number;
};
