import type {
  Artifact,
} from "../../../contracts/artifacts/artifact.js";
import type {
  PromptFramework,
} from "../../../contracts/execution/prompt-framework-contract.js";
import type {
  PromptPlan,
} from "../../../contracts/execution/prompt-framework-models.js";
import type {
  StructuredIntelligence,
  StructuredIntelligenceInput,
  StructuredIntelligencePayload,
} from "../../../contracts/company-intelligence/structured-intelligence-models.js";

export type StructuredIntelligenceDependencyKey = "filing" | "themes";

export type StructuredIntelligenceDependencyMap = {
  filing: Artifact<unknown>;
  themes: Artifact<unknown>;
};

/**
 * Platform Foundation boundary for governed Structured Intelligence Prompt Plan
 * resolution.
 *
 * Implementations own Prompt Plan governance. The Structured Intelligence
 * builder consumes the resolved plan and never constructs or mutates it.
 */
export interface StructuredIntelligencePromptPlanResolver {
  resolveStructuredIntelligencePromptPlan(
    input: StructuredIntelligenceInput,
  ): Promise<PromptPlan>;
}

export interface StructuredIntelligenceBuilderOptions {
  promptPlanResolver: StructuredIntelligencePromptPlanResolver;
  promptFramework: PromptFramework<StructuredIntelligencePayload>;
}

export type StructuredIntelligenceBuildOutput = StructuredIntelligence;
