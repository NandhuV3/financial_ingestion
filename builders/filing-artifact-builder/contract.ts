export const FILING_ARTIFACT_BUILDER_TYPE = "filing-artifact-builder";
export const FILING_ARTIFACT_BUILDER_VERSION = "filing-artifact-builder-v1";
export const FILING_ARTIFACT_SCHEMA_VERSION = "filing-artifact-v1";
export const FILING_ARTIFACT_PIPELINE_VERSION = "filing-artifact-pipeline-v1";

export const FILING_SECTION_SEPARATOR = "\n\n";

export const FILING_SECTION_NAMES = [
  "management_discussion",
  "risk_factors",
] as const;

export type FilingSectionName = typeof FILING_SECTION_NAMES[number];

export type FilingTypeRequirement = {
  required_sections: readonly FilingSectionName[];
};

/**
 * Owner: Filing Artifact contract.
 * Purpose: select filing-type-specific completeness requirements.
 * Justification: 020 requires normalized MD&A and Risk Factors for 10-Q.
 */
export const FILING_TYPE_REQUIREMENTS: Readonly<
  Record<string, FilingTypeRequirement>
> = {
  "10-Q": {
    required_sections: [
      "management_discussion",
      "risk_factors",
    ],
  },
};
