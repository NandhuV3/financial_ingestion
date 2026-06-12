import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildThemeGenerationReport,
  decideThemeGeneration,
} from "../src/pipeline/theme-generation-cache.js";
import { buildThemePromptProvenance } from "../src/themes/generate-themes.js";

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

  it("builds theme generation reports with prompt provenance", () => {
    const promptProvenance = {
      prompt_id: "theme-generation-system",
      prompt_version: "theme-generation-v1",
      prompt_hash: "prompt-hash",
      prompt_source: "filesystem" as const,
      activation_id: null,
    };
    const report = buildThemeGenerationReport({
      status: "generated",
      reason: "themes_missing",
      estimatedInputTokens: 123,
      chunkHash: "chunk-hash",
      modelVersion: "gpt-test",
      promptProvenance,
    });

    assert.equal(report.model_version, "gpt-test");
    assert.deepEqual(report.prompt_provenance, promptProvenance);
  });

  it("builds stable theme prompt provenance from the effective prompt payload", () => {
    const resolvedPrompt = {
      promptId: "theme-generation-system",
      version: "theme-generation-v1",
      content: "system",
      hash: "system-hash",
      source: "filesystem" as const,
      activationId: "activation-1",
    };
    const provenance = buildThemePromptProvenance(resolvedPrompt, "user");

    assert.equal(provenance.prompt_id, "theme-generation-system");
    assert.equal(provenance.prompt_version, "theme-generation-v1");
    assert.equal(provenance.prompt_source, "filesystem");
    assert.equal(provenance.activation_id, "activation-1");
    assert.equal(
      provenance.prompt_hash,
      buildThemePromptProvenance(resolvedPrompt, "user").prompt_hash,
    );
    assert.notEqual(
      provenance.prompt_hash,
      buildThemePromptProvenance(resolvedPrompt, "different user").prompt_hash,
    );
  });
});
