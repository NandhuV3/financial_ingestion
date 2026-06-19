import type {
  LanguageShift,
  NarrativeBuildDependencies,
} from "./types.js";
import { BuilderValidationError } from "../../packages/builder-framework/src/builder-errors.js";

export function buildLanguageShifts(
  dependencies: NarrativeBuildDependencies,
  currentPeriod: string,
): LanguageShift[] {
  const shifts = new Map<string, LanguageShift>();

  for (const source of dependencies.sources) {
    if (source.declaration.period_id !== currentPeriod) {
      continue;
    }

    for (const shift of source.artifact.content.language_shift_observations) {
      const existing = shifts.get(shift.shift_id);

      if (existing !== undefined && !sameShift(existing, shift)) {
        throw new BuilderValidationError(
          `Language shift ${shift.shift_id} conflicts across sources.`,
        );
      }

      shifts.set(shift.shift_id, {
        ...shift,
        supporting_evidence: [...new Set([
          ...existing?.supporting_evidence ?? [],
          ...shift.supporting_evidence,
        ])].sort(),
        confidence: existing === undefined
          ? shift.confidence
          : (existing.confidence + shift.confidence) / 2,
      });
    }
  }

  return [...shifts.values()].sort((left, right) => left.shift_id.localeCompare(right.shift_id));
}

function sameShift(left: LanguageShift, right: LanguageShift): boolean {
  return left.concept_ref === right.concept_ref
    && left.prior_framing === right.prior_framing
    && left.current_framing === right.current_framing
    && left.shift_magnitude === right.shift_magnitude
    && left.shift_reason_detected === right.shift_reason_detected;
}
