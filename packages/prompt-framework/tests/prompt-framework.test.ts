import assert from "node:assert/strict";
import test from "node:test";
import type {
  PromptPlan,
  PromptUnitId,
  PromptUnitResult,
} from "../../../contracts/execution/prompt-framework-models.js";
import type {
  PromptUnitExecutor,
} from "../../../contracts/execution/prompt-framework-contract.js";
import {
  buildPromptExecutionPlan,
  FrameworkPromptValidator,
  PromptFrameworkOrchestrationError,
  PromptPlanOrchestrator,
} from "../src/index.js";

test("buildPromptExecutionPlan preserves deterministic declared order", () => {
  const executionPlan = buildPromptExecutionPlan(validPlan());

  assert.deepEqual(
    executionPlan.steps.map((step) => step.unit_id),
    ["business-model", "revenue-model", "risks"],
  );
  assert.deepEqual(
    executionPlan.steps[1]?.dependency_unit_ids,
    ["business-model"],
  );
});

test("FrameworkPromptValidator rejects duplicate Prompt Units", () => {
  const duplicateUnit = {
    unit_id: "business-model",
    prompt_id: "structured-intelligence.business-model",
    required: true,
    expected_output_schema_id: "business-model-v1",
  };
  const plan = validPlan({
    units: [
      duplicateUnit,
      duplicateUnit,
    ],
    executionOrder: ["business-model", "business-model"],
  });

  const validation = new FrameworkPromptValidator().validatePlan(plan);

  assert.equal(validation.valid, false);
  assert.ok(validation.issues.some((issue) => issue.code === "duplicate_unit"));
});

test("FrameworkPromptValidator rejects dependency order violations", () => {
  const plan = validPlan({
    executionOrder: ["revenue-model", "business-model", "risks"],
  });

  const validation = new FrameworkPromptValidator().validatePlan(plan);

  assert.equal(validation.valid, false);
  assert.ok(validation.issues.some((issue) =>
    issue.code === "dependency_order_violation"
  ));
});

test("FrameworkPromptValidator rejects required units missing from assembly", () => {
  const plan = validPlan();
  const validation = new FrameworkPromptValidator().validatePlan({
    ...plan,
    assembly: {
      ...plan.assembly,
      required_unit_ids: ["business-model"],
    },
  });

  assert.equal(validation.valid, false);
  assert.ok(validation.issues.some((issue) =>
    issue.code === "required_unit_missing_from_assembly"
  ));
});

test("PromptPlanOrchestrator coordinates Prompt Unit execution in order", async () => {
  const observedUnitIds: PromptUnitId[] = [];
  const orchestrator = new PromptPlanOrchestrator(
    executorRegistry((unitId) => {
      observedUnitIds.push(unitId);
      return succeededUnitResult(unitId);
    }),
  );

  const result = await orchestrator.executePlan(validPlan());

  assert.equal(result.completed, true);
  assert.deepEqual(observedUnitIds, [
    "business-model",
    "revenue-model",
    "risks",
  ]);
  assert.deepEqual(
    result.unit_results.map((unitResult) => unitResult.unit_id),
    observedUnitIds,
  );
});

test("PromptPlanOrchestrator stops when a required Prompt Unit fails", async () => {
  const observedUnitIds: PromptUnitId[] = [];
  const orchestrator = new PromptPlanOrchestrator(
    executorRegistry((unitId) => {
      observedUnitIds.push(unitId);
      return unitId === "revenue-model"
        ? failedUnitResult(unitId)
        : succeededUnitResult(unitId);
    }),
  );

  const result = await orchestrator.executePlan(validPlan());

  assert.equal(result.completed, false);
  assert.deepEqual(observedUnitIds, ["business-model", "revenue-model"]);
  assert.equal(result.unit_results.length, 2);
  assert.ok(result.validation.issues.some((issue) =>
    issue.code === "required_unit_failed"
  ));
});

test("PromptPlanOrchestrator rejects missing Prompt Unit executors", async () => {
  const orchestrator = new PromptPlanOrchestrator(new Map());

  await assert.rejects(
    () => orchestrator.executePlan(validPlan()),
    PromptFrameworkOrchestrationError,
  );
});

type PlanOverrides = {
  units?: PromptPlan["execution_graph"]["units"];
  dependencies?: PromptPlan["execution_graph"]["dependencies"];
  executionOrder?: readonly PromptUnitId[];
};

function validPlan(overrides: PlanOverrides = {}): PromptPlan {
  const units = overrides.units ?? [
    {
      unit_id: "business-model",
      prompt_id: "structured-intelligence.business-model",
      required: true,
      expected_output_schema_id: "business-model-v1",
    },
    {
      unit_id: "revenue-model",
      prompt_id: "structured-intelligence.revenue-model",
      required: true,
      expected_output_schema_id: "revenue-model-v1",
    },
    {
      unit_id: "risks",
      prompt_id: "structured-intelligence.risks",
      required: false,
      expected_output_schema_id: "risks-v1",
    },
  ];

  return {
    plan_id: "structured-intelligence",
    plan_version: "v1",
    execution_graph: {
      units,
      dependencies: overrides.dependencies ?? [
        {
          unit_id: "revenue-model",
          depends_on_unit_id: "business-model",
        },
        {
          unit_id: "risks",
          depends_on_unit_id: "business-model",
        },
      ],
      execution_order: {
        unit_ids: overrides.executionOrder ?? [
          "business-model",
          "revenue-model",
          "risks",
        ],
      },
    },
    assembly: {
      assembly_id: "structured-intelligence-assembly",
      required_unit_ids: ["business-model", "revenue-model"],
      output_schema_id: "structured-intelligence-v1",
    },
  };
}

function executorRegistry(
  execute: (unitId: PromptUnitId) => PromptUnitResult<unknown>,
): ReadonlyMap<PromptUnitId, PromptUnitExecutor<unknown>> {
  const registry = new Map<PromptUnitId, PromptUnitExecutor<unknown>>();

  for (const unitId of ["business-model", "revenue-model", "risks"]) {
    registry.set(unitId, {
      executeUnit: async () => execute(unitId),
    });
  }

  return registry;
}

function succeededUnitResult(unitId: PromptUnitId): PromptUnitResult<unknown> {
  return {
    unit_id: unitId,
    status: "succeeded",
    output: {
      unit_id: unitId,
    },
    validation: {
      valid: true,
      issues: [],
    },
  };
}

function failedUnitResult(unitId: PromptUnitId): PromptUnitResult<unknown> {
  return {
    unit_id: unitId,
    status: "failed",
    error: {
      code: "UNIT_FAILED",
      message: "Prompt unit failed.",
    },
    validation: {
      valid: false,
      issues: [
        {
          code: "unit_failed",
          message: "Prompt unit failed.",
          unit_id: unitId,
        },
      ],
    },
  };
}
