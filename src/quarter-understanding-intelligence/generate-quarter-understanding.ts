import type { BusinessSignalArtifact } from "../business-signal-intelligence/types/business-signal.types.js";
import type { QuarterChangeReport } from "../change-engine/change.types.js";
import type { CompanyKnowledge } from "../company-knowledge/types/company-knowledge.types.js";
import type { TopicEvolutionReport } from "../topic-evolution/topic-evolution.types.js";
import {
  buildQuarterUnderstanding,
  type BuildQuarterUnderstandingInputs,
  type LLMReasoningOutput,
} from "./build-quarter-understanding.js";
import type { QuarterUnderstandingRepository } from "./quarter-understanding.repository.js";
import type {
  DerivedFromArtifact,
  QuarterUnderstandingArtifact,
} from "./types/quarter-understanding.types.js";

export type QuarterUnderstandingReasoningOutput = LLMReasoningOutput;

export type GenerateQuarterUnderstandingParams = {
  ticker: string;
  reportingPeriod: string;
  companyKnowledge: CompanyKnowledge;
  businessSignalArtifact: BusinessSignalArtifact;
  quarterChange?: QuarterChangeReport | null;
  topicEvolution?: TopicEvolutionReport | null;
  reasoningOutput?: QuarterUnderstandingReasoningOutput | null;
  repository: QuarterUnderstandingRepository;
  derivedFrom?: DerivedFromArtifact[];
  builder?: (inputs: BuildQuarterUnderstandingInputs) => QuarterUnderstandingArtifact;
};

export async function generateQuarterUnderstanding(
  params: GenerateQuarterUnderstandingParams,
): Promise<QuarterUnderstandingArtifact> {
  const builder = params.builder ?? buildQuarterUnderstanding;
  let artifact: QuarterUnderstandingArtifact;

  try {
    artifact = builder({
      companyKnowledge: params.companyKnowledge,
      businessSignalArtifact: params.businessSignalArtifact,
      reportingPeriod: params.reportingPeriod,
      ...(params.quarterChange !== undefined ? { quarterChange: params.quarterChange } : {}),
      ...(params.topicEvolution !== undefined ? { topicEvolution: params.topicEvolution } : {}),
      ...(params.reasoningOutput !== undefined ? { reasoningOutput: params.reasoningOutput } : {}),
      derivedFrom: params.derivedFrom,
    });
  } catch (error) {
    throw new Error(
      `Failed to build Quarter Understanding for ${normalizeTicker(params.ticker)} ${normalizeReportingPeriod(params.reportingPeriod)}: ${errorMessage(error)}`,
    );
  }

  try {
    await params.repository.save(params.ticker, params.reportingPeriod, artifact);
  } catch (error) {
    throw new Error(
      `Failed to persist Quarter Understanding for ${normalizeTicker(params.ticker)} ${normalizeReportingPeriod(params.reportingPeriod)}: ${errorMessage(error)}`,
    );
  }

  return artifact;
}

function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase();
}

function normalizeReportingPeriod(reportingPeriod: string): string {
  return reportingPeriod.trim();
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
