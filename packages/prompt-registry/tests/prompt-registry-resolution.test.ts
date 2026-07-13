import assert from "node:assert/strict";
import test from "node:test";
import type {
  LLMPromptPackage,
} from "../../../contracts/execution/llm-prompt-package.js";
import type {
  PromptActivation,
} from "../../../contracts/execution/prompt-registry-models.js";
import {
  PromptRegistryGovernance,
  PromptRegistryPromptFrameworkAdapter,
  PromptRegistryResolutionError,
  PromptResolutionService,
  type PromptPackageDefinition,
  type PromptPackageRenderInput,
  type PromptPackageRenderer,
  type PromptRegistrySnapshot,
} from "../src/index.js";

test("PromptResolutionService resolves the active Prompt Package deterministically", async () => {
  const service = new PromptResolutionService(activeSnapshot());

  const result = await service.resolve({
    prompt_id: "prompt-a",
  });

  assert.equal(result.prompt_package.identity.prompt_version, "v2");
  assert.equal(result.prompt_package.lifecycle_state, "active");
  assert.equal(result.activation?.active_prompt_version, "v2");
  assert.equal(result.replay_reference.prompt_version, "v2");
});

test("PromptResolutionService resolves historical Prompt Packages by identity", async () => {
  const service = new PromptResolutionService(activeSnapshot());

  const result = await service.resolve({
    prompt_id: "prompt-a",
    prompt_version: "v1",
  });

  assert.equal(result.prompt_package.identity.prompt_version, "v1");
  assert.equal(result.prompt_package.lifecycle_state, "deprecated");
  assert.equal(result.activation, null);
  assert.equal(result.replay_reference.activation_id, null);
});

test("PromptResolutionService replay resolution never upgrades package versions", async () => {
  const service = new PromptResolutionService(activeSnapshot());

  const result = await service.resolveReplay({
    prompt_id: "prompt-a",
    prompt_version: "v1",
    activation_id: "historical-activation-v1",
    content_hash: "hash-v1",
  });

  assert.equal(result.prompt_package.identity.prompt_version, "v1");
  assert.equal(result.replay_reference.activation_id, "historical-activation-v1");
});

test("PromptResolutionService rejects replay content hash mismatches", async () => {
  const service = new PromptResolutionService(activeSnapshot());

  await assert.rejects(
    () => service.resolveReplay({
      prompt_id: "prompt-a",
      prompt_version: "v1",
      activation_id: null,
      content_hash: "wrong-hash",
    }),
    PromptRegistryResolutionError,
  );
});

test("PromptResolutionService resolves Prompt Version lineage", () => {
  const service = new PromptResolutionService(activeSnapshot());

  const lineage = service.resolveVersionLineage("prompt-a", "v2");

  assert.deepEqual(
    lineage.map((promptPackage) => promptPackage.identity.prompt_version),
    ["v1", "v2"],
  );
});

test("PromptRegistryPromptFrameworkAdapter resolves packages and delegates rendering", () => {
  const renderer = new RecordingRenderer();
  const adapter = new PromptRegistryPromptFrameworkAdapter(
    new PromptResolutionService(activeSnapshot()),
    renderer,
  );

  const rendered = adapter.render("prompt-a", {
    filing_id: "filing-1",
  });

  assert.equal(rendered.prompt_id, "prompt-a");
  assert.equal(rendered.prompt_version, "v2");
  assert.equal(renderer.calls[0]?.prompt_package.identity.prompt_version, "v2");
});

test("PromptRegistryPromptFrameworkAdapter preserves requested replay version", () => {
  const renderer = new RecordingRenderer();
  const adapter = new PromptRegistryPromptFrameworkAdapter(
    new PromptResolutionService(activeSnapshot()),
    renderer,
  );

  const rendered = adapter.render("prompt-a", {
    filing_id: "filing-1",
  }, "v1");

  assert.equal(rendered.prompt_version, "v1");
  assert.equal(renderer.calls[0]?.activation, null);
});

class RecordingRenderer implements PromptPackageRenderer {
  readonly calls: Array<PromptPackageRenderInput<unknown>> = [];

  render<TContext>(input: PromptPackageRenderInput<TContext>): LLMPromptPackage {
    this.calls.push(input);

    return {
      prompt_id: input.prompt_package.identity.prompt_id,
      prompt_version: input.prompt_package.identity.prompt_version,
      activation_id: input.activation?.activation_id ?? null,
      system_prompt: input.prompt_package.system_prompt_template,
      user_prompt: JSON.stringify(input.context),
      render_hash: `render:${input.prompt_package.content_hash}`,
      source: input.prompt_package.source,
    };
  }
}

function activeSnapshot(): PromptRegistrySnapshot {
  let governance = new PromptRegistryGovernance();
  governance = governance.createVersion({
    prompt_id: "prompt-a",
    prompt_version: "v1",
    change_reason: "Initial governed version.",
    package_definition: packageDefinition("hash-v1"),
  }).governance;
  governance = governance.transitionVersion("prompt-a", "v1", "review").governance;
  governance = governance.transitionVersion("prompt-a", "v1", "approved").governance;
  governance = governance.activateVersion("prompt-a", "v1").governance;
  governance = governance.createVersion({
    prompt_id: "prompt-a",
    prompt_version: "v2",
    change_reason: "Refined prompt wording.",
    package_definition: packageDefinition("hash-v2"),
  }).governance;
  governance = governance.transitionVersion("prompt-a", "v2", "review").governance;
  governance = governance.transitionVersion("prompt-a", "v2", "approved").governance;
  governance = governance.activateVersion("prompt-a", "v2").governance;

  const snapshot = governance.snapshot();
  return {
    packages: snapshot.packages,
    activations: snapshot.activations.map((activation): PromptActivation => ({
      ...activation,
      activation_id: activation.activation_id,
    })),
  };
}

function packageDefinition(contentHash: string): PromptPackageDefinition {
  return {
    system_prompt_template: "System prompt template.",
    user_prompt_template_id: "user-template-v1",
    expected_output_schema_id: "output-schema-v1",
    source: "filesystem",
    content_hash: contentHash,
  };
}
