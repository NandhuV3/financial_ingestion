import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildCompanyIdentityEvidence } from "../src/company-identity/build-company-identity.js";
import { calculateCompanyIdentityEvidenceHash } from "../src/company-identity/enrichment/build-company-identity-enrichment-prompt.js";
import {
  decideCompanyIdentityEnrichment,
  validateCompanyIdentityEnrichmentOutput,
} from "../src/company-identity/enrichment/enrich-company-identity.js";
import { writeJsonFile } from "../src/shared/filesystem/file-writer.js";
import type { CompanyIdentityEvidence } from "../src/company-identity/company-identity.types.js";
import type { FilingMetadata } from "../src/types/pipeline.types.js";
import type { Theme } from "../src/types/theme.types.js";

describe("company identity intelligence", () => {
  it("builds deterministic identity evidence without synthesizing a business description", () => {
    const evidence = buildCompanyIdentityEvidence(artifacts());

    assert.equal(evidence.company, "Microsoft");
    assert.equal("business_description" in evidence, false);
    assert.ok(evidence.themes.includes("Cloud Revenue Growth"));
    assert.ok(evidence.topics.includes("cloud"));
    assert.ok(evidence.products.includes("cloud infrastructure"));
    assert.ok(evidence.customers.includes("businesses and organizations"));
    assert.equal(evidence.narrative_summary, "Microsoft provides software, cloud infrastructure, developer tools, and AI platforms used by organizations around the world.");
  });

  it("gathers products, customers, opportunities, and risks as evidence", () => {
    const evidence = buildCompanyIdentityEvidence(artifacts());

    assert.ok(evidence.products.includes("software products"));
    assert.ok(evidence.customers.includes("developers and technology teams"));
    assert.ok(evidence.opportunities.some((opportunity) => opportunity.includes("cloud consumption")));
    assert.ok(evidence.risks.includes("competition"));
    assert.ok(evidence.risks.includes("cybersecurity"));
    assert.ok(evidence.risks.includes("supply chain and manufacturing"));
  });

  it("hashes evidence deterministically for enrichment caching", () => {
    const firstHash = calculateCompanyIdentityEvidenceHash(evidence());
    const secondHash = calculateCompanyIdentityEvidenceHash({ ...evidence(), themes: [...evidence().themes] });

    assert.equal(firstHash, secondHash);
  });

  it("skips enrichment when evidence hash is unchanged", () => {
    const decision = decideCompanyIdentityEnrichment({
      enrichedExists: true,
      previousInputHash: "hash-1",
      currentInputHash: "hash-1",
    });

    assert.equal(decision.shouldGenerate, false);
    assert.equal(decision.status, "skipped");
    assert.equal(decision.reason, "evidence_unchanged");
  });

  it("generates enrichment when evidence changes or output is missing", () => {
    const changed = decideCompanyIdentityEnrichment({
      enrichedExists: true,
      previousInputHash: "hash-1",
      currentInputHash: "hash-2",
    });
    const missing = decideCompanyIdentityEnrichment({
      enrichedExists: false,
      previousInputHash: null,
      currentInputHash: "hash-1",
    });

    assert.equal(changed.shouldGenerate, true);
    assert.equal(changed.reason, "evidence_changed");
    assert.equal(missing.shouldGenerate, true);
  });

  it("validates enriched identity output shape", () => {
    const output = validateCompanyIdentityEnrichmentOutput({
      business_description: "Microsoft provides software and cloud services to organizations.",
      primary_products: [" software products ", "cloud infrastructure"],
      primary_customers: ["businesses and organizations"],
      revenue_drivers: ["software subscriptions"],
      business_model_signals: ["recurring revenue"],
      competitive_signals: ["ecosystem strength"],
      operating_signals: ["cloud infrastructure"],
    });

    assert.deepEqual(output.primary_products, ["software products", "cloud infrastructure"]);
    assert.throws(() => validateCompanyIdentityEnrichmentOutput({
      business_description: "",
      primary_products: [],
      primary_customers: [],
      revenue_drivers: [],
      business_model_signals: [],
      competitive_signals: [],
      operating_signals: [],
    }));
  });

  it("rejects theme-shaped revenue drivers and risk-shaped signals", () => {
    const baseOutput = {
      business_description: "Microsoft provides software and cloud services to organizations.",
      primary_products: ["software products"],
      primary_customers: ["businesses and organizations"],
      revenue_drivers: ["software subscriptions"],
      business_model_signals: ["recurring revenue"],
      competitive_signals: ["ecosystem strength"],
      operating_signals: ["cloud infrastructure"],
    };

    assert.throws(() => validateCompanyIdentityEnrichmentOutput({
      ...baseOutput,
      revenue_drivers: ["Cloud Revenue Growth"],
    }, evidence()));
    assert.throws(() => validateCompanyIdentityEnrichmentOutput({
      ...baseOutput,
      revenue_drivers: ["AI investment"],
    }, evidence()));
    assert.throws(() => validateCompanyIdentityEnrichmentOutput({
      ...baseOutput,
      competitive_signals: ["intense competition from global firms"],
    }, evidence()));
    assert.throws(() => validateCompanyIdentityEnrichmentOutput({
      ...baseOutput,
      operating_signals: ["supplier limitations"],
    }, evidence()));
    assert.throws(() => validateCompanyIdentityEnrichmentOutput({
      ...baseOutput,
      operating_signals: ["logistics network"],
    }, evidence()));
    assert.throws(() => validateCompanyIdentityEnrichmentOutput({
      ...baseOutput,
      business_description: "Microsoft is a leading company providing software.",
    }, evidence()));
    assert.throws(() => validateCompanyIdentityEnrichmentOutput(baseOutput, {
      company: "Amazon",
      themes: [],
      topics: [],
      products: [],
      customers: [],
      risks: [],
      opportunities: [],
      filing_dates: ["2026-04-30"],
    }));
  });

  it("falls back to metadata-only evidence without synthesis", () => {
    const evidence = buildCompanyIdentityEvidence({
      filing: metadata(),
      themes: null,
      topicAssignments: null,
      insight: null,
      narrative: null,
      quarterChange: null,
      topicEvolution: null,
    });

    assert.equal(evidence.company, "Microsoft");
    assert.deepEqual(evidence.themes, []);
    assert.deepEqual(evidence.topics, []);
    assert.deepEqual(evidence.products, []);
    assert.deepEqual(evidence.customers, []);
    assert.deepEqual(evidence.filing_dates, ["2026-04-29"]);
  });

  it("writes artifact-shaped evidence output", async () => {
    const dir = await mkdtemp(join(tmpdir(), "company-identity-evidence-"));
    const outputPath = join(dir, "company-identity.evidence.json");
    const output = buildCompanyIdentityEvidence(artifacts());

    await writeJsonFile(outputPath, output);

    const saved = JSON.parse(await readFile(outputPath, "utf8")) as typeof output;

    assert.equal(saved.company, "Microsoft");
    assert.ok(saved.themes.length > 0);
    assert.ok(saved.risks.length > 0);
  });
});

function evidence(): CompanyIdentityEvidence {
  return {
    company: "Microsoft",
    themes: ["Cloud Revenue Growth"],
    topics: ["cloud"],
    products: ["cloud infrastructure", "software products"],
    customers: ["businesses and organizations"],
    risks: ["competition"],
    opportunities: ["cloud consumption"],
    narrative_summary: "Microsoft provides software and cloud services.",
    filing_dates: ["2026-04-29"],
  };
}

function artifacts() {
  const themes = [
    theme("Cloud Revenue Growth", "growth", "high", "Cloud revenue increased as businesses adopted more Azure services and software subscriptions."),
    theme("Investment in AI Infrastructure", "investments", "high", "The company invested in AI infrastructure, datacenter capacity, and developer platforms."),
    theme("Competitive Market Landscape", "competition", "high", "The company faces competition in cloud and AI services."),
    theme("Cybersecurity Challenges", "cybersecurity", "high", "Cybersecurity incidents could affect customer trust."),
    theme("Supply Chain Risks", "supply_chain", "medium", "Limited supplier options for components pose production risks."),
  ];

  return {
    filing: metadata(),
    themes: {
      company: "Microsoft",
      ticker: "MSFT",
      filing_date: "2026-04-29",
      themes,
    },
    topicAssignments: {
      company: "Microsoft",
      ticker: "MSFT",
      filing_date: "2026-04-29",
      themes: themes.map((theme) => ({
        ...theme,
        topic_id: theme.category === "growth" ? "cloud" : theme.category,
        confidence: null,
        assignment_method: "manual" as const,
        recommendation_method: null,
        recommendation_reason: null,
        assignment_status: "approved" as const,
      })),
    },
    insight: {
      company: "Microsoft",
      ticker: "MSFT",
      filing_date: "2026-04-29",
      previous_filing_date: "2026-01-28",
      headline: "Microsoft cloud revenue growth remains visible.",
      executive_summary: "Microsoft serves businesses and organizations with cloud infrastructure, software subscriptions, developer tools, and AI services.",
      key_changes: [],
      new_topics: [],
      removed_topics: [],
      risks: ["competition received more supporting references", "cybersecurity remains high importance"],
      opportunities: ["cloud consumption and software subscriptions remain revenue drivers"],
      source: {
        current_filing: metadata(),
        previous_filing: null,
        quarter_change_report: "comparison/quarter-change-report.json",
        themes: "intelligence/themes.json",
      },
    },
    narrative: {
      headline: "Microsoft emphasizes cloud and AI infrastructure.",
      executive_summary: "Microsoft provides software, cloud infrastructure, developer tools, and AI platforms used by organizations around the world.",
      what_changed: "Cloud infrastructure and AI investments remained prominent.",
      bull_case: "The business benefits from recurring software subscriptions, cloud consumption, and an ecosystem of developers.",
      bear_case: "Competition, cybersecurity, and supply chain risks could pressure operations.",
      investor_takeaway: "The business remains enterprise-focused and infrastructure-intensive.",
    },
    quarterChange: null,
    topicEvolution: null,
  };
}

function metadata(): FilingMetadata {
  return {
    company: "Microsoft",
    ticker: "MSFT",
    filing_date: "2026-04-29",
    form_type: "10-Q",
    accession_number: "0000000000-00-000000",
  };
}

function theme(
  name: string,
  category: string,
  importance: Theme["importance"],
  summary: string,
): Theme {
  return {
    theme: name,
    category,
    importance,
    summary,
    evidence: ["chunk_001"],
  };
}
