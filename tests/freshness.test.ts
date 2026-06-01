import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { detectSourceHashFreshness } from "../src/reporting/check-artifact-freshness.js";

describe("artifact freshness", () => {
  it("returns healthy when source hash matches stored hash", () => {
    assert.equal(detectSourceHashFreshness("abc123", "abc123"), "healthy");
  });

  it("returns stale when source hash differs from stored hash", () => {
    assert.equal(detectSourceHashFreshness("abc123", "def456"), "stale");
  });
});
