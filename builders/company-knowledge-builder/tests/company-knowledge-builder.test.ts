import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Artifact } from "../../../contracts/artifacts/artifact.js";
import { ArtifactStatus } from "../../../contracts/artifacts/artifact-status.js";
import type { ArtifactType } from "../../../contracts/artifacts/artifact-type.js";
import type { ArtifactRepository } from "../../../packages/artifact-framework/src/artifact-repository.js";
import { ArtifactService } from "../../../packages/artifact-framework/src/artifact-service.js";
import type { ArtifactLookup } from "../../../packages/artifact-framework/src/artifact-types.js";
import { BuilderExecutor } from "../../../packages/builder-framework/src/builder-executor.js";
import { BuilderDependencyError, BuilderValidationError } from "../../../packages/builder-framework/src/builder-errors.js";
import { BuilderRegistry } from "../../../packages/builder-framework/src/builder-registry.js";
import { CompanyKnowledgeBuilder } from "../builder.js";
import { buildCandidateSummary, buildEvaluationHooks, compareField } from "../comparison-engine.js";
import {
  COMPANY_KNOWLEDGE_BUILDER_TYPE,
  COMPANY_KNOWLEDGE_BUILDER_VERSION,
  COMPANY_KNOWLEDGE_CANDIDATE_PIPELINE_VERSION,
  COMPANY_KNOWLEDGE_CANDIDATE_SCHEMA_VERSION,
  type CompanyKnowledgeCandidateContent,
} from "../contract.js";
import type {
  CompanyKnowledge,
  CompanyKnowledgeArtifactContent,
  CompanyKnowledgeBuilderInput,
  CompanyKnowledgeHistoryContent,
  StructuredIntelligenceArtifactContent,
} from "../types.js";
import { validateCompanyKnowledgeCandidateContent } from "../validator.js";

describe("company knowledge builder", () => {
  it("generates a first-population candidate artifact through the Builder Framework", async () => {
    const repository = new TestArtifactRepository();
    const testExecutor = executor(repository);
    const structured = structuredArtifact(baseStructuredIntelligence());

    const artifact = await testExecutor.executeBuilder<CompanyKnowledgeBuilderInput, CompanyKnowledgeCandidateContent>({
      builderType: COMPANY_KNOWLEDGE_BUILDER_TYPE,
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "execution-1",
      input: input(),
      inputHash: "candidate-input-hash",
      dependencies: {
        structured_intelligence: structured,
      },
      generatedAt: "2026-06-15T00:00:00.000Z",
    });

    assert.equal(artifact.identity.artifact_type, "company_knowledge_candidate");
    assert.equal(artifact.metadata.schema_version, COMPANY_KNOWLEDGE_CANDIDATE_SCHEMA_VERSION);
    assert.equal(artifact.metadata.pipeline_version, COMPANY_KNOWLEDGE_CANDIDATE_PIPELINE_VERSION);
    assert.equal(artifact.content.candidate_changes.length, 9);
    assert.equal(artifact.content.candidate_changes.every((change) => change.change_type === "new_information"), true);
    assert.equal(artifact.content.candidate_changes.every((change) => change.builder_recommendation === "candidate_promote"), true);
    assert.equal(artifact.content.candidate_summary.total_fields_evaluated, 9);
    assert.deepEqual(artifact.lineage.upstream_dependencies, [
      {
        artifact_id: structured.identity.artifact_id,
        artifact_type: "structured_intelligence",
        version: 1,
        artifact_hash: structured.metadata.artifact_hash,
        input_hash: structured.metadata.input_hash,
      },
    ]);
    assert.deepEqual(await repository.getCurrent({
      artifact_type: "company_knowledge_candidate",
      company_id: "MSFT",
      period_id: "2026-Q2",
    }), artifact);
  });

  it("does not create or persist Company Knowledge", async () => {
    const repository = new TestArtifactRepository();
    const artifact = await executor(repository).executeBuilder<CompanyKnowledgeBuilderInput, CompanyKnowledgeCandidateContent>({
      builderType: COMPANY_KNOWLEDGE_BUILDER_TYPE,
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "execution-1",
      input: input(),
      inputHash: "candidate-input-hash",
      dependencies: {
        structured_intelligence: structuredArtifact(baseStructuredIntelligence()),
      },
    });

    assert.equal(artifact.identity.artifact_type, "company_knowledge_candidate");
    assert.equal(await repository.getCurrent({
      artifact_type: "company_knowledge",
      company_id: "MSFT",
      period_id: "2026-Q2",
    }), null);
  });

  it("records Company Knowledge history as a resolved dependency", async () => {
    const structured = structuredArtifact(baseStructuredIntelligence());
    const current = currentKnowledgeArtifact(currentKnowledgeMatchingStructured(baseStructuredIntelligence()));
    const history = companyKnowledgeHistoryArtifact([
      currentKnowledgeArtifact(currentKnowledgeMatchingStructured(baseStructuredIntelligence())).content,
    ]);
    const artifact = await executor(new TestArtifactRepository()).executeBuilder<CompanyKnowledgeBuilderInput, CompanyKnowledgeCandidateContent>({
      builderType: COMPANY_KNOWLEDGE_BUILDER_TYPE,
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "execution-history",
      input: input(),
      inputHash: "candidate-input-hash",
      dependencies: {
        structured_intelligence: structured,
        company_knowledge: current,
        company_knowledge_history: history,
      },
    });

    assert.deepEqual(artifact.lineage.upstream_dependencies.map((dependency) => dependency.artifact_id), [
      current.identity.artifact_id,
      history.identity.artifact_id,
      structured.identity.artifact_id,
    ]);
  });

  it("uses Company Knowledge history for evidence accumulation", async () => {
    const structured = baseStructuredIntelligence();
    const current = currentKnowledgeMatchingStructured(structured);
    const historical = currentKnowledgeMatchingStructured(structured);

    current.revenue_drivers = current.revenue_drivers.map((driver) => ({
      ...driver,
      supporting_periods: ["2026-Q1"],
    }));
    historical.revenue_drivers = historical.revenue_drivers.map((driver) => ({
      ...driver,
      supporting_periods: ["2025-Q4"],
      last_updated_period: "2025-Q4",
    }));

    const artifact = await executor(new TestArtifactRepository()).executeBuilder<CompanyKnowledgeBuilderInput, CompanyKnowledgeCandidateContent>({
      builderType: COMPANY_KNOWLEDGE_BUILDER_TYPE,
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "execution-history-evidence",
      input: input(),
      inputHash: "candidate-input-hash",
      dependencies: {
        structured_intelligence: structuredArtifact(structured),
        company_knowledge: currentKnowledgeArtifact(current),
        company_knowledge_history: companyKnowledgeHistoryArtifact([
          currentKnowledgeArtifact(historical).content,
        ]),
      },
    });
    const revenueDrivers = artifact.content.candidate_changes.find((change) => change.field_path === "revenue_drivers");

    assert.equal(revenueDrivers?.change_type, "evidence_accumulation");
    assert.equal(revenueDrivers?.evidence_delta, 1);
  });

  it("fails fast when Structured Intelligence dependency is missing", async () => {
    await assert.rejects(
      executor(new TestArtifactRepository()).executeBuilder<CompanyKnowledgeBuilderInput, CompanyKnowledgeCandidateContent>({
        builderType: COMPANY_KNOWLEDGE_BUILDER_TYPE,
        companyId: "MSFT",
        periodId: "2026-Q2",
        executionId: "execution-missing-structured",
        input: input(),
        inputHash: "candidate-input-hash",
        dependencies: {},
      }),
      BuilderDependencyError,
    );
  });

  it("allows missing Company Knowledge history", async () => {
    const structured = baseStructuredIntelligence();
    const artifact = await executor(new TestArtifactRepository()).executeBuilder<CompanyKnowledgeBuilderInput, CompanyKnowledgeCandidateContent>({
      builderType: COMPANY_KNOWLEDGE_BUILDER_TYPE,
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "execution-no-history",
      input: input(),
      inputHash: "candidate-input-hash",
      dependencies: {
        structured_intelligence: structuredArtifact(structured),
        company_knowledge: currentKnowledgeArtifact(currentKnowledgeMatchingStructured(structured)),
      },
    });

    assert.equal(artifact.content.candidate_changes.length, 9);
  });

  it("detects no-change candidates", async () => {
    const repository = new TestArtifactRepository();
    const structured = baseStructuredIntelligence();
    const current = currentKnowledgeArtifact(currentKnowledgeMatchingStructured(structured));
    const artifact = await executor(repository).executeBuilder<CompanyKnowledgeBuilderInput, CompanyKnowledgeCandidateContent>({
      builderType: COMPANY_KNOWLEDGE_BUILDER_TYPE,
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "execution-1",
      input: input(),
      inputHash: "candidate-input-hash",
      dependencies: {
        structured_intelligence: structuredArtifact(structured),
        company_knowledge: current,
      },
    });

    assert.equal(artifact.content.candidate_summary.unchanged_fields, 9);
    assert.equal(artifact.content.candidate_changes.every((change) => change.change_type === "no_change"), true);
    assert.equal(artifact.content.candidate_changes.every((change) => change.builder_recommendation === "candidate_retain"), true);
  });

  it("detects minor update recommendations", () => {
    const result = compareField({
      field_path: "management_focus",
      stability_class: "dynamic",
      current_value: "cloud infrastructure",
      candidate_value: "cloud infrastructure ai",
      supporting_evidence: ["evidence-1"],
      current_confidence: 0.7,
      candidate_confidence: 0.8,
      current_supporting_periods: ["2026-Q1"],
      candidate_supporting_periods: ["2026-Q1", "2026-Q2"],
      historical_supporting_periods: [],
    });

    assert.equal(result.change_type, "minor_update");
    assert.equal(result.builder_recommendation, "candidate_promote");
    assert.equal(result.review_required, false);
  });

  it("detects major update candidates", () => {
    const result = compareField({
      field_path: "management_focus",
      stability_class: "dynamic",
      current_value: "abcdef",
      candidate_value: "uvwxyz",
      supporting_evidence: ["evidence-1"],
      current_confidence: 0.8,
      candidate_confidence: 0.8,
      current_supporting_periods: ["2026-Q1"],
      candidate_supporting_periods: ["2026-Q2"],
      historical_supporting_periods: [],
    });

    assert.equal(result.change_type, "major_update");
    assert.equal(result.review_required, true);
    assert.equal(result.builder_recommendation, "candidate_review");
  });

  it("classifies semantic similarity below 0.50 as major update before contradiction elevation", () => {
    const result = compareField({
      field_path: "management_focus",
      stability_class: "dynamic",
      current_value: "cloud infrastructure platforms",
      candidate_value: "retail grocery delivery",
      supporting_evidence: ["evidence-1"],
      current_confidence: 0.9,
      candidate_confidence: 0.9,
      current_supporting_periods: ["2026-Q1"],
      candidate_supporting_periods: ["2026-Q2"],
      historical_supporting_periods: [],
    });

    assert.equal(result.change_type, "major_update");
  });

  it("elevates explicit stable high-confidence conflicts to contradiction", () => {
    const result = compareField({
      field_path: "business_model",
      stability_class: "stable",
      current_value: "Retail grocery stores and food delivery",
      candidate_value: "Enterprise software and cloud infrastructure services",
      supporting_evidence: ["evidence-1"],
      current_confidence: 0.9,
      candidate_confidence: 0.9,
      current_supporting_periods: ["2026-Q1"],
      candidate_supporting_periods: ["2026-Q2"],
      historical_supporting_periods: [],
    });

    assert.equal(result.change_type, "contradiction");
    assert.equal(result.review_required, true);
  });

  it("requires high confidence for candidate promote", () => {
    const result = compareField({
      field_path: "management_focus",
      stability_class: "dynamic",
      current_value: "cloud infrastructure",
      candidate_value: "cloud infrastructure ai",
      supporting_evidence: ["evidence-1"],
      current_confidence: 0.7,
      candidate_confidence: 0.8,
      current_supporting_periods: ["2026-Q1"],
      candidate_supporting_periods: ["2026-Q1", "2026-Q2"],
      historical_supporting_periods: [],
    });

    assert.equal(result.change_type, "minor_update");
    assert.equal(result.builder_recommendation, "candidate_promote");
  });

  it("does not promote low-confidence minor updates", () => {
    const result = compareField({
      field_path: "management_focus",
      stability_class: "dynamic",
      current_value: "cloud infrastructure",
      candidate_value: "cloud infrastructure ai",
      supporting_evidence: ["evidence-1"],
      current_confidence: 0.7,
      candidate_confidence: 0.79,
      current_supporting_periods: ["2026-Q1"],
      candidate_supporting_periods: ["2026-Q1", "2026-Q2"],
      historical_supporting_periods: [],
    });

    assert.equal(result.change_type, "minor_update");
    assert.notEqual(result.builder_recommendation, "candidate_promote");
  });

  it("detects contradictions", async () => {
    const structured = baseStructuredIntelligence();
    const current = currentKnowledgeMatchingStructured(structured);

    current.business_model.summary = "Retail grocery stores and food delivery";
    current.business_model.value_creation = "Selling packaged groceries in physical stores";
    current.business_model.revenue_structure = "Point of sale retail transactions";

    const artifact = await executor(new TestArtifactRepository()).executeBuilder<CompanyKnowledgeBuilderInput, CompanyKnowledgeCandidateContent>({
      builderType: COMPANY_KNOWLEDGE_BUILDER_TYPE,
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "execution-1",
      input: input(),
      inputHash: "candidate-input-hash",
      dependencies: {
        structured_intelligence: structuredArtifact(structured),
        company_knowledge: currentKnowledgeArtifact(current),
      },
    });
    const businessModel = artifact.content.candidate_changes.find((change) => change.field_path === "business_model");

    assert.equal(businessModel?.change_type, "contradiction");
    assert.equal(businessModel?.review_required, true);
    assert.equal(artifact.content.candidate_summary.contradictions, 1);
  });

  it("detects evidence accumulation", async () => {
    const structured = baseStructuredIntelligence();
    const current = currentKnowledgeMatchingStructured(structured);

    current.revenue_drivers = current.revenue_drivers.map((driver) => ({
      ...driver,
      supporting_periods: [],
    }));

    const artifact = await executor(new TestArtifactRepository()).executeBuilder<CompanyKnowledgeBuilderInput, CompanyKnowledgeCandidateContent>({
      builderType: COMPANY_KNOWLEDGE_BUILDER_TYPE,
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "execution-1",
      input: input(),
      inputHash: "candidate-input-hash",
      dependencies: {
        structured_intelligence: structuredArtifact(structured),
        company_knowledge: currentKnowledgeArtifact(current),
      },
    });
    const revenueDrivers = artifact.content.candidate_changes.find((change) => change.field_path === "revenue_drivers");

    assert.equal(revenueDrivers?.change_type, "evidence_accumulation");
    assert.equal(revenueDrivers?.builder_recommendation, "candidate_promote");
    assert.equal(revenueDrivers?.evidence_delta, 1);
  });

  it("requires review for stable field changes", async () => {
    const structured = baseStructuredIntelligence();
    const current = currentKnowledgeMatchingStructured(structured);

    current.products = [
      {
        product_name: "Azure",
        description: "Cloud infrastructure platform for enterprise workloads.",
        importance: "high",
        confidence: 0.82,
        supporting_periods: ["2026-Q1"],
        last_updated_period: "2026-Q1",
      },
    ];

    const artifact = await executor(new TestArtifactRepository()).executeBuilder<CompanyKnowledgeBuilderInput, CompanyKnowledgeCandidateContent>({
      builderType: COMPANY_KNOWLEDGE_BUILDER_TYPE,
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "execution-1",
      input: input(),
      inputHash: "candidate-input-hash",
      dependencies: {
        structured_intelligence: structuredArtifact(structured),
        company_knowledge: currentKnowledgeArtifact(current),
      },
    });
    const products = artifact.content.candidate_changes.find((change) => change.field_path === "products");

    assert.equal(products?.review_required, true);
    assert.equal(products?.builder_recommendation, "candidate_review");
  });

  it("rejects candidate summary mismatches", () => {
    const change = compareField({
      field_path: "management_focus",
      stability_class: "dynamic",
      current_value: null,
      candidate_value: "cloud infrastructure",
      supporting_evidence: ["evidence-1"],
      current_confidence: 0,
      candidate_confidence: 0.82,
      current_supporting_periods: [],
      candidate_supporting_periods: ["2026-Q2"],
      historical_supporting_periods: [],
    });
    const content = candidateContent([change]);

    content.candidate_summary.changed_fields = 99;

    assert.throws(
      () => validateCompanyKnowledgeCandidateContent(content),
      BuilderValidationError,
    );
  });

  it("rejects evaluation hook mismatches", () => {
    const change = compareField({
      field_path: "management_focus",
      stability_class: "dynamic",
      current_value: null,
      candidate_value: "cloud infrastructure",
      supporting_evidence: ["evidence-1"],
      current_confidence: 0,
      candidate_confidence: 0.82,
      current_supporting_periods: [],
      candidate_supporting_periods: ["2026-Q2"],
      historical_supporting_periods: [],
    });
    const content = candidateContent([change]);

    content.evaluation_hooks.changed_fields = 99;

    assert.throws(
      () => validateCompanyKnowledgeCandidateContent(content),
      BuilderValidationError,
    );
  });

  it("records framework-owned lineage and preserves builder ownership boundaries", async () => {
    const structured = structuredArtifact(baseStructuredIntelligence());
    const current = currentKnowledgeArtifact(currentKnowledgeMatchingStructured(baseStructuredIntelligence()));
    const artifact = await executor(new TestArtifactRepository()).executeBuilder<CompanyKnowledgeBuilderInput, CompanyKnowledgeCandidateContent>({
      builderType: COMPANY_KNOWLEDGE_BUILDER_TYPE,
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "execution-42",
      input: input(),
      inputHash: "candidate-input-hash",
      dependencies: {
        structured_intelligence: structured,
        company_knowledge: current,
      },
    });

    assert.equal(artifact.lineage.generation_context.builder_type, COMPANY_KNOWLEDGE_BUILDER_TYPE);
    assert.equal(artifact.lineage.generation_context.execution_id, "execution-42");
    assert.deepEqual(artifact.lineage.upstream_dependencies.map((dependency) => dependency.artifact_type), [
      "company_knowledge",
      "structured_intelligence",
    ]);
    assert.equal(artifact.content.candidate_changes.some((change) => "governance_decisions" in change), false);
    assert.equal("metadata" in artifact.content, false);
    assert.equal("lineage" in artifact.content, false);
  });
});

function executor(repository: ArtifactRepository): BuilderExecutor {
  const registry = new BuilderRegistry();

  registry.registerBuilder({
    builder_type: COMPANY_KNOWLEDGE_BUILDER_TYPE,
    artifact_type: "company_knowledge_candidate",
    version: COMPANY_KNOWLEDGE_BUILDER_VERSION,
    schema_version: COMPANY_KNOWLEDGE_CANDIDATE_SCHEMA_VERSION,
    pipeline_version: COMPANY_KNOWLEDGE_CANDIDATE_PIPELINE_VERSION,
  }, () => new CompanyKnowledgeBuilder());

  return new BuilderExecutor(registry, new ArtifactService(repository));
}

function input(): CompanyKnowledgeBuilderInput {
  return {
    company_id: "MSFT",
    period_id: "2026-Q2",
    filing_id: "msft-2026-q2-10q",
  };
}

function baseStructuredIntelligence(): StructuredIntelligenceArtifactContent {
  return {
    company_id: "MSFT",
    period_id: "2026-Q2",
    filing_id: "msft-2026-q2-10q",
    filing_period: "2026-Q2",
    confidence: {
      overall: 0.82,
    },
    understanding: {
      business_model: {
        summary: "Microsoft sells software, cloud infrastructure, and productivity services.",
        value_creation: "Enterprise customers use Microsoft platforms to run business workloads.",
        confidence: 0.82,
        evidence_refs: ["business-model-evidence"],
      },
      products: [
        {
          product_name: "Microsoft 365",
          description: "Productivity applications and collaboration services.",
          importance: "high",
          confidence: 0.82,
          evidence_refs: ["product-evidence-1"],
        },
        {
          product_name: "Azure",
          description: "Cloud infrastructure and platform services.",
          importance: "high",
          confidence: 0.82,
          evidence_refs: ["product-evidence-2"],
        },
      ],
      customers: [
        {
          customer_segment: "Enterprise customers",
          description: "Organizations buying software, cloud, and security tools.",
          confidence: 0.82,
          evidence_refs: ["customer-evidence"],
        },
      ],
      revenue_model: {
        summary: "Recurring subscriptions and consumption-based cloud revenue.",
        recurring_components: ["subscriptions"],
        transactional_components: ["cloud consumption"],
        confidence: 0.82,
        evidence_refs: ["revenue-model-evidence"],
      },
      revenue_drivers: [
        {
          driver: "Cloud consumption",
          explanation: "Azure workloads increase usage revenue.",
          confidence: 0.82,
          evidence_refs: ["revenue-driver-evidence"],
        },
      ],
      competitive_positioning: [
        {
          position: "Enterprise platform breadth",
          supporting_reasoning: "Microsoft bundles cloud, productivity, and security capabilities.",
          confidence: 0.82,
          evidence_refs: ["competitive-evidence"],
        },
      ],
      strategic_priorities: [
        {
          priority: "AI platform integration",
          rationale: "Management is integrating AI across cloud and productivity products.",
          confidence: 0.82,
          evidence_refs: ["strategy-evidence"],
        },
      ],
      management_focus: [
        {
          focus_area: "Cloud infrastructure scaling",
          explanation: "Management discussed expanding infrastructure for AI workloads.",
          confidence: 0.82,
          evidence_refs: ["management-evidence"],
        },
      ],
      risks: [
        {
          risk: "Capacity constraints",
          explanation: "Demand may exceed available infrastructure.",
          confidence: 0.82,
          evidence_refs: ["risk-evidence"],
        },
      ],
      dependencies: [
        {
          dependency: "Data center capacity",
          explanation: "Cloud and AI services require large-scale infrastructure.",
          confidence: 0.82,
          evidence_refs: ["dependency-evidence"],
        },
      ],
    },
  };
}

function currentKnowledgeMatchingStructured(structured: StructuredIntelligenceArtifactContent): CompanyKnowledge {
  const businessModel = structured.understanding.business_model!;
  const revenueModel = structured.understanding.revenue_model!;

  return {
    business_model: {
      summary: businessModel.summary,
      value_creation: businessModel.value_creation,
      revenue_structure: revenueModel.summary,
      confidence: structured.confidence.overall,
      supporting_periods: [structured.period_id],
      last_updated_period: structured.period_id,
    },
    products: structured.understanding.products.map((product) => ({
      product_name: product.product_name,
      description: product.description,
      importance: product.importance,
      confidence: structured.confidence.overall,
      supporting_periods: [structured.period_id],
      last_updated_period: structured.period_id,
    })),
    customers: structured.understanding.customers.map((customer) => ({
      customer_segment: customer.customer_segment,
      description: customer.description,
      confidence: structured.confidence.overall,
      supporting_periods: [structured.period_id],
      last_updated_period: structured.period_id,
    })),
    revenue_structure: {
      summary: revenueModel.summary,
      recurring_components: [...revenueModel.recurring_components],
      transactional_components: [...revenueModel.transactional_components],
      confidence: structured.confidence.overall,
      supporting_periods: [structured.period_id],
      last_updated_period: structured.period_id,
    },
    revenue_drivers: structured.understanding.revenue_drivers.map((driver) => ({
      driver: driver.driver,
      description: driver.explanation,
      confidence: structured.confidence.overall,
      supporting_periods: [structured.period_id],
      last_updated_period: structured.period_id,
    })),
    competitive_positioning: structured.understanding.competitive_positioning.map((positioning) => ({
      positioning: positioning.position,
      rationale: positioning.supporting_reasoning,
      confidence: structured.confidence.overall,
      supporting_periods: [structured.period_id],
      last_updated_period: structured.period_id,
    })),
    strategic_priorities: structured.understanding.strategic_priorities.map((priority) => ({
      priority: priority.priority,
      description: priority.rationale,
      confidence: structured.confidence.overall,
      supporting_periods: [structured.period_id],
      last_updated_period: structured.period_id,
    })),
    management_focus: structured.understanding.management_focus.map((focus) => ({
      focus_area: focus.focus_area,
      description: focus.explanation,
      confidence: structured.confidence.overall,
      supporting_periods: [structured.period_id],
      last_updated_period: structured.period_id,
    })),
    dependencies: structured.understanding.dependencies.map((dependency) => ({
      dependency: dependency.dependency,
      description: dependency.explanation,
      confidence: structured.confidence.overall,
      supporting_periods: [structured.period_id],
      last_updated_period: structured.period_id,
    })),
  };
}

function structuredArtifact(content: StructuredIntelligenceArtifactContent): Artifact<StructuredIntelligenceArtifactContent> {
  return artifact("structured-artifact-1", "structured_intelligence", content);
}

function currentKnowledgeArtifact(knowledge: CompanyKnowledge): Artifact<CompanyKnowledgeArtifactContent> {
  return artifact("company-knowledge-artifact-1", "company_knowledge", {
    company_id: "MSFT",
    period_id: "2026-Q1",
    company_knowledge_version: 1,
    knowledge,
    confidence: {
      overall: 0.82,
      evidence_depth: 0.8,
      history_length: 0.5,
      consistency_score: 0.8,
      governance_confidence: 0.9,
    },
  });
}

function companyKnowledgeHistoryArtifact(
  versions: CompanyKnowledgeArtifactContent[],
): Artifact<CompanyKnowledgeHistoryContent> {
  return artifact("company-knowledge-history-artifact-1", "company_knowledge", {
    versions,
  });
}

function candidateContent(
  changes: ReturnType<typeof compareField>[],
): CompanyKnowledgeCandidateContent {
  return {
    company_id: "MSFT",
    period_id: "2026-Q2",
    filing_id: "msft-2026-q2-10q",
    candidate_changes: changes,
    candidate_summary: buildCandidateSummary(changes),
    evaluation_hooks: buildEvaluationHooks(changes),
  };
}

function artifact<T>(artifactId: string, artifactType: ArtifactType, content: T): Artifact<T> {
  return {
    identity: {
      artifact_id: artifactId,
      artifact_type: artifactType,
      company_id: "MSFT",
      period_id: "2026-Q2",
      version: 1,
    },
    metadata: {
      version: 1,
      schema_version: `${artifactType}-schema-v1`,
      pipeline_version: `${artifactType}-pipeline-v1`,
      generated_at: "2026-06-15T00:00:00.000Z",
      artifact_hash: `${artifactType}-artifact-hash`,
      input_hash: `${artifactType}-input-hash`,
      generation_duration_ms: 1,
      status: ArtifactStatus.ACTIVE,
    },
    lineage: {
      upstream_dependencies: [],
      generation_context: {
        builder_type: `${artifactType}-builder`,
      },
    },
    content,
  };
}

class TestArtifactRepository implements ArtifactRepository {
  private readonly artifacts = new Map<string, Artifact<unknown>>();
  private readonly current = new Map<string, string>();

  async create<T>(artifact: Artifact<T>): Promise<void> {
    const stored = cloneArtifact(artifact);

    this.artifacts.set(artifact.identity.artifact_id, stored);
    this.current.set(lookupKey(artifact.identity), artifact.identity.artifact_id);
  }

  async getById<T>(artifactId: string): Promise<Artifact<T> | null> {
    const artifact = this.artifacts.get(artifactId);

    return artifact ? cloneArtifact(artifact) as Artifact<T> : null;
  }

  async getCurrent<T>(lookup: ArtifactLookup): Promise<Artifact<T> | null> {
    const artifactId = this.current.get(lookupKey(lookup));

    return artifactId ? this.getById<T>(artifactId) : null;
  }

  async getHistory<T>(lookup: ArtifactLookup): Promise<Artifact<T>[]> {
    return [...this.artifacts.values()]
      .filter((artifact) =>
        artifact.identity.artifact_type === lookup.artifact_type
        && artifact.identity.company_id === lookup.company_id
        && artifact.identity.period_id === lookup.period_id)
      .sort((left, right) => left.identity.version - right.identity.version)
      .map((artifact) => cloneArtifact(artifact) as Artifact<T>);
  }
}

function lookupKey(lookup: ArtifactLookup): string {
  return `${lookup.artifact_type}:${lookup.company_id ?? ""}:${lookup.period_id ?? ""}`;
}

function cloneArtifact<T>(artifact: Artifact<T>): Artifact<T> {
  return JSON.parse(JSON.stringify(artifact)) as Artifact<T>;
}
