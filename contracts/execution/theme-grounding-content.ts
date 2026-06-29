export type GroundingScope = {
  evidence_entry_count: number;
  section_names: string[];
};

export type GroundingEvidenceEntry = {
  evidence_ref: string;
  evidence_hash: string;
  section_name: string;
  paragraph_index: number;
  paragraph_text: string;
};

export type GroundingSection = {
  section_name: string;
  evidence_refs: string[];
};

export type GroundingMetadata = {
  source_readiness_result_id: string;
  source_evidence_identity_artifact_id: string;
  generated_from_readiness_status: "ready";
};

export type ThemeGroundingContent = {
  readiness_result_id: string;
  filing_id: string;
  filing_hash: string;
  grounding_version: string;
  grounding_scope: GroundingScope;
  ordered_evidence: GroundingEvidenceEntry[];
  section_hierarchy: GroundingSection[];
  grounding_metadata: GroundingMetadata;
};
