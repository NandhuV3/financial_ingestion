import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type { CompanyKnowledgeArtifactContent } from "../company-knowledge-builder/types.js";
import type { BusinessSignal, BusinessSignalsArtifactContent, TopicEvolutionArtifactContent } from "../business-signals-builder/types.js";
import type { TrustSignalsArtifactContent, TrustSignal } from "../trust-signals-builder/types.js";
import type {
  DepthLevel,
  UnderstandingCategory,
  UnderstandingDirection,
  UnderstandingImportance,
} from "./contract.js";

export type QuarterUnderstandingBuilderInput = {
  company_id: string;
  period_id: string;
};

export type QuarterUnderstandingBuilderDependencies = {
  company_knowledge: Artifact<CompanyKnowledgeArtifactContent>;
  business_signals: Artifact<BusinessSignalsArtifactContent>;
  trust_signals?: Artifact<TrustSignalsArtifactContent>;
  topic_evolution?: Artifact<TopicEvolutionArtifactContent>;
  concept_registry?: Artifact<ConceptRegistryContent>;
};

export type EnrichmentInputStatus = {
  available: boolean;
  artifact_path: string | null;
  artifact_version: number | null;
  absent_reason: string | null;
};

export type EnrichmentStatus = {
  trust_signals: EnrichmentInputStatus;
  topic_evolution: EnrichmentInputStatus;
  concept_registry: EnrichmentInputStatus;
};

export type DepthIndicator = {
  overall: DepthLevel;
  trust_dimension: "present" | "absent";
  longitudinal_dimension: "present" | "absent";
};

export type EvidencePackage = {
  signal_refs: string[];
  company_knowledge_refs: string[];
  trust_signal_refs: string[];
  topic_refs: string[];
};

export type Understanding = {
  understanding_id: string;
  category: UnderstandingCategory;
  concept_id?: string;
  title: string;
  explanation: string;
  importance: UnderstandingImportance;
  direction: UnderstandingDirection;
  evidence_package: EvidencePackage;
};

export type ProposedConcept = {
  proposed_concept_id: string;
  title: string;
  description: string;
  evidence_refs: string[];
  rationale: string;
};

export type QuarterUnderstandingConfidence = {
  overall: number;
  grounding_score: number;
  signal_utilization_score: number;
  evidence_coverage_score: number;
  interpretation_quality_score: number;
};

export type QuarterUnderstandingEvaluationHooks = {
  prompt_version: string;
  model_version: string;
  understanding_count: number;
  signal_utilization: {
    available_signal_count: number;
    used_signal_count: number;
    ignored_signal_count: number;
  };
  grounding: {
    evidence_package_count: number;
    missing_evidence_count: number;
  };
  concept_usage: {
    concept_registry_available: boolean;
    emitted_concept_count: number;
    proposed_concept_count: number;
  };
  depth: DepthIndicator;
  enrichment_status: EnrichmentStatus;
};

export type QuarterUnderstandingArtifactContent = {
  company_id: string;
  period_id: string;
  understandings: Understanding[];
  proposed_concepts: ProposedConcept[];
  enrichment_status: EnrichmentStatus;
  depth_indicator: DepthIndicator;
  confidence: QuarterUnderstandingConfidence;
  evaluation_hooks: QuarterUnderstandingEvaluationHooks;
};

export type ConceptRegistryContent = {
  concepts?: ConceptRegistryConcept[];
};

export type ConceptRegistryConcept = {
  concept_id: string;
  category: UnderstandingCategory;
  title: string;
  status: "active" | "inactive";
};

export type QuarterUnderstandingBuildContext = {
  companyId: string;
  periodId: string;
  companyKnowledgeArtifact: Artifact<CompanyKnowledgeArtifactContent>;
  businessSignalsArtifact: Artifact<BusinessSignalsArtifactContent>;
  trustSignalsArtifact: Artifact<TrustSignalsArtifactContent> | null;
  topicEvolutionArtifact: Artifact<TopicEvolutionArtifactContent> | null;
  conceptRegistryArtifact: Artifact<ConceptRegistryContent> | null;
};

export type UnderstandingSeed = {
  category: UnderstandingCategory;
  title: string;
  explanation: string;
  importance: UnderstandingImportance;
  direction: UnderstandingDirection;
  signal_refs: string[];
  company_knowledge_refs: string[];
  trust_signal_refs: string[];
  topic_refs: string[];
};

export type SignalGroup = {
  category: UnderstandingCategory;
  signals: BusinessSignal[];
};

export type TrustSignalGroup = {
  signals: TrustSignal[];
};
