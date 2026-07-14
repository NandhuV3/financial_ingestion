import assert from "node:assert/strict";
import test from "node:test";
import {
  STRUCTURED_INTELLIGENCE_BUILDER_TYPE,
  STRUCTURED_INTELLIGENCE_BUSINESS_SCOPE,
  STRUCTURED_INTELLIGENCE_CONTRACT_VERSION,
  STRUCTURED_INTELLIGENCE_MODELS_CONTRACT_VERSION,
  STRUCTURED_INTELLIGENCE_SCHEMA_VERSION,
  STRUCTURED_INTELLIGENCE_SECTION_IDS,
  type StructuredIntelligence,
  type StructuredIntelligenceBuilder,
  type StructuredIntelligenceEvidenceReference,
  type StructuredIntelligenceInput,
} from "../../packages/structured-intelligence/src/index.js";

test("Structured Intelligence contracts expose frozen public versions", () => {
  assert.equal(
    STRUCTURED_INTELLIGENCE_CONTRACT_VERSION,
    "structured-intelligence-contract-v1",
  );
  assert.equal(
    STRUCTURED_INTELLIGENCE_MODELS_CONTRACT_VERSION,
    "structured-intelligence-models-v1",
  );
  assert.equal(
    STRUCTURED_INTELLIGENCE_SCHEMA_VERSION,
    "structured-intelligence-artifact-v1",
  );
  assert.equal(STRUCTURED_INTELLIGENCE_BUILDER_TYPE, "structured-intelligence");
});

test("StructuredIntelligenceInput represents Filing Artifact and Themes only", () => {
  const input: StructuredIntelligenceInput = {
    company_id: "company-1",
    period_id: "period-1",
    filing_id: "filing-1",
    inputs: {
      filing_artifact: dependency("filing-artifact-1", "filing"),
      themes_artifact: dependency("themes-artifact-1", "themes"),
    },
  };

  assert.equal(input.inputs.filing_artifact.artifact_type, "filing");
  assert.equal(input.inputs.themes_artifact.artifact_type, "themes");
  assert.equal(
    Object.hasOwn(input.inputs, "topic_assignment"),
    false,
  );
});

test("StructuredIntelligence payload excludes operational metadata", () => {
  const content: StructuredIntelligence = {
    artifact_type: "structured_intelligence",
    company_id: "company-1",
    period_id: "period-1",
    filing_id: "filing-1",
    metadata: {
      schema_version: STRUCTURED_INTELLIGENCE_SCHEMA_VERSION,
      status: "complete",
      business_scope: STRUCTURED_INTELLIGENCE_BUSINESS_SCOPE,
      evidence_summary: {
        evidence_reference_count: 1,
        theme_reference_count: 1,
      },
    },
    payload: {
      business_model: {
        summary: "The filing describes a subscription software business.",
        value_creation: "The filing links customer usage to recurring value.",
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
    },
  };

  assert.equal(content.metadata.business_scope, "single_filing");
  assert.equal(Object.hasOwn(content, "lineage"), false);
  assert.equal(Object.hasOwn(content.metadata, "generated_at"), false);
  assert.equal(Object.hasOwn(content.metadata, "prompt_version"), false);
  assert.equal(Object.hasOwn(content.metadata, "model_version"), false);
});

test("Structured Intelligence section identifiers match governed business fields", () => {
  assert.deepEqual(STRUCTURED_INTELLIGENCE_SECTION_IDS, [
    "business_model",
    "products",
    "customers",
    "revenue_model",
    "revenue_drivers",
    "competitive_positioning",
    "strategic_priorities",
    "management_focus",
    "risks",
    "dependencies",
  ]);
});

test("StructuredIntelligenceBuilder is a Builder Framework-compatible contract", () => {
  const builder: StructuredIntelligenceBuilder = {
    builderType() {
      return STRUCTURED_INTELLIGENCE_BUILDER_TYPE;
    },
    async validateInput() {
      return undefined;
    },
    async execute() {
      return {
        content: {
          artifact_type: "structured_intelligence",
          company_id: "company-1",
          period_id: "period-1",
          filing_id: "filing-1",
          metadata: {
            schema_version: STRUCTURED_INTELLIGENCE_SCHEMA_VERSION,
            status: "partial",
            business_scope: STRUCTURED_INTELLIGENCE_BUSINESS_SCOPE,
            evidence_summary: {
              evidence_reference_count: 0,
              theme_reference_count: 0,
            },
          },
          payload: emptyPayload(),
        },
      };
    },
  };

  assert.equal(builder.builderType(), STRUCTURED_INTELLIGENCE_BUILDER_TYPE);
});

function dependency(artifactId: string, artifactType: "filing" | "themes") {
  return {
    artifact_id: artifactId,
    artifact_type: artifactType,
    version: 1,
    artifact_hash: `${artifactId}-hash`,
    input_hash: `${artifactId}-input-hash`,
  };
}

function evidenceReference(): StructuredIntelligenceEvidenceReference {
  return {
    evidence_ref: "evidence-1",
    evidence_hash: "evidence-hash-1",
    evidence_identity_id: "evidence-identity-1",
    filing_section: "Business",
    source_excerpt: "The company describes subscription software revenue.",
    theme_ids: ["theme-1"],
  };
}

function emptyPayload(): StructuredIntelligence["payload"] {
  return {
    business_model: null,
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
