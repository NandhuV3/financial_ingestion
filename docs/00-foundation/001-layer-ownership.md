# Layer Ownership Architecture

## Purpose

This document defines the ownership boundaries for every layer in the Investment Intelligence Platform.

Ownership boundaries are one of the most important architectural controls in the system. Every layer must answer a specific business question, own a specific type of intelligence, and explicitly avoid responsibilities assigned to other layers.

If ownership boundaries are violated, the system becomes difficult to evaluate, difficult to audit, and difficult to scale.

This document is considered a foundational architecture specification.

---

# Layer Overview

```text
Filing
    ├──→ Themes
    │        ↓
    │    Topic Assignment
    │        ↓
    │    Topic Evolution
    │
    └──→ Structured Intelligence
             ├──→ Company Knowledge
             └──→ Quarter Change
                    ↑
          Prior Structured Intelligence

Company Knowledge
Topic Evolution
Quarter Change
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

What coherent business narratives did management discuss in this filing?

## Owns

* Filing-specific observation clusters
* Coherent management discussion narratives
* Observation summaries
* Directional framing stated in the filing
* Filing evidence references and evidence counts

## Does Not Own

* Canonical topic classification
* Topic normalization
* Cross-period comparison
* Topic evolution
* Business interpretation
* Durable company knowledge
* Investor interpretation

## Inputs

* Filing text

## Outputs

* Theme artifacts

## Notes

Themes represent what was discussed.

Themes do not represent what the discussion means.

Themes are observations, not topic labels.

---

# 2. Topic Registry

## Business Question

What canonical business topics may filing observations normalize to?

## Owns

* Canonical Topic IDs
* Universal and sector topic tiers
* Topic definitions
* Topic aliases
* Topic examples and exclusions
* Topic embedding versions
* Topic lifecycle status
* Topic governance

## Does Not Own

* Company-specific observations
* Filing-specific themes
* Topic evolution
* Business interpretation

## Inputs

* Governed Topic Proposals
* Cross-company evidence
* Uniqueness analysis
* Topic Evolution utility review

## Outputs

* Versioned Topic Registry
* Active universal topics
* Active sector topics

Topic creation is governed.

Topic Assignment cannot create topics.

Only active topics are assignable.

Proposed and provisional topics remain governance-owned and are not production
assignment targets.

---

# 3. Topic Assignment

## Business Question

Which canonical topics are represented by the extracted themes?

## Owns

* Mapping themes to canonical Topic IDs
* Topic Registry usage
* Assignment confidence
* Canonical topic normalization
* Theme Summary propagation

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
* Topic creation
* Topic evolution
* Investor relevance
* Topic interpretation

## Inputs

* Themes
* Topic Registry

## Outputs

* Topic Assignment artifact

---

# 4. Topic Evolution

## Business Question

How has a topic evolved across multiple periods?

## Owns

* Longitudinal topic behavior
* Persistence
* Emergence
* Disappearance
* Strengthening
* Weakening
* Narrative drift

## Does Not Own

* Business-level period deltas
* Investor interpretation
* Business conclusions

## Inputs

* Topic Assignments
* Propagated Theme Summaries
* Historical Topic Assignments

## Outputs

* Topic Evolution artifact

Examples:

```text
Emerging
Strengthening
Stable
Weakening
Disappearing
Narrative Drift
```

---

# 5. Quarter Change

## Business Question

What changed in the business between the current and prior period?

## Owns

* Revenue driver changes
* Strategic priority changes
* Competitive positioning changes
* Risk characterization changes
* Operating model changes
* Management emphasis changes

## Does Not Own

* Why changes matter
* Topic persistence
* Topic emergence
* Topic disappearance
* Topic strengthening
* Topic weakening
* Narrative drift
* Investor interpretation

## Inputs

* Current Structured Intelligence
* Prior Structured Intelligence

## Outputs

* Quarter Change artifact

Quarter Change measures.

Quarter Change does not interpret.

Quarter Change is a business-delta layer, not a topic-delta layer.

---

# 6. Structured Intelligence

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

# 7. Company Knowledge

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

# 8. Business Signals

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

# 9. Quarter Understanding

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

# 10. Investor Intelligence

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

# 11. Partner Domain

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
Filing
├──→ Themes
│    → Topic Assignment
│    → Topic Evolution
│
└──→ Structured Intelligence
     ├──→ Company Knowledge
     └──→ Quarter Change
            ↑
          Prior Structured Intelligence

Company Knowledge
Topic Evolution
Quarter Change
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
