import type { Artifact } from "../../../contracts/artifacts/artifact.js";
import { ArtifactStatus } from "../../../contracts/artifacts/artifact-status.js";
import type { ArtifactType } from "../../../contracts/artifacts/artifact-type.js";
import type { ArtifactRepository } from "../../../packages/artifact-framework/src/artifact-repository.js";
import type { ArtifactLookup } from "../../../packages/artifact-framework/src/artifact-types.js";
import {
  ACCOUNTING_STABILITY_CALIBRATION,
  ACCOUNTING_STABILITY_RULE_SET,
} from "../contract.js";
import type {
  AccountingSourceArtifactContent,
  AccountingStabilityBuilderInput,
} from "../types.js";

export function input(
  overrides: Partial<AccountingStabilityBuilderInput> = {},
): AccountingStabilityBuilderInput {
  return {
    company_id: "MSFT",
    period_id: "2026-Q2",
    source_dependencies: [
      {
        dependency_name: "prior_filing",
        period_id: "2026-Q1",
        artifact_type: "filing",
      },
      {
        dependency_name: "current_filing",
        period_id: "2026-Q2",
        artifact_type: "filing",
      },
    ],
    rule_set: {
      rule_set_ref: ACCOUNTING_STABILITY_RULE_SET.ref,
      rule_version: ACCOUNTING_STABILITY_RULE_SET.version,
    },
    calibration: {
      calibration_ref: ACCOUNTING_STABILITY_CALIBRATION.ref,
      calibration_version: ACCOUNTING_STABILITY_CALIBRATION.version,
    },
    ...overrides,
  };
}

export function priorSource(): Artifact<AccountingSourceArtifactContent> {
  return sourceArtifact("filing-q1", "2026-Q1", {
    accounting_policies: [
      {
        policy_type: "revenue_recognition",
        policy_text: "Recognize subscriptions ratably.",
        proactively_disclosed: true,
        comparability_impact: "none",
        evidence_refs: ["q1:policy:revenue"],
        confidence: 0.9,
      },
    ],
    segments: [
      segment("Cloud", "q1:segment:cloud"),
      segment("Productivity", "q1:segment:productivity"),
    ],
    non_gaap_measure: {
      gaap_value: 100,
      non_gaap_value: 105,
      exclusion_items: ["stock compensation"],
      evidence_refs: ["q1:non-gaap"],
      confidence: 0.9,
    },
    restatements: [],
    coverage: completeCoverage(),
    evidence_refs: ["q1:accounting-source"],
  });
}

export function currentSource(): Artifact<AccountingSourceArtifactContent> {
  return sourceArtifact("filing-q2", "2026-Q2", {
    accounting_policies: [
      {
        policy_type: "revenue_recognition",
        policy_text: "Recognize usage revenue as consumed.",
        proactively_disclosed: true,
        comparability_impact: "moderate",
        evidence_refs: ["q2:policy:revenue"],
        confidence: 0.8,
      },
    ],
    segments: [
      {
        ...segment("Cloud and AI", "q2:segment:cloud-ai"),
        disclosed_reason: "AI products are managed with cloud infrastructure.",
        comparability_impact: "moderate",
      },
      segment("Productivity", "q2:segment:productivity"),
    ],
    non_gaap_measure: {
      gaap_value: 100,
      non_gaap_value: 120,
      exclusion_items: ["stock compensation", "restructuring"],
      evidence_refs: ["q2:non-gaap"],
      confidence: 0.8,
    },
    restatements: [
      {
        period_announced: "2026-Q2",
        periods_affected: ["2025-Q4"],
        scope: "revenue",
        description: "Prior-period revenue presentation corrected.",
        materiality: "medium",
        evidence_refs: ["q2:restatement"],
        confidence: 0.85,
      },
    ],
    coverage: completeCoverage(),
    evidence_refs: ["q2:accounting-source"],
  });
}

export function sourceForPeriod(
  period: string,
): Artifact<AccountingSourceArtifactContent> {
  const value = currentSource();
  value.identity.artifact_id = `filing-${period}`;
  value.identity.period_id = period;
  value.content = {
    ...value.content,
    accounting_policies: value.content.accounting_policies.map((policy) => ({
      ...policy,
      evidence_refs: [`${period}:policy`],
    })),
    segments: value.content.segments.map((item) => ({
      ...item,
      evidence_refs: [`${period}:segment:${item.segment_name}`],
    })),
    non_gaap_measure: value.content.non_gaap_measure === null
      ? null
      : {
          ...value.content.non_gaap_measure,
          evidence_refs: [`${period}:non-gaap`],
        },
    restatements: [],
    evidence_refs: [`${period}:accounting-source`],
  };
  return value;
}

export function sourceArtifact(
  artifactId: string,
  periodId: string,
  content: AccountingSourceArtifactContent,
): Artifact<AccountingSourceArtifactContent> {
  return artifact(artifactId, "filing", content, periodId);
}

export function artifact<T>(
  artifactId: string,
  artifactType: ArtifactType,
  content: T,
  periodId: string,
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
      artifact_hash: `${artifactId}-hash`,
      input_hash: `${artifactId}-input-hash`,
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

function segment(segmentName: string, evidenceRef: string) {
  return {
    segment_name: segmentName,
    disclosed_reason: null,
    comparability_impact: "none" as const,
    evidence_refs: [evidenceRef],
    confidence: 0.9,
  };
}

function completeCoverage() {
  return {
    accounting_policies_available: true,
    segments_available: true,
    non_gaap_available: true,
    restatements_available: true,
  };
}

function key(lookup: ArtifactLookup): string {
  return `${lookup.artifact_type}:${lookup.company_id ?? ""}:${lookup.period_id ?? ""}`;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

