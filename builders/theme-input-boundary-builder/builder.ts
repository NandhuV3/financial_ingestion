import type {
  ThemeInputBoundaryContent,
} from "../../contracts/execution/theme-input-boundary-content.js";
import type { Builder } from "../../packages/builder-framework/src/builder.js";
import type { BuilderContext } from "../../packages/builder-framework/src/builder-context.js";
import type { BuilderResult } from "../../packages/builder-framework/src/builder-result.js";
import { THEME_INPUT_BOUNDARY_BUILDER_TYPE } from "./contract.js";
import {
  assembleThemeInputBoundaryContent,
} from "./input-assembler.js";
import type { ThemeInputBoundaryBuilderInput } from "./types.js";
import {
  validateThemeInputBoundaryBuilderInput,
  validateThemeInputBoundaryContent,
} from "./validator.js";

export class ThemeInputBoundaryBuilder implements Builder<
  ThemeInputBoundaryBuilderInput,
  ThemeInputBoundaryContent
> {
  builderType(): string {
    return THEME_INPUT_BOUNDARY_BUILDER_TYPE;
  }

  async validateInput(input: ThemeInputBoundaryBuilderInput): Promise<void> {
    validateThemeInputBoundaryBuilderInput(input);
  }

  async execute(
    context: BuilderContext<ThemeInputBoundaryBuilderInput>,
  ): Promise<BuilderResult<ThemeInputBoundaryContent>> {
    validateThemeInputBoundaryBuilderInput(context.input);

    const content = assembleThemeInputBoundaryContent(
      context.input.theme_grounding,
    );

    validateThemeInputBoundaryContent({
      grounding: context.input.theme_grounding,
      content,
    });

    return { content };
  }
}
