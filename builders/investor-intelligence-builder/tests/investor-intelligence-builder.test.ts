import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ResolvedPrompt } from "../../../src/prompt-registry/prompt.types.js";
import type { ArtifactRepository } from "../../../packages/artifact-framework/src/artifact-repository.js";
import { ArtifactService } from "../../../packages/artifact-framework/src/artifact-service.js";
import { BuilderExecutor } from "../../../packages/builder-framework/src/builder-executor.js";
import { BuilderDependencyError, BuilderValidationError } from "../../../packages/builder-framework/src/builder-errors.js";
import { BuilderRegistry } from "../../../packages/builder-framework/src/builder-registry.js";
import type { LLMClient, LLMRequest } from "../../../packages/llm-framework/src/llm-client.js";
import { InvestorIntelligenceBuilder } from "../builder.js";
import {
  buildInvestorConfidence,
  confidenceLevelFromCompanyKnowledgeScore,
} from "../confidence.js";
import {
  INVESTOR_COMPANY_KNOWLEDGE_HIGH_CONFIDENCE_MIN,
  INVESTOR_CONFIDENCE_CALIBRATION,
  INVESTOR_CONFIDENCE_LEVEL_SCORE_HIGH,
  INVESTOR_CONFIDENCE_LEVEL_SCORE_LOW,
  INVESTOR_CONFIDENCE_LEVEL_SCORE_MEDIUM,
} from "../confidence-contract.js";
import {
  INVESTOR_INTELLIGENCE_BUILDER_TYPE,
  INVESTOR_INTELLIGENCE_BUILDER_VERSION,
  INVESTOR_INTELLIGENCE_MODEL_VERSION,
  INVESTOR_INTELLIGENCE_PIPELINE_VERSION,
  INVESTOR_INTELLIGENCE_SCHEMA_VERSION,
  INVESTOR_Q1_PROMPT_ID,
  INVESTOR_Q2_PROMPT_ID,
  INVESTOR_Q3_PROMPT_ID,
  INVESTOR_Q4_PROMPT_ID,
  INVESTOR_Q5_PROMPT_ID,
} from "../contract.js";
import type {
  InvestorIntelligenceArtifactContent,
  InvestorIntelligenceBuilderInput,
  Q1PromptOutput,
  Q2PromptOutput,
  Q3PromptOutput,
  Q4PromptOutput,
  Q5PromptOutput,
} from "../types.js";
import { validateInvestorIntelligenceArtifactContent } from "../validator.js";
import {
  artifact,
  businessSignals,
  commitmentTracking,
  companyKnowledge,
  input,
  quarterUnderstandingBase,
  quarterUnderstandingWithTrust,
  TestArtifactRepository,
  topicEvolution,
  trustSignals,
} from "./investor-intelligence-builder.fixtures.js";

describe("investor intelligence builder", () => {
  it("orchestrates Prompt Registry resolution and LLM execution for Q1-Q5", async () => {
    const harness = buildHarness();
    const result = await harness.executor.executeBuilder<InvestorIntelligenceBuilderInput, InvestorIntelligenceArtifactContent>({
      builderType: INVESTOR_INTELLIGENCE_BUILDER_TYPE,
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "investor-intelligence-base",
      input: input(),
      inputHash: "investor-intelligence-input-hash",
      dependencies: {
        company_knowledge: companyKnowledge(),
        quarter_understanding: quarterUnderstandingBase(),
      },
      generatedAt: "2026-06-15T00:00:00.000Z",
    });

    assert.equal(result.identity.artifact_type, "investor_intelligence");
    assert.equal(result.metadata.schema_version, INVESTOR_INTELLIGENCE_SCHEMA_VERSION);
    assert.equal(result.metadata.pipeline_version, INVESTOR_INTELLIGENCE_PIPELINE_VERSION);
    assert.deepEqual(harness.resolvedPromptIds, [
      INVESTOR_Q1_PROMPT_ID,
      INVESTOR_Q2_PROMPT_ID,
      INVESTOR_Q3_PROMPT_ID,
      INVESTOR_Q4_PROMPT_ID,
      INVESTOR_Q5_PROMPT_ID,
    ]);
    assert.equal(harness.llm.requests.length, 5);
    assert.deepEqual(harness.llm.requests.map((request) => request.temperature), [0, 0, 0, 0, 0]);
    assert.deepEqual(harness.llm.requests.map((request) => request.model), [
      INVESTOR_INTELLIGENCE_MODEL_VERSION,
      INVESTOR_INTELLIGENCE_MODEL_VERSION,
      INVESTOR_INTELLIGENCE_MODEL_VERSION,
      INVESTOR_INTELLIGENCE_MODEL_VERSION,
      INVESTOR_INTELLIGENCE_MODEL_VERSION,
    ]);
    assert.equal(result.content.q1.status, "answered");
    assert.equal(result.content.q4.status, "insufficient_data");
    assert.equal(result.content.q4.absent_reason, "market_data_unavailable");
    assert.equal(result.content.q5.status, "partial");
    assert.equal(result.content.enrichment_status.business_signals.available, false);
    assert.equal(result.content.depth_indicator.trust_dimension, "absent");
    assert.equal(result.content.q3.trust_assessment, null);
    assert.deepEqual(await harness.repository.getCurrent({
      artifact_type: "investor_intelligence",
      company_id: "MSFT",
      period_id: "2026-Q2",
    }), result);
  });

  it("records per-question prompt and model lineage", async () => {
    const harness = buildHarness();
    const result = await executeValid(harness);

    assert.equal(result.content.prompt_lineage.q1.prompt_id, INVESTOR_Q1_PROMPT_ID);
    assert.equal(result.content.prompt_lineage.q1.prompt_version, "investor-q1-v-test");
    assert.equal(result.content.prompt_lineage.q1.model_version, INVESTOR_INTELLIGENCE_MODEL_VERSION);
    assert.equal(result.content.evaluation_hooks.prompt_versions.q5, "investor-q5-v-test");
    assert.equal(result.content.evaluation_hooks.model_versions.q3, INVESTOR_INTELLIGENCE_MODEL_VERSION);
    assert.equal(typeof result.content.per_question_input_hashes.q1, "string");
    assert.equal(typeof result.content.coherence_hash, "string");
    assert.equal(typeof result.content.output_hash, "string");
    assert.equal(result.lineage.prompt_reference?.prompt_id, INVESTOR_Q5_PROMPT_ID);
    assert.equal(result.lineage.model_reference?.model_version, INVESTOR_INTELLIGENCE_MODEL_VERSION);
  });

  it("uses Business Signals only for Q2 enrichment", async () => {
    const harness = buildHarness({
      q2: {
        ...q2Output(),
        evidence_package: {
          ...emptyEvidence(),
          company_knowledge_refs: ["revenue_drivers"],
          quarter_understanding_refs: ["understanding-growth-1"],
          business_signal_refs: ["signal-growth-1", "signal-strategy-1"],
        },
      },
    });
    const result = await harness.executor.executeBuilder<InvestorIntelligenceBuilderInput, InvestorIntelligenceArtifactContent>({
      builderType: INVESTOR_INTELLIGENCE_BUILDER_TYPE,
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "investor-intelligence-q2-enrichment",
      input: input(),
      inputHash: "investor-intelligence-input-hash",
      dependencies: {
        company_knowledge: companyKnowledge(),
        quarter_understanding: quarterUnderstandingBase(),
        business_signals: businessSignals(),
      },
    });

    assert.equal(result.content.enrichment_status.business_signals.available, true);
    assert.deepEqual(result.content.q2.evidence_package.business_signal_refs, ["signal-growth-1", "signal-strategy-1"]);
    assert.deepEqual(result.content.q1.evidence_package.business_signal_refs, []);
    assert.deepEqual(result.content.q3.evidence_package.business_signal_refs, []);
  });

  it("rejects direct Trust Signals when Quarter Understanding trust dimension is present", async () => {
    await assert.rejects(
      buildHarness().executor.executeBuilder<InvestorIntelligenceBuilderInput, InvestorIntelligenceArtifactContent>({
        builderType: INVESTOR_INTELLIGENCE_BUILDER_TYPE,
        companyId: "MSFT",
        periodId: "2026-Q2",
        executionId: "investor-intelligence-trust-reject",
        input: input(),
        inputHash: "investor-intelligence-input-hash",
        dependencies: {
          company_knowledge: companyKnowledge(),
          quarter_understanding: quarterUnderstandingWithTrust(),
          trust_signals: trustSignals(),
        },
      }),
      BuilderDependencyError,
    );
  });

  it("allows Trust Signals only as conditional fallback when trust dimension is absent", async () => {
    const harness = buildHarness({
      q3: {
        ...q3Output(),
        evidence_package: {
          ...emptyEvidence(),
          quarter_understanding_refs: ["trust_dimension_absent"],
          trust_signal_refs: ["trust-signal-1"],
        },
      },
    });
    const result = await harness.executor.executeBuilder<InvestorIntelligenceBuilderInput, InvestorIntelligenceArtifactContent>({
      builderType: INVESTOR_INTELLIGENCE_BUILDER_TYPE,
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "investor-intelligence-trust-fallback",
      input: input(),
      inputHash: "investor-intelligence-input-hash",
      dependencies: {
        company_knowledge: companyKnowledge(),
        quarter_understanding: quarterUnderstandingBase(),
        trust_signals: trustSignals(),
      },
    });

    assert.equal(result.content.depth_indicator.trust_dimension, "absent");
    assert.deepEqual(result.content.q3.evidence_package.trust_signal_refs, ["trust-signal-1"]);
    assert.equal(result.content.q3.trust_assessment, null);
  });

  it("passes Commitment Tracking only to Q3 context", async () => {
    const harness = buildHarness();
    const result = await harness.executor.executeBuilder<InvestorIntelligenceBuilderInput, InvestorIntelligenceArtifactContent>({
      builderType: INVESTOR_INTELLIGENCE_BUILDER_TYPE,
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "investor-intelligence-commitment-depth",
      input: input(),
      inputHash: "investor-intelligence-input-hash",
      dependencies: {
        company_knowledge: companyKnowledge(),
        quarter_understanding: quarterUnderstandingBase(),
        commitment_tracking: commitmentTracking(),
      },
    });

    assert.match(harness.llm.requests[2].messages[1].content, /"commitment_tracking":/);
    assert.doesNotMatch(harness.llm.requests[0].messages[1].content, /"commitment_tracking":/);
    assert.doesNotMatch(harness.llm.requests[1].messages[1].content, /"commitment_tracking":/);
    assert.deepEqual(result.content.q1.evidence_package.commitment_tracking_refs, []);
    assert.deepEqual(result.content.q2.evidence_package.commitment_tracking_refs, []);
  });

  it("keeps Q4 insufficient_data even when Market Data dependency is supplied", async () => {
    const result = await buildHarness().executor.executeBuilder<InvestorIntelligenceBuilderInput, InvestorIntelligenceArtifactContent>({
      builderType: INVESTOR_INTELLIGENCE_BUILDER_TYPE,
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "investor-intelligence-market-data",
      input: input(),
      inputHash: "investor-intelligence-input-hash",
      dependencies: {
        company_knowledge: companyKnowledge(),
        quarter_understanding: quarterUnderstandingBase(),
        market_data: artifact("market-data-1", "financial_statements", {}),
      },
    });

    assert.equal(result.content.enrichment_status.market_data.available, true);
    assert.equal(result.content.q4.status, "insufficient_data");
    assert.equal(result.content.q4.absent_reason, "market_data_unavailable");
    assert.deepEqual(result.content.q4.evidence_package.market_data_refs, []);
  });

  it("passes only structured Q1-Q4 outputs into Q5 prompt context", async () => {
    const harness = buildHarness();
    await executeValid(harness);
    const q5Prompt = harness.llm.requests[4].messages[1].content;

    assert.match(q5Prompt, /"q1"/);
    assert.match(q5Prompt, /"q2"/);
    assert.match(q5Prompt, /"q3"/);
    assert.match(q5Prompt, /"q4"/);
    assert.doesNotMatch(q5Prompt, /"company_knowledge":/);
    assert.doesNotMatch(q5Prompt, /"quarter_understanding":/);
    assert.doesNotMatch(q5Prompt, /"business_signals":/);
    assert.doesNotMatch(q5Prompt, /"trust_signals":/);
    assert.doesNotMatch(q5Prompt, /"commitment_tracking":/);
    assert.doesNotMatch(q5Prompt, /"topic_evolution":/);
    assert.doesNotMatch(q5Prompt, /"market_data":/);
  });

  it("fails when required dependencies are missing", async () => {
    await assert.rejects(
      buildHarness().executor.executeBuilder<InvestorIntelligenceBuilderInput, InvestorIntelligenceArtifactContent>({
        builderType: INVESTOR_INTELLIGENCE_BUILDER_TYPE,
        companyId: "MSFT",
        periodId: "2026-Q2",
        executionId: "investor-intelligence-missing-ck",
        input: input(),
        inputHash: "investor-intelligence-input-hash",
        dependencies: {
          quarter_understanding: quarterUnderstandingBase(),
        },
      }),
      BuilderDependencyError,
    );

    await assert.rejects(
      buildHarness().executor.executeBuilder<InvestorIntelligenceBuilderInput, InvestorIntelligenceArtifactContent>({
        builderType: INVESTOR_INTELLIGENCE_BUILDER_TYPE,
        companyId: "MSFT",
        periodId: "2026-Q2",
        executionId: "investor-intelligence-missing-qu",
        input: input(),
        inputHash: "investor-intelligence-input-hash",
        dependencies: {
          company_knowledge: companyKnowledge(),
        },
      }),
      BuilderDependencyError,
    );
  });

  it("rejects forbidden direct dependencies", async () => {
    await assert.rejects(
      buildHarness().executor.executeBuilder<InvestorIntelligenceBuilderInput, InvestorIntelligenceArtifactContent>({
        builderType: INVESTOR_INTELLIGENCE_BUILDER_TYPE,
        companyId: "MSFT",
        periodId: "2026-Q2",
        executionId: "investor-intelligence-forbidden",
        input: input(),
        inputHash: "investor-intelligence-input-hash",
        dependencies: {
          company_knowledge: companyKnowledge(),
          quarter_understanding: quarterUnderstandingBase(),
          quarter_change: artifact("quarter-change-1", "quarter_change", {}),
        },
      }),
      BuilderDependencyError,
    );
  });

  it("rejects Q4 answered status", async () => {
    const content = await validArtifact();
    content.q4.status = "answered";

    assert.throws(
      () => validateInvestorIntelligenceArtifactContent(content),
      BuilderValidationError,
    );
  });

  it("rejects unknown prompt output fields", async () => {
    await assert.rejects(
      executeWithOutputs({ q1: withExtra(q1Output(), { unexpected_field: "not allowed" }) }),
      BuilderValidationError,
    );
  });

  it("rejects recommendation prompt output fields", async () => {
    await assert.rejects(
      executeWithOutputs({ q2: withExtra(q2Output(), { recommendation: "not allowed" }) }),
      BuilderValidationError,
    );
  });

  it("rejects valuation prompt output fields", async () => {
    await assert.rejects(
      executeWithOutputs({ q3: withExtra(q3Output(), { valuation: "not allowed" }) }),
      BuilderValidationError,
    );
  });

  it("rejects price target prompt output fields", async () => {
    await assert.rejects(
      executeWithOutputs({ q4: withExtra(q4Output(), { price_target: "not allowed" }) }),
      BuilderValidationError,
    );
  });

  it("rejects expected return prompt output fields", async () => {
    await assert.rejects(
      executeWithOutputs({ q5: withExtra(q5Output(), { expected_return: "not allowed" }) }),
      BuilderValidationError,
    );
  });

  it("rejects upstream artifact payload fields", async () => {
    await assert.rejects(
      executeWithOutputs({ q1: withExtra(q1Output(), { company_knowledge: companyKnowledge().content }) }),
      BuilderValidationError,
    );
  });

  it("rejects cross-question prompt output fields", async () => {
    await assert.rejects(
      executeWithOutputs({ q2: withExtra(q2Output(), { q3: q3Output() }) }),
      BuilderValidationError,
    );
  });

  it("rejects forbidden Q1 language", async () => {
    const content = await validArtifact();
    content.q1.summary = "This creates expected return potential.";

    assert.throws(
      () => validateInvestorIntelligenceArtifactContent(content),
      BuilderValidationError,
    );
  });

  it("rejects forbidden Q2 language", async () => {
    const content = await validArtifact();
    content.q2.revenue_quality = "This supports a price target.";

    assert.throws(
      () => validateInvestorIntelligenceArtifactContent(content),
      BuilderValidationError,
    );
  });

  it("rejects forbidden Q3 language", async () => {
    const content = await validArtifact();
    content.q3.summary = "This is a sell recommendation.";

    assert.throws(
      () => validateInvestorIntelligenceArtifactContent(content),
      BuilderValidationError,
    );
  });

  it("rejects forbidden Q4 language", async () => {
    const content = await validArtifact();
    content.q4.expectation_context = "This implies upside.";

    assert.throws(
      () => validateInvestorIntelligenceArtifactContent(content),
      BuilderValidationError,
    );
  });

  it("rejects forbidden Q5 language", async () => {
    const content = await validArtifact();
    content.q5.key_drivers = ["price target improvement"];

    assert.throws(
      () => validateInvestorIntelligenceArtifactContent(content),
      BuilderValidationError,
    );
  });

  for (const phrase of [
    "target price",
    "target prices",
    "should buy",
    "should sell",
    "should hold",
    "investors should buy the stock",
  ]) {
    it(`rejects forbidden phrase: ${phrase}`, async () => {
      const content = await validArtifact();
      content.q5.key_risks = [phrase];

      assert.throws(
        () => validateInvestorIntelligenceArtifactContent(content),
        BuilderValidationError,
      );
    });
  }

  it("accepts valid artifacts after full narrative validation", async () => {
    const content = await validArtifact();

    assert.doesNotThrow(
      () => validateInvestorIntelligenceArtifactContent(content),
    );
  });

  it("calculates confidence from documented calibration constants", async () => {
    const content = await validArtifact();

    assert.equal(content.confidence.q1_score, INVESTOR_CONFIDENCE_LEVEL_SCORE_HIGH);
    assert.equal(content.confidence.q2_score, INVESTOR_CONFIDENCE_LEVEL_SCORE_MEDIUM);
    assert.equal(content.confidence.q3_score, INVESTOR_CONFIDENCE_LEVEL_SCORE_LOW);
    assert.equal(content.confidence.q4_score, INVESTOR_CONFIDENCE_LEVEL_SCORE_LOW);
    assert.equal(content.confidence.q5_score, INVESTOR_CONFIDENCE_LEVEL_SCORE_LOW);
    assert.equal(content.confidence.overall, INVESTOR_CONFIDENCE_LEVEL_SCORE_LOW);
  });

  it("applies threshold changes through the confidence calibration contract", async () => {
    const calibration = {
      ...INVESTOR_CONFIDENCE_CALIBRATION,
      company_knowledge_thresholds: {
        ...INVESTOR_CONFIDENCE_CALIBRATION.company_knowledge_thresholds,
        high_min: 1,
      },
    };

    assert.equal(
      confidenceLevelFromCompanyKnowledgeScore(INVESTOR_COMPANY_KNOWLEDGE_HIGH_CONFIDENCE_MIN, calibration),
      "medium",
    );
  });

  it("applies level-score changes through the confidence calibration contract", async () => {
    const content = await validArtifact();
    const calibration = {
      ...INVESTOR_CONFIDENCE_CALIBRATION,
      level_scores: {
        ...INVESTOR_CONFIDENCE_CALIBRATION.level_scores,
        low: INVESTOR_CONFIDENCE_LEVEL_SCORE_MEDIUM,
      },
    };

    assert.equal(
      buildInvestorConfidence({
        q1: content.q1,
        q2: content.q2,
        q3: content.q3,
        q4: content.q4,
        q5: content.q5,
      }, calibration).overall,
      INVESTOR_CONFIDENCE_LEVEL_SCORE_MEDIUM,
    );
  });

  it("is deterministic for repeated executions with identical prompt outputs and inputs", async () => {
    const dependencies = {
      company_knowledge: companyKnowledge(),
      quarter_understanding: quarterUnderstandingBase(),
      business_signals: businessSignals(),
      topic_evolution: topicEvolution(),
    };
    const first = await buildHarness().executor.executeBuilder<InvestorIntelligenceBuilderInput, InvestorIntelligenceArtifactContent>({
      builderType: INVESTOR_INTELLIGENCE_BUILDER_TYPE,
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "investor-intelligence-replay-1",
      input: input(),
      inputHash: "investor-intelligence-input-hash",
      dependencies,
    });
    const second = await buildHarness().executor.executeBuilder<InvestorIntelligenceBuilderInput, InvestorIntelligenceArtifactContent>({
      builderType: INVESTOR_INTELLIGENCE_BUILDER_TYPE,
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "investor-intelligence-replay-2",
      input: input(),
      inputHash: "investor-intelligence-input-hash",
      dependencies,
    });

    assert.deepEqual(first.content, second.content);
  });
});

function buildHarness(overrides: Partial<QuestionOutputs> = {}): {
  executor: BuilderExecutor;
  repository: TestArtifactRepository;
  llm: MockLLMClient;
  resolvedPromptIds: string[];
} {
  const repository = new TestArtifactRepository();
  const registry = new BuilderRegistry();
  const promptResolver = new MockPromptResolver();
  const llm = new MockLLMClient(questionOutputs(overrides));

  registry.registerBuilder({
    builder_type: INVESTOR_INTELLIGENCE_BUILDER_TYPE,
    artifact_type: "investor_intelligence",
    version: INVESTOR_INTELLIGENCE_BUILDER_VERSION,
    schema_version: INVESTOR_INTELLIGENCE_SCHEMA_VERSION,
    pipeline_version: INVESTOR_INTELLIGENCE_PIPELINE_VERSION,
  }, () => new InvestorIntelligenceBuilder({
    promptResolver,
    llmClient: llm,
  }));

  return {
    executor: new BuilderExecutor(registry, new ArtifactService(repository)),
    repository,
    llm,
    resolvedPromptIds: promptResolver.resolvedPromptIds,
  };
}

async function executeValid(harness = buildHarness()): Promise<ReturnType<BuilderExecutor["executeBuilder"]> extends Promise<infer T> ? T & { content: InvestorIntelligenceArtifactContent } : never> {
  return await harness.executor.executeBuilder<InvestorIntelligenceBuilderInput, InvestorIntelligenceArtifactContent>({
    builderType: INVESTOR_INTELLIGENCE_BUILDER_TYPE,
    companyId: "MSFT",
    periodId: "2026-Q2",
    executionId: "investor-intelligence-valid",
    input: input(),
    inputHash: "investor-intelligence-input-hash",
    dependencies: {
      company_knowledge: companyKnowledge(),
      quarter_understanding: quarterUnderstandingBase(),
    },
  }) as never;
}

async function validArtifact(): Promise<InvestorIntelligenceArtifactContent> {
  const result = await executeValid();

  return result.content;
}

async function executeWithOutputs(overrides: Partial<QuestionOutputs>) {
  return await buildHarness(overrides).executor.executeBuilder<InvestorIntelligenceBuilderInput, InvestorIntelligenceArtifactContent>({
    builderType: INVESTOR_INTELLIGENCE_BUILDER_TYPE,
    companyId: "MSFT",
    periodId: "2026-Q2",
    executionId: "investor-intelligence-invalid-prompt-output",
    input: input(),
    inputHash: "investor-intelligence-input-hash",
    dependencies: {
      company_knowledge: companyKnowledge(),
      quarter_understanding: quarterUnderstandingBase(),
    },
  });
}

function withExtra<T extends object>(output: T, extra: Record<string, unknown>): T {
  return {
    ...output,
    ...extra,
  };
}

class MockPromptResolver {
  readonly resolvedPromptIds: string[] = [];

  resolve(promptId: string): ResolvedPrompt {
    this.resolvedPromptIds.push(promptId);

    return {
      promptId,
      version: `${promptId.replaceAll("_", "-")}-v-test`,
      content: `System prompt for ${promptId}`,
      hash: `hash-${promptId}`,
      source: "filesystem",
      activationId: null,
    };
  }
}

class MockLLMClient implements LLMClient {
  readonly requests: LLMRequest[] = [];
  private index = 0;

  constructor(private readonly outputs: QuestionOutputs) {}

  async callLLM(request: LLMRequest): Promise<{ output_text: string }> {
    this.requests.push(request);
    const ordered = [this.outputs.q1, this.outputs.q2, this.outputs.q3, this.outputs.q4, this.outputs.q5];
    const output = ordered[this.index];

    this.index += 1;

    return {
      output_text: JSON.stringify(output),
    };
  }
}

type QuestionOutputs = {
  q1: Q1PromptOutput;
  q2: Q2PromptOutput;
  q3: Q3PromptOutput;
  q4: Q4PromptOutput;
  q5: Q5PromptOutput;
};

function questionOutputs(overrides: Partial<QuestionOutputs>): QuestionOutputs {
  return {
    q1: overrides.q1 ?? q1Output(),
    q2: overrides.q2 ?? q2Output(),
    q3: overrides.q3 ?? q3Output(),
    q4: overrides.q4 ?? q4Output(),
    q5: overrides.q5 ?? q5Output(),
  };
}

function q1Output(): Q1PromptOutput {
  return {
    status: "answered",
    summary: "Microsoft sells cloud infrastructure, productivity software, and business applications.",
    strengths: ["Diversified enterprise software demand."],
    weaknesses: ["Execution depends on sustained cloud demand."],
    evidence_package: {
      ...emptyEvidence(),
      company_knowledge_refs: ["business_model", "products", "customers"],
      quarter_understanding_refs: ["understanding-business-1"],
    },
    limitations: [],
  };
}

function q2Output(): Q2PromptOutput {
  return {
    status: "answered",
    summary: "Future revenue depends on cloud platform usage and enterprise software adoption.",
    revenue_quality: "Revenue quality is supported by recurring enterprise demand.",
    margin_quality: "Margin quality depends on cloud scale and infrastructure investment.",
    cash_generation_quality: "Cash generation remains linked to recurring software economics.",
    evidence_package: {
      ...emptyEvidence(),
      company_knowledge_refs: ["revenue_drivers"],
      quarter_understanding_refs: ["understanding-growth-1"],
    },
    limitations: ["Business Signals unavailable for Q2 enrichment."],
  };
}

function q3Output(): Q3PromptOutput {
  return {
    status: "partial",
    summary: "Trust interpretation is limited because Quarter Understanding lacks trust depth.",
    trust_assessment: null,
    trust_depth_limitation: "Trust dimension is absent in Quarter Understanding.",
    evidence_package: {
      ...emptyEvidence(),
      quarter_understanding_refs: ["trust_dimension_absent"],
    },
    limitations: ["Trust Signals unavailable."],
  };
}

function q4Output(): Q4PromptOutput {
  return {
    status: "insufficient_data",
    summary: "Valuation analysis is unavailable in Sprint 11.",
    expectation_context: "Market-price data is not currently available for expectation framing.",
    valuation_depth_limitation: "Market Data unavailable.",
    absent_reason: "market_data_unavailable",
    evidence_package: emptyEvidence(),
    limitations: ["Market Data unavailable."],
  };
}

function q5Output(): Q5PromptOutput {
  return {
    status: "partial",
    bull_case: ["The thesis depends on enterprise software demand and cloud adoption."],
    bear_case: ["The thesis weakens if cloud demand slows or trust evidence remains unavailable."],
    key_drivers: ["Cloud adoption", "Recurring enterprise software demand"],
    key_risks: ["Infrastructure execution", "Limited trust depth"],
    evidence_package: {
      ...emptyEvidence(),
      company_knowledge_refs: ["business_model"],
      quarter_understanding_refs: ["understanding-business-1", "understanding-growth-1"],
    },
    limitations: ["Market Data unavailable."],
  };
}

function emptyEvidence() {
  return {
    company_knowledge_refs: [],
    quarter_understanding_refs: [],
    business_signal_refs: [],
    trust_signal_refs: [],
    commitment_tracking_refs: [],
    topic_refs: [],
    prior_investor_intelligence_refs: [],
    market_data_refs: [],
  };
}
