/**
 * Public entry point for Governance Policy Registry bootstrap consumers.
 *
 * Exports the read-only registry, validation error, and filesystem loader used
 * by future Governance Engine code to resolve immutable policy versions.
 */
export {
  GovernancePolicyRegistry,
  GovernancePolicyRegistryError,
  validateGovernancePolicyRegistrySource,
} from "./governance-policy-registry.js";
export {
  DEFAULT_GOVERNANCE_POLICY_REGISTRY_PATH,
  loadGovernancePolicyRegistry,
} from "./governance-policy-registry-loader.js";
