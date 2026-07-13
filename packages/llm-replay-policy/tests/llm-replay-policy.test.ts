import assert from "node:assert/strict";
import test from "node:test";
import type {
  LLMExecutionRecord,
} from "../../../contracts/execution/llm-execution-record.js";
import type {
  ReplayRequest,
} from "../../../contracts/execution/llm-replay-policy-models.js";
import {
  DeterministicReplayDecisionEngine,
  DeterministicReplayPolicy,
  DeterministicReplayRequestValidator,
  DeterministicReplayResultFactory,
} from "../src/index.js";

test("DeterministicReplayRequestValidator validates replay prerequisites", () => {
  const validation = new DeterministicReplayRequestValidator().validate(
    replayRequest("REPLAY"),
  );

  assert.equal(validation.valid, true);
  assert.deepEqual(validation.issues, []);
});

test("DeterministicReplayRequestValidator reports deterministic validation failures", () => {
  const request = replayRequest("REPLAY");
  request.replay_reference.prompt_reference.prompt_version = "wrong-version";

  const validation = new DeterministicReplayRequestValidator().validate(request);

  assert.equal(validation.valid, false);
  assert.ok(validation.issues.some((issue) =>
    issue.code === "prompt_version_mismatch"
  ));
});

test("DeterministicReplayDecisionEngine returns replay decisions for valid replay requests", async () => {
  const decision = await new DeterministicReplayDecisionEngine().decide(
    replayRequest("REPLAY"),
  );

  assert.equal(decision.decision_type, "replay");
  if (decision.decision_type === "replay") {
    assert.equal(decision.replay_reference.execution_record.record_id, "record-1");
  }
});

test("DeterministicReplayDecisionEngine returns regeneration decisions for regeneration requests", async () => {
  const decision = await new DeterministicReplayDecisionEngine().decide(
    replayRequest("REGENERATION"),
  );

  assert.equal(decision.decision_type, "regenerate");
  if (decision.decision_type === "regenerate") {
    assert.equal(
      decision.regeneration_request.reason,
      "Replay request mode requires a new governed execution.",
    );
  }
});

test("DeterministicReplayDecisionEngine returns failure decisions for invalid requests", async () => {
  const request = replayRequest("REPLAY");
  request.replay_reference.execution_context.execution_id = "different-execution";

  const decision = await new DeterministicReplayDecisionEngine().decide(request);

  assert.equal(decision.decision_type, "fail");
  if (decision.decision_type === "fail") {
    assert.equal(decision.failure.failure_code, "REPLAY_REQUEST_INVALID");
    assert.equal(decision.failure.retryable, false);
  }
});

test("DeterministicReplayPolicy delegates deterministic decisions", async () => {
  const decision = await new DeterministicReplayPolicy().evaluate(
    replayRequest("REPLAY"),
  );

  assert.equal(decision.decision_type, "replay");
});

test("DeterministicReplayResultFactory projects decisions without execution", async () => {
  const decision = await new DeterministicReplayDecisionEngine().decide(
    replayRequest("REGENERATION"),
  );
  const result = new DeterministicReplayResultFactory().createResult(decision);

  assert.equal(result.status, "regeneration_required");
});

function replayRequest(
  replayMode: ReplayRequest["replay_mode"],
): ReplayRequest {
  return {
    replay_mode: replayMode,
    replay_reference: {
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
    },
    policy_metadata: {
      policy_id: "llm-replay-policy",
      policy_version: "v1",
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
