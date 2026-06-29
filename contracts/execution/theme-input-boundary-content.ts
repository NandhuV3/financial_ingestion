export type ThemeVisibleEvidenceEntry = {
  evidence_ref: string;
  section_name: string;
  paragraph_index: number;
  paragraph_text: string;
};

export type ThemeVisibleSection = {
  section_name: string;
  evidence_refs: string[];
};

export type ThemePermittedMetadata = {
  source_grounding_result_id: string;
  visible_evidence_count: number;
  visible_section_names: string[];
};

export type ThemeInputBoundaryContent = {
  grounding_result_id: string;
  filing_id: string;
  filing_hash: string;
  input_version: string;
  visible_evidence: ThemeVisibleEvidenceEntry[];
  visible_section_hierarchy: ThemeVisibleSection[];
  permitted_metadata: ThemePermittedMetadata;
};
