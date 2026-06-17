import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type { BusinessSignalsArtifactContent, TopicEvolutionArtifactContent } from "../business-signals-builder/types.js";
import type { CompanyKnowledgeArtifactContent } from "../company-knowledge-builder/types.js";
import type { CommitmentTrackingArtifactContent, TrustSignalsArtifactContent } from "../trust-signals-builder/types.js";
import type { QuarterUnderstandingArtifactContent } from "../quarter-understanding-builder/types.js";
import type { DepthLevel, QuestionConfidenceLevel, QuestionStatus } from "./contract.js";

export type InvestorIntelligenceBuilderInput = {
  company_id: string;
  period_id: string;
};

export type InvestorIntelligenceBuilderDependencies = {
  company_knowledge: Artifact<CompanyKnowledgeArtifactContent>;
  quarter_understanding: Artifact<QuarterUnderstandingArtifactContent>;
  business_signals?: Artifact<BusinessSignalsArtifactContent>;
  trust_signals?: Artifact<TrustSignalsArtifactContent>;
  commitment_tracking?: Artifact<CommitmentTrackingArtifactContent>;
  topic_evolution?: Artifact<TopicEvolutionArtifactContent>;
  prior_investor_intelligence?: Artifact<InvestorIntelligenceArtifactContent>;
  market_data?: Artifact<unknown>;
};

export type EnrichmentInputStatus = {
  available: boolean;
  artifact_path: string | null;
  artifact_version: number | null;
  absent_reason: string | null;
};

export type EnrichmentStatus = {
  business_signals: EnrichmentInputStatus;
  trust_signals: EnrichmentInputStatus;
  commitment_tracking: EnrichmentInputStatus;
  topic_evolution: EnrichmentInputStatus;
  prior_investor_intelligence: EnrichmentInputStatus;
  market_data: EnrichmentInputStatus;
};

export type DepthIndicator = {
  overall: DepthLevel;
  trust_dimension: "present" | "absent";
  longitudinal_dimension: "present" | "absent";
};

export type QuestionEvidencePackage = {
  company_knowledge_refs: string[];
  quarter_understanding_refs: string[];
  business_signal_refs: string[];
  trust_signal_refs: string[];
  commitment_tracking_refs: string[];
  topic_refs: string[];
  prior_investor_intelligence_refs: string[];
  market_data_refs: string[];
};

export type QuestionBase = {
  status: QuestionStatus;
  confidence: QuestionConfidenceLevel;
  depth_indicator: DepthIndicator;
  evidence_package: QuestionEvidencePackage;
  limitations: string[];
};

export type Q1Business = QuestionBase & {
  summary: string;
  strengths: string[];
  weaknesses: string[];
};

export type Q2Money = QuestionBase & {
  summary: string;
  revenue_quality: string;
  margin_quality: string;
  cash_generation_quality: string;
};

export type Q3Trust = QuestionBase & {
  summary: string;
  trust_assessment: string | null;
  trust_depth_limitation: string | null;
};

export type Q4Price = QuestionBase & {
  summary: string;
  expectation_context: string;
  valuation_depth_limitation: string | null;
  absent_reason: "market_data_unavailable";
};

export type Q5Reason = QuestionBase & {
  bull_case: string[];
  bear_case: string[];
  key_drivers: string[];
  key_risks: string[];
};

export type PromptLineage = {
  prompt_id: string;
  prompt_version: string;
  prompt_hash: string;
  prompt_source: string;
  activation_id: string | null;
  model_version: string;
};

export type InvestorPromptLineage = {
  q1: PromptLineage;
  q2: PromptLineage;
  q3: PromptLineage;
  q4: PromptLineage;
  q5: PromptLineage;
};

export type InvestorIntelligenceConfidence = {
  overall: number;
  q1_score: number;
  q2_score: number;
  q3_score: number;
  q4_score: number;
  q5_score: number;
  grounding_score: number;
  evidence_coverage_score: number;
};

export type PerQuestionInputHashes = {
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  q5: string;
};

export type InvestorIntelligenceEvaluationHooks = {
  prompt_version: string;
  model_version: string;
  prompt_versions: {
    q1: string;
    q2: string;
    q3: string;
    q4: string;
    q5: string;
  };
  model_versions: {
    q1: string;
    q2: string;
    q3: string;
    q4: string;
    q5: string;
  };
  q1_present: boolean;
  q2_present: boolean;
  q3_present: boolean;
  q4_present: boolean;
  q5_present: boolean;
  depth: DepthIndicator;
  enrichment_status: EnrichmentStatus;
};

export type InvestorIntelligenceArtifactContent = {
  company_id: string;
  period_id: string;
  q1: Q1Business;
  q2: Q2Money;
  q3: Q3Trust;
  q4: Q4Price;
  q5: Q5Reason;
  confidence: InvestorIntelligenceConfidence;
  enrichment_status: EnrichmentStatus;
  depth_indicator: DepthIndicator;
  per_question_input_hashes: PerQuestionInputHashes;
  coherence_hash: string;
  output_hash: string;
  prompt_lineage: InvestorPromptLineage;
  evaluation_hooks: InvestorIntelligenceEvaluationHooks;
};

export type InvestorIntelligenceBuildContext = {
  companyId: string;
  periodId: string;
  companyKnowledgeArtifact: Artifact<CompanyKnowledgeArtifactContent>;
  quarterUnderstandingArtifact: Artifact<QuarterUnderstandingArtifactContent>;
  businessSignalsArtifact: Artifact<BusinessSignalsArtifactContent> | null;
  trustSignalsArtifact: Artifact<TrustSignalsArtifactContent> | null;
  commitmentTrackingArtifact: Artifact<CommitmentTrackingArtifactContent> | null;
  topicEvolutionArtifact: Artifact<TopicEvolutionArtifactContent> | null;
  priorInvestorIntelligenceArtifact: Artifact<InvestorIntelligenceArtifactContent> | null;
  marketDataArtifact: Artifact<unknown> | null;
};

export type Q5Input = {
  q1: Q1Business;
  q2: Q2Money;
  q3: Q3Trust;
  q4: Q4Price;
};

export type QuestionPromptBase = {
  status: QuestionStatus;
  evidence_package: QuestionEvidencePackage;
  limitations: string[];
};

export type Q1PromptOutput = QuestionPromptBase & Omit<Q1Business, keyof QuestionBase>;
export type Q2PromptOutput = QuestionPromptBase & Omit<Q2Money, keyof QuestionBase>;
export type Q3PromptOutput = QuestionPromptBase & Omit<Q3Trust, keyof QuestionBase>;
export type Q4PromptOutput = QuestionPromptBase & Omit<Q4Price, keyof QuestionBase>;
export type Q5PromptOutput = QuestionPromptBase & Omit<Q5Reason, keyof QuestionBase>;
