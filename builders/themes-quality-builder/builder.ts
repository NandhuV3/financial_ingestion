import type {
  ThemesExecutionReadinessContent,
} from "../../contracts/execution/themes-execution-readiness-content.js";
import type { Builder } from "../../packages/builder-framework/src/builder.js";
import type { BuilderContext } from "../../packages/builder-framework/src/builder-context.js";
import type { BuilderResult } from "../../packages/builder-framework/src/builder-result.js";
import { createLogger } from "../../src/shared/logger.js";
import { THEMES_QUALITY_BUILDER_TYPE } from "./contract.js";
import {
  evaluateThemesExecutionReadiness,
} from "./readiness-evaluator.js";
import type {
  ThemesQualityBuilderInput,
  ThemesQualityExecutionOutput,
  ThemesQualityExecutionRecord,
} from "./types.js";
import {
  resolveThemesQualityDependencies,
  validateThemesExecutionReadinessContent,
  validateThemesQualityBuilderInput,
  validateThemesQualityBuildTarget,
} from "./validator.js";

type ThemesQualityLogger = {
  info(message: string, context?: Record<string, string | number | boolean | undefined>): void;
  error(message: string, context?: Record<string, string | number | boolean | undefined>): void;
};

type ThemesQualityBuilderOptions = {
  logger?: ThemesQualityLogger;
  now?: () => string;
  durationMs?: (startedAtMs: number) => number;
};

export class ThemesQualityBuilder implements Builder<
  ThemesQualityBuilderInput,
  ThemesExecutionReadinessContent
> {
  private readonly logger: ThemesQualityLogger;
  private readonly now: () => string;
  private readonly durationMs: (startedAtMs: number) => number;

  constructor(options: ThemesQualityBuilderOptions = {}) {
    this.logger = options.logger ?? createLogger(THEMES_QUALITY_BUILDER_TYPE);
    this.now = options.now ?? (() => new Date().toISOString());
    this.durationMs = options.durationMs ?? ((startedAtMs) =>
      Date.now() - startedAtMs);
  }

  builderType(): string {
    return THEMES_QUALITY_BUILDER_TYPE;
  }

  async validateInput(input: ThemesQualityBuilderInput): Promise<void> {
    validateThemesQualityBuilderInput(input);
  }

  async execute(
    context: BuilderContext<ThemesQualityBuilderInput>,
  ): Promise<BuilderResult<ThemesExecutionReadinessContent>> {
    const output = await this.executeWithRecord(context);

    return output.builder_result;
  }

  async executeWithRecord(
    context: BuilderContext<ThemesQualityBuilderInput>,
  ): Promise<ThemesQualityExecutionOutput> {
    const startedAt = this.now();
    const startedAtMs = Date.now();

    this.logger.info("Themes Quality execution started.", {
      builder_type: THEMES_QUALITY_BUILDER_TYPE,
      execution_id: context.executionId,
      company_id: context.companyId,
      period_id: context.periodId,
    });

    try {
      validateThemesQualityBuilderInput(context.input);
      validateThemesQualityBuildTarget({
        builderInput: context.input,
        companyId: context.companyId,
        periodId: context.periodId,
      });
      const dependencies = resolveThemesQualityDependencies({
        dependencies: context.dependencies,
        builderInput: context.input,
        companyId: context.companyId,
        periodId: context.periodId,
      });
      const content = evaluateThemesExecutionReadiness({
        evidenceIdentityArtifactId:
          dependencies.evidence_identity.identity.artifact_id,
        evidenceIdentity: context.input.evidence_identity,
      });

      validateThemesExecutionReadinessContent({
        evidenceIdentityArtifactId:
          dependencies.evidence_identity.identity.artifact_id,
        evidenceIdentity: context.input.evidence_identity,
        content,
      });

      const executionRecord = this.createExecutionRecord({
        context,
        content,
        evidenceIdentityArtifactId:
          dependencies.evidence_identity.identity.artifact_id,
        startedAt,
        startedAtMs,
        status: "success",
      });

      this.logger.info("Themes Quality execution completed.", {
        builder_type: THEMES_QUALITY_BUILDER_TYPE,
        execution_id: context.executionId,
        company_id: context.companyId,
        period_id: context.periodId,
        readiness_status: content.readiness_status,
        finding_count: content.findings.length,
        duration_ms: executionRecord.duration_ms,
      });

      return {
        builder_result: { content },
        execution_record: executionRecord,
      };
    } catch (error) {
      this.logger.error("Themes Quality execution failed.", {
        builder_type: THEMES_QUALITY_BUILDER_TYPE,
        execution_id: context.executionId,
        company_id: context.companyId,
        period_id: context.periodId,
        error_message: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  private createExecutionRecord(input: {
    context: BuilderContext<ThemesQualityBuilderInput>;
    content: ThemesExecutionReadinessContent;
    evidenceIdentityArtifactId: string;
    startedAt: string;
    startedAtMs: number;
    status: "success";
  }): ThemesQualityExecutionRecord {
    const blockingFindingCount = input.content.findings
      .filter(({ severity }) => severity === "blocking")
      .length;
    const warningFindingCount = input.content.findings
      .filter(({ severity }) => severity === "warning")
      .length;

    return {
      builder_type: THEMES_QUALITY_BUILDER_TYPE,
      execution_id: input.context.executionId,
      company_id: input.context.companyId,
      period_id: input.context.periodId,
      evidence_identity_artifact_id: input.evidenceIdentityArtifactId,
      status: input.status,
      readiness_status: input.content.readiness_status,
      finding_count: input.content.findings.length,
      blocking_finding_count: blockingFindingCount,
      warning_finding_count: warningFindingCount,
      metrics: input.content.metrics,
      started_at: input.startedAt,
      completed_at: this.now(),
      duration_ms: this.durationMs(input.startedAtMs),
    };
  }
}
