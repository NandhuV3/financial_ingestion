import type { ThemesArtifactContent } from "../themes/contract.js";
import type {
  FilingArtifactContent,
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
      evidence_hashes: uniqueSorted(
        theme.evidence.map(({ excerpt_hash }) => excerpt_hash),
      ),
    }));

  return {
    company_id: input.companyId,
    period_id: input.periodId,
    filing: {
      filing_id: input.filing.filing_id,
      filing_type: input.filing.filing_type,
      filing_content: input.filing.filing_content,
      evidence_hashes: uniqueSorted(
        orderedThemes.flatMap(({ evidence_hashes }) => evidence_hashes),
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
