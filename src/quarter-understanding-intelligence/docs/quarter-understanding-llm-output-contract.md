# Quarter Understanding LLM Output Contract

## 1. Purpose

Quarter Understanding is the first approved LLM-powered reasoning layer in the platform.

This contract defines the exact responsibilities of the LLM.

The goal is to separate:

```text
Reasoning
```

from

```text
Infrastructure
```

The LLM owns reasoning.

The Builder owns infrastructure.

This separation preserves:

* Auditability
* Reproducibility
* Storage stability
* Independent evolution of prompts and schemas
* Future longitudinal intelligence
* Future narrative intelligence
* Future owner questions

---

## 2. Architectural Boundary

### LLM Responsibilities

The LLM may generate:

* Understanding summaries
* Semantic anchors
* Categories
* Importance assessments
* Signal agreement assessments
* Company Knowledge alignment assessments
* Supporting signal references

### Builder Responsibilities

The Builder owns:

* Understanding IDs
* Business keys
* Metadata
* Lineage
* Input hashes
* Confidence scoring
* Evidence references
* Storage paths
* Versioning
* Repository interaction

The LLM must never generate infrastructure fields.

---

## 3. Required Output Shape

The LLM output must conform conceptually to:

```ts
type LLMReasoningOutput = {
  reasoning_schema_version: string;

  understandings: {
    category: string;

    semantic_anchor_key: string;

    summary: string;

    importance:
      | "low"
      | "medium"
      | "high";

    signal_agreement:
      | "corroborating"
      | "mixed"
      | "conflicting";

    company_knowledge_alignment:
      | "consistent"
      | "inconsistent"
      | "not_applicable";

    supporting_signal_ids: string[];
  }[];
};
```

This is not the final persisted artifact.

This is reasoning output only.

---

## 4. Semantic Anchor Ownership

The LLM proposes:

```text
semantic_anchor_key
```

Examples:

```text
cloud_demand

ai_infrastructure

customer_concentration

margin_pressure

pricing_power
```

Anchors should:

* Represent business concepts
* Remain stable across quarters
* Avoid company names
* Avoid period names
* Avoid filing-specific wording

Good:

```text
cloud_demand
```

Bad:

```text
microsoft_cloud_q1
cloud_growth_2026
```

---

## 5. Summary Ownership

The summary is the primary reasoning output.

The summary should explain:

```text
What appears to be happening?
```

Examples:

Good:

```text
Cloud demand remains a primary growth driver and management appears willing to increase infrastructure investment to support continued expansion.
```

Poor:

```text
Cloud demand increased.
```

The summary should synthesize.

The summary should not merely repeat signals.

---

## 6. Category Ownership

Allowed categories:

```text
Revenue
Growth
Margin
Customer
Product
Competitive
Dependency
Operational
Capital Allocation
Management Commentary
```

The LLM must select from approved categories.

Custom categories are prohibited.

---

## 7. Importance Ownership

Allowed values:

```text
low
medium
high
```

Importance should consider:

* Strategic significance
* Evidence strength
* Management emphasis
* Relationship to Company Knowledge

Importance must not consider:

* Stock attractiveness
* Valuation
* Market sentiment
* Portfolio implications

---

## 8. Signal Agreement Ownership

Allowed values:

```text
corroborating
mixed
conflicting
```

Examples:

### Corroborating

```text
Cloud demand increased.

Cloud revenue accelerated.

Management emphasized demand.
```

Signals reinforce one another.

### Mixed

```text
Demand increased.

Margins weakened.
```

Signals point in different directions.

### Conflicting

```text
Management optimism increased.

Revenue signals weakened.
```

Evidence directly conflicts.

---

## 9. Company Knowledge Alignment Ownership

Allowed values:

```text
consistent
inconsistent
not_applicable
```

Examples:

### Consistent

```text
Cloud demand remains strong.
```

Supports known business model.

### Inconsistent

```text
Core revenue driver weakened.
```

Challenges current Company Knowledge assumptions.

### Not Applicable

```text
Temporary filing emphasis change.
```

No meaningful relationship.

---

## 10. Supporting Signal References

The LLM may only reference signals provided as input.

Example:

```json
{
  "supporting_signal_ids": [
    "sig_001",
    "sig_002",
    "sig_010"
  ]
}
```

The LLM must never invent signal IDs.

The Builder validates all references.

---

## 11. Prohibited Outputs

The LLM must never generate:

### Recommendations

```text
Buy
Sell
Hold
Increase allocation
Reduce allocation
```

### Valuation Opinions

```text
Undervalued
Overvalued
Fair value
```

### Market Predictions

```text
Future returns
Target prices
Market forecasts
```

### Owner Questions

Owner Questions belong to a later intelligence layer.

### Narratives

Narratives belong to a future Narrative Intelligence layer.

---

## 12. Hallucination Prevention

The LLM must never:

* Invent signals
* Invent Company Knowledge
* Invent products
* Invent customers
* Invent dependencies
* Invent management commentary
* Invent evidence

All understandings must be grounded in supplied inputs.

---

## 13. Empty Output Rules

If evidence is insufficient:

```json
{
  "understandings": []
}
```

No understandings is a valid output.

Invented understandings are invalid.

---

## 14. Reasoning Schema Version

The LLM output contract must be versioned independently.

Example:

```text
reasoning_schema_version = "1.0.0"
```

This version tracks:

* Prompt contract evolution
* LLM output shape evolution

It is independent from:

```text
artifact schema version
```

The two version systems must remain separate.

---

## 15. Auditability Requirement

Raw LLM output is a first-class artifact.

Future storage may include:

```text
reasoning-raw.json
```

Purpose:

* Prompt debugging
* Model comparison
* Regression testing
* Audit review
* Reproducibility

The raw reasoning output must remain distinguishable from the final assembled Quarter Understanding artifact.

---

## 16. Success Criteria

A successful LLM output:

* Interprets signals
* Synthesizes evidence
* Produces stable semantic anchors
* Remains grounded in supplied inputs
* Avoids recommendations
* Avoids predictions
* Avoids narratives

The LLM exists to explain business developments.

It does not exist to advise investors.
