import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type { Builder } from "../../packages/builder-framework/src/builder.js";
import type { BuilderContext } from "../../packages/builder-framework/src/builder-context.js";
import { BuilderDependencyError } from "../../packages/builder-framework/src/builder-errors.js";
import type { BuilderResult } from "../../packages/builder-framework/src/builder-result.js";
import {
  buildCandidateKnowledgeFromStructuredIntelligence,
  buildCandidateSummary,
  compareCompanyKnowledgeFields,
} from "./comparison-engine.js";
import {
  COMPANY_KNOWLEDGE_BUILDER_TYPE,
  type CompanyKnowledgeCandidateContent,
} from "./contract.js";
import { buildCompanyKnowledgeCandidateEvaluationHooks } from "./evaluation.js";
import type {
  CompanyKnowledgeArtifactContent,
  CompanyKnowledgeBuilderInput,
  StructuredIntelligenceArtifactContent,
} from "./types.js";
import {
  validateCompanyKnowledgeBuilderInput,
  validateCompanyKnowledgeCandidateContent,
  validateCompanyKnowledgeDependency,
  validateStructuredIntelligenceDependency,
} from "./validator.js";

export class CompanyKnowledgeBuilder implements Builder<
  CompanyKnowledgeBuilderInput,
  CompanyKnowledgeCandidateContent
> {
  builderType(): string {
    return COMPANY_KNOWLEDGE_BUILDER_TYPE;
  }

  async validateInput(input: CompanyKnowledgeBuilderInput): Promise<void> {
    validateCompanyKnowledgeBuilderInput(input);
  }

  async execute(
    context: BuilderContext<CompanyKnowledgeBuilderInput>,
  ): Promise<BuilderResult<CompanyKnowledgeCandidateContent>> {
    const structuredIntelligence = dependencyContent<StructuredIntelligenceArtifactContent>(
      context.dependencies.structured_intelligence,
      "structured_intelligence",
    );
    const currentKnowledge = optionalDependencyContent<CompanyKnowledgeArtifactContent>(
      context.dependencies.company_knowledge,
    );

    validateStructuredIntelligenceDependency(structuredIntelligence);

    if (currentKnowledge !== null) {
      validateCompanyKnowledgeDependency(currentKnowledge);
    }

    const candidateKnowledge = buildCandidateKnowledgeFromStructuredIntelligence(structuredIntelligence);
    const comparisonResults = compareCompanyKnowledgeFields(
      currentKnowledge?.knowledge ?? null,
      candidateKnowledge,
      structuredIntelligence,
    );
    const candidateChanges = comparisonResults.filter((change) => change.supporting_evidence.length > 0);
    const content: CompanyKnowledgeCandidateContent = {
      company_id: context.input.company_id,
      period_id: context.input.period_id,
      filing_id: context.input.filing_id,
      candidate_changes: candidateChanges,
      candidate_summary: buildCandidateSummary(candidateChanges),
      evaluation_hooks: buildCompanyKnowledgeCandidateEvaluationHooks(candidateChanges),
    };

    validateCompanyKnowledgeCandidateContent(content);

    return {
      content,
    };
  }
}

function dependencyContent<T>(artifact: Artifact<unknown> | undefined, dependencyName: string): T {
  if (!artifact) {
    throw new BuilderDependencyError(`Missing required Company Knowledge Builder dependency: ${dependencyName}`);
  }

  return artifact.content as T;
}

function optionalDependencyContent<T>(artifact: Artifact<unknown> | undefined): T | null {
  return artifact ? artifact.content as T : null;
}
