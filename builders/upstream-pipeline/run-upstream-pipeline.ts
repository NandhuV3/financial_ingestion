import type { Artifact } from "../../contracts/artifacts/artifact.js";
import { calculateArtifactHash } from "../../packages/artifact-framework/src/artifact-service.js";
import { BuilderExecutionError } from "../../packages/builder-framework/src/builder-errors.js";
import type { BuilderResult } from "../../packages/builder-framework/src/builder-result.js";
import { PROMOTION_RULES_VERSION } from "../../governance/company-knowledge-governance/promotion-rules.js";
import {
  BUSINESS_SIGNALS_BUILDER_TYPE,
} from "../business-signals-builder/contract.js";
import type {
  BusinessSignalsArtifactContent,
  BusinessSignalsBuilderInput,
} from "../business-signals-builder/types.js";
import {
  COMPANY_KNOWLEDGE_BUILDER_TYPE,
  type CompanyKnowledgeCandidateContent,
} from "../company-knowledge-builder/contract.js";
import type {
  CompanyKnowledgeArtifactContent,
  CompanyKnowledgeBuilderInput,
} from "../company-knowledge-builder/types.js";
import {
  STRUCTURED_INTELLIGENCE_BUILDER_TYPE,
  type StructuredIntelligenceArtifactContent,
} from "../structured-intelligence/contract.js";
import type {
  FilingArtifactContent,
  StructuredIntelligenceBuilderInput,
} from "../structured-intelligence/types.js";
import {
  THEMES_BUILDER_TYPE,
  type ThemesArtifactContent,
} from "../themes/contract.js";
import type {
  FilingType,
  ThemesBuilderInput,
} from "../themes/types.js";
import {
  TOPIC_ASSIGNMENT_BUILDER_TYPE,
} from "../topic-assignment-builder/contract.js";
import type {
  TopicAssignmentArtifactContent,
  TopicAssignmentBuilderInput,
  TopicRegistryArtifactContent,
} from "../topic-assignment-builder/types.js";
import type { UpstreamPipelineRuntime } from "./register-builders.js";

export type RunUpstreamPipelineInput = {
  runtime: UpstreamPipelineRuntime;
  filingArtifact: Artifact<FilingArtifactContent>;
  topicRegistryArtifact: Artifact<TopicRegistryArtifactContent>;
  companyId: string;
  periodId: string;
  generatedAt?: string;
  onArtifact?: UpstreamPipelineArtifactObserver;
};

export const UPSTREAM_PIPELINE_STAGES = [
  "themes",
  "topic_assignment",
  "structured_intelligence",
  "company_knowledge_candidate",
  "governance_decision",
  "company_knowledge",
  "business_signals",
] as const;

export type UpstreamPipelineStage = typeof UPSTREAM_PIPELINE_STAGES[number];

export type UpstreamPipelineArtifactObserver = (
  stage: UpstreamPipelineStage,
  artifact: Artifact<unknown>,
) => void | Promise<void>;

export async function runUpstreamPipeline(
  input: RunUpstreamPipelineInput,
): Promise<BuilderResult<BusinessSignalsArtifactContent>> {
  validateFilingIdentity(input);

  const themesInput: ThemesBuilderInput = {
    company_id: input.companyId,
    period_id: input.periodId,
    filing_id: input.filingArtifact.content.filing_id,
    filing_type: filingType(input.filingArtifact.content.filing_type),
    filing_content: input.filingArtifact.content.filing_content,
    filing_hash: input.filingArtifact.content.filing_hash,
  };
  const themes = await input.runtime.executor.executeBuilder<
    ThemesBuilderInput,
    ThemesArtifactContent
  >({
    builderType: THEMES_BUILDER_TYPE,
    companyId: input.companyId,
    periodId: input.periodId,
    executionId: executionId(input, "themes"),
    input: themesInput,
    inputHash: calculateArtifactHash(themesInput),
    dependencies: {
      filing: input.filingArtifact,
    },
    generatedAt: input.generatedAt,
  });
  await emitArtifact(input, "themes", themes);

  const topicAssignmentInput: TopicAssignmentBuilderInput = {
    company_id: input.companyId,
    period_id: input.periodId,
    filing_id: input.filingArtifact.content.filing_id,
  };
  const topicAssignment = await input.runtime.executor.executeBuilder<
    TopicAssignmentBuilderInput,
    TopicAssignmentArtifactContent
  >({
    builderType: TOPIC_ASSIGNMENT_BUILDER_TYPE,
    companyId: input.companyId,
    periodId: input.periodId,
    executionId: executionId(input, "topic-assignment"),
    input: topicAssignmentInput,
    inputHash: calculateArtifactHash({
      themes: themes.metadata.artifact_hash,
      topic_registry: input.topicRegistryArtifact.metadata.artifact_hash,
    }),
    dependencies: {
      themes,
      topic_registry: input.topicRegistryArtifact,
    },
    generatedAt: input.generatedAt,
  });
  await emitArtifact(input, "topic_assignment", topicAssignment);

  const structuredInput: StructuredIntelligenceBuilderInput = {
    company_id: input.companyId,
    period_id: input.periodId,
    filing_id: input.filingArtifact.content.filing_id,
  };
  const structuredIntelligence = await input.runtime.executor.executeBuilder<
    StructuredIntelligenceBuilderInput,
    StructuredIntelligenceArtifactContent
  >({
    builderType: STRUCTURED_INTELLIGENCE_BUILDER_TYPE,
    companyId: input.companyId,
    periodId: input.periodId,
    executionId: executionId(input, "structured-intelligence"),
    input: structuredInput,
    inputHash: calculateArtifactHash({
      filing: input.filingArtifact.metadata.artifact_hash,
      themes: themes.metadata.artifact_hash,
    }),
    dependencies: {
      filing: input.filingArtifact,
      themes,
    },
    generatedAt: input.generatedAt,
  });
  await emitArtifact(input, "structured_intelligence", structuredIntelligence);

  const currentCompanyKnowledge =
    await input.runtime.artifactService.getCurrentArtifact<CompanyKnowledgeArtifactContent>({
      artifact_type: "company_knowledge",
      company_id: input.companyId,
      period_id: input.periodId,
    });
  const candidateInput: CompanyKnowledgeBuilderInput = {
    company_id: input.companyId,
    period_id: input.periodId,
    filing_id: input.filingArtifact.content.filing_id,
  };
  const companyKnowledgeCandidate = await input.runtime.executor.executeBuilder<
    CompanyKnowledgeBuilderInput,
    CompanyKnowledgeCandidateContent
  >({
    builderType: COMPANY_KNOWLEDGE_BUILDER_TYPE,
    companyId: input.companyId,
    periodId: input.periodId,
    executionId: executionId(input, "company-knowledge-candidate"),
    input: candidateInput,
    inputHash: calculateArtifactHash({
      structured_intelligence: structuredIntelligence.metadata.artifact_hash,
      current_company_knowledge:
        currentCompanyKnowledge?.metadata.artifact_hash ?? null,
    }),
    dependencies: {
      structured_intelligence: structuredIntelligence,
      ...(currentCompanyKnowledge === null
        ? {}
        : { company_knowledge: currentCompanyKnowledge }),
    },
    generatedAt: input.generatedAt,
  });
  await emitArtifact(
    input,
    "company_knowledge_candidate",
    companyKnowledgeCandidate,
  );

  const governanceResult = await input.runtime.governanceEngine.execute({
    company_id: input.companyId,
    period_id: input.periodId,
    candidate_artifact: companyKnowledgeCandidate,
    current_company_knowledge: currentCompanyKnowledge,
    promotion_rules_version: PROMOTION_RULES_VERSION,
    reviewer: null,
    manual_override: null,
    generated_at: input.generatedAt,
  });
  await emitArtifact(
    input,
    "governance_decision",
    governanceResult.governance_decision,
  );

  if (governanceResult.company_knowledge === null) {
    throw new BuilderExecutionError(
      "Company Knowledge governance did not produce an approved artifact.",
    );
  }
  await emitArtifact(
    input,
    "company_knowledge",
    governanceResult.company_knowledge,
  );

  const businessSignalsInput: BusinessSignalsBuilderInput = {
    company_id: input.companyId,
    period_id: input.periodId,
  };
  const businessSignals = await input.runtime.executor.executeBuilder<
    BusinessSignalsBuilderInput,
    BusinessSignalsArtifactContent
  >({
    builderType: BUSINESS_SIGNALS_BUILDER_TYPE,
    companyId: input.companyId,
    periodId: input.periodId,
    executionId: executionId(input, "business-signals"),
    input: businessSignalsInput,
    inputHash: calculateArtifactHash({
      company_knowledge:
        governanceResult.company_knowledge.metadata.artifact_hash,
    }),
    dependencies: {
      company_knowledge: governanceResult.company_knowledge,
    },
    generatedAt: input.generatedAt,
  });
  await emitArtifact(input, "business_signals", businessSignals);

  return {
    content: businessSignals.content,
  };
}

function validateFilingIdentity(input: RunUpstreamPipelineInput): void {
  if (input.filingArtifact.identity.artifact_type !== "filing") {
    throw new BuilderExecutionError(
      "Upstream pipeline requires a filing artifact.",
    );
  }

  if (
    input.filingArtifact.identity.company_id !== input.companyId
    || input.filingArtifact.identity.period_id !== input.periodId
  ) {
    throw new BuilderExecutionError(
      "Filing artifact company and period must match the pipeline target.",
    );
  }

  if (input.filingArtifact.content.filing_period !== input.periodId) {
    throw new BuilderExecutionError(
      "Filing content period must match the pipeline target.",
    );
  }
}

function filingType(value: string): FilingType {
  if (value === "10-K" || value === "10-Q" || value === "Transcript") {
    return value;
  }

  throw new BuilderExecutionError(
    `Unsupported Themes filing type: ${value}.`,
  );
}

function executionId(
  input: RunUpstreamPipelineInput,
  stage: string,
): string {
  return `${input.companyId}:${input.periodId}:${stage}`;
}

async function emitArtifact(
  input: RunUpstreamPipelineInput,
  stage: UpstreamPipelineStage,
  artifact: Artifact<unknown>,
): Promise<void> {
  await input.onArtifact?.(stage, artifact);
}
