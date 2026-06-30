import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type {
  EvidenceIdentityContent,
} from "../../contracts/artifacts/evidence-identity-artifact-content.js";
import type { FilingArtifactContent } from "../../contracts/artifacts/filing-artifact-content.js";
import type {
  ThemeGroundingContent,
} from "../../contracts/execution/theme-grounding-content.js";
import type {
  ThemeInputBoundaryContent,
} from "../../contracts/execution/theme-input-boundary-content.js";
import type {
  ThemesExecutionReadinessContent,
} from "../../contracts/execution/themes-execution-readiness-content.js";
import { calculateArtifactHash } from "../../packages/artifact-framework/src/artifact-service.js";
import type { BuilderContext } from "../../packages/builder-framework/src/builder-context.js";
import { BuilderExecutionError } from "../../packages/builder-framework/src/builder-errors.js";
import {
  EVIDENCE_IDENTITY_BUILDER_TYPE,
} from "../evidence-identity-builder/contract.js";
import type {
  EvidenceIdentityBuilderInput,
} from "../evidence-identity-builder/types.js";
import {
  FILING_ARTIFACT_BUILDER_TYPE,
} from "../filing-artifact-builder/contract.js";
import type {
  FilingArtifactBuilderInput,
} from "../filing-artifact-builder/types.js";
import { ThemeGroundingBuilder } from "../theme-grounding-builder/builder.js";
import {
  THEME_GROUNDING_BUILDER_TYPE,
} from "../theme-grounding-builder/contract.js";
import type {
  ThemeGroundingBuilderInput,
} from "../theme-grounding-builder/types.js";
import { ThemeInputBoundaryBuilder } from "../theme-input-boundary-builder/builder.js";
import {
  THEME_INPUT_BOUNDARY_BUILDER_TYPE,
} from "../theme-input-boundary-builder/contract.js";
import type {
  ThemeInputBoundaryBuilderInput,
} from "../theme-input-boundary-builder/types.js";
import { ThemesQualityBuilder } from "../themes-quality-builder/builder.js";
import {
  THEMES_QUALITY_BUILDER_TYPE,
} from "../themes-quality-builder/contract.js";
import type {
  ThemesQualityBuilderInput,
  ThemesQualityExecutionRecord,
} from "../themes-quality-builder/types.js";
import {
  THEMES_BUILDER_TYPE,
  type ThemesArtifactContent,
} from "../themes/contract.js";
import type {
  ThemesBuilderInput,
} from "../themes/types.js";
import type { UpstreamPipelineRuntime } from "./register-builders.js";

export type RunUpstreamPipelineInput = {
  runtime: UpstreamPipelineRuntime;
  normalizedFiling: FilingArtifactBuilderInput;
  generatedAt?: string;
  onArtifact?: UpstreamPipelineArtifactObserver;
  onTransientOutput?: UpstreamPipelineTransientObserver;
};

export const UPSTREAM_PIPELINE_STAGES = [
  "filing",
  "evidence_identity",
  "themes",
] as const;

export type UpstreamPipelineStage = typeof UPSTREAM_PIPELINE_STAGES[number];

export const UPSTREAM_PIPELINE_TRANSIENT_STAGES = [
  "themes_quality",
  "theme_grounding",
  "theme_input_boundary",
] as const;

export type UpstreamPipelineTransientStage =
  typeof UPSTREAM_PIPELINE_TRANSIENT_STAGES[number];

export type UpstreamPipelineArtifactObserver = (
  stage: UpstreamPipelineStage,
  artifact: Artifact<unknown>,
) => void | Promise<void>;

export type UpstreamPipelineTransientOutput =
  | ThemesQualityExecutionRecord
  | ThemesExecutionReadinessContent
  | ThemeGroundingContent
  | ThemeInputBoundaryContent;

export type UpstreamPipelineTransientObserver = (
  stage: UpstreamPipelineTransientStage,
  output: UpstreamPipelineTransientOutput,
) => void | Promise<void>;

export async function runUpstreamPipeline(
  input: RunUpstreamPipelineInput,
): Promise<Artifact<ThemesArtifactContent>> {
  validateNormalizedFiling(input.normalizedFiling);

  const companyId = input.normalizedFiling.company_id;
  const periodId = input.normalizedFiling.period_id;

  const filingArtifact = await input.runtime.executor.executeBuilder<
    FilingArtifactBuilderInput,
    FilingArtifactContent
  >({
    builderType: FILING_ARTIFACT_BUILDER_TYPE,
    companyId,
    periodId,
    executionId: executionId(companyId, periodId, "filing-artifact"),
    input: input.normalizedFiling,
    inputHash: calculateArtifactHash(input.normalizedFiling),
    generatedAt: input.generatedAt,
  });
  await emitArtifact(input, "filing", filingArtifact);

  const evidenceIdentityInput: EvidenceIdentityBuilderInput = {
    filing_artifact: filingArtifact.content,
  };
  const evidenceIdentity = await input.runtime.executor.executeBuilder<
    EvidenceIdentityBuilderInput,
    EvidenceIdentityContent
  >({
    builderType: EVIDENCE_IDENTITY_BUILDER_TYPE,
    companyId,
    periodId,
    executionId: executionId(companyId, periodId, "evidence-identity"),
    input: evidenceIdentityInput,
    inputHash: calculateArtifactHash({
      filing: filingArtifact.metadata.artifact_hash,
      input: evidenceIdentityInput,
    }),
    dependencies: {
      filing: filingArtifact,
    },
    generatedAt: input.generatedAt,
  });
  await emitArtifact(input, "evidence_identity", evidenceIdentity);

  const themesQualityBuilder = new ThemesQualityBuilder();
  const themesQualityInput: ThemesQualityBuilderInput = {
    evidence_identity: evidenceIdentity.content,
  };
  const themesQualityOutput = await themesQualityBuilder.executeWithRecord(
    builderContext({
      companyId,
      periodId,
      executionId: executionId(companyId, periodId, "themes-quality"),
      input: themesQualityInput,
      dependencies: {
        evidence_identity: evidenceIdentity,
      },
    }),
  );
  await emitTransient(
    input,
    "themes_quality",
    themesQualityOutput.execution_record,
  );

  const themeGroundingBuilder = new ThemeGroundingBuilder();
  const themeGroundingInput: ThemeGroundingBuilderInput = {
    themes_execution_readiness: themesQualityOutput.builder_result.content,
  };
  const themeGrounding = await themeGroundingBuilder.execute(
    builderContext({
      companyId,
      periodId,
      executionId: executionId(companyId, periodId, "theme-grounding"),
      input: themeGroundingInput,
      dependencies: {},
    }),
  );
  await emitTransient(input, "theme_grounding", themeGrounding.content);

  const themeInputBoundaryBuilder = new ThemeInputBoundaryBuilder();
  const themeInputBoundaryInput: ThemeInputBoundaryBuilderInput = {
    theme_grounding: themeGrounding.content,
  };
  const themeInputBoundary = await themeInputBoundaryBuilder.execute(
    builderContext({
      companyId,
      periodId,
      executionId: executionId(companyId, periodId, "theme-input-boundary"),
      input: themeInputBoundaryInput,
      dependencies: {},
    }),
  );
  await emitTransient(
    input,
    "theme_input_boundary",
    themeInputBoundary.content,
  );

  const themesInput: ThemesBuilderInput = {
    theme_input_boundary: themeInputBoundary.content,
  };
  const themes = await input.runtime.executor.executeBuilder<
    ThemesBuilderInput,
    ThemesArtifactContent
  >({
    builderType: THEMES_BUILDER_TYPE,
    companyId,
    periodId,
    executionId: executionId(companyId, periodId, "themes"),
    input: themesInput,
    inputHash: calculateArtifactHash(themesInput),
    dependencies: {},
    lineageDependencies: {
      evidence_identity: evidenceIdentity,
    },
    generatedAt: input.generatedAt,
  });
  await emitArtifact(input, "themes", themes);

  return themes;
}

function validateNormalizedFiling(input: FilingArtifactBuilderInput): void {
  if (
    input.company_id.trim() === ""
    || input.period_id.trim() === ""
    || input.filing_id.trim() === ""
  ) {
    throw new BuilderExecutionError(
      "Upstream pipeline requires normalized filing identity.",
    );
  }

  if (input.filing_period !== input.period_id) {
    throw new BuilderExecutionError(
      "Normalized filing period must match the pipeline period.",
    );
  }
}

function builderContext<TInput>(input: {
  companyId: string;
  periodId: string;
  executionId: string;
  input: TInput;
  dependencies: BuilderContext<TInput>["dependencies"];
}): BuilderContext<TInput> {
  return {
    companyId: input.companyId,
    periodId: input.periodId,
    executionId: input.executionId,
    input: input.input,
    dependencies: input.dependencies,
    recordPromptReference() {
      return undefined;
    },
    recordModelReference() {
      return undefined;
    },
  };
}

function executionId(
  companyId: string,
  periodId: string,
  stage: string,
): string {
  return `${companyId}:${periodId}:${stage}`;
}

async function emitArtifact(
  input: RunUpstreamPipelineInput,
  stage: UpstreamPipelineStage,
  artifact: Artifact<unknown>,
): Promise<void> {
  await input.onArtifact?.(stage, artifact);
}

async function emitTransient(
  input: RunUpstreamPipelineInput,
  stage: UpstreamPipelineTransientStage,
  output: UpstreamPipelineTransientOutput,
): Promise<void> {
  await input.onTransientOutput?.(stage, output);
}
