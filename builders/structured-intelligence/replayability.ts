import type { FilingArtifactContent } from "../../contracts/artifacts/filing-artifact-content.js";
import type { ResolvedPrompt } from "../../src/prompt-registry/prompt.types.js";
import { stableHash } from "../investor-intelligence-builder/hashes.js";
import {
  STRUCTURED_INTELLIGENCE_EVALUATION_VERSION,
  STRUCTURED_INTELLIGENCE_TEMPERATURE,
  type StructuredIntelligenceArtifactContent,
  type StructuredIntelligenceReplayabilityMetadata,
} from "./contract.js";
import type {
  StructuredPromptContext,
} from "./types.js";
import type { ThemesArtifactContent } from "../themes/contract.js";

type ContentWithoutReplayability = Omit<
  StructuredIntelligenceArtifactContent,
  "replayability_metadata"
>;

export function buildStructuredIntelligenceReplayability(input: {
  prompt: ResolvedPrompt;
  modelVersion: string;
  filing: FilingArtifactContent;
  themes: ThemesArtifactContent;
  context: StructuredPromptContext;
  content: ContentWithoutReplayability;
}): StructuredIntelligenceReplayabilityMetadata {
  const base = {
    prompt_id: input.prompt.promptId,
    prompt_version: input.prompt.version,
    model_version: input.modelVersion,
    temperature: STRUCTURED_INTELLIGENCE_TEMPERATURE,
    filing_input_hash: stableHash(input.filing),
    themes_input_hash: stableHash(input.themes),
    context_hash: stableHash(input.context),
    evaluation_version: STRUCTURED_INTELLIGENCE_EVALUATION_VERSION,
  };

  return {
    ...base,
    output_hash: stableHash({
      ...input.content,
      replayability_metadata: base,
    }),
  };
}

export function recomputeStructuredIntelligenceOutputHash(
  content: StructuredIntelligenceArtifactContent,
): string {
  const {
    replayability_metadata: {
      output_hash: _outputHash,
      ...replayabilityWithoutOutputHash
    },
    ...contentWithoutReplayability
  } = content;

  return stableHash({
    ...contentWithoutReplayability,
    replayability_metadata: replayabilityWithoutOutputHash,
  });
}
