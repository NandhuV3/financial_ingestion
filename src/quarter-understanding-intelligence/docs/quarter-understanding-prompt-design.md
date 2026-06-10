# Quarter Understanding Prompt Design

## 1. Purpose

Quarter Understanding is the first LLM-powered interpretation layer in the platform.

Business Signals identify observations.

Quarter Understanding explains what those observations collectively appear to mean.

The purpose of the prompt is to guide interpretation while preserving:

* Evidence grounding
* Auditability
* Traceability
* Consistency
* Reproducibility

The prompt must not allow the model to become:

* An investment advisor
* A recommendation engine
* A narrative generator
* An owner-question generator

Quarter Understanding owns interpretation only.

---

## 2. Inputs To The Prompt

The prompt receives structured inputs only.

Primary inputs:

```text
Company Knowledge
Business Signal Artifact
Filing Metadata
```

Optional future inputs:

```text
Historical Quarter Understandings
Management Commentary Intelligence
Longitudinal Intelligence
```

The prompt should never receive:

```text
Portfolio holdings
Stock prices
Valuation targets
Buy/sell recommendations
Frontend presentation data
```

---

## 3. Company Knowledge Usage

Company Knowledge provides durable business context.

Examples:

```text
Products
Customers
Revenue Drivers
Competitive Positioning
Operating Model
Dependencies
```

The model should use Company Knowledge to understand:

```text
Why a signal matters
How a signal relates to the business
Whether multiple signals connect
```

The model must not modify Company Knowledge.

The model must not redefine Company Knowledge.

---

## 4. Business Signal Usage

Business Signals are authoritative observations.

The model must treat Business Signals as evidence.

Examples:

```text
Cloud demand acceleration observed.

AI infrastructure investment increased.

Customer concentration risk increased.

Margin pressure intensified.
```

The model may connect signals.

The model may synthesize signals.

The model may prioritize signals.

The model may not invent new signals.

---

## 5. Required Output Characteristics

Every understanding should be:

* Evidence-based
* Business-focused
* Concise
* Traceable
* Explainable
* Auditable

Every understanding should answer:

```text
What appears to be happening?
Why does it matter?
How does it connect to the business?
```

---

## 6. Prohibited Behavior

The model must never:

* Recommend buying
* Recommend selling
* Recommend holding
* Recommend allocation changes
* Predict stock prices
* Predict future returns
* Generate owner questions
* Generate narratives
* Invent facts
* Invent evidence

Examples of prohibited outputs:

```text
Buy because cloud demand is accelerating.

Increase allocation due to strong AI demand.

The stock should outperform.

Investors should be bullish.
```

---

## 7. Understanding Generation Rules

The model should:

1. Review Company Knowledge.
2. Review Business Signals.
3. Identify related observations.
4. Group supporting signals.
5. Generate interpretation.
6. Assign category.
7. Propose semantic anchor.
8. Assign importance.
9. Assess confidence inputs.

Interpretations should connect evidence.

Interpretations should not restate signals verbatim.

---

## 8. Semantic Anchor Generation

The model proposes:

```text
semantic_anchor_key
```

Examples:

```text
cloud_demand
ai_infrastructure
gross_margin_pressure
customer_concentration
```

Requirements:

* Stable
* Short
* Concept-focused
* Reusable across quarters

Avoid:

```text
cloud_demand_q1
azure_growth_this_quarter
microsoft_cloud_2026_q1
```

Anchors should represent concepts, not periods.

---

## 9. Category Assignment

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

The model must select from approved categories only.

No custom categories.

---

## 10. Importance Assessment

Allowed values:

```text
low
medium
high
```

Importance should consider:

* Strategic significance
* Number of supporting signals
* Management emphasis
* Relationship to Company Knowledge

Importance should not consider:

* Share price impact
* Market sentiment
* Portfolio implications

---

## 11. Confidence Assessment

The model contributes:

```text
signal_agreement
company_knowledge_alignment
```

The model should assess:

### Signal Agreement

```text
corroborating
mixed
conflicting
```

### Company Knowledge Alignment

```text
consistent
inconsistent
not_applicable
```

The model should explain confidence internally through evidence evaluation.

The model should not expose chain-of-thought reasoning.

---

## 12. Evidence Requirements

Every understanding must be linked to evidence.

Valid evidence sources:

```text
Business Signals
Company Knowledge
```

Unsupported interpretations are prohibited.

If evidence is insufficient:

```text
Do not generate the understanding.
```

---

## 13. Multi-Signal Synthesis

The model should prefer synthesis over repetition.

Poor output:

```text
Signal:
Cloud demand increased.

Understanding:
Cloud demand increased.
```

Better output:

```text
Cloud demand remains a primary growth driver and management continues prioritizing infrastructure expansion to support demand.
```

The understanding should add interpretation.

---

## 14. Contradictory Signals

When signals conflict:

```text
Do not ignore conflicts.
```

Example:

```text
Revenue growth improved.

Margin pressure intensified.
```

Possible understanding:

```text
Growth remains strong but profitability appears pressured by increased investment intensity.
```

Conflicts should reduce confidence.

Conflicts should not be hidden.

---

## 15. Empty Output Rules

If meaningful interpretation cannot be supported:

```text
Return zero understandings.
```

Do not invent interpretations to fill space.

Empty artifacts are valid outputs.

---

## 16. Future Prompt Evolution

Future prompt improvements may:

* Improve synthesis quality
* Improve prioritization
* Improve semantic anchor consistency

Future prompt improvements may not:

* Change ownership boundaries
* Introduce recommendations
* Introduce narratives
* Introduce owner questions

Ownership remains fixed.

---

## 17. Success Criteria

A successful Quarter Understanding prompt produces interpretations that are:

* Evidence-backed
* Consistent
* Auditable
* Useful for downstream intelligence

while remaining:

* Recommendation-free
* Question-free
* Narrative-free
* Fact-preserving

The prompt exists to explain business developments, not to advise investors.
