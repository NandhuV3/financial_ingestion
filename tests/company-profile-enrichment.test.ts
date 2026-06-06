import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateCompanyProfileRawHash } from "../src/company-profile/enrichment/build-company-profile-enrichment-prompt.js";
import { decideCompanyProfileEnrichment, mergeEnrichment } from "../src/company-profile/enrichment/enrich-company-profile.js";
import type { CompanyProfileRaw } from "../src/company-profile/company-profile.types.js";

describe("company profile enrichment", () => {
  it("hashes raw profiles deterministically", () => {
    const firstHash = calculateCompanyProfileRawHash(rawProfile());
    const secondHash = calculateCompanyProfileRawHash({ ...rawProfile() });

    assert.equal(firstHash, secondHash);
  });

  it("skips enrichment when raw profile hash is unchanged", () => {
    const decision = decideCompanyProfileEnrichment({
      enrichedExists: true,
      previousInputHash: "hash-1",
      currentInputHash: "hash-1",
    });

    assert.equal(decision.shouldGenerate, false);
    assert.equal(decision.status, "skipped");
    assert.equal(decision.reason, "raw_profile_unchanged");
  });

  it("generates enrichment when raw profile hash changed or output is missing", () => {
    const changed = decideCompanyProfileEnrichment({
      enrichedExists: true,
      previousInputHash: "hash-1",
      currentInputHash: "hash-2",
    });
    const missing = decideCompanyProfileEnrichment({
      enrichedExists: false,
      previousInputHash: null,
      currentInputHash: "hash-1",
    });

    assert.equal(changed.shouldGenerate, true);
    assert.equal(changed.reason, "raw_profile_changed");
    assert.equal(missing.shouldGenerate, true);
  });

  it("merges only allowed LLM-enriched fields and preserves deterministic fields", () => {
    const raw = rawProfile();
    const enriched = mergeEnrichment(raw, {
      business_model: "Microsoft sells software and cloud services to organizations.",
      competitive_advantages: ["deep customer relationships", "large cloud platform"],
      customer_value_proposition: "Customers use Microsoft to run everyday digital work reliably.",
    }, {
      model: "gpt-4o-mini",
      generated_at: "2026-06-06T00:00:00.000Z",
      input_hash: "hash-1",
    });

    assert.equal(enriched.business_model, "Microsoft sells software and cloud services to organizations.");
    assert.deepEqual(enriched.products, raw.products);
    assert.deepEqual(enriched.customers, raw.customers);
    assert.deepEqual(enriched.business_risks, raw.business_risks);
    assert.deepEqual(enriched.themes, raw.themes);
    assert.deepEqual(enriched.topics, raw.topics);
    assert.deepEqual(enriched.source_filings, raw.source_filings);
    assert.equal(enriched.profile_quality, "enriched");
    assert.equal(enriched.enrichment.input_hash, "hash-1");
  });
});

function rawProfile(): CompanyProfileRaw {
  return {
    company: "Microsoft",
    products: ["cloud services", "software products"],
    customers: ["businesses and organizations"],
    business_risks: ["competition"],
    themes: ["Cloud Revenue Growth"],
    topics: ["cloud"],
    source_filings: ["2026-04-29"],
    profile_quality: "raw",
  };
}
