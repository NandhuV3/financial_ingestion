import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  fiscalPeriod,
  loadNormalizedFilingBuilderInput,
} from "../normalized-filing-adapter.js";

describe("normalized filing adapter", () => {
  it("derives fiscal periods from SEC report dates and fiscal year ends", () => {
    assert.equal(fiscalPeriod("2026-03-31", "0630"), "2026-Q3");
    assert.equal(fiscalPeriod("2025-09-30", "0630"), "2026-Q1");
    assert.equal(fiscalPeriod("2025-12-31", "1231"), "2025-Q4");
  });

  it("loads the real normalized MSFT filing inputs without demo identifiers", async () => {
    const loaded = await loadNormalizedFilingBuilderInput({
      ticker: "MSFT",
      filingDate: "2026-04-29",
    });

    assert.equal(loaded.filingDate, "2026-04-29");
    assert.equal(loaded.builderInput.company_id, "MSFT");
    assert.equal(loaded.builderInput.period_id, "2026-Q3");
    assert.equal(loaded.builderInput.filing_period, "2026-Q3");
    assert.equal(loaded.builderInput.filing_type, "10-Q");
    assert.equal(
      loaded.builderInput.filing_id,
      "0001193125-26-191507",
    );
    assert.equal(loaded.builderInput.management_discussion.length > 1_000, true);
    assert.equal(loaded.builderInput.risk_factors.length > 1_000, true);
    assert.match(loaded.builderInput.raw_html_hash, /^[a-f0-9]{64}$/);

    const serialized = JSON.stringify(loaded);
    assert.doesNotMatch(serialized, /demo-filing-msft-2026-q2/);
    assert.doesNotMatch(serialized, /demo-filing-source-hash/);
    assert.doesNotMatch(serialized, /demo-filing-input/);
  });
});
