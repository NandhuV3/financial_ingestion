import type { Artifact } from "../../contracts/artifacts/artifact.js";
import {
  BuilderDependencyError,
  BuilderValidationError,
} from "../../packages/builder-framework/src/builder-errors.js";
import {
  ACCOUNTING_STABILITY_CALIBRATION,
  ACCOUNTING_STABILITY_RULE_SET,
  COMPARABILITY_IMPACTS,
  MATERIALITY_LEVELS,
  POLICY_TYPES,
  RESTATEMENT_SCOPES,
} from "./contract.js";
import type {
  AccountingSourceArtifactContent,
  AccountingStabilityBuilderInput,
} from "./types.js";
import {
  requireAllowed,
  requireProbability,
  requireStringArray,
  requireText,
} from "./validation-helpers.js";

export function validateAccountingBuilderInput(
  input: AccountingStabilityBuilderInput,
): void {
  requireText(input.company_id, "company_id");
  requireText(input.period_id, "period_id");

  if (
    !Array.isArray(input.source_dependencies)
    || input.source_dependencies.length === 0
  ) {
    throw new BuilderValidationError(
      "Accounting Stability requires declared source dependencies.",
    );
  }

  const names = new Set<string>();
  const periods = new Set<string>();
  for (const [index, source] of input.source_dependencies.entries()) {
    const field = `source_dependencies[${index}]`;
    requireText(source.dependency_name, `${field}.dependency_name`);
    requireText(source.period_id, `${field}.period_id`);

    if (!["filing", "structured_intelligence"].includes(source.artifact_type)) {
      throw new BuilderValidationError(`${field}.artifact_type is invalid.`);
    }
    if (names.has(source.dependency_name)) {
      throw new BuilderValidationError(
        `Duplicate Accounting Stability dependency ${source.dependency_name}.`,
      );
    }
    if (periods.has(source.period_id)) {
      throw new BuilderValidationError(
        `Duplicate Accounting Stability period ${source.period_id}.`,
      );
    }
    names.add(source.dependency_name);
    periods.add(source.period_id);
  }

  if (
    input.rule_set.rule_set_ref !== ACCOUNTING_STABILITY_RULE_SET.ref
    || input.rule_set.rule_version !== ACCOUNTING_STABILITY_RULE_SET.version
  ) {
    throw new BuilderValidationError(
      "Accounting Stability rule set is unsupported.",
    );
  }
  if (
    input.calibration.calibration_ref
      !== ACCOUNTING_STABILITY_CALIBRATION.ref
    || input.calibration.calibration_version
      !== ACCOUNTING_STABILITY_CALIBRATION.version
  ) {
    throw new BuilderValidationError(
      "Accounting Stability calibration is unsupported.",
    );
  }
}

export function validateAccountingSourceArtifact(
  artifact: Artifact<AccountingSourceArtifactContent>,
  dependencyName: string,
): void {
  const content = artifact.content;
  requireStringArray(
    content.evidence_refs,
    `${dependencyName}.evidence_refs`,
    false,
  );
  validateCoverage(content, dependencyName);

  const policyTypes = new Set<string>();
  for (const [index, policy] of content.accounting_policies.entries()) {
    const field = `${dependencyName}.accounting_policies[${index}]`;
    requireAllowed(policy.policy_type, POLICY_TYPES, `${field}.policy_type`);
    requireText(policy.policy_text, `${field}.policy_text`);
    if (typeof policy.proactively_disclosed !== "boolean") {
      throw new BuilderDependencyError(
        `${field}.proactively_disclosed must be boolean.`,
      );
    }
    requireAllowed(
      policy.comparability_impact,
      COMPARABILITY_IMPACTS,
      `${field}.comparability_impact`,
    );
    requireStringArray(policy.evidence_refs, `${field}.evidence_refs`, false);
    requireProbability(policy.confidence, `${field}.confidence`);

    if (policyTypes.has(policy.policy_type)) {
      throw new BuilderDependencyError(
        `${dependencyName} contains duplicate policy type ${policy.policy_type}.`,
      );
    }
    policyTypes.add(policy.policy_type);
  }

  const segmentNames = new Set<string>();
  for (const [index, segment] of content.segments.entries()) {
    const field = `${dependencyName}.segments[${index}]`;
    requireText(segment.segment_name, `${field}.segment_name`);
    if (segment.disclosed_reason !== null) {
      requireText(segment.disclosed_reason, `${field}.disclosed_reason`);
    }
    requireAllowed(
      segment.comparability_impact,
      COMPARABILITY_IMPACTS,
      `${field}.comparability_impact`,
    );
    requireStringArray(segment.evidence_refs, `${field}.evidence_refs`, false);
    requireProbability(segment.confidence, `${field}.confidence`);
    if (segmentNames.has(segment.segment_name)) {
      throw new BuilderDependencyError(
        `${dependencyName} contains duplicate segment ${segment.segment_name}.`,
      );
    }
    segmentNames.add(segment.segment_name);
  }

  if (content.non_gaap_measure !== null) {
    const measure = content.non_gaap_measure;
    if (!Number.isFinite(measure.gaap_value) || measure.gaap_value === 0) {
      throw new BuilderDependencyError(
        `${dependencyName}.non_gaap_measure.gaap_value must be non-zero.`,
      );
    }
    if (!Number.isFinite(measure.non_gaap_value)) {
      throw new BuilderDependencyError(
        `${dependencyName}.non_gaap_measure.non_gaap_value is invalid.`,
      );
    }
    requireStringArray(
      measure.exclusion_items,
      `${dependencyName}.non_gaap_measure.exclusion_items`,
    );
    requireStringArray(
      measure.evidence_refs,
      `${dependencyName}.non_gaap_measure.evidence_refs`,
      false,
    );
    requireProbability(
      measure.confidence,
      `${dependencyName}.non_gaap_measure.confidence`,
    );
  }

  for (const [index, restatement] of content.restatements.entries()) {
    const field = `${dependencyName}.restatements[${index}]`;
    requireText(restatement.period_announced, `${field}.period_announced`);
    requireStringArray(
      restatement.periods_affected,
      `${field}.periods_affected`,
      false,
    );
    requireAllowed(restatement.scope, RESTATEMENT_SCOPES, `${field}.scope`);
    requireText(restatement.description, `${field}.description`);
    requireAllowed(
      restatement.materiality,
      MATERIALITY_LEVELS,
      `${field}.materiality`,
    );
    requireStringArray(
      restatement.evidence_refs,
      `${field}.evidence_refs`,
      false,
    );
    requireProbability(restatement.confidence, `${field}.confidence`);
  }
}

function validateCoverage(
  content: AccountingSourceArtifactContent,
  dependencyName: string,
): void {
  for (const [field, available] of Object.entries(content.coverage)) {
    if (typeof available !== "boolean") {
      throw new BuilderDependencyError(
        `${dependencyName}.coverage.${field} must be boolean.`,
      );
    }
  }

  if (
    !content.coverage.accounting_policies_available
    && content.accounting_policies.length > 0
  ) {
    throw new BuilderDependencyError(
      `${dependencyName} cannot contain unavailable accounting policies.`,
    );
  }
  if (!content.coverage.segments_available && content.segments.length > 0) {
    throw new BuilderDependencyError(
      `${dependencyName} cannot contain unavailable segments.`,
    );
  }
  if (
    content.coverage.non_gaap_available
    !== (content.non_gaap_measure !== null)
  ) {
    throw new BuilderDependencyError(
      `${dependencyName} non-GAAP coverage is inconsistent.`,
    );
  }
  if (
    !content.coverage.restatements_available
    && content.restatements.length > 0
  ) {
    throw new BuilderDependencyError(
      `${dependencyName} cannot contain unavailable restatements.`,
    );
  }
}

