import type { FilingArtifactContent } from "../../contracts/artifacts/filing-artifact-content.js";
import type { Builder } from "../../packages/builder-framework/src/builder.js";
import type { BuilderContext } from "../../packages/builder-framework/src/builder-context.js";
import type { BuilderResult } from "../../packages/builder-framework/src/builder-result.js";
import { FILING_ARTIFACT_BUILDER_TYPE } from "./contract.js";
import {
  assembleFilingContent,
  calculateFilingHash,
} from "./content-assembler.js";
import type { FilingArtifactBuilderInput } from "./types.js";
import {
  validateFilingArtifactBuildTarget,
  validateFilingArtifactBuilderInput,
  validateFilingArtifactContent,
} from "./validator.js";

export class FilingArtifactBuilder implements Builder<
  FilingArtifactBuilderInput,
  FilingArtifactContent
> {
  builderType(): string {
    return FILING_ARTIFACT_BUILDER_TYPE;
  }

  async validateInput(input: FilingArtifactBuilderInput): Promise<void> {
    validateFilingArtifactBuilderInput(input);
  }

  async execute(
    context: BuilderContext<FilingArtifactBuilderInput>,
  ): Promise<BuilderResult<FilingArtifactContent>> {
    validateFilingArtifactBuilderInput(context.input);
    validateFilingArtifactBuildTarget({
      builderInput: context.input,
      companyId: context.companyId,
      periodId: context.periodId,
    });

    const filingContent = assembleFilingContent(context.input);
    const content: FilingArtifactContent = {
      filing_id: context.input.filing_id,
      filing_type: context.input.filing_type,
      filing_content: filingContent,
      filing_hash: calculateFilingHash(filingContent),
      filing_period: context.input.filing_period,
    };

    validateFilingArtifactContent({
      builderInput: context.input,
      content,
    });

    return { content };
  }
}
