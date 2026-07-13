import assert from "node:assert/strict";
import test from "node:test";
import type {
  ExecutionContextReference,
  ExecutionRequest,
  ExecutionResult,
} from "../../../contracts/execution/llm-execution-models.js";
import type {
  LLMPromptPackage,
} from "../../../contracts/execution/llm-prompt-package.js";
import type {
  ExecutionService,
} from "../../../contracts/execution/llm-execution-framework-contract.js";
import type {
  LLMExecutionRecord,
} from "../../../contracts/execution/llm-execution-record.js";
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
  DeterministicPromptAssembly,
  FrameworkPromptValidator,
  GovernedPromptFramework,
  LLMExecutionPromptUnitExecutor,
  PromptFrameworkOrchestrationError,
  type PromptPackageResolver,
  type PromptUnitExecutionInputs,
  PromptPlanOrchestrator,
} from "../src/index.js";
import {
  createLLMExecutionRecord,
  IntegratedLLMExecutionService,
  type LLMExecutionReplayDecision,
} from "../../llm-execution-framework/src/index.js";

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

test("DeterministicPromptAssembly combines unit output fields in execution order", async () => {
  const assembly = new DeterministicPromptAssembly();
  const result = await assembly.assemble(validPlan(), [
    succeededUnitResult("business-model", {
      business_model: "Subscription software.",
    }),
    succeededUnitResult("revenue-model", {
      revenue_model: "Cloud services revenue.",
    }),
    succeededUnitResult("risks", {
      risks: ["Competition"],
    }),
  ]);

  assert.equal(result.status, "succeeded");
  if (result.status === "succeeded") {
    assert.deepEqual(Object.keys(result.output), [
      "business_model",
      "revenue_model",
      "risks",
    ]);
  }
});

test("DeterministicPromptAssembly rejects duplicate output fields", async () => {
  const assembly = new DeterministicPromptAssembly();
  const result = await assembly.assemble(validPlan(), [
    succeededUnitResult("business-model", {
      shared: "business model",
    }),
    succeededUnitResult("revenue-model", {
      shared: "revenue model",
    }),
  ]);

  assert.equal(result.status, "failed");
  assert.ok(result.validation.issues.some((issue) =>
    issue.code === "duplicate_output_field"
  ));
});

test("GovernedPromptFramework coordinates orchestration and assembly", async () => {
  const orchestrator = new PromptPlanOrchestrator(
    executorRegistry((unitId) => succeededUnitResult(unitId, {
      [fieldName(unitId)]: unitId,
    })),
  );
  const framework = new GovernedPromptFramework(
    orchestrator,
    new DeterministicPromptAssembly(),
  );

  const result = await framework.execute(validPlan());

  assert.equal(result.status, "succeeded");
  if (result.status === "succeeded") {
    assert.equal(result.output.business_model, "business-model");
    assert.equal(result.output.revenue_model, "revenue-model");
  }
});

test("LLMExecutionPromptUnitExecutor resolves active prompt packages and delegates execution", async () => {
  const resolver = new RecordingPromptPackageResolver();
  const executionService = new RecordingExecutionService();
  const executor = new LLMExecutionPromptUnitExecutor(
    resolver,
    integratedExecutionService(executionService),
    promptUnitExecutionInputs({
      executionMode: "ORIGINAL_EXECUTION",
      replayDecision: {
        execution_mode: "ORIGINAL_EXECUTION",
      },
    }),
  );

  const result = await executor.executeUnit(validPlan(), "business-model");

  assert.equal(result.status, "succeeded");
  assert.equal(resolver.calls[0]?.promptId, "structured-intelligence.business-model");
  assert.equal(resolver.calls[0]?.version, undefined);
  assert.equal(executionService.callCount, 1);
});

test("LLMExecutionPromptUnitExecutor replays original prompt version without invoking execution", async () => {
  const promptPackage = promptPackageFor("structured-intelligence.business-model", "v3");
  const originalResult: ExecutionResult<Record<string, unknown>> = {
    status: "succeeded",
    output: {
      business_model: "Subscription software.",
    },
    metadata: executionMetadata({
      executionMode: "ORIGINAL_EXECUTION",
      promptId: promptPackage.prompt_id,
      promptVersion: promptPackage.prompt_version,
    }),
  };
  const originalRecord = createLLMExecutionRecord({
    prompt_package: promptPackage,
    result: originalResult,
  });
  const resolver = new RecordingPromptPackageResolver();
  const executionService = new FailingExecutionService();
  const executor = new LLMExecutionPromptUnitExecutor(
    resolver,
    integratedExecutionService(executionService),
    promptUnitExecutionInputs({
      executionMode: "REPLAY",
      replayDecision: {
        execution_mode: "REPLAY",
        original_result: originalResult,
        original_execution_record: originalRecord,
      },
    }),
  );

  const result = await executor.executeUnit(validPlan(), "business-model");

  assert.equal(result.status, "succeeded");
  assert.equal(executionService.callCount, 0);
  assert.equal(resolver.calls[0]?.version, "v3");
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

function succeededUnitResult(
  unitId: PromptUnitId,
  output: Record<string, unknown> = {
    unit_id: unitId,
  },
): PromptUnitResult<unknown> {
  return {
    unit_id: unitId,
    status: "succeeded",
    output,
    validation: {
      valid: true,
      issues: [],
    },
  };
}

function fieldName(unitId: PromptUnitId): string {
  return unitId.replace(/-/g, "_");
}

class RecordingPromptPackageResolver implements PromptPackageResolver {
  readonly calls: Array<{
    promptId: string;
    context: unknown;
    version?: string;
  }> = [];

  render<TContext>(
    promptId: string,
    context: TContext,
    version?: string,
  ): LLMPromptPackage {
    this.calls.push({
      promptId,
      context,
      version,
    });

    return promptPackageFor(promptId, version ?? "active-v1");
  }
}

class RecordingExecutionService implements ExecutionService<
  ExecutionRequest<
    LLMPromptPackage,
    ExecutionContextReference,
    TestProviderConfiguration
  >,
  ExecutionResult<Record<string, unknown>>
> {
  callCount = 0;

  async execute(
    request: ExecutionRequest<
      LLMPromptPackage,
      ExecutionContextReference,
      TestProviderConfiguration
    >,
  ): Promise<ExecutionResult<Record<string, unknown>>> {
    this.callCount += 1;

    return {
      status: "succeeded",
      output: {
        business_model: request.prompt_package.prompt_id,
      },
      metadata: executionMetadata({
        executionMode: request.execution_context.execution_mode,
        promptId: request.prompt_package.prompt_id,
        promptVersion: request.prompt_package.prompt_version,
      }),
    };
  }
}

class FailingExecutionService implements ExecutionService<
  ExecutionRequest<
    LLMPromptPackage,
    ExecutionContextReference,
    TestProviderConfiguration
  >,
  ExecutionResult<Record<string, unknown>>
> {
  callCount = 0;

  async execute(): Promise<ExecutionResult<Record<string, unknown>>> {
    this.callCount += 1;
    throw new Error("Execution service must not be invoked during replay.");
  }
}

type TestProviderConfiguration = {
  model_id: string;
  model_version: string;
  provider_id: string;
};

function integratedExecutionService(
  executionService: ExecutionService<
    ExecutionRequest<
      LLMPromptPackage,
      ExecutionContextReference,
      TestProviderConfiguration
    >,
    ExecutionResult<Record<string, unknown>>
  >,
): IntegratedLLMExecutionService<
  ExecutionContextReference,
  TestProviderConfiguration,
  Record<string, unknown>
> {
  return new IntegratedLLMExecutionService(executionService, {
    record: async (record: LLMExecutionRecord) => record,
  });
}

function promptUnitExecutionInputs(input: {
  executionMode: ExecutionContextReference["execution_mode"];
  replayDecision: LLMExecutionReplayDecision<Record<string, unknown>>;
}): PromptUnitExecutionInputs<
  ExecutionContextReference,
  TestProviderConfiguration,
  Record<string, unknown>
> {
  return {
    unit_contexts: new Map<PromptUnitId, unknown>([
      ["business-model", {
        filing_id: "filing-1",
      }],
    ]),
    execution_contexts: new Map<PromptUnitId, ExecutionContextReference>([
      ["business-model", {
        execution_id: "execution-1",
        execution_mode: input.executionMode,
        producer: "prompt-framework-test",
        generated_at: "2026-07-13T00:00:00.000Z",
      }],
    ]),
    provider_configurations: new Map<PromptUnitId, TestProviderConfiguration>([
      ["business-model", {
        model_id: "test-model",
        model_version: "test-model-v1",
        provider_id: "test-provider",
      }],
    ]),
    replay_decisions: new Map([
      ["business-model", input.replayDecision],
    ]),
  };
}

function promptPackageFor(
  promptId: string,
  promptVersion: string,
): LLMPromptPackage {
  return {
    prompt_id: promptId,
    prompt_version: promptVersion,
    activation_id: "activation-1",
    system_prompt: "System prompt.",
    user_prompt: "User prompt.",
    render_hash: `render-hash:${promptId}:${promptVersion}`,
    source: "filesystem",
  };
}

function executionMetadata(input: {
  executionMode: ExecutionContextReference["execution_mode"];
  promptId: string;
  promptVersion: string;
}) {
  return {
    execution_id: "execution-1",
    execution_mode: input.executionMode,
    producer: "prompt-framework-test",
    generated_at: "2026-07-13T00:00:00.000Z",
    prompt_id: input.promptId,
    prompt_version: input.promptVersion,
    model_id: "test-model",
    model_version: "test-model-v1",
    provider_id: "test-provider",
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
