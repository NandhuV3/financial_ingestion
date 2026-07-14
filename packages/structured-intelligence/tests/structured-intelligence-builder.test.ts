import assert from "node:assert/strict";
import test from "node:test";
import type {
  Artifact,
} from "../../../contracts/artifacts/artifact.js";
import {
  ArtifactStatus,
} from "../../../contracts/artifacts/artifact-status.js";
import type {
  PromptFramework,
} from "../../../contracts/execution/prompt-framework-contract.js";
import type {
  PromptAssemblyResult,
  PromptPlan,
} from "../../../contracts/execution/prompt-framework-models.js";
import type {
  StructuredIntelligenceInput,
  StructuredIntelligencePayload,
} from "../../../contracts/company-intelligence/structured-intelligence-models.js";
import type {
  BuilderContext,
} from "../../builder-framework/src/builder-context.js";
import {
  BuilderExecutionError,
  BuilderValidationError,
} from "../../builder-framework/src/builder-errors.js";
import {
  GovernedStructuredIntelligenceBuilder,
  STRUCTURED_INTELLIGENCE_BUILDER_TYPE,
  type StructuredIntelligencePromptPlanResolver,
} from "../src/index.js";

test("GovernedStructuredIntelligenceBuilder validates required input references", async () => {
  const builder = newBuilder();
  const invalidInput: StructuredIntelligenceInput = {
    ...input(),
    inputs: {
      ...input().inputs,
      filing_artifact: {
        ...input().inputs.filing_artifact,
        artifact_id: "",
      },
    },
  };

  await assert.rejects(
    () => builder.validateInput(invalidInput),
    BuilderValidationError,
  );
});

test("GovernedStructuredIntelligenceBuilder resolves Prompt Plan and invokes Prompt Framework", async () => {
  const resolver = new RecordingPromptPlanResolver(promptPlan());
  const promptFramework = new RecordingPromptFramework(succeededAssembly());
  const builder = newBuilder({
    resolver,
    promptFramework,
  });

  const result = await builder.execute(builderContext());

  assert.equal(builder.builderType(), STRUCTURED_INTELLIGENCE_BUILDER_TYPE);
  assert.equal(resolver.callCount, 1);
  assert.equal(promptFramework.callCount, 1);
  assert.equal(promptFramework.planIds[0], "structured-intelligence");
  assert.equal(result.content.artifact_type, "structured_intelligence");
  assert.equal(result.content.metadata.status, "partial");
});

test("GovernedStructuredIntelligenceBuilder preserves governed output evidence", async () => {
  const payload = structuredPayload();
  const builder = newBuilder({
    promptFramework: new RecordingPromptFramework(succeededAssembly(payload)),
  });

  const result = await builder.execute(builderContext());

  assert.deepEqual(
    result.content.payload.business_model?.evidence,
    payload.business_model?.evidence,
  );
  assert.equal(
    result.content.metadata.evidence_summary.evidence_reference_count,
    1,
  );
  assert.equal(result.content.metadata.evidence_summary.theme_reference_count, 1);
});

test("GovernedStructuredIntelligenceBuilder rejects forbidden dependencies", async () => {
  const builder = newBuilder();
  const context = builderContext({
    dependencies: {
      ...dependencies(),
      topic_assignment: artifact("topic-assignment-1", "topic_assignment", {}),
    },
  });

  await assert.rejects(
    () => builder.execute(context),
    BuilderValidationError,
  );
});

test("GovernedStructuredIntelligenceBuilder rejects failed Prompt Framework output", async () => {
  const builder = newBuilder({
    promptFramework: new RecordingPromptFramework({
      status: "failed",
      unit_results: [],
      validation: {
        valid: false,
        issues: [
          {
            code: "required_unit_failed",
            message: "Required prompt unit failed.",
          },
        ],
      },
    }),
  });

  await assert.rejects(
    () => builder.execute(builderContext()),
    BuilderExecutionError,
  );
});

test("GovernedStructuredIntelligenceBuilder rejects incomplete governed payloads", async () => {
  const builder = newBuilder({
    promptFramework: new RecordingPromptFramework(succeededAssembly({
      ...structuredPayload(),
      products: [
        {
          product_name: "Cloud",
          description: "Cloud services.",
          importance: "high",
          confidence: 0.8,
          evidence: [],
        },
      ],
    })),
  });

  await assert.rejects(
    () => builder.execute(builderContext()),
    BuilderValidationError,
  );
});

class RecordingPromptPlanResolver
  implements StructuredIntelligencePromptPlanResolver {
  callCount = 0;

  constructor(private readonly plan: PromptPlan) {}

  async resolveStructuredIntelligencePromptPlan(
    _input: StructuredIntelligenceInput,
  ): Promise<PromptPlan> {
    this.callCount += 1;
    return this.plan;
  }
}

class RecordingPromptFramework
  implements PromptFramework<StructuredIntelligencePayload> {
  callCount = 0;
  readonly planIds: string[] = [];

  constructor(
    private readonly result: PromptAssemblyResult<StructuredIntelligencePayload>,
  ) {}

  async execute(
    plan: PromptPlan,
  ): Promise<PromptAssemblyResult<StructuredIntelligencePayload>> {
    this.callCount += 1;
    this.planIds.push(plan.plan_id);
    return this.result;
  }
}

function newBuilder(overrides: {
  resolver?: StructuredIntelligencePromptPlanResolver;
  promptFramework?: PromptFramework<StructuredIntelligencePayload>;
} = {}) {
  return new GovernedStructuredIntelligenceBuilder({
    promptPlanResolver: overrides.resolver
      ?? new RecordingPromptPlanResolver(promptPlan()),
    promptFramework: overrides.promptFramework
      ?? new RecordingPromptFramework(succeededAssembly()),
  });
}

function builderContext(overrides: {
  input?: StructuredIntelligenceInput;
  dependencies?: Record<string, Artifact<unknown>>;
} = {}): BuilderContext<StructuredIntelligenceInput> {
  return {
    companyId: "MSFT",
    periodId: "2026-Q3",
    executionId: "execution-1",
    input: overrides.input ?? input(),
    dependencies: overrides.dependencies ?? dependencies(),
    recordPromptReference() {
      return undefined;
    },
    recordModelReference() {
      return undefined;
    },
  };
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

function dependencies(): Record<string, Artifact<unknown>> {
  return {
    filing: artifact("filing-artifact-1", "filing", {
      filing_id: "filing-1",
      filing_type: "10-Q",
      filing_content: "Business filing content.",
      filing_hash: "filing-hash",
      filing_period: "2026-Q3",
    }),
    themes: artifact("themes-artifact-1", "themes", {
      company_id: "MSFT",
      period_id: "2026-Q3",
      filing_id: "filing-1",
      themes: [
        {
          theme_id: "theme-1",
          title: "Cloud revenue",
          summary: "The filing discusses cloud revenue.",
          category: "product",
          evidence: [
            {
              evidence_ref: "evidence-1",
            },
          ],
          evidence_count: 1,
        },
      ],
    }),
  };
}

function artifact(
  artifactId: string,
  artifactType: Artifact<unknown>["identity"]["artifact_type"],
  content: unknown,
): Artifact<unknown> {
  const hashes = artifactHashes(artifactId);

  return {
    identity: {
      artifact_id: artifactId,
      artifact_type: artifactType,
      company_id: "MSFT",
      period_id: "2026-Q3",
      version: 1,
    },
    metadata: {
      version: 1,
      schema_version: `${artifactType}-schema-v1`,
      pipeline_version: `${artifactType}-pipeline-v1`,
      generated_at: "2026-07-14T00:00:00.000Z",
      artifact_hash: hashes.artifactHash,
      input_hash: hashes.inputHash,
      generation_duration_ms: 0,
      status: ArtifactStatus.ACTIVE,
    },
    lineage: {
      upstream_dependencies: [],
      generation_context: {
        builder_type: `${artifactType}-builder`,
        execution_id: `${artifactType}-execution-1`,
      },
    },
    content,
  };
}

function artifactHashes(artifactId: string) {
  if (artifactId === "filing-artifact-1") {
    return {
      artifactHash: "filing-artifact-hash",
      inputHash: "filing-input-hash",
    };
  }

  if (artifactId === "themes-artifact-1") {
    return {
      artifactHash: "themes-artifact-hash",
      inputHash: "themes-input-hash",
    };
  }

  return {
    artifactHash: `${artifactId}-hash`,
    inputHash: `${artifactId}-input-hash`,
  };
}

function promptPlan(): PromptPlan {
  return {
    plan_id: "structured-intelligence",
    plan_version: "v1",
    execution_graph: {
      units: [
        {
          unit_id: "business-model",
          prompt_id: "structured-intelligence.business-model",
          required: true,
          expected_output_schema_id: "structured-intelligence-v1",
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
}

function succeededAssembly(
  payload: StructuredIntelligencePayload = structuredPayload(),
): PromptAssemblyResult<StructuredIntelligencePayload> {
  return {
    status: "succeeded",
    output: payload,
    unit_results: [],
    validation: {
      valid: true,
      issues: [],
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
