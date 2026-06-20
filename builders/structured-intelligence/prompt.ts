import type { StructuredIntelligencePromptInput } from "./types.js";

export const STRUCTURED_INTELLIGENCE_PROMPT_ID = "structured-intelligence-builder-system";

export const STRUCTURED_INTELLIGENCE_SYSTEM_PROMPT = `You generate filing-scoped Structured Intelligence.

Use only the current filing and the supplied Themes artifact.
Do not use Company Knowledge, Business Signals, Trust Signals, Quarter Understanding, Investor Intelligence, market data, prior filings, or external knowledge.
Do not generate recommendations, trust conclusions, valuation language, concept IDs, or topic IDs.
Every generated business claim must include at least one evidence_refs entry.
Each evidence_refs entry must be either a supplied Theme theme_id or a supplied Theme evidence excerpt_hash.
Return JSON only.`;

export function buildStructuredIntelligenceUserPrompt(input: StructuredIntelligencePromptInput): string {
  return `Create Structured Intelligence for this filing.

Company ID: ${input.company_id}
Period ID: ${input.period_id}
Filing ID: ${input.filing_id}
Filing Type: ${input.filing_type}

Return JSON only with this shape:
{
  "status": "complete | partial | insufficient_filing",
  "understanding": {
    "business_model": {
      "summary": "",
      "value_creation": "",
      "revenue_structure": "",
      "evidence_refs": ["<theme_id-or-source-evidence-excerpt_hash>"]
    },
    "products": [
      {
        "product_name": "",
        "description": "",
        "importance": "high | medium | low",
        "evidence_refs": ["<theme_id-or-source-evidence-excerpt_hash>"]
      }
    ],
    "customers": [
      {
        "customer_segment": "",
        "description": "",
        "evidence_refs": ["<theme_id-or-source-evidence-excerpt_hash>"]
      }
    ],
    "revenue_model": {
      "summary": "",
      "recurring_components": [],
      "transactional_components": [],
      "evidence_refs": ["<theme_id-or-source-evidence-excerpt_hash>"]
    },
    "revenue_drivers": [
      {
        "driver": "",
        "explanation": "",
        "evidence_refs": ["<theme_id-or-source-evidence-excerpt_hash>"]
      }
    ],
    "competitive_positioning": [
      {
        "position": "",
        "supporting_reasoning": "",
        "evidence_refs": ["<theme_id-or-source-evidence-excerpt_hash>"]
      }
    ],
    "strategic_priorities": [
      {
        "priority": "",
        "rationale": "",
        "evidence_refs": ["<theme_id-or-source-evidence-excerpt_hash>"]
      }
    ],
    "management_focus": [
      {
        "focus_area": "",
        "explanation": "",
        "evidence_refs": ["<theme_id-or-source-evidence-excerpt_hash>"]
      }
    ],
    "risks": [
      {
        "risk": "",
        "explanation": "",
        "evidence_refs": ["<theme_id-or-source-evidence-excerpt_hash>"]
      }
    ],
    "dependencies": [
      {
        "dependency": "",
        "explanation": "",
        "evidence_refs": ["<theme_id-or-source-evidence-excerpt_hash>"]
      }
    ]
  }
}

Rules:
- Use "unknown" only when the filing does not support a required summary field.
- Use empty arrays when the filing does not support optional repeated fields.
- Every emitted business_model and revenue_model claim must contain at least one evidence_refs entry.
- Every item emitted in products, customers, revenue_drivers, competitive_positioning, strategic_priorities, management_focus, risks, or dependencies must contain at least one evidence_refs entry.
- evidence_refs may contain only theme_id values or evidence.excerpt_hash values present in the supplied Themes artifact.
- Never emit an empty evidence_refs array. Omit an unsupported optional item instead.
- Do not invent products, customers, markets, competitors, risks, dependencies, or strategies.
- Do not include confidence scores.

Themes:
${JSON.stringify(input.themes, null, 2)}

Filing content:
${input.filing_content}`;
}
