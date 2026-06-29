import {
  renderThemesUserPrompt,
  THEMES_PROMPT_ID,
  type ThemesPromptRenderContext,
} from "./themes-prompt.js";
import type { PromptRendererRegistry } from "./prompt.types.js";

export function defaultPromptRenderers(): PromptRendererRegistry {
  return {
    [THEMES_PROMPT_ID]: (context) =>
      renderThemesUserPrompt(context as ThemesPromptRenderContext),
  };
}
