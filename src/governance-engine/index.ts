/**
 * Public entry point for the bootstrap Governance Engine.
 *
 * Exports the deterministic executor and validator used to evaluate one Topic
 * Candidate Governance Artifact with one Governance Policy and produce one
 * Governance Decision object.
 */
export { GovernanceEngine } from "./executor.js";
export {
  GovernanceEngineValidationError,
  validateGovernanceDecision,
  validateGovernanceEngineInput,
} from "./validator.js";
