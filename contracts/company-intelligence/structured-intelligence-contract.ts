import type {
  Artifact,
} from "../artifacts/artifact.js";
import type {
  Builder,
} from "../../packages/builder-framework/src/builder.js";
import type {
  BuilderResult,
} from "../../packages/builder-framework/src/builder-result.js";
import type {
  PromptPlan,
} from "../execution/prompt-framework-models.js";
import type {
  PromptReplayReference,
} from "../execution/prompt-registry-models.js";
import type {
  ReplayReference,
} from "../execution/llm-replay-policy-models.js";
import type {
  ExecutionRecordReference,
} from "../framework/execution-record-reference.js";
import type {
  StructuredIntelligence,
  StructuredIntelligenceInput,
  StructuredIntelligenceInputReferences,
  StructuredIntelligenceMetadata,
  StructuredIntelligencePayload,
} from "./structured-intelligence-models.js";

/**
 * Canonical public contracts for Structured Intelligence.
 *
 * These interfaces define the business-layer boundary only. Implementations
 * must delegate prompt orchestration, LLM execution, prompt governance, replay
 * policy, artifact persistence, artifact hashing, and lineage persistence to
 * Platform Foundation components.
 */
export const STRUCTURED_INTELLIGENCE_CONTRACT_VERSION =
  "structured-intelligence-contract-v1";

export const STRUCTURED_INTELLIGENCE_BUILDER_TYPE =
  "structured-intelligence";

export interface StructuredIntelligenceOperationalReferences {
  prompt_plan: PromptPlan;
  prompt_replay_reference: PromptReplayReference;
  replay_reference: ReplayReference | null;
  execution_references: readonly ExecutionRecordReference[];
}

export interface StructuredIntelligenceArtifactAssemblyInput {
  input: StructuredIntelligenceInput;
  payload: StructuredIntelligencePayload;
  metadata: StructuredIntelligenceMetadata;
  operational_references: StructuredIntelligenceOperationalReferences;
}

/**
 * Business-specific artifact content assembly boundary.
 *
 * This interface does not persist artifacts or construct Artifact Framework
 * metadata. It only defines the layer-owned content assembly contract for later
 * Structured Intelligence implementation packages.
 */
export interface StructuredIntelligenceArtifactBuilder {
  buildContent(
    input: StructuredIntelligenceArtifactAssemblyInput,
  ): Promise<StructuredIntelligence>;
}

/**
 * Canonical Structured Intelligence builder contract.
 *
 * The builder produces one Structured Intelligence content object for later
 * Artifact Framework persistence. It must not execute providers directly or
 * own Prompt Registry, LLM Execution Framework, Replay Policy, or Artifact
 * Framework behavior.
 */
export interface StructuredIntelligenceBuilder
  extends Builder<StructuredIntelligenceInput, StructuredIntelligence> {
  builderType(): typeof STRUCTURED_INTELLIGENCE_BUILDER_TYPE;
}

export type StructuredIntelligenceBuilderResult =
  BuilderResult<StructuredIntelligence>;

export interface StructuredIntelligenceResolvedInputs {
  references: StructuredIntelligenceInputReferences;
  filing_artifact: Artifact<unknown>;
  themes_artifact: Artifact<unknown>;
}
