# Layer Ownership Architecture

## Purpose

This document defines the ownership boundaries for every layer in the Investment Intelligence Platform.

Ownership boundaries are one of the most important architectural controls in the system. Every layer must answer a specific business question, own a specific type of intelligence, and explicitly avoid responsibilities assigned to other layers.

If ownership boundaries are violated, the system becomes difficult to evaluate, difficult to audit, and difficult to scale.

This document is considered a foundational architecture specification.

---

# Layer Overview

```text
Themes
    ├──→ Topic Assignment
    │        ├──→ Topic Evolution
    │        └──→ Quarter Change
    │
    └──→ Structured Intelligence
    ↓
Company Knowledge
    ↓
Business Signals
    ↓
Quarter Understanding
    ↓
Investor Intelligence
    ↓
Partner Domain

Trust Pillars
    ├── Commitment Tracking
    ├── Narrative Consistency
    ├── Accounting Stability
    └── Capital Allocation Tracking
    ↓
Trust Signals
    ↓
Quarter Understanding
    ↓
Investor Intelligence Q3
```

Each layer has a single primary responsibility.

---

# 1. Themes

## Business Question

What topics is management discussing in this filing?

## Owns

* Raw topic observations extracted from filing text
* Filing-specific discussion themes
* Topic evidence references

Examples:

* Cloud
* Cybersecurity
* AI
* Supply Chain
* Regulatory Pressure

## Does Not Own

* Canonical topic classification
* Topic normalization
* Topic importance
* Topic trend analysis
* Investor interpretation

## Inputs

* Filing text

## Outputs

* Theme artifacts

## Notes

Themes represent what was discussed.

Themes do not represent what the discussion means.

---

# 2. Topic Assignment

## Business Question

Which canonical topics are represented by the extracted themes?

## Owns

* Mapping themes to canonical Topic IDs
* Topic Registry usage
* Topic normalization

Example:

```text
Theme:
"Azure AI Platform"

Assigned Topic:
cloud_computing
```

## Does Not Own

* Topic importance
* Topic trend analysis
* Investor relevance
* Topic interpretation

## Inputs

* Themes
* Topic Registry

## Outputs

* Topic Assignment artifact

---

# 3. Topic Evolution

## Business Question

How has a topic evolved across multiple periods?

## Owns

* Longitudinal topic behavior
* Topic strengthening
* Topic weakening
* Topic emergence
* Topic disappearance

## Does Not Own

* Single-period changes
* Investor interpretation
* Business conclusions

## Inputs

* Topic Assignment history

## Outputs

* Topic Evolution artifact

Examples:

```text
Emerging
Growing
Stable
Declining
Disappearing
```

---

# 4. Quarter Change

## Business Question

What changed between this filing and the previous filing?

## Owns

* Filing-to-filing delta computation
* Topic appearance
* Topic disappearance
* Topic intensity changes

## Does Not Own

* Why changes matter
* Trend analysis
* Investor interpretation

## Inputs

* Current Topic Assignment
* Previous Topic Assignment

## Outputs

* Quarter Change artifact

Quarter Change measures.

Quarter Change does not interpret.

---

# 5. Structured Intelligence

## Business Question

What is this business and how does it operate based on this filing?

## Owns

Per-filing business understanding:

* Business description
* Revenue drivers
* Competitive positioning
* Risks
* Opportunities
* Strategic priorities

## Does Not Own

* Durable business truth
* Longitudinal understanding
* Investor conclusions

## Inputs

* Filing text
* Themes

## Outputs

* Structured Intelligence artifact

Structured Intelligence is filing-scoped.

It is not company-scoped.

---

# 6. Company Knowledge

## Business Question

What is durably true about this business across time?

## Owns

Canonical business understanding:

* Business model
* Revenue structure
* Products
* Customers
* Competitive position
* Strategic identity

## Does Not Own

* Quarter-specific observations
* Signal generation
* Investor interpretation

## Inputs

* Structured Intelligence
* Prior Company Knowledge

## Outputs

* Company Knowledge artifact

Company Knowledge represents accumulated understanding across many periods.

It is governed through promotion rules.

It is not a simple overwrite of Structured Intelligence.

---

# 7. Business Signals

## Business Question

What is observably true right now?

## Owns

Typed deterministic observations.

Examples:

```text
REVENUE_ACCELERATION

MARGIN_DETERIORATION

STRATEGIC_PRIORITY_DROPPED
```

## Does Not Own

* Interpretation
* Recommendations
* Investor conclusions

## Required Inputs

* Company Knowledge

## Enrichment Inputs

* Quarter Change
* Topic Evolution

## Outputs

* Business Signals artifact

Signals are facts.

Signals are not opinions.

---

# 8. Quarter Understanding

## Business Question

What happened this period and why does it matter?

## Owns

* Signal interpretation
* Pattern assessment
* Contextual understanding
* Current-period insight

## Does Not Own

* Signal generation
* Durable company facts
* Investor-facing Q1–Q5 answers

## Required Inputs

* Company Knowledge
* Business Signals

## Enrichment Inputs

* Trust Signals
* Topic Evolution
* Concept Registry

## Outputs

* Quarter Understanding artifact

Quarter Understanding is period-scoped.

Its responsibility ends at understanding the quarter.

---

# 9. Investor Intelligence

## Business Question

What should an investor understand about this business?

## Owns

The Five Question Framework.

### Q1

What does this company sell?

### Q2

Where does the next rupee come from?

### Q3

Can the story be trusted?

### Q4

Is the story already too expensive?

### Q5

Why would I hold it and what would change that?

## Does Not Own

* Signal generation
* Filing analysis
* Presentation formatting

## Required Inputs

* Company Knowledge
* Quarter Understanding

## Enrichment Inputs

* Business Signals
* Topic Evolution

## Trust Input

* Quarter Understanding trust interpretation

Investor Intelligence does not consume generic Trust Artifacts.

## Outputs

* Investor Intelligence artifact

Investor Intelligence is company-scoped.

Quarter Understanding is period-scoped.

These ownership boundaries must remain separate.

---

# 10. Partner Domain

## Business Question

How should intelligence be presented to the end user?

## Owns

* Formatting
* Presentation
* Ordering
* Language adaptation
* Display structure

## Does Not Own

* New intelligence
* New conclusions
* New signals
* New investor reasoning

## Inputs

* Investor Intelligence

## Outputs

* User-facing experience

Partner Domain is a presentation layer.

It is not an intelligence layer.

---

# Ownership Principles

## Principle 1

A layer may only answer its own business question.

## Principle 2

A downstream layer may interpret upstream outputs.

An upstream layer may never depend on downstream outputs.

## Principle 3

Business Signals are observations.

Quarter Understanding interprets observations.

Investor Intelligence synthesizes interpretations.

Partner Domain presents synthesis.

## Principle 4

No layer may generate intelligence already owned by another layer.

Ownership duplication is an architectural violation.

## Principle 5

Partner Domain must never generate new intelligence.

All intelligence must exist upstream.

---

# Locked Architecture Decision

The following ownership model is considered locked:

```text
Structured Intelligence
→ Company Knowledge
→ Business Signals
→ Quarter Understanding
→ Investor Intelligence
→ Partner Domain
```

Trust follows a separate governed flow:

```text
Trust Pillars
├── Commitment Tracking
├── Narrative Consistency
├── Accounting Stability
└── Capital Allocation Tracking
→ Trust Signals
→ Quarter Understanding
→ Investor Intelligence Q3
```

Any future change requires explicit architectural review.
