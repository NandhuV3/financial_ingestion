import assert from "node:assert/strict";
import test from "node:test";
import type {
  PromptPackage,
} from "../../../contracts/execution/prompt-registry-models.js";
import {
  PromptPackageLifecycleManager,
  PromptRegistryActivationError,
  PromptRegistryGovernance,
  PromptRegistryLifecycleError,
  PromptRegistryVersionError,
  PromptVersionCatalog,
  type PromptPackageDefinition,
} from "../src/index.js";

test("PromptPackageLifecycleManager enforces locked lifecycle transitions", () => {
  const lifecycleManager = new PromptPackageLifecycleManager();
  const draftPackage = promptPackage("prompt-a", "v1", "draft");
  const reviewPackage = lifecycleManager.transition(draftPackage, "review");

  assert.equal(draftPackage.lifecycle_state, "draft");
  assert.equal(reviewPackage.lifecycle_state, "review");
  assert.notEqual(reviewPackage, draftPackage);
  assert.throws(
    () => lifecycleManager.transition(draftPackage, "active"),
    PromptRegistryLifecycleError,
  );
});

test("PromptVersionCatalog creates immutable deterministic version lineage", () => {
  const catalog = new PromptVersionCatalog();
  const first = catalog.createVersion({
    prompt_id: "prompt-a",
    prompt_version: "v1",
    change_reason: "Initial governed version.",
    package_definition: packageDefinition("hash-v1"),
  });
  const second = first.catalog.createVersion({
    prompt_id: "prompt-a",
    prompt_version: "v2",
    change_reason: "Refined prompt wording.",
    package_definition: packageDefinition("hash-v2"),
  });

  assert.equal(
    first.prompt_package.version_lineage.previous_prompt_version,
    null,
  );
  assert.equal(
    second.prompt_package.version_lineage.previous_prompt_version,
    "v1",
  );
  assert.equal(second.catalog.latestVersion("prompt-a")?.identity.prompt_version, "v2");
  assert.equal(first.catalog.latestVersion("prompt-a")?.identity.prompt_version, "v1");
});

test("PromptVersionCatalog rejects duplicate versions and ambiguous lineage", () => {
  const catalog = new PromptVersionCatalog([
    promptPackage("prompt-a", "v1", "draft"),
  ]);

  assert.throws(
    () => catalog.createVersion({
      prompt_id: "prompt-a",
      prompt_version: "v1",
      change_reason: "Duplicate version.",
      package_definition: packageDefinition("hash-v1-duplicate"),
    }),
    PromptRegistryVersionError,
  );

  assert.throws(
    () => new PromptVersionCatalog([
      promptPackage("prompt-a", "v1", "draft"),
      promptPackage("prompt-a", "v2", "draft", null),
    ]).latestVersion("prompt-a"),
    PromptRegistryVersionError,
  );
});

test("PromptRegistryGovernance activates exactly one active version per prompt id", () => {
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
  const activated = governance.activateVersion("prompt-a", "v2");

  const snapshot = activated.governance.snapshot();
  const activePackages = snapshot.packages.filter((candidate) =>
    candidate.identity.prompt_id === "prompt-a"
      && candidate.lifecycle_state === "active"
  );

  assert.equal(activePackages.length, 1);
  assert.equal(activePackages[0]?.identity.prompt_version, "v2");
  assert.equal(
    activated.governance.getVersion("prompt-a", "v1")?.lifecycle_state,
    "deprecated",
  );
  assert.equal(
    activated.activation_id,
    activated.governance.snapshot().activations[0]?.activation_id,
  );
});

test("PromptRegistryGovernance rejects activation before approval", () => {
  const governance = new PromptRegistryGovernance().createVersion({
    prompt_id: "prompt-a",
    prompt_version: "v1",
    change_reason: "Initial governed version.",
    package_definition: packageDefinition("hash-v1"),
  }).governance;

  assert.throws(
    () => governance.activateVersion("prompt-a", "v1"),
    PromptRegistryActivationError,
  );
});

test("PromptRegistryGovernance returns defensive immutable snapshots", () => {
  const created = new PromptRegistryGovernance().createVersion({
    prompt_id: "prompt-a",
    prompt_version: "v1",
    change_reason: "Initial governed version.",
    package_definition: packageDefinition("hash-v1"),
  });
  const snapshot = created.governance.snapshot();
  const mutatedPackage = snapshot.packages[0];

  assert.ok(mutatedPackage !== undefined);
  mutatedPackage.lifecycle_state = "retired";

  assert.equal(
    created.governance.getVersion("prompt-a", "v1")?.lifecycle_state,
    "draft",
  );
});

function promptPackage(
  promptId: string,
  promptVersion: string,
  lifecycleState: PromptPackage["lifecycle_state"],
  previousPromptVersion: string | null = null,
): PromptPackage {
  return {
    identity: {
      prompt_id: promptId,
      prompt_version: promptVersion,
    },
    lifecycle_state: lifecycleState,
    ...packageDefinition(`hash-${promptVersion}`),
    version_lineage: {
      previous_prompt_version: previousPromptVersion,
      change_reason: "Test lineage.",
    },
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
