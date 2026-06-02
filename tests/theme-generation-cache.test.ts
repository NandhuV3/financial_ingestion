import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { decideThemeGeneration } from "../src/pipeline/theme-generation-cache.js";

describe("theme generation cache", () => {
  it("generates themes when themes are missing", () => {
    const decision = decideThemeGeneration({
      themesExist: false,
      storedChunkHash: "hash-a",
      currentChunkHash: "hash-a",
    });

    assert.equal(decision.shouldGenerate, true);
    assert.equal(decision.status, "generated");
    assert.equal(decision.reason, "themes_missing");
  });

  it("skips theme generation when themes exist and chunk hash is unchanged", () => {
    const decision = decideThemeGeneration({
      themesExist: true,
      storedChunkHash: "hash-a",
      currentChunkHash: "hash-a",
    });

    assert.equal(decision.shouldGenerate, false);
    assert.equal(decision.status, "skipped");
    assert.equal(decision.reason, "chunks_unchanged");
  });

  it("generates themes when themes exist and chunk hash changed", () => {
    const decision = decideThemeGeneration({
      themesExist: true,
      storedChunkHash: "hash-a",
      currentChunkHash: "hash-b",
    });

    assert.equal(decision.shouldGenerate, true);
    assert.equal(decision.status, "generated");
    assert.equal(decision.reason, "chunk_changes_detected");
  });
});
