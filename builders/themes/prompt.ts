import {
  renderThemesUserPrompt,
} from "../../src/prompt-registry/themes-prompt.js";
import type { ThemePromptEvidence } from "./types.js";

export {
  THEMES_PROMPT_ID,
  THEMES_PROMPT_VERSION,
  renderThemesUserPrompt,
} from "../../src/prompt-registry/themes-prompt.js";

/**
 * Compatibility wrapper for existing callers. Prompt content remains owned by
 * Prompt Registry.
 */
export function buildThemesUserPrompt(
  filingType: string,
  evidence: ThemePromptEvidence[],
): string {
  return renderThemesUserPrompt({
    filingType,
    evidence,
  });
}
