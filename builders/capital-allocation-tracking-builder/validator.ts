import type { Artifact } from "../../contracts/artifacts/artifact.js";
import { BuilderDependencyError, BuilderValidationError } from "../../packages/builder-framework/src/builder-errors.js";
import {
  CAPITAL_ALLOCATION_TYPES,
  DEPTH_LEVELS,
  FINANCIAL_STATEMENT_COVERAGE,
  GAP_TYPES,
} from "./contract.js";
import type {
  CapitalAllocationGap,
  CapitalAllocationTrackingArtifactContent,
  CapitalAllocationTrackingBuilderInput,
} from "./types.js";
import {
  requireAllowed,
  requireNonEmptyStringArray,
  requireStringArray,
  requireText,
  validateEnrichmentInputStatus,
} from "./validation-helpers.js";

export function validateCapitalAllocationTrackingBuilderInput(
  input: CapitalAllocationTrackingBuilderInput,
): void {
  requireText(input.company_id, "company_id");
  requireText(input.period_id, "period_id");
}

export function requireDependency<T>(
  artifact: Artifact<unknown> | undefined,
  dependencyName: string,
  artifactType: string,
): Artifact<T> {
  if (artifact === undefined) {
    throw new BuilderDependencyError(`Missing required Capital Allocation Tracking dependency: ${dependencyName}`);
  }

  if (artifact.identity.artifact_type !== artifactType) {
    throw new BuilderDependencyError(
      `Capital Allocation Tracking dependency ${dependencyName} must be ${artifactType}.`,
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
      `Capital Allocation Tracking dependency ${dependencyName} must be ${artifactType}.`,
    );
  }

  return artifact as Artifact<T>;
}

export function validateCapitalAllocationTrackingArtifactContent(
  content: CapitalAllocationTrackingArtifactContent,
): void {
  requireText(content.company_id, "capital_allocation_tracking.company_id");
  requireText(content.period_id, "capital_allocation_tracking.period_id");

  if (!Array.isArray(content.stated_priorities)) {
    throw new BuilderValidationError("capital_allocation_tracking.stated_priorities must be an array.");
  }

  if (!Array.isArray(content.observed_deployments)) {
    throw new BuilderValidationError("capital_allocation_tracking.observed_deployments must be an array.");
  }

  if (!Array.isArray(content.gaps)) {
    throw new BuilderValidationError("capital_allocation_tracking.gaps must be an array.");
  }

  for (const [index, priority] of content.stated_priorities.entries()) {
    requireText(priority.priority_id, `stated_priorities[${index}].priority_id`);
    requireText(priority.description, `stated_priorities[${index}].description`);
    requireAllowed(priority.priority_type, CAPITAL_ALLOCATION_TYPES, `stated_priorities[${index}].priority_type`);
    requireNonEmptyStringArray(priority.evidence_refs, `stated_priorities[${index}].evidence_refs`);
    requireNonEmptyStringArray(priority.filing_refs, `stated_priorities[${index}].filing_refs`);
  }

  for (const [index, deployment] of content.observed_deployments.entries()) {
    requireText(deployment.deployment_id, `observed_deployments[${index}].deployment_id`);
    requireAllowed(
      deployment.deployment_type,
      CAPITAL_ALLOCATION_TYPES,
      `observed_deployments[${index}].deployment_type`,
    );

    if (deployment.amount !== null && !Number.isFinite(deployment.amount)) {
      throw new BuilderValidationError(`observed_deployments[${index}].amount must be finite or null.`);
    }

    requireNonEmptyStringArray(deployment.evidence_refs, `observed_deployments[${index}].evidence_refs`);

    if (deployment.filing_refs.length === 0 && deployment.financial_statement_refs.length === 0) {
      throw new BuilderValidationError(
        `observed_deployments[${index}] must reference a filing or financial statement.`,
      );
    }

    requireStringArray(deployment.filing_refs, `observed_deployments[${index}].filing_refs`);
    requireStringArray(
      deployment.financial_statement_refs,
      `observed_deployments[${index}].financial_statement_refs`,
    );
  }

  validateGaps(content);
  validateCoverageStatus(content);
  validateSummary(content);
  validateEnrichmentStatus(content);
  validateDepthIndicator(content);
  validateDepthConsistency(content);
}

function validateGaps(content: CapitalAllocationTrackingArtifactContent): void {
  const priorityIds = new Set(content.stated_priorities.map((priority) => priority.priority_id));
  const deploymentIds = new Set(content.observed_deployments.map((deployment) => deployment.deployment_id));

  for (const [index, gap] of content.gaps.entries()) {
    requireText(gap.gap_id, `gaps[${index}].gap_id`);
    requireAllowed(gap.gap_type, GAP_TYPES, `gaps[${index}].gap_type`);
    requireText(gap.explanation, `gaps[${index}].explanation`);
    requireNonEmptyStringArray(gap.evidence_refs, `gaps[${index}].evidence_refs`);

    if (gap.priority_refs.length === 0 && gap.deployment_refs.length === 0) {
      throw new BuilderValidationError(`gaps[${index}] must reference a priority or deployment.`);
    }

    requireStringArray(gap.priority_refs, `gaps[${index}].priority_refs`);
    requireStringArray(gap.deployment_refs, `gaps[${index}].deployment_refs`);

    for (const priorityRef of gap.priority_refs) {
      if (!priorityIds.has(priorityRef)) {
        throw new BuilderValidationError(`gaps[${index}] references unknown priority ${priorityRef}.`);
      }
    }

    for (const deploymentRef of gap.deployment_refs) {
      if (!deploymentIds.has(deploymentRef)) {
        throw new BuilderValidationError(`gaps[${index}] references unknown deployment ${deploymentRef}.`);
      }
    }
  }
}

function validateCoverageStatus(content: CapitalAllocationTrackingArtifactContent): void {
  const coverage = content.coverage_status;

  if (coverage === null || typeof coverage !== "object") {
    throw new BuilderValidationError("capital_allocation_tracking.coverage_status must be an object.");
  }

  if (coverage.priorities_available !== (content.stated_priorities.length > 0)) {
    throw new BuilderValidationError("coverage_status.priorities_available must match stated priorities.");
  }

  if (coverage.deployments_available !== (content.observed_deployments.length > 0)) {
    throw new BuilderValidationError("coverage_status.deployments_available must match observed deployments.");
  }

  requireAllowed(
    coverage.financial_statement_coverage,
    FINANCIAL_STATEMENT_COVERAGE,
    "coverage_status.financial_statement_coverage",
  );
}

function validateSummary(content: CapitalAllocationTrackingArtifactContent): void {
  const summary = content.period_summary;

  if (summary.priority_count !== content.stated_priorities.length) {
    throw new BuilderValidationError("period_summary.priority_count must match stated priorities.");
  }

  if (summary.deployment_count !== content.observed_deployments.length) {
    throw new BuilderValidationError("period_summary.deployment_count must match observed deployments.");
  }

  if (summary.gap_count !== content.gaps.length) {
    throw new BuilderValidationError("period_summary.gap_count must match gaps.");
  }

  assertGapCount(content.gaps, summary.aligned_gap_count, "aligned", "aligned_gap_count");
  assertGapCount(content.gaps, summary.under_supported_gap_count, "under_supported", "under_supported_gap_count");
  assertGapCount(
    content.gaps,
    summary.unsupported_deployment_gap_count,
    "unsupported_deployment",
    "unsupported_deployment_gap_count",
  );
  assertGapCount(
    content.gaps,
    summary.insufficient_evidence_gap_count,
    "insufficient_evidence",
    "insufficient_evidence_gap_count",
  );
}

function validateEnrichmentStatus(content: CapitalAllocationTrackingArtifactContent): void {
  validateEnrichmentInputStatus(
    content.enrichment_status.prior_capital_allocation_tracking,
    "enrichment_status.prior_capital_allocation_tracking",
  );
  validateEnrichmentInputStatus(
    content.enrichment_status.prior_financial_statements,
    "enrichment_status.prior_financial_statements",
  );
}

function validateDepthIndicator(content: CapitalAllocationTrackingArtifactContent): void {
  if (!DEPTH_LEVELS.includes(content.depth_indicator.overall)) {
    throw new BuilderValidationError("depth_indicator.overall is invalid.");
  }

  if (!["present", "absent"].includes(content.depth_indicator.prior_period_dimension)) {
    throw new BuilderValidationError("depth_indicator.prior_period_dimension is invalid.");
  }
}

function validateDepthConsistency(content: CapitalAllocationTrackingArtifactContent): void {
  const priorCapitalAvailable = content.enrichment_status.prior_capital_allocation_tracking.available;
  const priorFinancialsAvailable = content.enrichment_status.prior_financial_statements.available;
  const expectedOverall = priorCapitalAvailable && priorFinancialsAvailable
    ? "full"
    : priorCapitalAvailable || priorFinancialsAvailable
      ? "standard"
      : "base";
  const expectedPriorDimension = priorCapitalAvailable || priorFinancialsAvailable ? "present" : "absent";

  if (content.depth_indicator.overall !== expectedOverall) {
    throw new BuilderValidationError("depth_indicator.overall does not match enrichment coverage.");
  }

  if (content.depth_indicator.prior_period_dimension !== expectedPriorDimension) {
    throw new BuilderValidationError("depth_indicator.prior_period_dimension does not match enrichment coverage.");
  }

  if (content.coverage_status.prior_period_available !== (expectedPriorDimension === "present")) {
    throw new BuilderValidationError("coverage_status.prior_period_available must match enrichment coverage.");
  }
}

function assertGapCount(
  gaps: CapitalAllocationGap[],
  actualCount: number,
  gapType: CapitalAllocationGap["gap_type"],
  summaryField: string,
): void {
  const expected = gaps.filter((gap) => gap.gap_type === gapType).length;

  if (actualCount !== expected) {
    throw new BuilderValidationError(`period_summary.${summaryField} must match gaps.`);
  }
}
