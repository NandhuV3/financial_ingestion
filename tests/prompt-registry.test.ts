import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  CachePromptProvider,
  type CachedPrompt,
} from "../src/prompt-registry/cache-prompt-provider.js";
import {
  FilesystemPromptProvider,
  STRUCTURED_INTELLIGENCE_SYSTEM_PROMPT_ID,
  THEME_GENERATION_SYSTEM_PROMPT_ID,
} from "../src/prompt-registry/filesystem-prompt-provider.js";
import { FilePromptActivationStore } from "../src/prompt-registry/prompt-activation-store.js";
import type { PromptActivation } from "../src/prompt-registry/prompt-activation.types.js";
import { FilePromptEvaluationStore } from "../src/prompt-registry/prompt-evaluation-store.js";
import type { PromptEvaluation } from "../src/prompt-registry/prompt-evaluation.types.js";
import { refreshPromptCache } from "../src/prompt-registry/prompt-cache.js";
import { calculateEffectivePromptHash, calculatePromptHash } from "../src/prompt-registry/prompt-hash.js";
import { PromptResolver } from "../src/prompt-registry/prompt-resolver.js";
import type { PromptProvider } from "../src/prompt-registry/prompt.types.js";
import { STRUCTURED_INTELLIGENCE_SYSTEM_PROMPT } from "../src/structured-intelligence/build-structured-intelligence.prompt.js";
import { STRUCTURED_INTELLIGENCE_PROMPT_VERSION } from "../src/structured-intelligence/structured-intelligence.constants.js";
import { THEME_SYSTEM_PROMPT } from "../src/themes/theme-input.js";

describe("prompt registry", () => {
  it("resolves the theme generation prompt from filesystem source", () => {
    const prompt = new PromptResolver(new FilesystemPromptProvider()).resolve(THEME_GENERATION_SYSTEM_PROMPT_ID);

    assert.equal(prompt.promptId, THEME_GENERATION_SYSTEM_PROMPT_ID);
    assert.equal(prompt.version, "theme-generation-v1");
    assert.equal(prompt.source, "filesystem");
    assert.equal(prompt.content, THEME_SYSTEM_PROMPT);
    assert.equal(prompt.hash, calculatePromptHash(THEME_SYSTEM_PROMPT));
    assert.equal(prompt.activationId, null);
  });

  it("resolves the Structured Intelligence prompt from filesystem source", () => {
    const prompt = new PromptResolver(new FilesystemPromptProvider()).resolve(STRUCTURED_INTELLIGENCE_SYSTEM_PROMPT_ID);

    assert.equal(prompt.promptId, STRUCTURED_INTELLIGENCE_SYSTEM_PROMPT_ID);
    assert.equal(prompt.version, STRUCTURED_INTELLIGENCE_PROMPT_VERSION);
    assert.equal(prompt.source, "filesystem");
    assert.equal(prompt.content, STRUCTURED_INTELLIGENCE_SYSTEM_PROMPT);
    assert.equal(prompt.hash, calculatePromptHash(STRUCTURED_INTELLIGENCE_SYSTEM_PROMPT));
    assert.equal(prompt.activationId, null);
  });

  it("returns null from the filesystem provider for unknown prompts", () => {
    assert.equal(new FilesystemPromptProvider().resolve("missing-prompt"), null);
  });

  it("throws a descriptive error when a prompt cannot be resolved", () => {
    const missingProvider: PromptProvider = {
      resolve: () => null,
    };

    assert.throws(
      () => new PromptResolver(missingProvider).resolve("missing-prompt"),
      /Prompt not found: missing-prompt/,
    );
  });

  it("resolves an explicitly pinned prompt version", () => {
    const prompt = new PromptResolver(
      new FilesystemPromptProvider(),
    ).resolve(
      "structured-intelligence-builder-system",
      "structured-intelligence-builder-v2",
    );

    assert.equal(prompt.version, "structured-intelligence-builder-v2");
    assert.match(prompt.content, /"product_name": "string"/);
  });

  it("calculates deterministic SHA-256 prompt hashes", () => {
    const content = "prompt content";
    const expected = createHash("sha256").update(content, "utf8").digest("hex");

    assert.equal(calculatePromptHash(content), expected);
    assert.equal(calculatePromptHash(content), calculatePromptHash(content));
    assert.notEqual(calculatePromptHash(content), calculatePromptHash(`${content}!`));
  });

  it("calculates stable effective prompt hashes from system prompt, user prompt, and schema version", () => {
    const params = {
      systemPrompt: "system",
      userPrompt: "user",
      schemaVersion: "schema-v1",
    };

    assert.equal(calculateEffectivePromptHash(params), calculateEffectivePromptHash(params));
    assert.notEqual(calculateEffectivePromptHash(params), calculateEffectivePromptHash({
      ...params,
      userPrompt: "changed user",
    }));
    assert.notEqual(calculateEffectivePromptHash(params), calculateEffectivePromptHash({
      ...params,
      schemaVersion: "schema-v2",
    }));
  });

  it("resolves prompts from cache before filesystem when cache is valid", async () => {
    const cacheRoot = await createPromptCache([
      cachedPrompt({
        prompt_id: THEME_GENERATION_SYSTEM_PROMPT_ID,
        version: "theme-generation-cache-v1",
        content: "cached theme prompt",
      }),
    ]);
    const prompt = new PromptResolver([
      new CachePromptProvider(cacheRoot),
      new FilesystemPromptProvider(),
    ]).resolve(THEME_GENERATION_SYSTEM_PROMPT_ID);

    assert.equal(prompt.source, "cache");
    assert.equal(prompt.version, "theme-generation-cache-v1");
    assert.equal(prompt.content, "cached theme prompt");
    assert.equal(prompt.hash, calculatePromptHash("cached theme prompt"));
    assert.equal(prompt.activationId, null);
  });

  it("falls back to filesystem when cache is missing", async () => {
    const cacheRoot = await mkdtemp(join(tmpdir(), "prompt-cache-missing-"));
    const prompt = new PromptResolver([
      new CachePromptProvider(cacheRoot),
      new FilesystemPromptProvider(),
    ]).resolve(THEME_GENERATION_SYSTEM_PROMPT_ID);

    assert.equal(prompt.source, "filesystem");
    assert.equal(prompt.content, THEME_SYSTEM_PROMPT);
  });

  it("falls back to filesystem when cache is corrupt", async () => {
    const cacheRoot = await mkdtemp(join(tmpdir(), "prompt-cache-corrupt-"));

    await writeFile(join(cacheRoot, "active-prompts.json"), "{not-json", "utf8");

    const prompt = new PromptResolver([
      new CachePromptProvider(cacheRoot),
      new FilesystemPromptProvider(),
    ]).resolve(THEME_GENERATION_SYSTEM_PROMPT_ID);

    assert.equal(prompt.source, "filesystem");
    assert.equal(prompt.content, THEME_SYSTEM_PROMPT);
  });

  it("falls back to filesystem on cache miss", async () => {
    const cacheRoot = await createPromptCache([]);
    const prompt = new PromptResolver([
      new CachePromptProvider(cacheRoot),
      new FilesystemPromptProvider(),
    ]).resolve(THEME_GENERATION_SYSTEM_PROMPT_ID);

    assert.equal(prompt.source, "filesystem");
    assert.equal(prompt.content, THEME_SYSTEM_PROMPT);
  });

  it("fails resolution when cached prompt hash does not match content", async () => {
    const cacheRoot = await createPromptCache([{
      prompt_id: THEME_GENERATION_SYSTEM_PROMPT_ID,
      version: "theme-generation-cache-v1",
      content: "cached theme prompt",
      hash: "wrong-hash",
      source: "cache",
    }]);

    assert.throws(
      () => new PromptResolver([
        new CachePromptProvider(cacheRoot),
        new FilesystemPromptProvider(),
      ]).resolve(THEME_GENERATION_SYSTEM_PROMPT_ID),
      /Prompt cache hash mismatch/,
    );
  });

  it("refreshes cache artifacts from filesystem prompts", async () => {
    const cacheRoot = await mkdtemp(join(tmpdir(), "prompt-cache-refresh-"));
    const prompts = await refreshPromptCache(cacheRoot);
    const activePrompts = JSON.parse(
      await readFile(join(cacheRoot, "active-prompts.json"), "utf8"),
    ) as CachedPrompt[];
    const themePrompt = activePrompts.find((prompt) =>
      prompt.prompt_id === THEME_GENERATION_SYSTEM_PROMPT_ID);
    const promptFile = JSON.parse(
      await readFile(join(cacheRoot, "prompts", `${THEME_GENERATION_SYSTEM_PROMPT_ID}.json`), "utf8"),
    ) as CachedPrompt;

    assert.ok(prompts.length >= 2);
    assert.ok(themePrompt);
    assert.equal(themePrompt.source, "cache");
    assert.equal(themePrompt.hash, calculatePromptHash(themePrompt.content));
    assert.deepEqual(promptFile, themePrompt);
  });

  it("resolves the activated prompt version and attaches activation_id", async () => {
    const cacheRoot = await createPromptCache([
      cachedPrompt({
        prompt_id: THEME_GENERATION_SYSTEM_PROMPT_ID,
        version: "theme-generation-cache-v1",
        content: "cached theme prompt",
      }),
    ]);
    await writeActivations(cacheRoot, [
      activation({
        activation_id: "activation-1",
        prompt_id: THEME_GENERATION_SYSTEM_PROMPT_ID,
        active_version: "theme-generation-cache-v1",
      }),
    ]);

    const prompt = new PromptResolver([
      new CachePromptProvider(cacheRoot),
      new FilesystemPromptProvider(),
    ], new FilePromptActivationStore(cacheRoot)).resolve(THEME_GENERATION_SYSTEM_PROMPT_ID);

    assert.equal(prompt.source, "cache");
    assert.equal(prompt.version, "theme-generation-cache-v1");
    assert.equal(prompt.activationId, "activation-1");
  });

  it("preserves existing behavior when activation is missing", async () => {
    const cacheRoot = await createPromptCache([
      cachedPrompt({
        prompt_id: THEME_GENERATION_SYSTEM_PROMPT_ID,
        version: "theme-generation-cache-v1",
        content: "cached theme prompt",
      }),
    ]);

    const prompt = new PromptResolver([
      new CachePromptProvider(cacheRoot),
      new FilesystemPromptProvider(),
    ], new FilePromptActivationStore(cacheRoot)).resolve(THEME_GENERATION_SYSTEM_PROMPT_ID);

    assert.equal(prompt.source, "cache");
    assert.equal(prompt.version, "theme-generation-cache-v1");
    assert.equal(prompt.activationId, null);
  });

  it("fails resolution when activation references a missing prompt version", async () => {
    const cacheRoot = await createPromptCache([
      cachedPrompt({
        prompt_id: THEME_GENERATION_SYSTEM_PROMPT_ID,
        version: "theme-generation-cache-v1",
        content: "cached theme prompt",
      }),
    ]);
    await writeActivations(cacheRoot, [
      activation({
        activation_id: "activation-1",
        prompt_id: THEME_GENERATION_SYSTEM_PROMPT_ID,
        active_version: "missing-version",
      }),
    ]);

    assert.throws(
      () => new PromptResolver([
        new CachePromptProvider(cacheRoot),
        new FilesystemPromptProvider(),
      ], new FilePromptActivationStore(cacheRoot)).resolve(THEME_GENERATION_SYSTEM_PROMPT_ID),
      /Invalid prompt activation activation-1/,
    );
  });

  it("persists activation records", async () => {
    const cacheRoot = await mkdtemp(join(tmpdir(), "prompt-activation-store-"));
    const evaluationStore = new FilePromptEvaluationStore(cacheRoot);
    const store = new FilePromptActivationStore(cacheRoot);
    const record = activation({
      activation_id: "activation-1",
      prompt_id: THEME_GENERATION_SYSTEM_PROMPT_ID,
      active_version: "theme-generation-v1",
    });

    await evaluationStore.saveEvaluation(evaluation({
      prompt_id: THEME_GENERATION_SYSTEM_PROMPT_ID,
      prompt_version: "theme-generation-v1",
    }));
    await store.saveActivation(record);

    assert.deepEqual(store.getActivation(THEME_GENERATION_SYSTEM_PROMPT_ID), record);
  });

  it("allows activation when evaluation passes the policy gate", async () => {
    const cacheRoot = await mkdtemp(join(tmpdir(), "prompt-activation-success-"));
    const evaluationStore = new FilePromptEvaluationStore(cacheRoot);
    const store = new FilePromptActivationStore(cacheRoot);

    await evaluationStore.saveEvaluation(evaluation({
      prompt_version: "theme-generation-v1",
      overall_score: 0.94,
    }));
    await store.saveActivation(activation({
      activation_id: "activation-success",
      active_version: "theme-generation-v1",
    }));

    assert.equal(store.getActivation(THEME_GENERATION_SYSTEM_PROMPT_ID)?.activation_id, "activation-success");
  });

  it("denies activation when evaluation is missing", async () => {
    const cacheRoot = await mkdtemp(join(tmpdir(), "prompt-activation-missing-eval-"));
    const store = new FilePromptActivationStore(cacheRoot);

    await assert.rejects(
      () => store.saveActivation(activation({
        activation_id: "activation-missing-eval",
        active_version: "theme-generation-v1",
      })),
      /evaluation is missing/,
    );
  });

  it("denies activation when score is too low", async () => {
    const cacheRoot = await mkdtemp(join(tmpdir(), "prompt-activation-low-score-"));
    const evaluationStore = new FilePromptEvaluationStore(cacheRoot);
    const store = new FilePromptActivationStore(cacheRoot);

    await evaluationStore.saveEvaluation(evaluation({
      prompt_version: "theme-generation-v1",
      overall_score: 0.89,
    }));

    await assert.rejects(
      () => store.saveActivation(activation({
        activation_id: "activation-low-score",
        active_version: "theme-generation-v1",
      })),
      /below minimum/,
    );
  });

  it("denies activation when evaluation has failures", async () => {
    const cacheRoot = await mkdtemp(join(tmpdir(), "prompt-activation-failures-"));
    const evaluationStore = new FilePromptEvaluationStore(cacheRoot);
    const store = new FilePromptActivationStore(cacheRoot);

    await evaluationStore.saveEvaluation(evaluation({
      prompt_version: "theme-generation-v1",
      failures: ["structured intelligence score regressed"],
    }));

    await assert.rejects(
      () => store.saveActivation(activation({
        activation_id: "activation-failures",
        active_version: "theme-generation-v1",
      })),
      /evaluation has failures/,
    );
  });

  it("denies activation when regression exceeds the policy threshold", async () => {
    const cacheRoot = await createPromptCache([
      cachedPrompt({
        prompt_id: THEME_GENERATION_SYSTEM_PROMPT_ID,
        version: "theme-generation-candidate-v1",
        content: "candidate theme prompt",
      }),
    ]);
    const evaluationStore = new FilePromptEvaluationStore(cacheRoot);
    const store = new FilePromptActivationStore(cacheRoot);

    await evaluationStore.saveEvaluation(evaluation({
      evaluation_id: "evaluation-baseline",
      prompt_version: "theme-generation-v1",
      overall_score: 0.98,
      created_at: "2026-06-12T00:00:00.000Z",
    }));
    await evaluationStore.saveEvaluation(evaluation({
      evaluation_id: "evaluation-candidate",
      prompt_version: "theme-generation-candidate-v1",
      overall_score: 0.94,
      compared_against: "theme-generation-v1",
      created_at: "2026-06-12T00:01:00.000Z",
    }));

    await assert.rejects(
      () => store.saveActivation(activation({
        activation_id: "activation-regression",
        active_version: "theme-generation-candidate-v1",
      })),
      /score regression/,
    );
  });

  it("persists evaluation records", async () => {
    const cacheRoot = await mkdtemp(join(tmpdir(), "prompt-evaluation-store-"));
    const store = new FilePromptEvaluationStore(cacheRoot);
    const record = evaluation({
      evaluation_id: "evaluation-persisted",
      prompt_version: "theme-generation-v1",
      overall_score: 0.93,
    });

    await store.saveEvaluation(record);

    assert.deepEqual(store.getEvaluation(THEME_GENERATION_SYSTEM_PROMPT_ID, "theme-generation-v1"), record);
  });
});

async function createPromptCache(prompts: CachedPrompt[]): Promise<string> {
  const cacheRoot = await mkdtemp(join(tmpdir(), "prompt-cache-test-"));

  await writeFile(join(cacheRoot, "active-prompts.json"), `${JSON.stringify(prompts, null, 2)}\n`, "utf8");

  return cacheRoot;
}

function cachedPrompt(params: Omit<CachedPrompt, "hash" | "source">): CachedPrompt {
  return {
    ...params,
    hash: calculatePromptHash(params.content),
    source: "cache",
  };
}

async function writeActivations(cacheRoot: string, activations: PromptActivation[]): Promise<void> {
  await writeFile(join(cacheRoot, "activations.json"), `${JSON.stringify(activations, null, 2)}\n`, "utf8");
}

function activation(overrides: Partial<PromptActivation>): PromptActivation {
  return {
    activation_id: "activation-test",
    prompt_id: THEME_GENERATION_SYSTEM_PROMPT_ID,
    active_version: "theme-generation-v1",
    activated_at: "2026-06-12T00:00:00.000Z",
    activated_by: "test",
    reason: "test activation",
    ...overrides,
  };
}

function evaluation(overrides: Partial<PromptEvaluation>): PromptEvaluation {
  return {
    evaluation_id: "evaluation-test",
    prompt_id: THEME_GENERATION_SYSTEM_PROMPT_ID,
    prompt_version: "theme-generation-v1",
    overall_score: 0.95,
    passed: true,
    warnings: [],
    failures: [],
    created_at: "2026-06-12T00:00:00.000Z",
    ...overrides,
  };
}
