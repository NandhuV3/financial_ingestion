import type { BusinessHealth } from "../partner-domain.types.js";
import type { PartnerSourceArtifacts } from "../partner-source.types.js";

export function buildBusinessHealth(artifacts: PartnerSourceArtifacts): BusinessHealth {
  const summary = artifacts.topicEvolution?.summary ?? {};
  const strengthening = Number(summary.strengthening_topics ?? 0) + Number(summary.new_topics ?? 0);
  const weakening = Number(summary.weakening_topics ?? 0) + Number(summary.disappeared_topics ?? 0);
  const quarterSummary = artifacts.quarterChange?.summary;

  if (quarterSummary) {
    const positiveQuarterSignals = quarterSummary.importance_increases + quarterSummary.evidence_increases;
    const negativeQuarterSignals = quarterSummary.importance_decreases + quarterSummary.evidence_decreases + quarterSummary.removed_categories;

    if (negativeQuarterSignals > positiveQuarterSignals + 1) {
      return "weakening";
    }

    if (positiveQuarterSignals > negativeQuarterSignals + 1) {
      return "improving";
    }
  }

  if (weakening > strengthening + 1) {
    return "weakening";
  }

  if (strengthening > weakening + 1) {
    return "improving";
  }

  return "stable";
}
