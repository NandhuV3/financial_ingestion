import type {
  FilingEvidenceCatalogEntry,
  ThemesBuilderInput,
} from "./types.js";

export const THEMES_PROMPT_ID = "theme-generation-system";

export function buildThemesUserPrompt(
  input: ThemesBuilderInput,
  evidenceCatalog: FilingEvidenceCatalogEntry[],
): string {
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
          "excerpt_hash": "<select an exact excerpt_hash from the evidence catalog>"
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
- Use only excerpt_hash values supplied in the evidence catalog.
- Never create, shorten, transform, or guess an excerpt_hash.
- The platform owns section and paragraph_reference metadata. Return the selected excerpt_hash; platform metadata replaces any model-supplied location metadata.

Evidence catalog:
${JSON.stringify(evidenceCatalog, null, 2)}

Filing content:
${input.filing_content}`;
}
