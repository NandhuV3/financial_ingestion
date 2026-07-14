import assert from "node:assert/strict";
import test from "node:test";
import type {
  Artifact,
} from "../../../contracts/artifacts/artifact.js";
import {
  EXECUTION_RECORD_REFERENCE_SCHEMA_VERSION,
  type ExecutionRecordReference,
} from "../../../contracts/framework/execution-record-reference.js";
import type {
  LLMExecutionRecord,
} from "../../../contracts/execution/llm-execution-record.js";
import type {
  ReplayReference,
} from "../../../contracts/execution/llm-replay-policy-models.js";
import type {
  StructuredIntelligence,
  StructuredIntelligenceInput,
  StructuredIntelligencePayload,
} from "../../../contracts/company-intelligence/structured-intelligence-models.js";
import {
  ArtifactService,
  calculateArtifactHash,
} from "../../artifact-framework/src/artifact-service.js";
import type {
  ArtifactRepository,
} from "../../artifact-framework/src/artifact-repository.js";
import type {
  ArtifactLookup,
  ReservedArtifactId,
} from "../../artifact-framework/src/artifact-types.js";
import {
  BuilderValidationError,
} from "../../builder-framework/src/builder-errors.js";
import {
  assembleStructuredIntelligenceArtifact,
  buildStructuredIntelligenceContent,
  STRUCTURED_INTELLIGENCE_PIPELINE_VERSION,
  structuredIntelligenceInputHash,
} from "../src/index.js";

test("assembleStructuredIntelligenceArtifact persists canonical artifact through Artifact Framework", async () => {
  const repository = new MemoryArtifactRepository();
  const artifactService = new ArtifactService(repository);
  const content = buildStructuredIntelligenceContent({
    target: input(),
    payload: structuredPayload(),
  });

  const result = await assembleStructuredIntelligenceArtifact({
    input: input(),
    content,
    artifactService,
    execution_id: "structured-intelligence-execution-1",
    prompt_reference: promptReference(),
    model_reference: modelReference(),
    execution_references: executionReferences(),
    replay_reference: replayReference(),
    generated_at: "2026-07-14T00:00:00.000Z",
    generation_duration_ms: 0,
    artifact_id: "structured-artifact-1" as ReservedArtifactId,
  });

  assert.equal(result.artifact.identity.artifact_id, "structured-artifact-1");
  assert.equal(result.artifact.identity.artifact_type, "structured_intelligence");
  assert.equal(result.artifact.metadata.pipeline_version, STRUCTURED_INTELLIGENCE_PIPELINE_VERSION);
  assert.equal(result.artifact.metadata.input_hash, structuredIntelligenceInputHash(input()));
  assert.equal(result.artifact.metadata.artifact_hash, calculateArtifactHash(content));
  assert.deepEqual(result.artifact.content, content);
  assert.deepEqual(await artifactService.getArtifact("structured-artifact-1"), result.artifact);
});

test("assembleStructuredIntelligenceArtifact attaches governed lineage references", async () => {
  const artifactService = new ArtifactService(new MemoryArtifactRepository());
  const result = await assembleStructuredIntelligenceArtifact({
    input: input(),
    content: buildStructuredIntelligenceContent({
      target: input(),
      payload: structuredPayload(),
    }),
    artifactService,
    execution_id: "structured-intelligence-execution-1",
    prompt_reference: promptReference(),
    model_reference: modelReference(),
    execution_references: executionReferences(),
    replay_reference: replayReference(),
    generated_at: "2026-07-14T00:00:00.000Z",
    generation_duration_ms: 0,
  });

  assert.deepEqual(
    result.artifact.lineage.upstream_dependencies.map((dependency) =>
      dependency.artifact_type),
    ["filing", "themes"],
  );
  assert.deepEqual(result.artifact.lineage.prompt_reference, promptReference());
  assert.deepEqual(result.artifact.lineage.model_reference, modelReference());
  assert.deepEqual(
    result.artifact.lineage.execution_references,
    executionReferences(),
  );
  assert.equal(
    result.artifact.lineage.generation_context.execution_id,
    "structured-intelligence-execution-1",
  );
});

test("assembleStructuredIntelligenceArtifact preserves replay reference for replay consumers", async () => {
  const replay = replayReference();
  const result = await assembleStructuredIntelligenceArtifact({
    input: input(),
    content: buildStructuredIntelligenceContent({
      target: input(),
      payload: structuredPayload(),
    }),
    artifactService: new ArtifactService(new MemoryArtifactRepository()),
    execution_id: "structured-intelligence-execution-1",
    prompt_reference: promptReference(),
    model_reference: modelReference(),
    execution_references: executionReferences(),
    replay_reference: replay,
    generated_at: "2026-07-14T00:00:00.000Z",
    generation_duration_ms: 0,
  });

  assert.deepEqual(result.replay_reference, replay);
});

test("assembleStructuredIntelligenceArtifact rejects replay prompt drift", async () => {
  const replay = replayReference();
  const driftedReplay: ReplayReference = {
    ...replay,
    prompt_reference: {
      ...replay.prompt_reference,
      prompt_version: "different-version",
    },
  };

  await assert.rejects(
    () => assembleStructuredIntelligenceArtifact({
      input: input(),
      content: buildStructuredIntelligenceContent({
        target: input(),
        payload: structuredPayload(),
      }),
      artifactService: new ArtifactService(new MemoryArtifactRepository()),
      execution_id: "structured-intelligence-execution-1",
      prompt_reference: promptReference(),
      model_reference: modelReference(),
      execution_references: executionReferences(),
      replay_reference: driftedReplay,
      generated_at: "2026-07-14T00:00:00.000Z",
      generation_duration_ms: 0,
    }),
    BuilderValidationError,
  );
});

test("assembleStructuredIntelligenceArtifact rejects non-replay-safe model temperature", async () => {
  await assert.rejects(
    () => assembleStructuredIntelligenceArtifact({
      input: input(),
      content: buildStructuredIntelligenceContent({
        target: input(),
        payload: structuredPayload(),
      }),
      artifactService: new ArtifactService(new MemoryArtifactRepository()),
      execution_id: "structured-intelligence-execution-1",
      prompt_reference: promptReference(),
      model_reference: {
        ...modelReference(),
        temperature: 0.7,
      },
      execution_references: executionReferences(),
      replay_reference: null,
      generated_at: "2026-07-14T00:00:00.000Z",
      generation_duration_ms: 0,
    }),
    BuilderValidationError,
  );
});

class MemoryArtifactRepository implements ArtifactRepository {
  private readonly artifacts = new Map<string, Artifact<unknown>>();

  async create<T>(artifact: Artifact<T>): Promise<void> {
    this.artifacts.set(
      artifact.identity.artifact_id,
      JSON.parse(JSON.stringify(artifact)) as Artifact<unknown>,
    );
  }

  async getById<T>(artifactId: string): Promise<Artifact<T> | null> {
    const artifact = this.artifacts.get(artifactId);
    return artifact === undefined
      ? null
      : JSON.parse(JSON.stringify(artifact)) as Artifact<T>;
  }

  async getCurrent<T>(lookup: ArtifactLookup): Promise<Artifact<T> | null> {
    const artifacts = [...this.artifacts.values()]
      .filter((artifact) =>
        artifact.identity.artifact_type === lookup.artifact_type
        && artifact.identity.company_id === lookup.company_id
        && artifact.identity.period_id === lookup.period_id)
      .sort((left, right) => right.identity.version - left.identity.version);

    const artifact = artifacts[0];
    return artifact === undefined
      ? null
      : JSON.parse(JSON.stringify(artifact)) as Artifact<T>;
  }

  async getHistory<T>(lookup: ArtifactLookup): Promise<Artifact<T>[]> {
    return [...this.artifacts.values()]
      .filter((artifact) =>
        artifact.identity.artifact_type === lookup.artifact_type
        && artifact.identity.company_id === lookup.company_id
        && artifact.identity.period_id === lookup.period_id)
      .sort((left, right) => left.identity.version - right.identity.version)
      .map((artifact) =>
        JSON.parse(JSON.stringify(artifact)) as Artifact<T>);
  }
}

function input(): StructuredIntelligenceInput {
  return {
    company_id: "MSFT",
    period_id: "2026-Q3",
    filing_id: "filing-1",
    inputs: {
      filing_artifact: {
        artifact_id: "filing-artifact-1",
        artifact_type: "filing",
        version: 1,
        artifact_hash: "filing-artifact-hash",
        input_hash: "filing-input-hash",
      },
      themes_artifact: {
        artifact_id: "themes-artifact-1",
        artifact_type: "themes",
        version: 1,
        artifact_hash: "themes-artifact-hash",
        input_hash: "themes-input-hash",
      },
    },
  };
}

function structuredPayload(): StructuredIntelligencePayload {
  return {
    business_model: {
      summary: "The filing describes a cloud subscription business.",
      value_creation: "Management describes customer usage as recurring value.",
      confidence: 0.9,
      evidence: [evidenceReference()],
    },
    products: [],
    customers: [],
    revenue_model: null,
    revenue_drivers: [],
    competitive_positioning: [],
    strategic_priorities: [],
    management_focus: [],
    risks: [],
    dependencies: [],
  };
}

function evidenceReference() {
  return {
    evidence_ref: "evidence-1",
    evidence_hash: "evidence-hash-1",
    evidence_identity_id: "evidence-identity-1",
    filing_section: "Business",
    source_excerpt: "Cloud services revenue is described in the filing.",
    theme_ids: ["theme-1"],
  };
}

function promptReference() {
  return {
    prompt_id: "structured-intelligence.business-model",
    prompt_version: "v1",
    activation_id: "activation-1",
  };
}

function modelReference() {
  return {
    provider: "platform-llm",
    model_name: "demo-model",
    model_version: "demo-model-v1",
    temperature: 0,
  };
}

function executionReferences(): ExecutionRecordReference[] {
  return [
    {
      schema_version: EXECUTION_RECORD_REFERENCE_SCHEMA_VERSION,
      record_type: "llm_execution",
      record_id: "llm-record-1",
      record_hash: "llm-record-hash-1",
      producer: "llm-execution-framework",
      execution_id: "structured-intelligence-execution-1",
    },
  ];
}

function replayReference(): ReplayReference {
  return {
    artifact_reference: {
      artifact_id: "historical-structured-artifact-1",
      artifact_type: "structured_intelligence",
      version: 1,
      artifact_hash: "historical-artifact-hash",
      input_hash: "historical-input-hash",
    },
    execution_record: llmExecutionRecord(),
    prompt_reference: {
      prompt_id: "structured-intelligence.business-model",
      prompt_version: "v1",
      activation_id: "activation-1",
      content_hash: "prompt-content-hash",
    },
    execution_context: {
      execution_id: "structured-intelligence-execution-1",
      producer: "structured-intelligence",
      generated_at: "2026-07-14T00:00:00.000Z",
    },
    model: {
      model_id: "demo-model",
      model_version: "demo-model-v1",
    },
    provider: {
      provider_id: "platform-llm",
    },
  };
}

function llmExecutionRecord(): LLMExecutionRecord {
  return {
    schema_version: "llm-execution-record-v1",
    record_type: "llm_execution",
    record_id: "llm-record-1",
    record_hash: "llm-record-hash-1",
    producer: "llm-execution-framework",
    execution_id: "structured-intelligence-execution-1",
    prompt: {
      prompt_id: "structured-intelligence.business-model",
      prompt_version: "v1",
      activation_id: "activation-1",
      render_hash: "prompt-render-hash",
    },
    model: {
      model_id: "demo-model",
      model_version: "demo-model-v1",
    },
    provider: {
      provider_id: "platform-llm",
    },
    execution: {
      execution_id: "structured-intelligence-execution-1",
      execution_mode: "ORIGINAL_EXECUTION",
      producer: "structured-intelligence",
      generated_at: "2026-07-14T00:00:00.000Z",
    },
    result: {
      status: "succeeded",
      output_hash: "output-hash",
      error: null,
    },
  };
}
