import type { Artifact } from "../../../contracts/artifacts/artifact.js";
import { ArtifactStatus } from "../../../contracts/artifacts/artifact-status.js";
import type { ArtifactType } from "../../../contracts/artifacts/artifact-type.js";
import type { ArtifactRepository } from "../../../packages/artifact-framework/src/artifact-repository.js";
import type { ArtifactLookup } from "../../../packages/artifact-framework/src/artifact-types.js";
import {
  COMMITMENT_TRACKING_CALIBRATION,
  COMMITMENT_TRACKING_RULE_SET,
  COMMITMENT_TRACKING_SCHEMA_VERSION,
} from "../contract.js";
import type {
  CommitmentSourceArtifactContent,
  CommitmentSourceRecord,
  CommitmentTrackingArtifactContent,
  CommitmentTrackingBuilderInput,
} from "../types.js";

export function builderInput(
  overrides: Partial<CommitmentTrackingBuilderInput> = {},
): CommitmentTrackingBuilderInput {
  return {
    company_id: "MSFT",
    period_id: "2026-Q2",
    source_dependencies: [
      {
        dependency_name: "current_filing",
        period_id: "2026-Q2",
        source_type: "10Q",
        artifact_type: "filing",
        absent_reason: null,
      },
    ],
    rule_set: {
      rule_set_ref: COMMITMENT_TRACKING_RULE_SET.ref,
      rule_version: COMMITMENT_TRACKING_RULE_SET.version,
    },
    calibration: {
      calibration_ref: COMMITMENT_TRACKING_CALIBRATION.ref,
      calibration_version: COMMITMENT_TRACKING_CALIBRATION.version,
    },
    ...overrides,
  };
}

export function sourceArtifact(
  records: CommitmentSourceRecord[] = [sourceRecord()],
  options: {
    artifactId?: string;
    artifactType?: "filing" | "structured_intelligence";
    periodId?: string;
  } = {},
): Artifact<CommitmentSourceArtifactContent> {
  return artifact(
    options.artifactId ?? "filing-2026-q2",
    options.artifactType ?? "filing",
    {
      commitment_records: records,
    },
    options.periodId ?? "2026-Q2",
  );
}

export function sourceRecord(
  overrides: Partial<CommitmentSourceRecord> = {},
): CommitmentSourceRecord {
  return {
    commitment_id: "commitment-ai-capacity",
    commitment_type: "capacity_expansion",
    statement: "Expand AI datacenter capacity.",
    commitment_period: "2026-Q2",
    expected_resolution_period: "2026-Q4",
    actual_resolution_period: null,
    status: "new",
    expected_resolution_passed: false,
    identity_basis: {
      company_id: "MSFT",
      commitment_type: "capacity_expansion",
      canonical_statement: "Expand AI datacenter capacity.",
      initial_commitment_period: "2026-Q2",
      expected_resolution_period: "2026-Q4",
      creation_evidence_ref: "evidence-ai-capacity-created",
      identity_rule_version: COMMITMENT_TRACKING_RULE_SET.version,
    },
    resolution: null,
    evidence: [
      {
        evidence_id: "evidence-ai-capacity-created",
        source_record_ref: "filing-2026-q2:item2:commitment-1",
        evidence_text: "We will expand AI datacenter capacity by Q4.",
        evidence_role: "creation",
        confidence: 0.9,
      },
    ],
    confidence: {
      extraction_confidence: 0.9,
      linkage_confidence: 0,
      resolution_confidence: 0,
    },
    ...overrides,
  };
}

export function priorCommitmentArtifact(): Artifact<CommitmentTrackingArtifactContent> {
  return artifact(
    "commitment-tracking-2026-q2",
    "commitment_tracking",
    validFirstPopulationContent(),
    "2026-Q2",
  );
}

export function validFirstPopulationContent(): CommitmentTrackingArtifactContent {
  const record = sourceRecord();

  return {
    artifact_type: "commitment_tracking",
    company: "MSFT",
    period: "2026-Q2",
    commitments: [
      {
        commitment_id: record.commitment_id,
        commitment_type: record.commitment_type,
        statement: record.statement,
        commitment_period: record.commitment_period,
        expected_resolution_period: record.expected_resolution_period,
        actual_resolution_period: record.actual_resolution_period,
        status: record.status,
        timing: {
          overdue: false,
        },
        identity_basis: record.identity_basis,
        resolution: null,
        evidence: [
          {
            ...record.evidence[0]!,
            source_artifact_ref: "filing-2026-q2",
            source_artifact_version: 1,
            filing_period: "2026-Q2",
            source_type: "10Q",
          },
        ],
        timeline: [
          {
            period: "2026-Q2",
            status: "new",
            evidence_ref: "evidence-ai-capacity-created",
            confidence: 0.9,
          },
        ],
        confidence: 0.9,
      },
    ],
    summary: {
      total_commitments: 1,
      active_commitments: 0,
      achieved_commitments: 0,
      delayed_commitments: 0,
      modified_commitments: 0,
      abandoned_commitments: 0,
      fulfillment_rate: 0,
    },
    coverage: {
      status: "complete",
      current_period_source_count: 1,
      historical_period_count: 1,
      missing_sources: [],
    },
    depth_indicator: {
      historical_periods_available: 1,
      first_population: true,
      longitudinal_tracking_available: false,
      preferred_history_available: false,
    },
    confidence: {
      overall: 0.2875,
      extraction_confidence: 0.9,
      linkage_confidence: 0,
      resolution_confidence: 0,
      history_depth_score: 0.25,
    },
    replayability_metadata: {
      schema_version: COMMITMENT_TRACKING_SCHEMA_VERSION,
      source_artifact_references: ["filing-2026-q2"],
      source_artifact_versions: [1],
      source_record_references: ["filing-2026-q2:item2:commitment-1"],
      prior_commitment_tracking_ref: null,
      prior_commitment_tracking_version: null,
      rule_set_ref: COMMITMENT_TRACKING_RULE_SET.ref,
      rule_version: COMMITMENT_TRACKING_RULE_SET.version,
      calibration_ref: COMMITMENT_TRACKING_CALIBRATION.ref,
      calibration_version: COMMITMENT_TRACKING_CALIBRATION.version,
      evidence_references: ["evidence-ai-capacity-created"],
      lifecycle_references: ["commitment-ai-capacity:2026-Q2:new"],
    },
  };
}

export function artifact<T>(
  artifactId: string,
  artifactType: ArtifactType,
  content: T,
  periodId = "2026-Q2",
): Artifact<T> {
  return {
    identity: {
      artifact_id: artifactId,
      artifact_type: artifactType,
      company_id: "MSFT",
      period_id: periodId,
      version: 1,
    },
    metadata: {
      version: 1,
      schema_version: `${artifactType}-schema-v1`,
      pipeline_version: `${artifactType}-pipeline-v1`,
      generated_at: "2026-06-19T00:00:00.000Z",
      artifact_hash: `${artifactType}-artifact-hash`,
      input_hash: `${artifactType}-input-hash`,
      generation_duration_ms: 1,
      status: ArtifactStatus.ACTIVE,
    },
    lineage: {
      upstream_dependencies: [],
      generation_context: {
        builder_type: `${artifactType}-builder`,
      },
    },
    content,
  };
}

export class TestArtifactRepository implements ArtifactRepository {
  private readonly artifacts = new Map<string, Artifact<unknown>>();
  private readonly current = new Map<string, string>();

  async create<T>(artifactValue: Artifact<T>): Promise<void> {
    this.artifacts.set(artifactValue.identity.artifact_id, clone(artifactValue));
    this.current.set(key(artifactValue.identity), artifactValue.identity.artifact_id);
  }

  async getById<T>(artifactId: string): Promise<Artifact<T> | null> {
    const value = this.artifacts.get(artifactId);
    return value ? clone(value) as Artifact<T> : null;
  }

  async getCurrent<T>(lookup: ArtifactLookup): Promise<Artifact<T> | null> {
    const artifactId = this.current.get(key(lookup));
    return artifactId ? this.getById<T>(artifactId) : null;
  }

  async getHistory<T>(lookup: ArtifactLookup): Promise<Artifact<T>[]> {
    return [...this.artifacts.values()]
      .filter((value) =>
        value.identity.artifact_type === lookup.artifact_type
        && value.identity.company_id === lookup.company_id
        && value.identity.period_id === lookup.period_id)
      .map((value) => clone(value) as Artifact<T>);
  }
}

function key(lookup: ArtifactLookup): string {
  return `${lookup.artifact_type}:${lookup.company_id ?? ""}:${lookup.period_id ?? ""}`;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
