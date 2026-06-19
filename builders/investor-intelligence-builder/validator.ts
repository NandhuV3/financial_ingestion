import type { Artifact } from "../../contracts/artifacts/artifact.js";
import { BuilderDependencyError, BuilderValidationError } from "../../packages/builder-framework/src/builder-errors.js";
import { INVESTOR_CONFIDENCE_MAX, INVESTOR_CONFIDENCE_MIN } from "./confidence-contract.js";
import { DEPTH_LEVELS, QUESTION_CONFIDENCE_LEVELS, QUESTION_STATUSES } from "./contract.js";
import type {
  EnrichmentInputStatus,
  InvestorIntelligenceArtifactContent,
  InvestorIntelligenceBuilderInput,
  QuestionBase,
} from "./types.js";

export function validateInvestorIntelligenceBuilderInput(input: InvestorIntelligenceBuilderInput): void {
  requireText(input.company_id, "company_id");
  requireText(input.period_id, "period_id");
}

export function requireDependency<T>(
  artifact: Artifact<unknown> | undefined,
  dependencyName: string,
  artifactType: string,
): Artifact<T> {
  if (artifact === undefined) {
    throw new BuilderDependencyError(`Missing required Investor Intelligence Builder dependency: ${dependencyName}`);
  }

  if (artifact.identity.artifact_type !== artifactType) {
    throw new BuilderDependencyError(
      `Investor Intelligence Builder dependency ${dependencyName} must be ${artifactType}.`,
    );
  }

  return artifact as Artifact<T>;
}

export function optionalDependency<T>(
  artifact: Artifact<unknown> | undefined,
  dependencyName: string,
  artifactType: string,
): Artifact<T> | null {
  if (artifact === undefined) {
    return null;
  }

  if (artifact.identity.artifact_type !== artifactType) {
    throw new BuilderDependencyError(
      `Investor Intelligence Builder dependency ${dependencyName} must be ${artifactType}.`,
    );
  }

  return artifact as Artifact<T>;
}

export function rejectForbiddenDependencies(dependencies: Record<string, Artifact<unknown> | undefined>): void {
  const forbidden = [
    "quarter_change",
    "narrative_consistency",
    "accounting_stability",
    "capital_allocation_tracking",
    "filing",
    "current_filing",
    "raw_filing",
    "partner_domain",
  ];

  for (const dependencyName of forbidden) {
    if (dependencies[dependencyName] !== undefined) {
      throw new BuilderDependencyError(`Investor Intelligence Builder must not consume ${dependencyName}.`);
    }
  }
}

export function validateTrustSignalsFallbackRule(params: {
  trustSignalsPresent: boolean;
  trustDimension: "present" | "absent";
}): void {
  if (params.trustSignalsPresent && params.trustDimension === "present") {
    throw new BuilderDependencyError(
      "Investor Intelligence Builder may consume Trust Signals directly only when Quarter Understanding trust_dimension is absent.",
    );
  }
}

export function validateInvestorIntelligenceArtifactContent(content: InvestorIntelligenceArtifactContent): void {
  requireText(content.company_id, "investor_intelligence.company_id");
  requireText(content.period_id, "investor_intelligence.period_id");
  validateDepthIndicator(content);
  validateEnrichmentStatus(content);
  validateSection(content.q1, "q1");
  validateSection(content.q2, "q2");
  validateSection(content.q3, "q3");
  validateSection(content.q4, "q4");
  validateSection(content.q5, "q5");
  validateQ3(content);
  validateQ4(content);
  validateNarrativeFields(content);
  validateConfidence(content);
  validateHashes(content);
  validatePromptLineage(content);
  validateEvaluationHooks(content);
}

function validateDepthIndicator(content: InvestorIntelligenceArtifactContent): void {
  if (!DEPTH_LEVELS.includes(content.depth_indicator.overall)) {
    throw new BuilderValidationError("investor_intelligence.depth_indicator.overall is invalid.");
  }

  if (content.depth_indicator.trust_dimension !== "present" && content.depth_indicator.trust_dimension !== "absent") {
    throw new BuilderValidationError("investor_intelligence.depth_indicator.trust_dimension is invalid.");
  }

  if (content.depth_indicator.longitudinal_dimension !== "present"
    && content.depth_indicator.longitudinal_dimension !== "absent") {
    throw new BuilderValidationError("investor_intelligence.depth_indicator.longitudinal_dimension is invalid.");
  }
}

function validateEnrichmentStatus(content: InvestorIntelligenceArtifactContent): void {
  validateEnrichmentInputStatus(content.enrichment_status.business_signals, "business_signals");
  validateEnrichmentInputStatus(content.enrichment_status.trust_signals, "trust_signals");
  validateEnrichmentInputStatus(content.enrichment_status.commitment_tracking, "commitment_tracking");
  validateEnrichmentInputStatus(content.enrichment_status.topic_evolution, "topic_evolution");
  validateEnrichmentInputStatus(content.enrichment_status.prior_investor_intelligence, "prior_investor_intelligence");
  validateEnrichmentInputStatus(content.enrichment_status.market_data, "market_data");
}

function validateEnrichmentInputStatus(status: EnrichmentInputStatus, field: string): void {
  if (status === null || typeof status !== "object") {
    throw new BuilderValidationError(`investor_intelligence.enrichment_status.${field} must be an object.`);
  }

  if (typeof status.available !== "boolean") {
    throw new BuilderValidationError(`investor_intelligence.enrichment_status.${field}.available must be boolean.`);
  }

  if (status.available) {
    requireText(status.artifact_path, `investor_intelligence.enrichment_status.${field}.artifact_path`);

    if (!Number.isSafeInteger(status.artifact_version) || status.artifact_version === null || status.artifact_version <= 0) {
      throw new BuilderValidationError(
        `investor_intelligence.enrichment_status.${field}.artifact_version must be a positive integer when available.`,
      );
    }

    if (status.absent_reason !== null && status.absent_reason !== undefined) {
      throw new BuilderValidationError(`investor_intelligence.enrichment_status.${field}.absent_reason must be absent when available.`);
    }

    return;
  }

  if (status.artifact_path !== null && status.artifact_path !== undefined) {
    throw new BuilderValidationError(`investor_intelligence.enrichment_status.${field}.artifact_path must be absent when unavailable.`);
  }

  if (status.artifact_version !== null && status.artifact_version !== undefined) {
    throw new BuilderValidationError(`investor_intelligence.enrichment_status.${field}.artifact_version must be absent when unavailable.`);
  }

  requireText(status.absent_reason, `investor_intelligence.enrichment_status.${field}.absent_reason`);
}

function validateSection(section: QuestionBase, sectionName: string): void {
  if (!QUESTION_STATUSES.includes(section.status)) {
    throw new BuilderValidationError(`${sectionName}.status is invalid.`);
  }

  if (!QUESTION_CONFIDENCE_LEVELS.includes(section.confidence)) {
    throw new BuilderValidationError(`${sectionName}.confidence is invalid.`);
  }

  validateStringArray(section.limitations, `${sectionName}.limitations`);
  validateQuestionEvidence(section, sectionName);
}

function validateQuestionEvidence(section: QuestionBase, sectionName: string): void {
  validateStringArray(section.evidence_package.company_knowledge_refs, `${sectionName}.evidence_package.company_knowledge_refs`);
  validateStringArray(section.evidence_package.quarter_understanding_refs, `${sectionName}.evidence_package.quarter_understanding_refs`);
  validateStringArray(section.evidence_package.business_signal_refs, `${sectionName}.evidence_package.business_signal_refs`);
  validateStringArray(section.evidence_package.trust_signal_refs, `${sectionName}.evidence_package.trust_signal_refs`);
  validateStringArray(section.evidence_package.commitment_tracking_refs, `${sectionName}.evidence_package.commitment_tracking_refs`);
  validateStringArray(section.evidence_package.topic_refs, `${sectionName}.evidence_package.topic_refs`);
  validateStringArray(section.evidence_package.prior_investor_intelligence_refs, `${sectionName}.evidence_package.prior_investor_intelligence_refs`);
  validateStringArray(section.evidence_package.market_data_refs, `${sectionName}.evidence_package.market_data_refs`);
}

function validateQ3(content: InvestorIntelligenceArtifactContent): void {
  if (content.depth_indicator.trust_dimension === "present" && content.q3.evidence_package.trust_signal_refs.length > 0) {
    throw new BuilderValidationError("q3 must not reference Trust Signals when Quarter Understanding trust dimension is present.");
  }

  if (content.depth_indicator.trust_dimension === "absent" && content.q3.trust_assessment !== null) {
    throw new BuilderValidationError("q3.trust_assessment must be null when Quarter Understanding trust dimension is absent.");
  }
}

function validateQ4(content: InvestorIntelligenceArtifactContent): void {
  if (content.q4.status !== "insufficient_data") {
    throw new BuilderValidationError("q4.status must be insufficient_data in Sprint 11.");
  }

  if (content.q4.absent_reason !== "market_data_unavailable") {
    throw new BuilderValidationError("q4.absent_reason must be market_data_unavailable in Sprint 11.");
  }

  if (content.q4.evidence_package.market_data_refs.length > 0) {
    throw new BuilderValidationError("q4 must not reference Market Data while Sprint 11 valuation is deferred.");
  }
}

function validateNarrativeFields(content: InvestorIntelligenceArtifactContent): void {
  validateForbiddenLanguage(content.q1.summary, "q1.summary");
  validateForbiddenLanguage(content.q1.strengths.join(" "), "q1.strengths");
  validateForbiddenLanguage(content.q1.weaknesses.join(" "), "q1.weaknesses");
  validateForbiddenLanguage(content.q1.limitations.join(" "), "q1.limitations");

  validateForbiddenLanguage(content.q2.summary, "q2.summary");
  validateForbiddenLanguage(content.q2.revenue_quality, "q2.revenue_quality");
  validateForbiddenLanguage(content.q2.margin_quality, "q2.margin_quality");
  validateForbiddenLanguage(content.q2.cash_generation_quality, "q2.cash_generation_quality");
  validateForbiddenLanguage(content.q2.limitations.join(" "), "q2.limitations");

  validateForbiddenLanguage(content.q3.summary, "q3.summary");
  validateForbiddenLanguage(content.q3.trust_assessment ?? "", "q3.trust_assessment");
  validateForbiddenLanguage(content.q3.trust_depth_limitation ?? "", "q3.trust_depth_limitation");
  validateForbiddenLanguage(content.q3.limitations.join(" "), "q3.limitations");

  validateForbiddenLanguage(content.q4.summary, "q4.summary");
  validateForbiddenLanguage(content.q4.expectation_context, "q4.expectation_context");
  validateForbiddenLanguage(content.q4.valuation_depth_limitation ?? "", "q4.valuation_depth_limitation");
  validateForbiddenLanguage(content.q4.limitations.join(" "), "q4.limitations");

  validateForbiddenLanguage(content.q5.bull_case.join(" "), "q5.bull_case");
  validateForbiddenLanguage(content.q5.bear_case.join(" "), "q5.bear_case");
  validateForbiddenLanguage(content.q5.key_drivers.join(" "), "q5.key_drivers");
  validateForbiddenLanguage(content.q5.key_risks.join(" "), "q5.key_risks");
  validateForbiddenLanguage(content.q5.limitations.join(" "), "q5.limitations");
}

function validateConfidence(content: InvestorIntelligenceArtifactContent): void {
  for (const [field, value] of Object.entries(content.confidence)) {
    if (!Number.isFinite(value) || value < INVESTOR_CONFIDENCE_MIN || value > INVESTOR_CONFIDENCE_MAX) {
      throw new BuilderValidationError(`investor_intelligence.confidence.${field} must be between ${INVESTOR_CONFIDENCE_MIN} and ${INVESTOR_CONFIDENCE_MAX}.`);
    }
  }
}

function validateHashes(content: InvestorIntelligenceArtifactContent): void {
  requireText(content.per_question_input_hashes.q1, "per_question_input_hashes.q1");
  requireText(content.per_question_input_hashes.q2, "per_question_input_hashes.q2");
  requireText(content.per_question_input_hashes.q3, "per_question_input_hashes.q3");
  requireText(content.per_question_input_hashes.q4, "per_question_input_hashes.q4");
  requireText(content.per_question_input_hashes.q5, "per_question_input_hashes.q5");
  requireText(content.coherence_hash, "coherence_hash");
  requireText(content.output_hash, "output_hash");
}

function validatePromptLineage(content: InvestorIntelligenceArtifactContent): void {
  if (!content.prompt_lineage || typeof content.prompt_lineage !== "object") {
    throw new BuilderValidationError("prompt_lineage is required.");
  }

  for (const question of ["q1", "q2", "q3", "q4", "q5"] as const) {
    const lineage = content.prompt_lineage[question];

    if (!lineage || typeof lineage !== "object") {
      throw new BuilderValidationError(`prompt_lineage.${question} is required.`);
    }

    requireText(lineage.prompt_id, `prompt_lineage.${question}.prompt_id`);
    requireText(lineage.prompt_version, `prompt_lineage.${question}.prompt_version`);
    requireText(lineage.prompt_hash, `prompt_lineage.${question}.prompt_hash`);
    requireText(lineage.prompt_source, `prompt_lineage.${question}.prompt_source`);
    requireText(lineage.model_version, `prompt_lineage.${question}.model_version`);
  }
}

function validateEvaluationHooks(content: InvestorIntelligenceArtifactContent): void {
  if (!content.evaluation_hooks.prompt_versions || typeof content.evaluation_hooks.prompt_versions !== "object") {
    throw new BuilderValidationError("evaluation_hooks.prompt_versions is required.");
  }

  if (!content.evaluation_hooks.model_versions || typeof content.evaluation_hooks.model_versions !== "object") {
    throw new BuilderValidationError("evaluation_hooks.model_versions is required.");
  }

  for (const question of ["q1", "q2", "q3", "q4", "q5"] as const) {
    if (content.evaluation_hooks.prompt_versions[question] !== content.prompt_lineage[question].prompt_version) {
      throw new BuilderValidationError(`evaluation_hooks.prompt_versions.${question} must match prompt lineage.`);
    }

    if (content.evaluation_hooks.model_versions[question] !== content.prompt_lineage[question].model_version) {
      throw new BuilderValidationError(`evaluation_hooks.model_versions.${question} must match prompt lineage.`);
    }
  }
}

function validateStringArray(values: string[], field: string): void {
  if (!Array.isArray(values)) {
    throw new BuilderValidationError(`${field} must be an array.`);
  }

  for (const [index, value] of values.entries()) {
    requireText(value, `${field}[${index}]`);
  }
}

function validateForbiddenLanguage(value: string, field: string): void {
  const forbidden = [
    "recommend buying",
    "recommend selling",
    "recommend holding",
    "buy recommendation",
    "sell recommendation",
    "hold recommendation",
    "should buy",
    "should sell",
    "should hold",
    "investors should buy",
    "investors should sell",
    "investors should hold",
    "target price",
    "target prices",
    "price target",
    "price targets",
    "intrinsic value",
    "fair value",
    "margin of safety",
    "expected return",
    "upside",
    "downside",
  ];
  const normalized = value.toLowerCase();

  for (const phrase of forbidden) {
    if (normalized.includes(phrase)) {
      throw new BuilderValidationError(`${field} contains forbidden Investor Intelligence language: ${phrase}.`);
    }
  }
}

function requireText(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new BuilderValidationError(`${field} must be a non-empty string.`);
  }

  return value;
}
