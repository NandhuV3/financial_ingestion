import assert from "node:assert/strict";
import test from "node:test";
import type {
  LLMExecutionRecord,
} from "../../contracts/execution/llm-execution-record.js";
import {
  LLM_REPLAY_POLICY_CONTRACT_VERSION,
  LLM_REPLAY_POLICY_MODELS_CONTRACT_VERSION,
  REPLAY_DECISION_TYPES,
  REPLAY_MODES,
  REPLAY_RESULT_STATUSES,
  type ReplayDecision,
  type ReplayReference,
  type ReplayRequest,
  type ReplayResult,
} from "../../packages/llm-replay-policy/src/index.js";

test("LLM Replay Policy contracts expose stable model versions", () => {
  assert.equal(LLM_REPLAY_POLICY_CONTRACT_VERSION, "llm-replay-policy-v1");
  assert.equal(
    LLM_REPLAY_POLICY_MODELS_CONTRACT_VERSION,
    "llm-replay-policy-models-v1",
  );
  assert.deepEqual(REPLAY_MODES, ["REPLAY", "REGENERATION"]);
  assert.deepEqual(REPLAY_DECISION_TYPES, ["replay", "regenerate", "fail"]);
  assert.deepEqual(REPLAY_RESULT_STATUSES, [
    "replayed",
    "regeneration_required",
    "failed",
  ]);
});

test("ReplayRequest model preserves immutable replay references", () => {
  const request: ReplayRequest = {
    replay_mode: "REPLAY",
    replay_reference: replayReference(),
    policy_metadata: {
      policy_id: "llm-replay-policy",
      policy_version: "v1",
    },
  };

  assert.equal(request.replay_reference.prompt_reference.prompt_version, "v3");
  assert.equal(request.replay_reference.execution_record.record_id, "record-1");
  assert.equal(request.replay_reference.artifact_reference.artifact_id, "artifact-1");
});

test("ReplayDecision model separates replay, regeneration, and failure", () => {
  const replay: ReplayDecision = {
    decision_type: "replay",
    replay_reference: replayReference(),
    policy_metadata: policyMetadata(),
  };
  const regenerate: ReplayDecision = {
    decision_type: "regenerate",
    regeneration_request: {
      replay_reference: replayReference(),
      reason: "Operator requested new governed execution.",
      policy_metadata: policyMetadata(),
    },
    policy_metadata: policyMetadata(),
  };
  const failure: ReplayDecision = {
    decision_type: "fail",
    failure: {
      failure_code: "REPLAY_REFERENCE_MISSING",
      message: "Replay reference is incomplete.",
      retryable: false,
    },
    policy_metadata: policyMetadata(),
  };

  assert.equal(replay.decision_type, "replay");
  assert.equal(regenerate.decision_type, "regenerate");
  assert.equal(failure.decision_type, "fail");
});

test("ReplayResult model does not imply execution behavior", () => {
  const result: ReplayResult = {
    status: "replayed",
    replay_reference: replayReference(),
    policy_metadata: policyMetadata(),
  };

  assert.equal(result.status, "replayed");
  assert.equal(result.replay_reference.model.model_version, "model-v1");
});

function replayReference(): ReplayReference {
  return {
    artifact_reference: {
      artifact_id: "artifact-1",
      artifact_type: "structured_intelligence",
      version: 1,
      artifact_hash: "artifact-hash-1",
      input_hash: "input-hash-1",
    },
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

function policyMetadata() {
  return {
    policy_id: "llm-replay-policy",
    policy_version: "v1",
  };
}
