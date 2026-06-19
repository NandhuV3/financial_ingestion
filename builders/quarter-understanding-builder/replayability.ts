import type { ResolvedPrompt } from "../../src/prompt-registry/prompt.types.js";
import { stableHash } from "../investor-intelligence-builder/hashes.js";
import {
  QUARTER_UNDERSTANDING_BUILDER_VERSION,
  QUARTER_UNDERSTANDING_CALIBRATION_CONTRACT_VERSION,
} from "./contract.js";
import type {
  DepthIndicator,
  EnrichmentStatus,
  QuarterUnderstandingArtifactContent,
  QuarterUnderstandingEvaluationHooks,
  QuarterUnderstandingReplayabilityMetadata,
} from "./types.js";

export function buildQuarterUnderstandingInputHash(input: {
  companyKnowledgeHash: string;
  businessSignalsHash: string;
  trustSignalsHash: string | null;
  topicEvolutionHash: string | null;
  conceptRegistryHash: string | null;
}): string {
  return stableHash(input);
}

export function buildQuarterUnderstandingOutputHash(
  content: Omit<QuarterUnderstandingArtifactContent, "replayability_metadata">,
): string {
  return stableHash(content);
}

export function buildQuarterUnderstandingReplayability(input: {
  prompt: ResolvedPrompt;
  modelVersion: string;
  conceptRegistryVersion: number | null;
  inputHash: string;
  outputHash: string;
  evaluationHooks: QuarterUnderstandingEvaluationHooks;
  evaluationMetadata: Record<string, unknown>;
  enrichmentStatus: EnrichmentStatus;
  depthIndicator: DepthIndicator;
}): QuarterUnderstandingReplayabilityMetadata {
  return {
    prompt_lineage: {
      prompt_id: input.prompt.promptId,
      prompt_version: input.prompt.version,
      model_version: input.modelVersion,
    },
    prompt_version: input.prompt.version,
    model_version: input.modelVersion,
    concept_registry_version: input.conceptRegistryVersion === null
      ? null
      : String(input.conceptRegistryVersion),
    input_hash: input.inputHash,
    output_hash: input.outputHash,
    evaluation_hooks: structuredClone(input.evaluationHooks),
    evaluation_metadata: structuredClone(input.evaluationMetadata),
    enrichment_status: structuredClone(input.enrichmentStatus),
    depth_indicators: structuredClone(input.depthIndicator),
    builder_version: QUARTER_UNDERSTANDING_BUILDER_VERSION,
    calibration_contract_version:
      QUARTER_UNDERSTANDING_CALIBRATION_CONTRACT_VERSION,
  };
}
