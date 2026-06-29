import type {
  EvidenceCatalogEntry,
} from "../artifacts/evidence-identity-artifact-content.js";

export type ThemesExecutionReadinessStatus = "ready" | "not_ready";

export type ThemesQualityFindingSeverity = "blocking" | "warning" | "info";

export type ThemesReadinessEvidenceEntry = EvidenceCatalogEntry;

export type ThemesReadinessSection = {
  section_name: string;
  evidence_refs: string[];
};

export type ThemesQualityFinding = {
  finding_id: string;
  severity: ThemesQualityFindingSeverity;
  code: string;
  message: string;
  evidence_ref?: string;
};

export type ThemesQualityMetrics = {
  evidence_entry_count: number;
  section_count: number;
  section_distribution: Record<string, number>;
  duplicate_reference_count: number;
  orphan_reference_count: number;
  invalid_hash_count: number;
  ordering_issue_count: number;
};

export type ThemesExecutionReadinessContent = {
  evidence_identity_artifact_id: string;
  filing_id: string;
  filing_hash: string;
  readiness_status: ThemesExecutionReadinessStatus;
  validated_evidence: ThemesReadinessEvidenceEntry[];
  validated_section_hierarchy: ThemesReadinessSection[];
  findings: ThemesQualityFinding[];
  metrics: ThemesQualityMetrics;
};
