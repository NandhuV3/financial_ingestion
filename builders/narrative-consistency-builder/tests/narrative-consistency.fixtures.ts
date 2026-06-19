import type { Artifact } from "../../../contracts/artifacts/artifact.js";
import { ArtifactStatus } from "../../../contracts/artifacts/artifact-status.js";
import type { ArtifactType } from "../../../contracts/artifacts/artifact-type.js";
import type { ArtifactRepository } from "../../../packages/artifact-framework/src/artifact-repository.js";
import type { ArtifactLookup } from "../../../packages/artifact-framework/src/artifact-types.js";
import {
  NARRATIVE_CONSISTENCY_CALIBRATION,
  NARRATIVE_CONSISTENCY_RULE_SET,
} from "../contract.js";
import type {
  NarrativeConsistencyBuilderInput,
  NarrativeSourceArtifactContent,
} from "../types.js";

export function input(
  overrides: Partial<NarrativeConsistencyBuilderInput> = {},
): NarrativeConsistencyBuilderInput {
  return {
    company_id: "MSFT",
    period_id: "2026-Q2",
    source_dependencies: [
      {
        dependency_name: "prior_filing",
        period_id: "2026-Q1",
        artifact_type: "filing",
        absent_reason: null,
      },
      {
        dependency_name: "current_filing",
        period_id: "2026-Q2",
        artifact_type: "filing",
        absent_reason: null,
      },
    ],
    rule_set: {
      rule_set_ref: NARRATIVE_CONSISTENCY_RULE_SET.ref,
      rule_version: NARRATIVE_CONSISTENCY_RULE_SET.version,
    },
    calibration: {
      calibration_ref: NARRATIVE_CONSISTENCY_CALIBRATION.ref,
      calibration_version: NARRATIVE_CONSISTENCY_CALIBRATION.version,
    },
    ...overrides,
  };
}

export function priorSource(): Artifact<NarrativeSourceArtifactContent> {
  return sourceArtifact("filing-q1", "2026-Q1", {
    priority_observations: [
      {
        priority_id: "priority-ai",
        concept_ref: "ai_growth_acceleration",
        description: "Expand AI infrastructure.",
        mention_count: 2,
        evidence_refs: ["q1:priority-ai"],
        confidence: 0.9,
      },
      {
        priority_id: "priority-cloud",
        concept_ref: "cloud_expansion",
        description: "Expand cloud capacity.",
        mention_count: 3,
        evidence_refs: ["q1:priority-cloud"],
        confidence: 0.85,
      },
    ],
    theme_observations: [
      {
        theme_id: "theme-ai",
        concept_ref: "ai_growth_acceleration",
        narrative_category: "innovation",
        mention_count: 2,
        evidence_refs: ["q1:theme-ai"],
        confidence: 0.9,
      },
    ],
    language_shift_observations: [],
  });
}

export function currentSource(
  content: NarrativeSourceArtifactContent = currentContent(),
): Artifact<NarrativeSourceArtifactContent> {
  return sourceArtifact("filing-q2", "2026-Q2", content);
}

export function currentContent(): NarrativeSourceArtifactContent {
  return {
    priority_observations: [
      {
        priority_id: "priority-ai",
        concept_ref: "ai_growth_acceleration",
        description: "Expand AI infrastructure.",
        mention_count: 4,
        evidence_refs: ["q2:priority-ai"],
        confidence: 0.92,
      },
    ],
    theme_observations: [
      {
        theme_id: "theme-ai",
        concept_ref: "ai_growth_acceleration",
        narrative_category: "innovation",
        mention_count: 5,
        evidence_refs: ["q2:theme-ai"],
        confidence: 0.93,
      },
    ],
    language_shift_observations: [
      {
        shift_id: "shift-ai-primary",
        concept_ref: "ai_growth_acceleration",
        prior_framing: "AI is an emerging priority.",
        current_framing: "AI is the primary growth priority.",
        shift_magnitude: "significant",
        shift_reason_detected: true,
        supporting_evidence: ["q1:theme-ai", "q2:theme-ai"],
        confidence: 0.88,
      },
    ],
  };
}

export function sourceArtifact(
  artifactId: string,
  periodId: string,
  content: NarrativeSourceArtifactContent,
): Artifact<NarrativeSourceArtifactContent> {
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

function key(lookup: ArtifactLookup): string {
  return `${lookup.artifact_type}:${lookup.company_id ?? ""}:${lookup.period_id ?? ""}`;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
