import type {
  ThemeGroundingContent,
} from "../../contracts/execution/theme-grounding-content.js";
import type { Builder } from "../../packages/builder-framework/src/builder.js";
import type { BuilderContext } from "../../packages/builder-framework/src/builder-context.js";
import type { BuilderResult } from "../../packages/builder-framework/src/builder-result.js";
import { THEME_GROUNDING_BUILDER_TYPE } from "./contract.js";
import {
  assembleThemeGroundingContent,
} from "./grounding-assembler.js";
import type { ThemeGroundingBuilderInput } from "./types.js";
import {
  validateThemeGroundingBuilderInput,
  validateThemeGroundingContent,
} from "./validator.js";

export class ThemeGroundingBuilder implements Builder<
  ThemeGroundingBuilderInput,
  ThemeGroundingContent
> {
  builderType(): string {
    return THEME_GROUNDING_BUILDER_TYPE;
  }

  async validateInput(input: ThemeGroundingBuilderInput): Promise<void> {
    validateThemeGroundingBuilderInput(input);
  }

  async execute(
    context: BuilderContext<ThemeGroundingBuilderInput>,
  ): Promise<BuilderResult<ThemeGroundingContent>> {
    validateThemeGroundingBuilderInput(context.input);

    const content = assembleThemeGroundingContent(
      context.input.themes_execution_readiness,
    );

    validateThemeGroundingContent({
      readiness: context.input.themes_execution_readiness,
      content,
    });

    return { content };
  }
}
