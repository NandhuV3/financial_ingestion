import type { ArtifactRepository } from "../../packages/artifact-framework/src/artifact-repository.js";
import { ArtifactService } from "../../packages/artifact-framework/src/artifact-service.js";
import { BuilderExecutor } from "../../packages/builder-framework/src/builder-executor.js";
import { BuilderRegistry } from "../../packages/builder-framework/src/builder-registry.js";
import type { LLMClient } from "../../packages/llm-framework/src/llm-client.js";
import type { PromptResolver } from "../../src/prompt-registry/prompt-resolver.js";
import type { SemanticEmbeddingProvider } from "../topic-assignment-builder/types.js";
import { BusinessSignalsBuilder } from "../business-signals-builder/builder.js";
import {
  BUSINESS_SIGNALS_BUILDER_TYPE,
  BUSINESS_SIGNALS_BUILDER_VERSION,
  BUSINESS_SIGNALS_PIPELINE_VERSION,
  BUSINESS_SIGNALS_SCHEMA_VERSION,
} from "../business-signals-builder/contract.js";
import { EvidenceCatalogBuilder } from "../evidence-catalog-builder/builder.js";
import {
  EVIDENCE_CATALOG_BUILDER_TYPE,
  EVIDENCE_CATALOG_BUILDER_VERSION,
  EVIDENCE_CATALOG_PIPELINE_VERSION,
  EVIDENCE_CATALOG_SCHEMA_VERSION,
} from "../evidence-catalog-builder/contract.js";
import { FilingArtifactBuilder } from "../filing-artifact-builder/builder.js";
import {
  FILING_ARTIFACT_BUILDER_TYPE,
  FILING_ARTIFACT_BUILDER_VERSION,
  FILING_ARTIFACT_PIPELINE_VERSION,
  FILING_ARTIFACT_SCHEMA_VERSION,
} from "../filing-artifact-builder/contract.js";
import { CompanyKnowledgeBuilder } from "../company-knowledge-builder/builder.js";
import {
  COMPANY_KNOWLEDGE_BUILDER_TYPE,
  COMPANY_KNOWLEDGE_BUILDER_VERSION,
  COMPANY_KNOWLEDGE_CANDIDATE_PIPELINE_VERSION,
  COMPANY_KNOWLEDGE_CANDIDATE_SCHEMA_VERSION,
} from "../company-knowledge-builder/contract.js";
import { StructuredIntelligenceBuilder } from "../structured-intelligence/builder.js";
import {
  STRUCTURED_INTELLIGENCE_BUILDER_TYPE,
  STRUCTURED_INTELLIGENCE_BUILDER_VERSION,
  STRUCTURED_INTELLIGENCE_PIPELINE_VERSION,
  STRUCTURED_INTELLIGENCE_SCHEMA_VERSION,
} from "../structured-intelligence/contract.js";
import { ThemesBuilder } from "../themes/builder.js";
import {
  THEMES_BUILDER_TYPE,
  THEMES_BUILDER_VERSION,
  THEMES_PIPELINE_VERSION,
  THEMES_SCHEMA_VERSION,
} from "../themes/contract.js";
import { TopicAssignmentBuilder } from "../topic-assignment-builder/builder.js";
import {
  TOPIC_ASSIGNMENT_BUILDER_TYPE,
  TOPIC_ASSIGNMENT_BUILDER_VERSION,
  TOPIC_ASSIGNMENT_PIPELINE_VERSION,
  TOPIC_ASSIGNMENT_SCHEMA_VERSION,
} from "../topic-assignment-builder/contract.js";
import { TopicEvolutionBuilder } from "../topic-evolution-builder/builder.js";
import {
  TOPIC_EVOLUTION_BUILDER_TYPE,
  TOPIC_EVOLUTION_BUILDER_VERSION,
  TOPIC_EVOLUTION_PIPELINE_VERSION,
  TOPIC_EVOLUTION_SCHEMA_VERSION,
} from "../topic-evolution-builder/contract.js";
import {
  InMemoryCompanyKnowledgeAuditRepository,
  type CompanyKnowledgeAuditRepository,
} from "../../governance/company-knowledge-governance/audit.repository.js";
import { CompanyKnowledgeGovernanceEngine } from "../../governance/company-knowledge-governance/governance-engine.js";
import { GovernanceDecisionRepository } from "../../governance/company-knowledge-governance/governance-decision.repository.js";
import {
  type InvalidationPort,
  RecordingInvalidationPort,
} from "../../governance/company-knowledge-governance/invalidation-port.js";
import {
  InMemoryReviewQueueRepository,
  type ReviewQueueRepository,
} from "../../governance/company-knowledge-governance/review-queue.repository.js";

export type UpstreamPipelineRuntimeOptions = {
  repository: ArtifactRepository;
  promptResolver: Pick<PromptResolver, "resolve">;
  llmClient: LLMClient;
  semanticEmbeddingProvider: SemanticEmbeddingProvider;
  themesModelVersion?: string;
  structuredIntelligenceModelVersion?: string;
  reviewQueueRepository?: ReviewQueueRepository;
  auditRepository?: CompanyKnowledgeAuditRepository;
  invalidationPort?: InvalidationPort;
};

export type UpstreamPipelineRuntime = {
  artifactService: ArtifactService;
  executor: BuilderExecutor;
  governanceEngine: CompanyKnowledgeGovernanceEngine;
};

export function registerUpstreamBuilders(
  options: UpstreamPipelineRuntimeOptions,
): UpstreamPipelineRuntime {
  const artifactService = new ArtifactService(options.repository);
  const registry = new BuilderRegistry();

  registry.registerBuilder({
    builder_type: FILING_ARTIFACT_BUILDER_TYPE,
    artifact_type: "filing",
    version: FILING_ARTIFACT_BUILDER_VERSION,
    schema_version: FILING_ARTIFACT_SCHEMA_VERSION,
    pipeline_version: FILING_ARTIFACT_PIPELINE_VERSION,
  }, () => new FilingArtifactBuilder());

  registry.registerBuilder({
    builder_type: EVIDENCE_CATALOG_BUILDER_TYPE,
    artifact_type: "evidence_catalog",
    version: EVIDENCE_CATALOG_BUILDER_VERSION,
    schema_version: EVIDENCE_CATALOG_SCHEMA_VERSION,
    pipeline_version: EVIDENCE_CATALOG_PIPELINE_VERSION,
  }, () => new EvidenceCatalogBuilder());

  registry.registerBuilder({
    builder_type: THEMES_BUILDER_TYPE,
    artifact_type: "themes",
    version: THEMES_BUILDER_VERSION,
    schema_version: THEMES_SCHEMA_VERSION,
    pipeline_version: THEMES_PIPELINE_VERSION,
  }, () => new ThemesBuilder({
    promptResolver: options.promptResolver,
    llmClient: options.llmClient,
    modelVersion: options.themesModelVersion,
  }));

  registry.registerBuilder({
    builder_type: TOPIC_ASSIGNMENT_BUILDER_TYPE,
    artifact_type: "topic_assignment",
    version: TOPIC_ASSIGNMENT_BUILDER_VERSION,
    schema_version: TOPIC_ASSIGNMENT_SCHEMA_VERSION,
    pipeline_version: TOPIC_ASSIGNMENT_PIPELINE_VERSION,
  }, () => new TopicAssignmentBuilder(options.semanticEmbeddingProvider));

  registry.registerBuilder({
    builder_type: TOPIC_EVOLUTION_BUILDER_TYPE,
    artifact_type: "topic_evolution",
    version: TOPIC_EVOLUTION_BUILDER_VERSION,
    schema_version: TOPIC_EVOLUTION_SCHEMA_VERSION,
    pipeline_version: TOPIC_EVOLUTION_PIPELINE_VERSION,
  }, () => new TopicEvolutionBuilder());

  // registry.registerBuilder({
  //   builder_type: STRUCTURED_INTELLIGENCE_BUILDER_TYPE,
  //   artifact_type: "structured_intelligence",
  //   version: STRUCTURED_INTELLIGENCE_BUILDER_VERSION,
  //   schema_version: STRUCTURED_INTELLIGENCE_SCHEMA_VERSION,
  //   pipeline_version: STRUCTURED_INTELLIGENCE_PIPELINE_VERSION,
  // }, () => new StructuredIntelligenceBuilder({
  //   promptResolver: options.promptResolver,
  //   llmClient: options.llmClient,
  //   modelVersion: options.structuredIntelligenceModelVersion,
  // }));

  // registry.registerBuilder({
  //   builder_type: COMPANY_KNOWLEDGE_BUILDER_TYPE,
  //   artifact_type: "company_knowledge_candidate",
  //   version: COMPANY_KNOWLEDGE_BUILDER_VERSION,
  //   schema_version: COMPANY_KNOWLEDGE_CANDIDATE_SCHEMA_VERSION,
  //   pipeline_version: COMPANY_KNOWLEDGE_CANDIDATE_PIPELINE_VERSION,
  // }, () => new CompanyKnowledgeBuilder());

  // registry.registerBuilder({
  //   builder_type: BUSINESS_SIGNALS_BUILDER_TYPE,
  //   artifact_type: "business_signals",
  //   version: BUSINESS_SIGNALS_BUILDER_VERSION,
  //   schema_version: BUSINESS_SIGNALS_SCHEMA_VERSION,
  //   pipeline_version: BUSINESS_SIGNALS_PIPELINE_VERSION,
  // }, () => new BusinessSignalsBuilder());

  return {
    artifactService,
    executor: new BuilderExecutor(registry, artifactService),
    governanceEngine: new CompanyKnowledgeGovernanceEngine(
      artifactService,
      new GovernanceDecisionRepository(artifactService),
      options.reviewQueueRepository ?? new InMemoryReviewQueueRepository(),
      options.auditRepository ?? new InMemoryCompanyKnowledgeAuditRepository(),
      options.invalidationPort ?? new RecordingInvalidationPort(),
    ),
  };
}
