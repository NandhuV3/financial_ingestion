# 040-themes-prompt-contract.md

Status: LOCKED

# 1. Purpose

This document defines the permanent contract governing every Themes prompt.

It specifies:

- what the Themes LLM must produce
- what it must never produce
- what reasoning is allowed
- what reasoning is forbidden
- which architectural boundaries must never be crossed

Prompt wording may evolve.

This contract must remain stable.

Every future Themes prompt version must satisfy this specification.

---

# 2. Relationship To Other Documents

This document does not replace:

- 011-themes-spec.md
- themes-prompt.ts

Instead,

```
011 Themes Specification

↓

defines the Themes layer

↓

031 Prompt Contract

↓

defines what the LLM may and may not do

↓

themes-prompt.ts

↓

implements this contract
```

The implementation prompt must never violate this contract.

---

# 3. Primary Responsibility

Themes answers exactly one question.

> **What business narratives does management advance in this filing?**

Everything produced by Themes must contribute toward answering this question.

Nothing else.

---

# 4. Required Inputs

The Themes prompt consumes only

- Theme Input Boundary Artifact

The prompt may receive

- section names
- paragraph indexes
- paragraph text
- evidence references

through the Theme Input Boundary Artifact.

The prompt must never directly consume:

- Filing Artifact
- Evidence Identity
- Theme Grounding
- Themes Quality

Those responsibilities belong to deterministic upstream layers.

Themes may not consume downstream artifacts.

---

# 5. LLM Boundary

The Themes prompt operates only on the approved Theme Input Boundary Artifact.

It must never:

- reopen Filing Artifact
- reopen Evidence Identity
- reconstruct Theme Grounding
- expand visibility

It reasons only over approved visible evidence.

This preserves the deterministic to intelligence boundary established by the
locked architecture.

---

# 6. Forbidden Inputs

Themes must never consume

- Structured Intelligence
- Company Knowledge
- Quarter Change
- Topic Evolution
- Business Signals
- Trust Signals
- Quarter Understanding
- Investor Intelligence
- Market Data

Themes is always filing-scoped.

---

# 7. Required Outputs

Every Theme must contain

- title
- summary
- category
- supporting evidence

Evidence must reference only canonical evidence supplied through the Theme
Input Boundary Artifact.

No invented evidence.

---

# 8. Required Reasoning

Themes may

- identify business narratives
- cluster related evidence
- cluster related observations
- merge supporting paragraphs
- recognize filing-supported observations
- organize related discussions into coherent themes

Themes may perform narrative clustering.

Nothing beyond that.

---

# 9. Forbidden Reasoning

Themes must never

- explain why something happened
- interpret business implications
- assess management quality
- assess management credibility
- assess trust
- compare against previous filings
- identify long-term trends
- predict future outcomes
- assess business quality
- assess competitive strength
- produce investor conclusions
- recommend actions
- determine ownership thesis
- determine valuation
- determine durable business truth

---

# 10. Filing Scope Rule

Every Theme must be true only because this filing supports it.

The prompt must never produce statements that remain true independent of this filing.

Valid

> This filing describes increased AI infrastructure investment.

Invalid

> Microsoft is an AI infrastructure leader.

---

# 11. Narrative Rule

Themes identify narratives.

Themes do not identify facts.

Themes do not identify metrics.

Themes do not identify topics.

Themes identify coherent business discussions.

Example

Good

> AI Infrastructure Expansion

Bad

> Capital Expenditure Increased 12%

Bad

> Technology

Bad

> Management Discussion

---

# 12. Canonical Evidence Rule

Evidence exists to support Themes.

Themes never exist to consume evidence.

Every Theme must reference canonical evidence supplied through the Theme Input
Boundary Artifact.

Every selected paragraph must directly support the Theme.

Evidence may not be added merely because it appears nearby.

Evidence selection must be intentional.

---

# 13. Theme Independence

Every Theme must represent exactly one business narrative.

Themes must not combine unrelated developments.

Examples

Good

Cloud Revenue Expansion

Good

AI Infrastructure Investment

Bad

Cloud Revenue Expansion And Regulatory Risk

Those are separate narratives.

---

# 14. Theme Uniqueness

The prompt must not emit duplicate Themes.

Different wording is not sufficient.

Different titles are not sufficient.

A Theme must represent a unique business narrative.

---

# 15. Theme Granularity

Themes should be

- broader than individual facts
- narrower than business understanding

Theme

↓

Structured Intelligence

↓

Company Knowledge

is the required progression.

Themes must never become Structured Intelligence.

---

# 16. Boilerplate Rule

Themes must ignore

- section headings
- legal boilerplate
- accounting methodology
- generic risk disclosures
- generic competition language
- navigation text
- document structure

unless the filing introduces company-specific business substance.

---

# 17. Language Rules

Themes use

- neutral
- descriptive
- evidence-backed
- filing-scoped language

Themes never use

- strong
- weak
- impressive
- concerning
- attractive
- high quality
- durable
- credible
- superior
- best
- poor
- positive
- negative

unless quoted directly from filing evidence.

---

# 18. Ownership Boundary

Themes own

"What management discussed."

Structured Intelligence owns

"How the business works."

Company Knowledge owns

"What is durably true."

Quarter Understanding owns

"What happened this period."

Investor Intelligence owns

"What should an owner conclude."

Themes never answer downstream questions.

---

# 19. Confidence Rule

Confidence reflects extraction confidence only.

Confidence does not measure

- business quality
- investment quality
- management quality
- model confidence

Confidence measures only

how strongly the approved visible filing evidence supports the extracted
Theme.

It must never be interpreted as business confidence, investment confidence,
or model certainty.

---

# 20. Output Validation Rules

A valid Theme must satisfy all checks.

✓ Filing-scoped

✓ Narrative-based

✓ Evidence-supported

✓ Non-duplicative

✓ Single narrative

✓ No downstream reasoning

✓ Neutral language

✓ Correct category

Failure of any rule invalidates the Theme.

---

# 21. Forbidden Questions

The prompt must never answer questions such as

- Is management correct?
- Is this strategy effective?
- Is this bullish?
- Should investors care?
- Does this strengthen the investment thesis?
- Is the company trustworthy?
- Is the business high quality?
- Is this a competitive advantage?
- Is this better than competitors?
- What changed from last quarter?

Those questions belong to downstream layers.

---

# 22. Regression Requirements

Every future prompt version must preserve

- filing scope
- evidence grounding
- narrative extraction
- ownership boundaries
- neutral language

Prompt improvements may change wording.

They must never change responsibility.

---

# 23. Relationship To Prompt Registry

Prompt Registry governs

- versioning
- activation
- rollback

This document governs

- reasoning
- ownership
- allowed outputs
- forbidden outputs

They are complementary.

---

# 24. Final Principle

Themes is the platform's observation layer.

It answers only

> What business narratives does management advance in this filing?

Nothing upstream is interpreted.

Nothing downstream is anticipated.

Everything produced by Themes exists solely to enable later layers to build structured business understanding without re-reading the filing.
