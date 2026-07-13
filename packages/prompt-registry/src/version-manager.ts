import type {
  PromptPackage,
  PromptPackageVersion,
} from "../../../contracts/execution/prompt-registry-models.js";
import { PromptRegistryVersionError } from "./errors.js";
import type {
  PromptPackageDefinition,
  PromptVersionCreationRequest,
} from "./types.js";
import {
  clonePromptPackage,
  validatePromptIdentity,
  validatePromptPackage,
} from "./validation.js";

export class PromptVersionCatalog {
  private readonly packages: readonly PromptPackage[];

  constructor(promptPackages: readonly PromptPackage[] = []) {
    this.packages = sortPromptPackages(promptPackages.map((promptPackage) => {
      validatePromptPackage(promptPackage);
      return clonePromptPackage(promptPackage);
    }));

    validateUniqueVersions(this.packages);
    validateLineageReferences(this.packages);
  }

  createVersion(request: PromptVersionCreationRequest): {
    catalog: PromptVersionCatalog;
    prompt_package: PromptPackage;
  } {
    validatePromptIdentity(request.prompt_id, request.prompt_version);
    validatePackageDefinition(request.package_definition);

    if (request.change_reason.trim() === "") {
      throw new PromptRegistryVersionError(
        "PromptVersionCreationRequest.change_reason is required.",
      );
    }

    if (this.getVersion(request.prompt_id, request.prompt_version) !== undefined) {
      throw new PromptRegistryVersionError(
        `PromptPackage '${request.prompt_id}' version '${request.prompt_version}' already exists.`,
      );
    }

    const latestVersion = this.latestVersion(request.prompt_id);
    const promptPackage: PromptPackage = {
      identity: {
        prompt_id: request.prompt_id,
        prompt_version: request.prompt_version,
      },
      lifecycle_state: "draft",
      system_prompt_template: request.package_definition.system_prompt_template,
      user_prompt_template_id: request.package_definition.user_prompt_template_id,
      expected_output_schema_id:
        request.package_definition.expected_output_schema_id,
      source: request.package_definition.source,
      content_hash: request.package_definition.content_hash,
      version_lineage: {
        previous_prompt_version: latestVersion?.identity.prompt_version ?? null,
        change_reason: request.change_reason,
      },
    };

    validatePromptPackage(promptPackage);

    return {
      catalog: new PromptVersionCatalog([...this.packages, promptPackage]),
      prompt_package: clonePromptPackage(promptPackage),
    };
  }

  replaceVersion(promptPackage: PromptPackage): PromptVersionCatalog {
    validatePromptPackage(promptPackage);

    const existing = this.getVersion(
      promptPackage.identity.prompt_id,
      promptPackage.identity.prompt_version,
    );

    if (existing === undefined) {
      throw new PromptRegistryVersionError(
        `PromptPackage '${promptPackage.identity.prompt_id}' version '${promptPackage.identity.prompt_version}' does not exist.`,
      );
    }

    return new PromptVersionCatalog(this.packages.map((candidate) =>
      sameIdentity(candidate, promptPackage)
        ? clonePromptPackage(promptPackage)
        : candidate
    ));
  }

  getVersion(
    promptId: string,
    promptVersion: PromptPackageVersion,
  ): PromptPackage | undefined {
    validatePromptIdentity(promptId, promptVersion);

    const promptPackage = this.packages.find((candidate) =>
      candidate.identity.prompt_id === promptId
        && candidate.identity.prompt_version === promptVersion
    );

    return promptPackage === undefined
      ? undefined
      : clonePromptPackage(promptPackage);
  }

  latestVersion(promptId: string): PromptPackage | undefined {
    validatePromptIdentity(promptId, "latest");

    const promptPackages = this.packages.filter((candidate) =>
      candidate.identity.prompt_id === promptId
    );

    if (promptPackages.length === 0) {
      return undefined;
    }

    const referencedVersions = new Set(
      promptPackages
        .map((candidate) => candidate.version_lineage.previous_prompt_version)
        .filter((version): version is string => version !== null),
    );
    const terminalVersions = promptPackages.filter((candidate) =>
      !referencedVersions.has(candidate.identity.prompt_version)
    );

    if (terminalVersions.length !== 1) {
      throw new PromptRegistryVersionError(
        `PromptPackage '${promptId}' has ambiguous latest version lineage.`,
      );
    }

    return clonePromptPackage(terminalVersions[0]);
  }

  listVersions(promptId: string): readonly PromptPackage[] {
    validatePromptIdentity(promptId, "list");

    return this.packages
      .filter((candidate) => candidate.identity.prompt_id === promptId)
      .map(clonePromptPackage);
  }

  listPackages(): readonly PromptPackage[] {
    return this.packages.map(clonePromptPackage);
  }
}

function validatePackageDefinition(
  packageDefinition: PromptPackageDefinition,
): void {
  validatePromptPackage({
    identity: {
      prompt_id: "validation",
      prompt_version: "validation",
    },
    lifecycle_state: "draft",
    system_prompt_template: packageDefinition.system_prompt_template,
    user_prompt_template_id: packageDefinition.user_prompt_template_id,
    expected_output_schema_id: packageDefinition.expected_output_schema_id,
    source: packageDefinition.source,
    content_hash: packageDefinition.content_hash,
    version_lineage: {
      previous_prompt_version: null,
      change_reason: "validation",
    },
  });
}

function validateUniqueVersions(promptPackages: readonly PromptPackage[]): void {
  const identities = new Set<string>();

  for (const promptPackage of promptPackages) {
    const key = identityKey(promptPackage);
    if (identities.has(key)) {
      throw new PromptRegistryVersionError(
        `PromptPackage '${promptPackage.identity.prompt_id}' version '${promptPackage.identity.prompt_version}' is duplicated.`,
      );
    }
    identities.add(key);
  }
}

function validateLineageReferences(
  promptPackages: readonly PromptPackage[],
): void {
  for (const promptPackage of promptPackages) {
    const previousVersion =
      promptPackage.version_lineage.previous_prompt_version;

    if (previousVersion === null) {
      continue;
    }

    const previousPackage = promptPackages.find((candidate) =>
      candidate.identity.prompt_id === promptPackage.identity.prompt_id
        && candidate.identity.prompt_version === previousVersion
    );

    if (previousPackage === undefined) {
      throw new PromptRegistryVersionError(
        `PromptPackage '${promptPackage.identity.prompt_id}' version '${promptPackage.identity.prompt_version}' references missing previous version '${previousVersion}'.`,
      );
    }
  }
}

function sortPromptPackages(
  promptPackages: readonly PromptPackage[],
): readonly PromptPackage[] {
  return [...promptPackages].sort((left, right) =>
    left.identity.prompt_id.localeCompare(right.identity.prompt_id)
      || left.identity.prompt_version.localeCompare(right.identity.prompt_version)
  );
}

function sameIdentity(
  left: PromptPackage,
  right: PromptPackage,
): boolean {
  return identityKey(left) === identityKey(right);
}

function identityKey(promptPackage: PromptPackage): string {
  return `${promptPackage.identity.prompt_id}\u0000${promptPackage.identity.prompt_version}`;
}
