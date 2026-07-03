/**
 * Filesystem loader for the static Governance Policy Registry bootstrap.
 *
 * The loader reads the tracked JSON registry source, validates it through the
 * read-only registry implementation, and reports structured load/validation
 * events. It does not publish, mutate, or activate policies.
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type {
  GovernancePolicyRegistrySource,
} from "../../contracts/governance/governance-policy-registry-types.js";
import { createLogger } from "../shared/logger.js";
import {
  GovernancePolicyRegistry,
  GovernancePolicyRegistryError,
} from "./governance-policy-registry.js";

export const DEFAULT_GOVERNANCE_POLICY_REGISTRY_PATH =
  "src/governance-policy-registry/governance-policies.json";

const logger = createLogger("governance-policy-registry");

export async function loadGovernancePolicyRegistry(
  sourcePath = DEFAULT_GOVERNANCE_POLICY_REGISTRY_PATH,
): Promise<GovernancePolicyRegistry> {
  logger.info("Loading Governance Policy Registry.", {
    source_path: sourcePath,
  });

  try {
    const parsed = JSON.parse(
      await readFile(resolve(sourcePath), "utf8"),
    ) as GovernancePolicyRegistrySource;
    const registry = new GovernancePolicyRegistry(parsed);
    const activePolicy = registry.getActivePolicy();

    logger.info("Governance Policy Registry validation succeeded.", {
      source_path: sourcePath,
      active_policy_version: activePolicy.policy_version,
      policy_count: registry.listPolicyVersions().length,
    });

    return registry;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    logger.error("Governance Policy Registry validation failed.", {
      source_path: sourcePath,
      error_message: message,
    });

    if (error instanceof GovernancePolicyRegistryError) {
      throw error;
    }

    throw new GovernancePolicyRegistryError(
      `Failed to load Governance Policy Registry source: ${sourcePath}`,
      {
        cause: error,
        suggestedAction:
          "Verify the Governance Policy Registry source path and JSON syntax.",
      },
    );
  }
}
