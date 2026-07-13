import assert from "node:assert/strict";
import test from "node:test";
import {
  PROMPT_FRAMEWORK_CONTRACT_VERSION,
  PROMPT_FRAMEWORK_MODELS_CONTRACT_VERSION,
  PROMPT_UNIT_STATUSES,
  type PromptAssemblyResult,
  type PromptPlan,
  type PromptUnitResult,
} from "../../packages/prompt-framework/src/index.js";

test("Prompt Framework contracts expose stable model versions", () => {
  assert.equal(PROMPT_FRAMEWORK_CONTRACT_VERSION, "prompt-framework-v1");
  assert.equal(
    PROMPT_FRAMEWORK_MODELS_CONTRACT_VERSION,
    "prompt-framework-models-v1",
  );
  assert.deepEqual(PROMPT_UNIT_STATUSES, ["succeeded", "failed"]);
});

test("Prompt Framework models represent a deterministic prompt plan", () => {
  const plan: PromptPlan = {
    plan_id: "structured-intelligence",
    plan_version: "v1",
    execution_graph: {
      units: [
        {
          unit_id: "business-model",
          prompt_id: "structured-intelligence.business-model",
          required: true,
          expected_output_schema_id: "business-model-v1",
        },
      ],
      dependencies: [],
      execution_order: {
        unit_ids: ["business-model"],
      },
    },
    assembly: {
      assembly_id: "structured-intelligence-assembly",
      required_unit_ids: ["business-model"],
      output_schema_id: "structured-intelligence-v1",
    },
  };

  assert.equal(plan.execution_graph.execution_order.unit_ids[0], "business-model");
  assert.equal(plan.assembly.required_unit_ids[0], "business-model");
});

test("Prompt Framework result models remain atomic", () => {
  const unitResult: PromptUnitResult<{ summary: string }> = {
    unit_id: "business-model",
    status: "succeeded",
    output: {
      summary: "Filing-scoped business description.",
    },
    validation: {
      valid: true,
      issues: [],
    },
  };

  const assemblyResult: PromptAssemblyResult<{ business_model: string }> = {
    status: "succeeded",
    output: {
      business_model: "Filing-scoped business description.",
    },
    unit_results: [unitResult],
    validation: {
      valid: true,
      issues: [],
    },
  };

  assert.equal(assemblyResult.status, "succeeded");
  assert.equal(assemblyResult.unit_results.length, 1);
});
