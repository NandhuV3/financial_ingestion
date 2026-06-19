import { NARRATIVE_CONSISTENCY_CALIBRATION } from "./contract.js";
import type {
  LanguageShift,
  NarrativeConfidence,
  NarrativeDepthIndicator,
  NarrativeTheme,
  StrategicPriority,
} from "./types.js";

export function buildNarrativeConfidence(input: {
  priorities: StrategicPriority[];
  themes: NarrativeTheme[];
  shifts: LanguageShift[];
  depth: NarrativeDepthIndicator;
}): NarrativeConfidence {
  const sourceConfidence = [
    ...input.priorities.map((item) => item.confidence),
    ...input.themes.map((item) => item.confidence),
  ];
  const extraction = average(sourceConfidence);
  const linkage = average(input.priorities.map((priority) => priority.confidence));
  const shiftDetection = average(input.shifts.map((shift) => shift.confidence));
  const historyDepth = Math.min(
    input.depth.historical_periods_available
      / NARRATIVE_CONSISTENCY_CALIBRATION.preferred_history_periods,
    1,
  );
  const weights = NARRATIVE_CONSISTENCY_CALIBRATION.confidence_weights;

  return {
    overall: round(
      extraction * weights.extraction
      + linkage * weights.linkage
      + shiftDetection * weights.shift_detection
      + historyDepth * weights.history_depth,
    ),
    extraction_confidence: round(extraction),
    linkage_confidence: round(linkage),
    shift_detection_confidence: round(shiftDetection),
    history_depth_score: round(historyDepth),
  };
}

function average(values: number[]): number {
  return values.length === 0
    ? 0
    : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value: number): number {
  const factor = 10 ** NARRATIVE_CONSISTENCY_CALIBRATION.rounding_precision;
  return Math.round(value * factor) / factor;
}
