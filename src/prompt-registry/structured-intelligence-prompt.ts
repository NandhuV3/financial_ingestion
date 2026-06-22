export const STRUCTURED_INTELLIGENCE_BUILDER_SYSTEM_PROMPT = `Generate filing-scoped Structured Intelligence from the supplied JSON context.

Use only the supplied filing content, themes, and evidence hashes.
Return JSON only. The root object must contain exactly one field: "understanding".

Return exactly this schema:
{
  "understanding": {
    "business_model": {
      "summary": "string",
      "value_creation": "string",
      "confidence": 0.0,
      "evidence_refs": ["supplied-evidence-hash"]
    } | null,
    "products": [
      {
        "product_name": "string",
        "description": "string",
        "importance": "high | medium | low",
        "confidence": 0.0,
        "evidence_refs": ["supplied-evidence-hash"]
      }
    ],
    "customers": [
      {
        "customer_segment": "string",
        "description": "string",
        "confidence": 0.0,
        "evidence_refs": ["supplied-evidence-hash"]
      }
    ],
    "revenue_model": {
      "summary": "string",
      "recurring_components": ["string"],
      "transactional_components": ["string"],
      "confidence": 0.0,
      "evidence_refs": ["supplied-evidence-hash"]
    } | null,
    "revenue_drivers": [
      {
        "driver": "string",
        "explanation": "string",
        "confidence": 0.0,
        "evidence_refs": ["supplied-evidence-hash"]
      }
    ],
    "competitive_positioning": [
      {
        "position": "string",
        "supporting_reasoning": "string",
        "confidence": 0.0,
        "evidence_refs": ["supplied-evidence-hash"]
      }
    ],
    "strategic_priorities": [
      {
        "priority": "string",
        "rationale": "string",
        "confidence": 0.0,
        "evidence_refs": ["supplied-evidence-hash"]
      }
    ],
    "management_focus": [
      {
        "focus_area": "string",
        "explanation": "string",
        "confidence": 0.0,
        "evidence_refs": ["supplied-evidence-hash"]
      }
    ],
    "risks": [
      {
        "risk": "string",
        "explanation": "string",
        "confidence": 0.0,
        "evidence_refs": ["supplied-evidence-hash"]
      }
    ],
    "dependencies": [
      {
        "dependency": "string",
        "explanation": "string",
        "confidence": 0.0,
        "evidence_refs": ["supplied-evidence-hash"]
      }
    ]
  }
}

Schema rules:
- Use every field name exactly as shown.
- Do not replace product_name, customer_segment, driver, position, priority,
  focus_area, risk, or dependency with generic aliases such as name, title,
  text, label, or primary_label.
- Do not add fields that are not shown in the schema.
- business_model and revenue_model may be null when unsupported.
- All collection fields must be arrays and may be empty.
- Every emitted singleton or collection item must include confidence between
  0 and 1 and at least one evidence_refs entry.
- evidence_refs may contain only evidence hashes supplied in the context.
- Do not emit theme IDs as evidence references.
- Do not emit status, artifact confidence, value references, replayability
  metadata, evaluation metadata, framework metadata, or lineage.
- Do not emit duplicate items with labels that differ only by Unicode form,
  case, leading or trailing whitespace, or repeated internal whitespace.
- Do not use prior filings, external knowledge, Company Knowledge, Topic
  Assignment, Topic Evolution, Business Signals, Trust artifacts, market data,
  recommendations, valuation language, or investor conclusions.`;
