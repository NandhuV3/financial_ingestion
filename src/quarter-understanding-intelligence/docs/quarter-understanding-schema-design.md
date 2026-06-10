# Quarter Understanding Schema Design

## 1. Root Artifact

Quarter Understanding artifacts must be:

* Company scoped
* Reporting-period scoped
* Immutable
* Independently regeneratable

Future artifact shape:

```ts
QuarterUnderstandingArtifact {
  company: string;
  period: string;

  understandings: QuarterUnderstanding[];

  metadata: Metadata;
  lineage: Lineage;
}
```

Period is mandatory.

Example:

```text
2026-Q1
```

An artifact must never contain multiple periods.

---

## 2. Understanding Identity

Each understanding requires two identities.

### Understanding ID

Execution-specific identifier.

```ts
understanding_id: string;
```

Used for:

* Deduplication
* Artifact-local references

### Semantic Anchor Key

Stable identity across quarters.

```ts
semantic_anchor_key: string;
```

Examples:

```text
cloud_demand
ai_infrastructure
customer_concentration
gross_margin_pressure
```

Purpose:

* Longitudinal intelligence
* Trend analysis
* Historical comparison
* Owner journal anchoring

Semantic anchors must remain stable across periods.

---

## 3. Understanding Structure

```ts
QuarterUnderstanding {
  understanding_id: string;

  semantic_anchor_key: string;

  category: UnderstandingCategory;

  summary: string;

  importance: "low" | "medium" | "high";

  confidence: UnderstandingConfidence;

  evidence: UnderstandingEvidence;
}
```

---

## 4. Confidence Model

Future confidence structure:

```ts
confidence: {
  score: number;

  evidence_count: number;

  source_reliability:
    | "high"
    | "medium"
    | "low";

  signal_agreement:
    | "corroborating"
    | "mixed"
    | "conflicting";

  company_knowledge_alignment:
    | "consistent"
    | "inconsistent"
    | "not_applicable";
}
```

Purpose:

* Interpretability
* Auditability
* Downstream question generation

---

## 5. Evidence Architecture

Quarter Understanding references evidence.

It does not own evidence.

```ts
evidence: {
  signal_refs: SignalReference[];

  company_knowledge_ref:
    CompanyKnowledgeReference;

  evidence_context: string;
}
```

---

## 6. Signal References

```ts
SignalReference {
  signal_id: string;

  period: string;

  artifact_path: string;

  input_hash: string;
}
```

Purpose:

* Traceability
* Staleness detection
* Audit review

References remain authoritative.

---

## 7. Company Knowledge Reference

```ts
CompanyKnowledgeReference {
  artifact_path: string;

  version: number;

  input_hash: string;
}
```

Purpose:

* Trace business context used during interpretation
* Detect stale understandings

---

## 8. Business Key Constraint

Future understandings should conceptually maintain uniqueness within an artifact.

Uniqueness key:

```text
semantic_anchor_key
```

An artifact should not contain multiple active understandings for the same semantic anchor.

If regeneration creates a replacement understanding:

```ts
supersedes?: string;
```

may be introduced.

---

## 9. Metadata

```ts
metadata: {
  schema_version: string;

  pipeline_version: string;

  model_version: string;

  prompt_version: string;

  generated_at: string;

  understanding_version: number;

  input_hash: string;
}
```

---

## 10. Lineage

```ts
lineage: {
  derived_from: {
    path: string;
    version: number;
    input_hash: string;
  }[];

  source_filings: {
    id: string;
    period: string;
    type: string;
  }[];
}
```

References must be versioned and hash-aware.

Flat string lineage is prohibited.

---

## 11. Future LLM Ownership

Quarter Understanding is the first approved LLM-powered layer.

The LLM may:

* Interpret signals
* Connect signals
* Explain significance

The LLM may not:

* Modify Company Knowledge
* Invent evidence
* Create unsupported facts
* Generate recommendations

All interpretations must remain traceable to referenced evidence.

---

## 12. Non Goals

This document does not define:

* TypeScript implementation
* Builder logic
* Storage
* Repository design
* Prompt implementation
* Runtime orchestration

This document freezes the future schema direction only.
