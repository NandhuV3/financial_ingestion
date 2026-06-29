import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type {
  EvidenceIdentityContent,
} from "../../contracts/artifacts/evidence-identity-artifact-content.js";
import type {
  ThemesExecutionReadinessContent,
  ThemesQualityMetrics,
  ThemesExecutionReadinessStatus,
} from "../../contracts/execution/themes-execution-readiness-content.js";

export type ThemesQualityBuilderInput = {
  evidence_identity: EvidenceIdentityContent;
};

export type ThemesQualityDependencies = {
  evidence_identity: Artifact<EvidenceIdentityContent>;
};

export type ThemesQualityExecutionStatus = "success" | "failure";

export type ThemesQualityExecutionRecord = {
  builder_type: string;
  execution_id: string;
  company_id: string;
  period_id: string;
  evidence_identity_artifact_id: string;
  status: ThemesQualityExecutionStatus;
  readiness_status?: ThemesExecutionReadinessStatus;
  finding_count: number;
  blocking_finding_count: number;
  warning_finding_count: number;
  metrics?: ThemesQualityMetrics;
  started_at: string;
  completed_at: string;
  duration_ms: number;
};

export type ThemesQualityExecutionOutput = {
  builder_result: {
    content: ThemesExecutionReadinessContent;
  };
  execution_record: ThemesQualityExecutionRecord;
};
