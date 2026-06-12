import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateStructuredIntelligenceQualityMetrics,
  validateStructuredIntelligenceOutput,
} from "../src/structured-intelligence/structured-intelligence.validation.js";
import {
  buildStructuredIntelligence,
} from "../src/structured-intelligence/build-structured-intelligence.js";
import {
  buildStructuredIntelligencePromptInput,
} from "../src/structured-intelligence/build-structured-intelligence.prompt.js";
import {
  buildStructuredIntelligencePromptProvenance,
} from "../src/structured-intelligence/generate-structured-intelligence.js";
import type { StructuredIntelligenceLLMOutput } from "../src/structured-intelligence/types/build-structured-intelligence.prompt.types.js";

describe("structured intelligence validation", () => {
  it("accepts valid schema-shaped output without coercion", () => {
    const output = validOutput();

    assert.deepEqual(validateStructuredIntelligenceOutput(output), output);
  });

  it("rejects string values where string arrays are required", () => {
    assert.throws(
      () => validateStructuredIntelligenceOutput({
        ...validOutput(),
        products: "Azure",
      }),
      /products.*string array/,
    );
  });

  it("rejects null values", () => {
    assert.throws(
      () => validateStructuredIntelligenceOutput({
        ...validOutput(),
        customers: null,
      }),
      /customers.*required/,
    );
  });

  it("rejects missing required fields", () => {
    const { risks: _risks, ...missingRisks } = validOutput();

    assert.throws(
      () => validateStructuredIntelligenceOutput(missingRisks),
      /missing required field "risks"/,
    );
  });

  it("calculates artifact quality metrics from populated and empty fields", () => {
    const metrics = calculateStructuredIntelligenceQualityMetrics({
      ...validOutput(),
      key_dependencies: [],
      opportunities: [],
    });

    assert.equal(metrics.field_coverage, 0.8);
    assert.deepEqual(metrics.empty_fields, ["key_dependencies", "opportunities"]);
    assert.ok(metrics.populated_fields.includes("business_description"));
    assert.ok(metrics.populated_fields.includes("products"));
  });

  it("builds Structured Intelligence artifacts with prompt provenance", () => {
    const artifacts = {
      filingMetadata: {
        company: "Microsoft",
        ticker: "MSFT",
        filing_date: "2026-04-29",
        form_type: "10-Q",
        accession_number: "0000000000-00-000000",
      },
      themes: null,
      topicAssignments: null,
      quarterChanges: null,
      topicEvolution: null,
    };
    const promptInput = buildStructuredIntelligencePromptInput(artifacts);
    const promptProvenance = buildStructuredIntelligencePromptProvenance({
      promptId: "structured-intelligence-system",
      version: "structured-intelligence-v1",
      content: "system",
      source: "filesystem",
      activationId: "activation-1",
    }, "user prompt");
    const artifact = buildStructuredIntelligence({
      artifacts,
      promptInput,
      output: validOutput(),
      paths: {
        filingMetadata: "metadata/filing.json",
        themes: "intelligence/themes.json",
        topicAssignments: "intelligence/themes.with-topics.json",
        quarterChanges: "comparison/quarter-change-report.json",
        topicEvolution: "reports/topic-evolution-report.json",
      },
      promptProvenance,
      generatedAt: "2026-06-12T00:00:00.000Z",
    });

    assert.deepEqual(artifact.metadata.prompt_provenance, promptProvenance);
    assert.equal(artifact.lineage.prompt_version, promptProvenance.prompt_version);
    assert.equal(artifact.metadata.prompt_provenance.activation_id, "activation-1");
  });
});

function validOutput(): StructuredIntelligenceLLMOutput {
  return {
    business_description: "Microsoft provides software and cloud services to organizations.",
    products: ["Azure", "Microsoft 365"],
    customers: ["Enterprises"],
    revenue_drivers: ["Cloud consumption"],
    competitive_positioning: ["Enterprise distribution"],
    operating_model: ["Cloud infrastructure"],
    key_dependencies: ["Data centers"],
    strategic_priorities: ["AI infrastructure"],
    risks: ["Competition"],
    opportunities: ["Cloud adoption"],
  };
}
