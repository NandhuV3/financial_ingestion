import type {
  Builder,
} from "../../builder-framework/src/builder.js";
import type {
  BuilderContext,
} from "../../builder-framework/src/builder-context.js";
import {
  BuilderExecutionError,
  BuilderValidationError,
} from "../../builder-framework/src/builder-errors.js";
import type {
  BuilderResult,
} from "../../builder-framework/src/builder-result.js";
import type {
  StructuredIntelligence,
  StructuredIntelligenceInput,
} from "../../../contracts/company-intelligence/structured-intelligence-models.js";
import {
  STRUCTURED_INTELLIGENCE_BUILDER_TYPE,
} from "../../../contracts/company-intelligence/structured-intelligence-contract.js";
import { createLogger } from "../../../src/shared/logger.js";
import { buildStructuredIntelligenceContent } from "./payload-construction.js";
import type {
  StructuredIntelligenceBuilderOptions,
} from "./types.js";
import {
  resolveStructuredIntelligenceDependencies,
  validateStructuredIntelligenceInput,
  validateStructuredIntelligenceOutput,
  validateStructuredIntelligencePromptPlan,
} from "./validation.js";

const logger = createLogger("structured-intelligence-builder");

/**
 * Canonical Structured Intelligence builder.
 *
 * The builder owns deterministic business payload construction only. Prompt
 * Plan governance, Prompt Framework orchestration, LLM execution, replay
 * policy, artifact identity, hashing, versioning, and persistence remain owned
 * by Platform Foundation components.
 */
export class GovernedStructuredIntelligenceBuilder
  implements Builder<StructuredIntelligenceInput, StructuredIntelligence> {
  constructor(
    private readonly options: StructuredIntelligenceBuilderOptions,
  ) {}

  builderType(): typeof STRUCTURED_INTELLIGENCE_BUILDER_TYPE {
    return STRUCTURED_INTELLIGENCE_BUILDER_TYPE;
  }

  async validateInput(input: StructuredIntelligenceInput): Promise<void> {
    validateStructuredIntelligenceInput(input);
  }

  async execute(
    context: BuilderContext<StructuredIntelligenceInput>,
  ): Promise<BuilderResult<StructuredIntelligence>> {
    logger.info("Structured Intelligence execution started.", {
      builder_type: this.builderType(),
      company_id: context.companyId,
      period_id: context.periodId,
      execution_id: context.executionId,
    });

    validateStructuredIntelligenceInput(context.input);
    resolveStructuredIntelligenceDependencies(
      context.dependencies,
      context.input,
    );

    const promptPlan = await this.options.promptPlanResolver
      .resolveStructuredIntelligencePromptPlan(context.input);
    validateStructuredIntelligencePromptPlan(promptPlan);

    const promptResult = await this.options.promptFramework.execute(promptPlan);

    if (promptResult.status !== "succeeded") {
      logger.error("Structured Intelligence Prompt Framework execution failed.", {
        builder_type: this.builderType(),
        company_id: context.companyId,
        period_id: context.periodId,
        execution_id: context.executionId,
        issue_count: promptResult.validation.issues.length,
      });
      throw new BuilderExecutionError(
        "Structured Intelligence Prompt Framework execution failed.",
      );
    }

    try {
      const output = buildStructuredIntelligenceContent({
        target: context.input,
        payload: promptResult.output,
      });
      validateStructuredIntelligenceOutput(output);

      logger.info("Structured Intelligence execution completed.", {
        builder_type: this.builderType(),
        company_id: context.companyId,
        period_id: context.periodId,
        execution_id: context.executionId,
        status: output.metadata.status,
        evidence_reference_count:
          output.metadata.evidence_summary.evidence_reference_count,
      });

      return {
        content: output,
      };
    } catch (error) {
      if (error instanceof BuilderValidationError) {
        throw error;
      }

      throw new BuilderValidationError(
        "Structured Intelligence payload construction failed.",
        error,
      );
    }
  }
}
