import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildCompanyKnowledge,
  calculateCompanyKnowledgeInputHash,
  type BuildCompanyKnowledgeInputs,
} from "../src/company-knowledge/build-company-knowledge.js";

describe("company knowledge builder", () => {
  it("assembles Company Knowledge from Company Identity first", () => {
    const knowledge = buildCompanyKnowledge(inputs());

    assert.equal(knowledge.company, "Microsoft");
    assert.equal(knowledge.business_description, "Microsoft provides cloud services and software subscriptions to businesses.");
    assert.equal(knowledge.business_model.value_creation, "Microsoft provides cloud services and software subscriptions to businesses.");
    assert.equal(knowledge.business_model.monetization, "software subscriptions; cloud consumption");
    assert.equal(knowledge.business_model.revenue_structure, "mixed");
    assert.deepEqual(knowledge.products, ["cloud services", "software products"]);
    assert.deepEqual(knowledge.customers, ["businesses", "developers"]);
    assert.deepEqual(knowledge.revenue_drivers, ["software subscriptions", "cloud consumption"]);
    assert.deepEqual(knowledge.competitive_positioning, [
      {
        signal: "developer ecosystem",
        source_type: "observed",
      },
    ]);
    assert.deepEqual(knowledge.operating_model, ["cloud infrastructure"]);
    assert.deepEqual(knowledge.key_dependencies, []);
  });

  it("falls back to Company Profile when Company Identity is missing", () => {
    const knowledge = buildCompanyKnowledge({
      ...inputs(),
      companyIdentity: null,
    });

    assert.equal(knowledge.business_description, "Legacy profile business model.");
    assert.deepEqual(knowledge.products, ["legacy product"]);
    assert.deepEqual(knowledge.customers, ["legacy customer"]);
    assert.deepEqual(knowledge.competitive_positioning, [
      {
        signal: "legacy advantage",
        source_type: "claimed",
      },
    ]);
  });

  it("uses filing metadata and empty fallback when identity and profile are missing", () => {
    const knowledge = buildCompanyKnowledge({
      filingMetadata: inputs().filingMetadata,
      generatedAt: "2026-06-08T00:00:00.000Z",
    });

    assert.equal(knowledge.company, "Microsoft");
    assert.equal(knowledge.business_description, "");
    assert.equal(knowledge.business_model.value_creation, "");
    assert.equal(knowledge.business_model.monetization, "");
    assert.equal(knowledge.business_model.revenue_structure, "mixed");
    assert.deepEqual(knowledge.products, []);
    assert.deepEqual(knowledge.customers, []);
  });

  it("calculates deterministic confidence and lineage", () => {
    const knowledge = buildCompanyKnowledge(inputs());

    assert.equal(knowledge.confidence.overall, 0.96);
    assert.equal(knowledge.confidence.filing_depth, 1);
    assert.equal(knowledge.confidence.field_coverage, 0.86);
    assert.deepEqual(knowledge.lineage.source_filings, [
      {
        id: "0000000000-00-000000",
        period: "2026-04-29",
        type: "10-Q",
      },
      {
        id: "2026-04-29",
        period: "2026-04-29",
        type: "unknown",
      },
    ]);
    assert.deepEqual(knowledge.lineage.derived_from, [
      "company-identity",
      "company-profile.enriched",
      "filing-metadata",
      "themes",
    ]);
    assert.equal(knowledge.lineage.model_version, "deterministic-v1");
    assert.equal(knowledge.lineage.prompt_version, "none");
  });

  it("hashes normalized inputs without volatile generated timestamps", () => {
    const first = inputs();
    const second = inputs();

    second.companyIdentity = {
      ...second.companyIdentity!,
      enrichment: {
        ...second.companyIdentity!.enrichment,
        generated_at: "2099-01-01T00:00:00.000Z",
      },
    };

    assert.equal(calculateCompanyKnowledgeInputHash(first), calculateCompanyKnowledgeInputHash(second));
  });

  it("does not convert business risks into key dependencies", () => {
    const knowledge = buildCompanyKnowledge({
      ...inputs(),
      companyIdentity: null,
    });

    assert.deepEqual(knowledge.key_dependencies, []);
  });

  it("applies field-level source precedence from identity before profile and metadata", () => {
    const knowledge = buildCompanyKnowledge({
      ...inputs(),
      companyIdentity: {
        ...inputs().companyIdentity!,
        business_description: "Identity description wins.",
        primary_products: ["identity product"],
        primary_customers: ["identity customer"],
        revenue_drivers: ["identity revenue driver"],
        competitive_signals: ["identity competitive signal"],
      },
      companyProfile: {
        ...inputs().companyProfile!,
        business_model: "Profile description loses.",
        products: ["profile product"],
        customers: ["profile customer"],
        competitive_advantages: ["profile advantage"],
      },
      filingMetadata: {
        ...inputs().filingMetadata!,
        company: "Metadata Company",
      },
    });

    assert.equal(knowledge.company, "Microsoft");
    assert.equal(knowledge.business_description, "Identity description wins.");
    assert.deepEqual(knowledge.products, ["identity product"]);
    assert.deepEqual(knowledge.customers, ["identity customer"]);
    assert.deepEqual(knowledge.revenue_drivers, ["identity revenue driver"]);
    assert.deepEqual(knowledge.competitive_positioning, [{
      signal: "identity competitive signal",
      source_type: "observed",
    }]);
  });

  it("uses profile field fallbacks independently when identity fields are missing", () => {
    const source = inputs();
    const knowledge = buildCompanyKnowledge({
      ...source,
      companyIdentity: {
        ...source.companyIdentity!,
        business_description: "",
        primary_products: [],
        primary_customers: [],
        revenue_drivers: [],
        competitive_signals: [],
      },
    });

    assert.equal(knowledge.business_description, "Legacy profile business model.");
    assert.deepEqual(knowledge.products, ["legacy product"]);
    assert.deepEqual(knowledge.customers, ["legacy customer"]);
    assert.deepEqual(knowledge.revenue_drivers, []);
    assert.deepEqual(knowledge.competitive_positioning, [{
      signal: "legacy advantage",
      source_type: "claimed",
    }]);
  });

  it("returns a valid empty CompanyKnowledge object for empty inputs", () => {
    const knowledge = buildCompanyKnowledge({});

    assert.equal(knowledge.company, "");
    assert.equal(knowledge.business_description, "");
    assert.equal(knowledge.business_model.value_creation, "");
    assert.equal(knowledge.business_model.monetization, "");
    assert.equal(knowledge.business_model.revenue_structure, "mixed");
    assert.deepEqual(knowledge.products, []);
    assert.deepEqual(knowledge.customers, []);
    assert.deepEqual(knowledge.revenue_drivers, []);
    assert.deepEqual(knowledge.competitive_positioning, []);
    assert.deepEqual(knowledge.operating_model, []);
    assert.deepEqual(knowledge.key_dependencies, []);
    assertValidConfidence(knowledge.confidence);
    assert.equal(knowledge.confidence.overall, 0);
    assert.equal(knowledge.metadata.schema_version, "1.0.0");
    assert.equal(knowledge.metadata.pipeline_version, "company-knowledge-builder-v1");
    assert.equal(knowledge.metadata.knowledge_version, 1);
    assert.ok(knowledge.metadata.generated_at);
    assert.ok(knowledge.metadata.input_hash);
    assert.deepEqual(knowledge.lineage.source_filings, []);
    assert.deepEqual(knowledge.lineage.derived_from, []);
    assert.equal(knowledge.lineage.model_version, "deterministic-v1");
    assert.equal(knowledge.lineage.prompt_version, "none");
    assertNoUndefined(knowledge);
  });

  it("keeps hashes stable for equivalent inputs and changed for real input changes", () => {
    const first = inputs();
    const same = {
      ...inputs(),
      derivedFrom: ["themes"],
    };
    const reordered = {
      ...inputs(),
      derivedFrom: ["extra", "themes"],
    };
    const reorderedSame = {
      ...inputs(),
      derivedFrom: ["themes", "extra"],
    };
    const changed = {
      ...inputs(),
      companyIdentity: {
        ...inputs().companyIdentity!,
        primary_products: ["different product"],
      },
    };

    assert.equal(calculateCompanyKnowledgeInputHash(first), calculateCompanyKnowledgeInputHash(same));
    assert.equal(calculateCompanyKnowledgeInputHash(reordered), calculateCompanyKnowledgeInputHash(reorderedSame));
    assert.notEqual(calculateCompanyKnowledgeInputHash(first), calculateCompanyKnowledgeInputHash(changed));
  });

  it("deduplicates lineage and preserves stable ordering", () => {
    const knowledge = buildCompanyKnowledge({
      ...inputs(),
      companyProfile: {
        ...inputs().companyProfile!,
        source_filings: ["2026-04-29", "2025-10-29", "2026-04-29"],
      },
      derivedFrom: ["themes", "themes", "company-identity"],
    });

    assert.deepEqual(knowledge.lineage.source_filings, [
      {
        id: "2025-10-29",
        period: "2025-10-29",
        type: "unknown",
      },
      {
        id: "0000000000-00-000000",
        period: "2026-04-29",
        type: "10-Q",
      },
      {
        id: "2026-04-29",
        period: "2026-04-29",
        type: "unknown",
      },
    ]);
    assert.deepEqual(knowledge.lineage.derived_from, [
      "company-identity",
      "company-profile.enriched",
      "filing-metadata",
      "themes",
    ]);
  });

  it("scores more complete inputs higher than incomplete inputs", () => {
    const complete = buildCompanyKnowledge(inputs());
    const missingIdentity = buildCompanyKnowledge({
      ...inputs(),
      companyIdentity: null,
    });
    const missingLineage = buildCompanyKnowledge({
      companyIdentity: inputs().companyIdentity,
      companyProfile: null,
      filingMetadata: null,
      derivedFrom: [],
    });
    const empty = buildCompanyKnowledge({});

    assert.ok(complete.confidence.overall > missingIdentity.confidence.overall);
    assert.ok(missingIdentity.confidence.overall > empty.confidence.overall);
    assert.ok(complete.confidence.overall > missingLineage.confidence.overall);

    for (const confidence of [
      complete.confidence,
      missingIdentity.confidence,
      missingLineage.confidence,
      empty.confidence,
    ]) {
      assertValidConfidence(confidence);
    }
  });

  it("is deterministic for repeated executions with the same generated_at", () => {
    const first = buildCompanyKnowledge(inputs());
    const second = buildCompanyKnowledge(inputs());

    assert.deepEqual(first, second);
  });

  it("is structurally deterministic across executions excluding generated_at", () => {
    const first = buildCompanyKnowledge({
      ...inputs(),
      generatedAt: "2026-06-08T00:00:00.000Z",
    });
    const second = buildCompanyKnowledge({
      ...inputs(),
      generatedAt: "2026-06-09T00:00:00.000Z",
    });

    assert.deepEqual(
      { ...first, metadata: { ...first.metadata, generated_at: "<ignored>" } },
      { ...second, metadata: { ...second.metadata, generated_at: "<ignored>" } },
    );
  });

  it("does not throw for documented missing-input failure modes", () => {
    const cases: BuildCompanyKnowledgeInputs[] = [
      { ...inputs(), companyIdentity: null },
      { ...inputs(), companyProfile: null },
      { ...inputs(), filingMetadata: null },
      { ...inputs(), derivedFrom: [] },
      {},
    ];

    for (const params of cases) {
      assert.doesNotThrow(() => buildCompanyKnowledge(params));
      assertNoUndefined(buildCompanyKnowledge(params));
    }
  });
});

function inputs(): BuildCompanyKnowledgeInputs {
  return {
    companyIdentity: {
      company: "Microsoft",
      business_description: "Microsoft provides cloud services and software subscriptions to businesses.",
      primary_products: ["cloud services", "software products"],
      primary_customers: ["businesses", "developers"],
      revenue_drivers: ["software subscriptions", "cloud consumption"],
      business_model_signals: ["recurring revenue"],
      competitive_signals: ["developer ecosystem"],
      operating_signals: ["cloud infrastructure"],
      enrichment: {
        model: "test",
        generated_at: "2026-06-08T00:00:00.000Z",
        input_hash: "identity-hash",
      },
    },
    companyProfile: {
      company: "Microsoft",
      products: ["legacy product"],
      customers: ["legacy customer"],
      business_risks: ["supplier concentration"],
      themes: [],
      topics: [],
      source_filings: ["2026-04-29", "2026-04-29"],
      business_model: "Legacy profile business model.",
      competitive_advantages: ["legacy advantage"],
      customer_value_proposition: "Legacy customer value.",
      profile_quality: "enriched",
      enrichment: {
        model: "test",
        generated_at: "2026-06-08T00:00:00.000Z",
        input_hash: "profile-hash",
      },
    },
    filingMetadata: {
      company: "Microsoft",
      ticker: "MSFT",
      filing_date: "2026-04-29",
      form_type: "10-Q",
      accession_number: "0000000000-00-000000",
    },
    derivedFrom: ["themes"],
    generatedAt: "2026-06-08T00:00:00.000Z",
  };
}

function assertValidConfidence(confidence: { overall: number; filing_depth: number; field_coverage: number }) {
  for (const value of [confidence.overall, confidence.filing_depth, confidence.field_coverage]) {
    assert.ok(value >= 0, `Expected confidence ${value} to be >= 0`);
    assert.ok(value <= 1, `Expected confidence ${value} to be <= 1`);
  }
}

function assertNoUndefined(value: unknown): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      assertNoUndefined(item);
    }

    return;
  }

  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      assert.notEqual(item, undefined, `Unexpected undefined at ${key}`);
      assertNoUndefined(item);
    }
  }
}
