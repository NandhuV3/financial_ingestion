import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateCompanyProfileRawHash } from "../src/company-profile/enrichment/build-company-profile-enrichment-prompt.js";
import { decideCompanyProfileEnrichment } from "../src/company-profile/enrichment/enrich-company-profile.js";
import type { CompanyProfileRaw } from "../src/company-profile/company-profile.types.js";

describe("company profile enrichment", () => {
  it("hashes raw profiles deterministically", () => {
    const firstHash = calculateCompanyProfileRawHash(rawProfile());
    const secondHash = calculateCompanyProfileRawHash({ ...rawProfile() });

    assert.equal(firstHash, secondHash);
  });

  it("skips profile enrichment because company identity owns business understanding", () => {
    const decision = decideCompanyProfileEnrichment();

    assert.equal(decision.shouldGenerate, false);
    assert.equal(decision.status, "skipped");
    assert.equal(decision.reason, "identity_owns_business_understanding");
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
