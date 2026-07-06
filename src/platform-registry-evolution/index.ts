/**
 * Public Platform Registry Evolution module.
 *
 * Registry Evolution applies approved Governance Decision registry changes to
 * produce the next immutable Platform Registry artifact.
 */
export {
  PlatformRegistryEvolution,
  platformRegistryArtifactId,
  platformRegistryEvolutionInputHash,
} from "./executor.js";
export {
  PlatformRegistryEvolutionValidationError,
  validateEvolvedRegistryContent,
  validatePlatformRegistryEvolutionInput,
} from "./validator.js";
