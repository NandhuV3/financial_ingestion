import type { StructuredIntelligence } from "../structured-intelligence/types/structured-intelligence.types.js";
import type { FilingMetadata } from "../types/pipeline.types.js";
import {
  buildCompanyKnowledge,
  type BuildCompanyKnowledgeInputs,
} from "./build-company-knowledge.js";
import type { CompanyKnowledgeRepository } from "./company-knowledge.repository.js";
import type { CompanyKnowledge } from "./types/company-knowledge.types.js";

export type GenerateCompanyKnowledgeParams = {
  ticker: string;
  structuredIntelligence: StructuredIntelligence;
  filingMetadata: FilingMetadata;
  repository: CompanyKnowledgeRepository;
  builder?: (inputs: BuildCompanyKnowledgeInputs) => CompanyKnowledge;
};

export async function generateCompanyKnowledge(
  params: GenerateCompanyKnowledgeParams,
): Promise<CompanyKnowledge> {
  const builder = params.builder ?? buildCompanyKnowledge;
  let knowledge: CompanyKnowledge;

  try {
    knowledge = builder({
      structuredIntelligence: params.structuredIntelligence,
      filingMetadata: params.filingMetadata,
    });
  } catch (error) {
    throw new Error(`Failed to build Company Knowledge for ${normalizeTicker(params.ticker)}: ${errorMessage(error)}`);
  }

  try {
    await params.repository.save(params.ticker, knowledge);
  } catch (error) {
    throw new Error(`Failed to persist Company Knowledge for ${normalizeTicker(params.ticker)}: ${errorMessage(error)}`);
  }

  return knowledge;
}

function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase();
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
