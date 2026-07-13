import assert from "node:assert/strict";
import test from "node:test";
import {
  PROMPT_LIFECYCLE_STATES,
  PROMPT_REGISTRY_CONTRACT_VERSION,
  PROMPT_REGISTRY_MODELS_CONTRACT_VERSION,
  type PromptPackage,
  type PromptReplayReference,
  type PromptResolutionRequest,
  type PromptResolutionResult,
} from "../../packages/prompt-registry/src/index.js";

test("Prompt Registry contracts expose stable versions and lifecycle states", () => {
  assert.equal(PROMPT_REGISTRY_CONTRACT_VERSION, "prompt-registry-v1");
  assert.equal(
    PROMPT_REGISTRY_MODELS_CONTRACT_VERSION,
    "prompt-registry-models-v1",
  );
  assert.deepEqual(PROMPT_LIFECYCLE_STATES, [
    "draft",
    "review",
    "approved",
    "active",
    "deprecated",
    "retired",
  ]);
});

test("PromptPackage model represents one governed immutable package version", () => {
  const promptPackage: PromptPackage = {
    identity: {
      prompt_id: "structured-intelligence.business-model",
      prompt_version: "v1",
    },
    lifecycle_state: "active",
    system_prompt_template: "System prompt template.",
    user_prompt_template_id: "structured-intelligence.business-model.user-v1",
    expected_output_schema_id: "business-model-output-v1",
    source: "filesystem",
    content_hash: "hash-1",
    version_lineage: {
      previous_prompt_version: null,
      change_reason: "Initial governed prompt package.",
    },
  };

  assert.equal(promptPackage.identity.prompt_version, "v1");
  assert.equal(promptPackage.lifecycle_state, "active");
});

test("Prompt resolution models separate request, result, and replay reference", () => {
  const request: PromptResolutionRequest = {
    prompt_id: "structured-intelligence.business-model",
  };
  const replayReference: PromptReplayReference = {
    prompt_id: "structured-intelligence.business-model",
    prompt_version: "v1",
    activation_id: "activation-1",
    content_hash: "hash-1",
  };
  const result: PromptResolutionResult = {
    prompt_package: {
      identity: {
        prompt_id: replayReference.prompt_id,
        prompt_version: replayReference.prompt_version,
      },
      lifecycle_state: "active",
      system_prompt_template: "System prompt template.",
      user_prompt_template_id: "structured-intelligence.business-model.user-v1",
      expected_output_schema_id: "business-model-output-v1",
      source: "filesystem",
      content_hash: replayReference.content_hash,
      version_lineage: {
        previous_prompt_version: null,
        change_reason: "Initial governed prompt package.",
      },
    },
    activation: {
      prompt_id: replayReference.prompt_id,
      active_prompt_version: replayReference.prompt_version,
      activation_id: "activation-1",
    },
    replay_reference: replayReference,
  };

  assert.equal(request.prompt_version, undefined);
  assert.equal(result.replay_reference.prompt_version, "v1");
  assert.equal(result.activation?.active_prompt_version, "v1");
});
