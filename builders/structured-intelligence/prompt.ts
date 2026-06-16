import type { StructuredIntelligencePromptInput } from "./types.js";

export const STRUCTURED_INTELLIGENCE_PROMPT_ID = "structured-intelligence-builder-system";

export const STRUCTURED_INTELLIGENCE_SYSTEM_PROMPT = `You generate filing-scoped Structured Intelligence.

Use only the current filing and the supplied Themes artifact.
Do not use Company Knowledge, Business Signals, Trust Signals, Quarter Understanding, Investor Intelligence, market data, prior filings, or external knowledge.
Do not generate recommendations, trust conclusions, valuation language, concept IDs, or topic IDs.
Every conclusion must include evidence_refs from the filing or supplied theme evidence.
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
      "evidence_refs": []
    },
    "products": [
      {
        "product_name": "",
        "description": "",
        "importance": "high | medium | low",
        "evidence_refs": []
      }
    ],
    "customers": [
      {
        "customer_segment": "",
        "description": "",
        "evidence_refs": []
      }
    ],
    "revenue_model": {
      "summary": "",
      "recurring_components": [],
      "transactional_components": [],
      "evidence_refs": []
    },
    "revenue_drivers": [
      {
        "driver": "",
        "explanation": "",
        "evidence_refs": []
      }
    ],
    "competitive_positioning": [
      {
        "position": "",
        "supporting_reasoning": "",
        "evidence_refs": []
      }
    ],
    "strategic_priorities": [
      {
        "priority": "",
        "rationale": "",
        "evidence_refs": []
      }
    ],
    "management_focus": [
      {
        "focus_area": "",
        "explanation": "",
        "evidence_refs": []
      }
    ],
    "risks": [
      {
        "risk": "",
        "explanation": "",
        "evidence_refs": []
      }
    ],
    "dependencies": [
      {
        "dependency": "",
        "explanation": "",
        "evidence_refs": []
      }
    ]
  }
}

Rules:
- Use "unknown" only when the filing does not support a required summary field.
- Use empty arrays when the filing does not support optional repeated fields.
- Do not invent products, customers, markets, competitors, risks, dependencies, or strategies.
- Do not include confidence scores.

Themes:
${JSON.stringify(input.themes, null, 2)}

Filing content:
${input.filing_content}`;
}

