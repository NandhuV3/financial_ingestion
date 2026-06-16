import type { ThemesBuilderInput } from "./types.js";

export const THEMES_PROMPT_ID = "theme-generation-system";

export function buildThemesUserPrompt(input: ThemesBuilderInput): string {
  return `Extract observed themes from this filing.

Company ID: ${input.company_id}
Period ID: ${input.period_id}
Filing ID: ${input.filing_id}
Filing Type: ${input.filing_type}

Return JSON only with this shape:
{
  "themes": [
    {
      "title": "short observation",
      "description": "what management discussed",
      "category": "strategy | product | customer | competition | operations | financial | capital_allocation | management | trust | regulatory | technology | other",
      "importance": "low | medium | high",
      "evidence": [
        {
          "section": "filing section or source location",
          "excerpt_hash": "stable hash or source reference",
          "paragraph_reference": "optional paragraph reference"
        }
      ],
      "frequency": 1
    }
  ]
}

Rules:
- Themes are observations, not interpretations.
- Do not assign topic IDs.
- Do not generate concept IDs.
- Do not infer business impact, sentiment, valuation, trust, recommendations, or investor conclusions.
- Every theme must include at least one evidence item.

Filing content:
${input.filing_content}`;
}

