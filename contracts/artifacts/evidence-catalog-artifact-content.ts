export type EvidenceCatalogEntry = {
  evidence_ref: string;
  evidence_hash: string;
  filing_id: string;
  section_name: string;
  paragraph_index: number;
  paragraph_text: string;
};

export type EvidenceCatalogArtifactContent = {
  artifact_type: "evidence_catalog";
  company_id: string;
  period_id: string;
  filing_id: string;
  filing_hash: string;
  entries: EvidenceCatalogEntry[];
};
