import type {
  Artifact,
} from "../../../contracts/artifacts/artifact.js";
import type {
  ArtifactType,
} from "../../../contracts/artifacts/artifact-type.js";
import type {
  DependencyReference,
} from "../../../contracts/artifacts/artifact-lineage.js";
import type {
  PromptPlan,
} from "../../../contracts/execution/prompt-framework-models.js";
import type {
  StructuredIntelligence,
  StructuredIntelligenceEvidenceReference,
  StructuredIntelligenceInput,
  StructuredIntelligencePayload,
} from "../../../contracts/company-intelligence/structured-intelligence-models.js";
import {
  STRUCTURED_INTELLIGENCE_BUSINESS_SCOPE,
  STRUCTURED_INTELLIGENCE_SCHEMA_VERSION,
  STRUCTURED_INTELLIGENCE_SECTION_IDS,
  STRUCTURED_INTELLIGENCE_STATUSES,
} from "../../../contracts/company-intelligence/structured-intelligence-models.js";
import {
  BuilderValidationError,
} from "../../builder-framework/src/builder-errors.js";
import type {
  StructuredIntelligenceDependencyMap,
} from "./types.js";

const allowedDependencyKeys = new Set(["filing", "themes"]);

export function validateStructuredIntelligenceInput(
  input: StructuredIntelligenceInput,
): void {
  requireText(input.company_id, "input.company_id");
  requireText(input.period_id, "input.period_id");
  requireText(input.filing_id, "input.filing_id");
  validateDependencyReference(
    input.inputs.filing_artifact,
    "filing",
    "input.inputs.filing_artifact",
  );
  validateDependencyReference(
    input.inputs.themes_artifact,
    "themes",
    "input.inputs.themes_artifact",
  );
}

export function resolveStructuredIntelligenceDependencies(
  dependencies: Record<string, Artifact<unknown>>,
  input: StructuredIntelligenceInput,
): StructuredIntelligenceDependencyMap {
  for (const dependencyKey of Object.keys(dependencies).sort()) {
    if (!allowedDependencyKeys.has(dependencyKey)) {
      throw new BuilderValidationError(
        `Structured Intelligence may consume only Filing Artifact and Themes. Unexpected dependency '${dependencyKey}' was supplied.`,
      );
    }
  }

  const filing = requireArtifact(dependencies.filing, "filing");
  const themes = requireArtifact(dependencies.themes, "themes");

  validateArtifactMatchesReference(
    filing,
    input.inputs.filing_artifact,
    "filing",
  );
  validateArtifactMatchesReference(
    themes,
    input.inputs.themes_artifact,
    "themes",
  );
  validateDependencyIdentity(filing, input, "filing");
  validateDependencyIdentity(themes, input, "themes");
  validateFilingContent(filing.content, input);
  validateThemesContent(themes.content, input);

  return {
    filing,
    themes,
  };
}

export function validateStructuredIntelligencePromptPlan(
  plan: PromptPlan,
): void {
  requireText(plan.plan_id, "prompt_plan.plan_id");
  requireText(plan.plan_version, "prompt_plan.plan_version");

  if (!Array.isArray(plan.execution_graph.units)) {
    throw new BuilderValidationError(
      "prompt_plan.execution_graph.units must be an array.",
    );
  }

  if (plan.execution_graph.units.length === 0) {
    throw new BuilderValidationError(
      "Structured Intelligence Prompt Plan must contain at least one Prompt Unit.",
    );
  }
}

export function validateStructuredIntelligencePayload(
  payload: StructuredIntelligencePayload,
): void {
  validateGroundedValue(payload.business_model, "business_model", true);
  validateGroundedArray(payload.products, "products");
  validateGroundedArray(payload.customers, "customers");
  validateGroundedValue(payload.revenue_model, "revenue_model", true);
  validateGroundedArray(payload.revenue_drivers, "revenue_drivers");
  validateGroundedArray(
    payload.competitive_positioning,
    "competitive_positioning",
  );
  validateGroundedArray(payload.strategic_priorities, "strategic_priorities");
  validateGroundedArray(payload.management_focus, "management_focus");
  validateGroundedArray(payload.risks, "risks");
  validateGroundedArray(payload.dependencies, "dependencies");
}

export function validateStructuredIntelligenceOutput(
  output: StructuredIntelligence,
): void {
  if (output.artifact_type !== "structured_intelligence") {
    throw new BuilderValidationError(
      "Structured Intelligence output artifact_type must be structured_intelligence.",
    );
  }

  requireText(output.company_id, "output.company_id");
  requireText(output.period_id, "output.period_id");
  requireText(output.filing_id, "output.filing_id");

  if (output.metadata.schema_version !== STRUCTURED_INTELLIGENCE_SCHEMA_VERSION) {
    throw new BuilderValidationError(
      "Structured Intelligence output schema_version is invalid.",
    );
  }

  if (!STRUCTURED_INTELLIGENCE_STATUSES.includes(output.metadata.status)) {
    throw new BuilderValidationError(
      "Structured Intelligence output status is invalid.",
    );
  }

  if (output.metadata.business_scope !== STRUCTURED_INTELLIGENCE_BUSINESS_SCOPE) {
    throw new BuilderValidationError(
      "Structured Intelligence output business_scope is invalid.",
    );
  }

  for (const sectionId of STRUCTURED_INTELLIGENCE_SECTION_IDS) {
    if (!(sectionId in output.payload)) {
      throw new BuilderValidationError(
        `Structured Intelligence output is missing required section '${sectionId}'.`,
      );
    }
  }

  validateStructuredIntelligencePayload(output.payload);
}

function validateDependencyReference(
  reference: DependencyReference,
  expectedArtifactType: ArtifactType,
  fieldName: string,
): void {
  requireText(reference.artifact_id, `${fieldName}.artifact_id`);
  requireText(reference.artifact_hash, `${fieldName}.artifact_hash`);
  requireText(reference.input_hash, `${fieldName}.input_hash`);

  if (reference.artifact_type !== expectedArtifactType) {
    throw new BuilderValidationError(
      `${fieldName}.artifact_type must be ${expectedArtifactType}.`,
    );
  }

  if (!Number.isInteger(reference.version) || reference.version <= 0) {
    throw new BuilderValidationError(
      `${fieldName}.version must be a positive integer.`,
    );
  }
}

function requireArtifact(
  artifact: Artifact<unknown> | undefined,
  dependencyName: "filing" | "themes",
): Artifact<unknown> {
  if (artifact === undefined) {
    throw new BuilderValidationError(
      `Structured Intelligence requires ${dependencyName} dependency.`,
    );
  }

  return artifact;
}

function validateArtifactMatchesReference(
  artifact: Artifact<unknown>,
  reference: DependencyReference,
  dependencyName: "filing" | "themes",
): void {
  if (
    artifact.identity.artifact_id !== reference.artifact_id
    || artifact.identity.artifact_type !== reference.artifact_type
    || artifact.identity.version !== reference.version
    || artifact.metadata.artifact_hash !== reference.artifact_hash
    || artifact.metadata.input_hash !== reference.input_hash
  ) {
    throw new BuilderValidationError(
      `Structured Intelligence ${dependencyName} dependency does not match its input reference.`,
    );
  }
}

function validateDependencyIdentity(
  artifact: Artifact<unknown>,
  input: StructuredIntelligenceInput,
  dependencyName: "filing" | "themes",
): void {
  if (
    artifact.identity.company_id !== input.company_id
    || artifact.identity.period_id !== input.period_id
  ) {
    throw new BuilderValidationError(
      `Structured Intelligence ${dependencyName} dependency identity does not match the input target.`,
    );
  }
}

function validateFilingContent(
  content: unknown,
  input: StructuredIntelligenceInput,
): void {
  if (!isObjectRecord(content)) {
    throw new BuilderValidationError("Filing content must be an object.");
  }

  requireText(content.filing_id, "filing.content.filing_id");

  if (content.filing_id !== input.filing_id) {
    throw new BuilderValidationError(
      "Filing content filing_id does not match Structured Intelligence input.",
    );
  }
}

function validateThemesContent(
  content: unknown,
  input: StructuredIntelligenceInput,
): void {
  if (!isObjectRecord(content)) {
    throw new BuilderValidationError("Themes content must be an object.");
  }

  if (
    content.company_id !== input.company_id
    || content.period_id !== input.period_id
    || content.filing_id !== input.filing_id
  ) {
    throw new BuilderValidationError(
      "Themes content identity does not match Structured Intelligence input.",
    );
  }

  if (!Array.isArray(content.themes)) {
    throw new BuilderValidationError("Themes content must contain themes.");
  }
}

function validateGroundedArray(
  values: readonly unknown[],
  fieldName: string,
): void {
  if (!Array.isArray(values)) {
    throw new BuilderValidationError(`${fieldName} must be an array.`);
  }

  values.forEach((value, index) => {
    validateGroundedValue(value, `${fieldName}[${index}]`, false);
  });
}

function validateGroundedValue(
  value: unknown,
  fieldName: string,
  nullable: boolean,
): void {
  if (value === null && nullable) {
    return;
  }

  if (!isObjectRecord(value)) {
    throw new BuilderValidationError(`${fieldName} must be an object.`);
  }

  if (typeof value.confidence !== "number") {
    throw new BuilderValidationError(`${fieldName}.confidence must be a number.`);
  }

  if (value.confidence < 0 || value.confidence > 1) {
    throw new BuilderValidationError(
      `${fieldName}.confidence must be between 0 and 1.`,
    );
  }

  if (!Array.isArray(value.evidence) || value.evidence.length === 0) {
    throw new BuilderValidationError(
      `${fieldName}.evidence must contain at least one evidence reference.`,
    );
  }

  value.evidence.forEach((entry, index) => {
    validateEvidenceReference(entry, `${fieldName}.evidence[${index}]`);
  });
}

function validateEvidenceReference(
  value: unknown,
  fieldName: string,
): asserts value is StructuredIntelligenceEvidenceReference {
  if (!isObjectRecord(value)) {
    throw new BuilderValidationError(`${fieldName} must be an object.`);
  }

  requireText(value.evidence_ref, `${fieldName}.evidence_ref`);
  requireText(value.evidence_hash, `${fieldName}.evidence_hash`);
  requireText(value.evidence_identity_id, `${fieldName}.evidence_identity_id`);
  requireText(value.filing_section, `${fieldName}.filing_section`);
  requireText(value.source_excerpt, `${fieldName}.source_excerpt`);

  if (!Array.isArray(value.theme_ids) || value.theme_ids.length === 0) {
    throw new BuilderValidationError(
      `${fieldName}.theme_ids must contain at least one Theme reference.`,
    );
  }

  value.theme_ids.forEach((themeId, index) => {
    requireText(themeId, `${fieldName}.theme_ids[${index}]`);
  });
}

function requireText(value: unknown, fieldName: string): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new BuilderValidationError(`${fieldName} is required.`);
  }
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
