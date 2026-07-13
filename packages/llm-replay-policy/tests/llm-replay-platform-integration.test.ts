import assert from "node:assert/strict";
import test from "node:test";
import type {
  Artifact,
} from "../../../contracts/artifacts/artifact.js";
import {
  ArtifactStatus,
} from "../../../contracts/artifacts/artifact-status.js";
import type {
  DependencyReference,
} from "../../../contracts/artifacts/artifact-lineage.js";
import type {
  LLMExecutionRecord,
} from "../../../contracts/execution/llm-execution-record.js";
import type {
  ExecutionResult,
} from "../../../contracts/execution/llm-execution-models.js";
import type {
  PromptResolutionResult,
} from "../../../contracts/execution/prompt-registry-models.js";
import type {
  ReplayRequest,
} from "../../../contracts/execution/llm-replay-policy-models.js";
import {
  LLMExecutionReplayDecisionAdapter,
  LLMReplayPolicyDecisionError,
  ReplayResolutionCoordinator,
  type ReplayArtifactLookup,
  type ReplayExecutionRecordLookup,
  type ReplayPromptPackageLookup,
} from "../src/index.js";

test("ReplayResolutionCoordinator coordinates replay resources through injected boundaries", async () => {
  const artifactLookup = new RecordingArtifactLookup(artifact());
  const executionRecordLookup = new RecordingExecutionRecordLookup(
    executionRecord(),
  );
  const promptLookup = new RecordingPromptLookup(promptResolution());
  const coordinator = new ReplayResolutionCoordinator(
    artifactLookup,
    executionRecordLookup,
    promptLookup,
  );

  const result = await coordinator.coordinate(replayRequest("REPLAY"));

  assert.equal(result.status, "replay_ready");
  assert.equal(artifactLookup.callCount, 1);
  assert.equal(executionRecordLookup.callCount, 1);
  assert.equal(promptLookup.callCount, 1);
  if (result.status === "replay_ready") {
    assert.equal(result.resources.artifact.identity.artifact_id, "artifact-1");
    assert.equal(result.resources.execution_record.record_id, "record-1");
    assert.equal(
      result.resources.prompt_resolution.prompt_package.identity.prompt_version,
      "v3",
    );
  }
});

test("ReplayResolutionCoordinator does not resolve resources for regeneration decisions", async () => {
  const artifactLookup = new RecordingArtifactLookup(artifact());
  const executionRecordLookup = new RecordingExecutionRecordLookup(
    executionRecord(),
  );
  const promptLookup = new RecordingPromptLookup(promptResolution());
  const coordinator = new ReplayResolutionCoordinator(
    artifactLookup,
    executionRecordLookup,
    promptLookup,
  );

  const result = await coordinator.coordinate(replayRequest("REGENERATION"));

  assert.equal(result.status, "regeneration_required");
  assert.equal(artifactLookup.callCount, 0);
  assert.equal(executionRecordLookup.callCount, 0);
  assert.equal(promptLookup.callCount, 0);
});

test("ReplayResolutionCoordinator propagates deterministic missing artifact failures", async () => {
  const coordinator = new ReplayResolutionCoordinator(
    new RecordingArtifactLookup(null),
    new RecordingExecutionRecordLookup(executionRecord()),
    new RecordingPromptLookup(promptResolution()),
  );

  const result = await coordinator.coordinate(replayRequest("REPLAY"));

  assert.equal(result.status, "failed");
  if (result.status === "failed") {
    assert.equal(result.decision.failure.failure_code, "REPLAY_ARTIFACT_NOT_FOUND");
  }
});

test("ReplayResolutionCoordinator propagates deterministic missing execution record failures", async () => {
  const coordinator = new ReplayResolutionCoordinator(
    new RecordingArtifactLookup(artifact()),
    new RecordingExecutionRecordLookup(null),
    new RecordingPromptLookup(promptResolution()),
  );

  const result = await coordinator.coordinate(replayRequest("REPLAY"));

  assert.equal(result.status, "failed");
  if (result.status === "failed") {
    assert.equal(
      result.decision.failure.failure_code,
      "REPLAY_EXECUTION_RECORD_NOT_FOUND",
    );
  }
});

test("ReplayResolutionCoordinator fails deterministically when prompt lookup fails", async () => {
  const coordinator = new ReplayResolutionCoordinator(
    new RecordingArtifactLookup(artifact()),
    new RecordingExecutionRecordLookup(executionRecord()),
    new FailingPromptLookup(),
  );

  await assert.rejects(
    () => coordinator.coordinate(replayRequest("REPLAY")),
    LLMReplayPolicyDecisionError,
  );
});

test("LLMExecutionReplayDecisionAdapter provides LLM execution replay decisions when original result is supplied", () => {
  const decision = new LLMExecutionReplayDecisionAdapter()
    .toExecutionFrameworkDecision(replayDecision(), executionResult());

  assert.equal(decision.execution_mode, "REPLAY");
  if (decision.execution_mode === "REPLAY") {
    assert.equal(decision.original_execution_record.record_id, "record-1");
    assert.equal(decision.original_result.status, "succeeded");
  }
});

test("LLMExecutionReplayDecisionAdapter maps regeneration decisions to original execution mode", () => {
  const decision = new LLMExecutionReplayDecisionAdapter()
    .toExecutionFrameworkDecision({
      decision_type: "regenerate",
      regeneration_request: {
        replay_reference: replayRequest("REGENERATION").replay_reference,
        reason: "Regeneration requested.",
        policy_metadata: policyMetadata(),
      },
      policy_metadata: policyMetadata(),
    });

  assert.equal(decision.execution_mode, "ORIGINAL_EXECUTION");
});

test("LLMExecutionReplayDecisionAdapter rejects replay decisions without original results", () => {
  assert.throws(
    () => new LLMExecutionReplayDecisionAdapter()
      .toExecutionFrameworkDecision(replayDecision()),
    LLMReplayPolicyDecisionError,
  );
});

class RecordingArtifactLookup
  implements ReplayArtifactLookup<Record<string, unknown>> {
  callCount = 0;

  constructor(
    private readonly resolvedArtifact: Artifact<Record<string, unknown>> | null,
  ) {}

  async getArtifact(): Promise<Artifact<Record<string, unknown>> | null> {
    this.callCount += 1;
    return this.resolvedArtifact;
  }
}

class RecordingExecutionRecordLookup implements ReplayExecutionRecordLookup {
  callCount = 0;

  constructor(private readonly resolvedRecord: LLMExecutionRecord | null) {}

  async getExecutionRecord(): Promise<LLMExecutionRecord | null> {
    this.callCount += 1;
    return this.resolvedRecord;
  }
}

class RecordingPromptLookup implements ReplayPromptPackageLookup {
  callCount = 0;

  constructor(private readonly resolvedPrompt: PromptResolutionResult) {}

  async resolveReplay(): Promise<PromptResolutionResult> {
    this.callCount += 1;
    return this.resolvedPrompt;
  }
}

class FailingPromptLookup implements ReplayPromptPackageLookup {
  async resolveReplay(): Promise<PromptResolutionResult> {
    throw new Error("Prompt lookup failed.");
  }
}

function replayDecision() {
  return {
    decision_type: "replay" as const,
    replay_reference: replayRequest("REPLAY").replay_reference,
    policy_metadata: policyMetadata(),
  };
}

function replayRequest(
  replayMode: ReplayRequest["replay_mode"],
): ReplayRequest {
  return {
    replay_mode: replayMode,
    replay_reference: {
      artifact_reference: artifactReference(),
      execution_record: executionRecord(),
      prompt_reference: {
        prompt_id: "structured-intelligence",
        prompt_version: "v3",
        activation_id: "activation-1",
        content_hash: "prompt-hash-1",
      },
      execution_context: {
        execution_id: "execution-1",
        producer: "structured-intelligence-builder",
        generated_at: "2026-07-13T00:00:00.000Z",
      },
      model: {
        model_id: "model-1",
        model_version: "model-v1",
      },
      provider: {
        provider_id: "provider-1",
      },
    },
    policy_metadata: policyMetadata(),
  };
}

function artifactReference(): DependencyReference {
  return {
    artifact_id: "artifact-1",
    artifact_type: "structured_intelligence",
    version: 1,
    artifact_hash: "artifact-hash-1",
    input_hash: "input-hash-1",
  };
}

function artifact(): Artifact<Record<string, unknown>> {
  return {
    identity: {
      artifact_id: "artifact-1",
      artifact_type: "structured_intelligence",
      company_id: "MSFT",
      period_id: "2026-Q3",
      version: 1,
    },
    metadata: {
      version: 1,
      schema_version: "structured-intelligence-v1",
      pipeline_version: "pipeline-v1",
      generated_at: "2026-07-13T00:00:00.000Z",
      artifact_hash: "artifact-hash-1",
      input_hash: "input-hash-1",
      generation_duration_ms: 0,
      status: ArtifactStatus.ACTIVE,
    },
    lineage: {
      upstream_dependencies: [],
      generation_context: {
        builder_type: "structured-intelligence-builder",
        execution_id: "execution-1",
      },
    },
    content: {
      business_model: "Subscription software.",
    },
  };
}

function promptResolution(): PromptResolutionResult {
  return {
    prompt_package: {
      identity: {
        prompt_id: "structured-intelligence",
        prompt_version: "v3",
      },
      lifecycle_state: "active",
      system_prompt_template: "System prompt.",
      user_prompt_template_id: "user-template-v3",
      expected_output_schema_id: "structured-intelligence-v1",
      source: "filesystem",
      content_hash: "prompt-hash-1",
      version_lineage: {
        previous_prompt_version: "v2",
        change_reason: "Refined prompt.",
      },
    },
    activation: {
      prompt_id: "structured-intelligence",
      active_prompt_version: "v3",
      activation_id: "activation-1",
    },
    replay_reference: {
      prompt_id: "structured-intelligence",
      prompt_version: "v3",
      activation_id: "activation-1",
      content_hash: "prompt-hash-1",
    },
  };
}

function executionRecord(): LLMExecutionRecord {
  return {
    schema_version: "llm-execution-record-v1",
    record_type: "llm_execution",
    record_id: "record-1",
    record_hash: "record-hash-1",
    producer: "structured-intelligence-builder",
    execution_id: "execution-1",
    prompt: {
      prompt_id: "structured-intelligence",
      prompt_version: "v3",
      activation_id: "activation-1",
      render_hash: "render-hash-1",
    },
    model: {
      model_id: "model-1",
      model_version: "model-v1",
    },
    provider: {
      provider_id: "provider-1",
    },
    execution: {
      execution_id: "execution-1",
      execution_mode: "ORIGINAL_EXECUTION",
      producer: "structured-intelligence-builder",
      generated_at: "2026-07-13T00:00:00.000Z",
    },
    result: {
      status: "succeeded",
      output_hash: "output-hash-1",
      error: null,
    },
  };
}

function executionResult(): ExecutionResult<Record<string, unknown>> {
  return {
    status: "succeeded",
    output: {
      business_model: "Subscription software.",
    },
    metadata: {
      execution_id: "execution-1",
      execution_mode: "ORIGINAL_EXECUTION",
      producer: "structured-intelligence-builder",
      generated_at: "2026-07-13T00:00:00.000Z",
      prompt_id: "structured-intelligence",
      prompt_version: "v3",
      model_id: "model-1",
      model_version: "model-v1",
      provider_id: "provider-1",
    },
  };
}

function policyMetadata() {
  return {
    policy_id: "llm-replay-policy",
    policy_version: "v1",
  };
}
