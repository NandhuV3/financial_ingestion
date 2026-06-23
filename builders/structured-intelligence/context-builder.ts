import type { FilingArtifactContent } from "../../contracts/artifacts/filing-artifact-content.js";
import type { ThemesArtifactContent } from "../themes/contract.js";
import type {
  StructuredPromptContext,
} from "./types.js";

export function buildStructuredPromptContext(input: {
  companyId: string;
  periodId: string;
  filing: FilingArtifactContent;
  themes: ThemesArtifactContent;
}): StructuredPromptContext {
  const orderedThemes = [...input.themes.themes]
    .sort((left, right) => left.theme_id.localeCompare(right.theme_id))
    .map((theme) => ({
      theme_id: theme.theme_id,
      title: theme.title,
      summary: theme.summary,
      category: theme.category,
      evidence_refs: uniqueSorted(
        theme.evidence.map(({ evidence_ref }) => evidence_ref),
      ),
    }));

  return {
    company_id: input.companyId,
    period_id: input.periodId,
    filing: {
      filing_id: input.filing.filing_id,
      filing_type: input.filing.filing_type,
      filing_content: input.filing.filing_content,
      evidence_refs: uniqueSorted(
        orderedThemes.flatMap(({ evidence_refs }) => evidence_refs),
      ),
    },
    themes: orderedThemes,
  };
}

export function serializeStructuredPromptContext(
  context: StructuredPromptContext,
): string {
  return JSON.stringify(context);
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}
