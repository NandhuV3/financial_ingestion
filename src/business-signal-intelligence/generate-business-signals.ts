import type { CompanyKnowledge } from "../company-knowledge/types/company-knowledge.types.js";
import type { FilingMetadata } from "../types/pipeline.types.js";
import {
  buildBusinessSignals,
  type BuildBusinessSignalsInputs,
} from "./build-business-signals.js";
import type { BusinessSignalRepository } from "./business-signal.repository.js";
import type { BusinessSignalArtifact } from "./types/business-signal.types.js";

type DerivedFromArtifact = {
  path: string;
  version: number;
  input_hash: string;
};

export type GenerateBusinessSignalsParams = {
  ticker: string;
  reportingPeriod: string;
  companyKnowledge?: CompanyKnowledge | null;
  filingMetadata?: FilingMetadata | null;
  derivedFrom?: DerivedFromArtifact[];
  repository: BusinessSignalRepository;
  builder?: (inputs: BuildBusinessSignalsInputs) => BusinessSignalArtifact;
};

export async function generateBusinessSignals(
  params: GenerateBusinessSignalsParams,
): Promise<BusinessSignalArtifact> {
  const builder = params.builder ?? buildBusinessSignals;
  let artifact: BusinessSignalArtifact;

  try {
    artifact = builder({
      companyKnowledge: params.companyKnowledge,
      filingMetadata: params.filingMetadata,
      reportingPeriod: params.reportingPeriod,
      derivedFrom: params.derivedFrom,
    });
  } catch (error) {
    throw new Error(
      `Failed to build Business Signals for ${normalizeTicker(params.ticker)} ${normalizeReportingPeriod(params.reportingPeriod)}: ${errorMessage(error)}`,
    );
  }

  try {
    await params.repository.save(params.ticker, params.reportingPeriod, artifact);
  } catch (error) {
    throw new Error(
      `Failed to persist Business Signals for ${normalizeTicker(params.ticker)} ${normalizeReportingPeriod(params.reportingPeriod)}: ${errorMessage(error)}`,
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
