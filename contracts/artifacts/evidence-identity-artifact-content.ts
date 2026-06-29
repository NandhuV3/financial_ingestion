export type EvidenceCatalogEntry = {
  evidence_ref: string;
  evidence_hash: string;
  filing_id: string;
  section_name: string;
  paragraph_index: number;
  paragraph_text: string;
};

export type EvidenceIdentityContent = {
  filing_id: string;
  filing_hash: string;
  entries: EvidenceCatalogEntry[];
};
