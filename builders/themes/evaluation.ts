import type { Theme, ThemesConfidence, ThemesEvaluationHooks } from "./contract.js";

export function calculateThemesConfidence(themes: Theme[], duplicateCount: number): ThemesConfidence {
  const evidenceCoverage = themes.length === 0
    ? 0
    : themes.filter((theme) => theme.evidence.length > 0).length / themes.length;
  const extractionConsistency = themes.length === 0
    ? 0
    : Math.max(0, 1 - duplicateCount / themes.length);
  const filingCoverage = themes.length === 0 ? 0 : 1;
  const overall = round((evidenceCoverage + extractionConsistency + filingCoverage) / 3);

  return {
    overall,
    evidence_coverage: round(evidenceCoverage),
    extraction_consistency: round(extractionConsistency),
    filing_coverage: round(filingCoverage),
  };
}

export function buildThemesEvaluationHooks(
  themes: Theme[],
  duplicateCount: number,
  promptVersion: string,
  modelVersion: string,
): ThemesEvaluationHooks {
  const totalEvidence = themes.reduce((sum, theme) => sum + theme.evidence.length, 0);
  const averageConfidence = themes.length === 0
    ? 0
    : themes.reduce((sum, theme) => sum + theme.confidence, 0) / themes.length;

  return {
    prompt_version: promptVersion,
    model_version: modelVersion,
    theme_count: themes.length,
    average_confidence: round(averageConfidence),
    confidence_distribution: {
      low: themes.filter((theme) => theme.confidence < 0.5).length,
      medium: themes.filter((theme) => theme.confidence >= 0.5 && theme.confidence < 0.8).length,
      high: themes.filter((theme) => theme.confidence >= 0.8).length,
    },
    evidence_density: themes.length === 0 ? 0 : round(totalEvidence / themes.length),
    duplicate_count: duplicateCount,
  };
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
