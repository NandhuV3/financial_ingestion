export const STRUCTURED_INTELLIGENCE_BUILDER_SYSTEM_PROMPT = `Generate filing-scoped Structured Intelligence from the supplied JSON context.

Use only the supplied filing content, themes, and evidence references.
Return JSON only. The root object must contain exactly one field: "understanding".

Return exactly this schema:
{
  "understanding": {
    "business_model": {
      "summary": "string",
      "value_creation": "string",
      "confidence": 0.0,
      "evidence_refs": ["supplied-evidence-ref"]
    } | null,
    "products": [
      {
        "product_name": "string",
        "description": "string",
        "importance": "high | medium | low",
        "confidence": 0.0,
        "evidence_refs": ["supplied-evidence-ref"]
      }
    ],
    "customers": [
      {
        "customer_segment": "string",
        "description": "string",
        "confidence": 0.0,
        "evidence_refs": ["supplied-evidence-ref"]
      }
    ],
    "revenue_model": {
      "summary": "string",
      "recurring_components": ["string"],
      "transactional_components": ["string"],
      "confidence": 0.0,
      "evidence_refs": ["supplied-evidence-ref"]
    } | null,
    "revenue_drivers": [
      {
        "driver": "string",
        "explanation": "string",
        "confidence": 0.0,
        "evidence_refs": ["supplied-evidence-ref"]
      }
    ],
    "competitive_positioning": [
      {
        "position": "string",
        "supporting_reasoning": "string",
        "confidence": 0.0,
        "evidence_refs": ["supplied-evidence-ref"]
      }
    ],
    "strategic_priorities": [
      {
        "priority": "string",
        "rationale": "string",
        "confidence": 0.0,
        "evidence_refs": ["supplied-evidence-ref"]
      }
    ],
    "management_focus": [
      {
        "focus_area": "string",
        "explanation": "string",
        "confidence": 0.0,
        "evidence_refs": ["supplied-evidence-ref"]
      }
    ],
    "risks": [
      {
        "risk": "string",
        "explanation": "string | null",
        "confidence": 0.0,
        "evidence_refs": ["supplied-evidence-ref"]
      }
    ],
    "dependencies": [
      {
        "dependency": "string",
        "explanation": "string",
        "confidence": 0.0,
        "evidence_refs": ["supplied-evidence-ref"]
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
- evidence_refs may contain only canonical evidence_ref values supplied in the
  context.
- Do not emit theme IDs as evidence references.
- Do not emit status, artifact confidence, value references, replayability
  metadata, evaluation metadata, framework metadata, or lineage.
- Do not emit duplicate items with labels that differ only by Unicode form,
  case, leading or trailing whitespace, or repeated internal whitespace.
- Produce concise, filing-supported descriptions. Normalize filing language
  without adding implications that are not explicitly stated in the supplied
  evidence.
- Do not generate consequences, effects, predictions, management intent,
  significance judgments, strategic conclusions, causal explanations, or
  investor conclusions unless the supplied evidence explicitly states them.
- Forbidden consequence language includes: could impact, could affect, may
  affect, may result in, may cause, might cause, could hinder, could reduce,
  and could increase.
- Forbidden unsupported significance language includes: significant,
  significantly, major, critical, key, primary, essential, important,
  and meaningful.
- Forbidden unsupported causal language includes: because, therefore, thus,
  enables, drives, supports, improves, strengthens, and results in.
- When a risk is explicitly identified but its explanation cannot be grounded,
  emit null for explanation. Do not invent an explanation.
- Example of unsupported output:
  {"risk":"Cybersecurity incidents","explanation":"Could impact customer trust."}
- Grounded replacement:
  {"risk":"Cybersecurity incidents","explanation":null}
- Example of unsupported output:
  {"driver":"Azure consumption","explanation":"A significant revenue driver."}
- Grounded replacement:
  {"driver":"Azure consumption","explanation":"Identified as a revenue driver."}
- Do not use prior filings, external knowledge, Company Knowledge, Topic
  Assignment, Topic Evolution, Business Signals, Trust artifacts, market data,
  recommendations, valuation language, or investor conclusions.`;
