# Quarter Understanding Builder Design

## 1. Goal

The Quarter Understanding Builder transforms business observations into business interpretation.

Business Signals identify what happened.

Quarter Understanding explains what those signals collectively appear to mean.

Quarter Understanding is the first approved LLM-powered intelligence layer in the platform.

It owns:

* Interpretation
* Signal synthesis
* Business reasoning
* Relative importance assessment
* Quarter-specific understanding

It does not own:

* Company facts
* Signal detection
* Recommendations
* Owner questions
* Narratives
* Portfolio guidance

---

## 2. Builder Inputs

The builder consumes already-generated intelligence artifacts.

The builder must not load files directly.

The builder must not own repositories.

The builder must not construct storage paths.

Allowed inputs:

* Company Knowledge
* Business Signal Artifact
* Filing Metadata

Future optional inputs:

* Historical Quarter Understandings
* Management Commentary Intelligence
* Longitudinal Intelligence

Primary inputs:

```text
Company Knowledge
    +
Business Signals
    +
Filing Metadata
```

Company Knowledge provides durable business context.

Business Signals provide quarter-specific observations.

The LLM synthesizes both into interpretations.

---

## 3. Builder Outputs

The builder produces:

```ts
QuarterUnderstandingArtifact
```

Containing:

* Understandings
* Importance
* Confidence
* Semantic Anchors
* Evidence References
* Metadata
* Lineage

The builder does not produce:

* Recommendations
* Buy/Sell language
* Portfolio actions
* Owner questions
* Narratives

---

## 4. LLM Ownership

Quarter Understanding is intentionally LLM-powered.

The LLM is responsible for:

* Connecting signals
* Synthesizing observations
* Identifying business implications
* Prioritizing understandings
* Producing concise summaries
* Proposing semantic anchors

The LLM is not allowed to:

* Invent evidence
* Invent facts
* Modify Company Knowledge
* Create unsupported claims
* Generate recommendations
* Generate owner questions

All outputs must remain traceable to supplied evidence.

---

## 5. Deterministic Responsibilities

The deterministic layer remains responsible for:

* Input validation
* Signal reference generation
* Company Knowledge references
* Lineage assembly
* Metadata generation
* Input hashing
* Version management
* Artifact normalization
* Stable ordering
* Deduplication

The deterministic layer owns auditability.

The LLM owns interpretation.

---

## 6. Understanding Generation Flow

```text
Company Knowledge
        +
Business Signals
        ↓
Prompt Assembly
        ↓
LLM Interpretation
        ↓
Understanding Candidates
        ↓
Normalization
        ↓
Quarter Understanding Artifact
```

The builder should never bypass Company Knowledge.

Interpretations must be grounded in durable business context.

---

## 7. Semantic Anchor Strategy

Every understanding requires:

```ts
semantic_anchor_key: string
```

Purpose:

* Longitudinal tracking
* Historical comparison
* Future dashboards
* Owner journal linking
* Trend analysis

Anchor generation follows a hybrid model:

```text
LLM proposes anchor
        +
Deterministic normalization
```

Example:

```text
Cloud demand remains strong.

→ cloud_demand
```

```text
AI infrastructure investment continues increasing.

→ ai_infrastructure
```

Pure deterministic anchors are too brittle.

Pure LLM anchors drift over time.

Hybrid generation provides stability and flexibility.

Anchors must remain stable across reporting periods whenever the underlying business concept remains the same.

---

## 8. Understanding Categories

Future categories include:

* Revenue
* Growth
* Margin
* Customer
* Product
* Competitive
* Dependency
* Operational
* Capital Allocation
* Management Commentary

The LLM may propose categories.

The deterministic layer validates category values against the approved schema.

---

## 9. Importance Assessment

The LLM may assign:

```text
low
medium
high
```

Importance should reflect:

* Strategic relevance
* Magnitude of business impact
* Number of supporting signals
* Management emphasis
* Relationship to Company Knowledge

Importance is not:

* Investment attractiveness
* Buy/Sell confidence
* Portfolio recommendation

---

## 10. Confidence Strategy

Confidence combines deterministic and LLM-assisted inputs.

LLM responsibilities:

* Signal agreement assessment
* Company Knowledge alignment assessment

Deterministic responsibilities:

* Evidence count
* Source coverage
* Lineage completeness

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

Confidence must remain explainable.

Confidence must never be based on persuasive wording.

---

## 11. Evidence Strategy

Quarter Understanding does not own evidence.

Quarter Understanding references evidence.

Evidence remains owned by upstream layers.

Future evidence model:

```ts
signal_refs[]
company_knowledge_ref
```

The builder must never duplicate signal ownership.

The builder may include:

```ts
evidence_context: string
```

Purpose:

* Human-readable audit trail
* Review support
* Interpretation traceability

References remain authoritative.

---

## 12. Evidence Requirements

Every understanding must be supported by:

* At least one Business Signal
* Or Company Knowledge plus supporting signals

Unsupported understandings are prohibited.

The builder must not create interpretations that cannot be traced to evidence.

---

## 13. Deduplication Strategy

The builder should prevent duplicate understandings.

Potential duplicate dimensions:

* Semantic Anchor
* Category
* Core business concept
* Supporting signals

Example:

```text
Cloud demand remains strong.
```

```text
Enterprise cloud demand remains healthy.
```

These may represent the same business understanding.

The builder should merge them into a single understanding when appropriate.

---

## 14. Lineage Generation

The builder must preserve:

* Source filings
* Source artifacts
* Input hashes
* Artifact references
* Model version
* Prompt version
* Pipeline version

Lineage must remain deterministic.

Versioned references are required.

Flat string references are prohibited.

---

## 15. Failure Modes

### Missing Company Knowledge

Expected behavior:

```text
Low confidence understandings
or empty artifact
```

The builder must not hallucinate context.

### Missing Business Signals

Expected behavior:

```text
Empty artifact
```

No signals means no interpretation.

### Missing Filing Metadata

Expected behavior:

```text
Interpretations may still be generated
if period attribution exists.
```

### Weak Evidence

Expected behavior:

```text
Low confidence understandings
```

### LLM Failure

Expected behavior:

```text
Valid empty artifact
```

The builder must fail safely.

---

## 16. Storage Independence

The builder must not:

* Read files
* Write files
* Know storage paths
* Know repository implementations

Persistence belongs to repositories.

Interpretation belongs to the builder.

---

## 17. Future Enrichment

Future enrichment may:

* Improve wording
* Improve summaries
* Improve prioritization

Future enrichment may not:

* Invent evidence
* Invent facts
* Rewrite lineage
* Modify Company Knowledge
* Generate recommendations

Interpretations must remain traceable to approved evidence.

---

## 18. Non Goals

This document does not define:

* Prompt implementation
* Repository implementation
* Storage layout
* Commands
* API routes
* Runtime orchestration

This document defines builder behavior and ownership only.
