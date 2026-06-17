import { TRUST_DIMENSIONS } from "../trust-signals-builder/contract.js";
import type { TrustSignalsArtifactContent } from "../trust-signals-builder/types.js";
import type { QuarterUnderstandingLimitations } from "./types.js";

export function buildQuarterUnderstandingLimitations(
  trustSignals: TrustSignalsArtifactContent | null,
): QuarterUnderstandingLimitations {
  return {
    trust_dimension_gaps: trustSignals === null
      ? [...TRUST_DIMENSIONS]
      : [...trustSignals.missing_dimensions],
  };
}
