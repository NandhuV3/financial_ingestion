# 014 — Structured Intelligence Specification

**Layer:** Company Intelligence

**Type:** Intelligence Subsystem Specification

**Pattern:** 020 – Intelligence Builder Pattern

**Status:** LOCKED

---

# 1. Purpose

Structured Intelligence is the first LLM-native intelligence artifact within Company Intelligence.

It exists to answer:

> **Based on what this filing states, how does this business work?**

Themes identify the business narratives discussed within a filing.

Structured Intelligence transforms those filing-scoped observations into structured business understanding while preserving evidence, explainability, and replay compatibility.

Structured Intelligence represents the business as described in a single filing.

It is **not** durable Company Knowledge.

It is **not** Quarter Understanding.

It is **not** Investor Intelligence.

It is the bridge between Themes and Company Knowledge Candidate.

---

# Golden Rule

Structured Intelligence does **not** determine whether management is correct.

Structured Intelligence captures how management describes the business in this filing.

Structured Intelligence may organize, normalize, and structure filing-supported claims.

Structured Intelligence does **not** validate those claims.

Structured Intelligence does **not** determine whether management's descriptions are accurate.

Structured Intelligence does **not** determine whether management's strategy is effective.

Structured Intelligence does **not** determine whether management is credible.

Those responsibilities belong to downstream layers.

### Valid

- This filing describes Azure consumption as a revenue driver.
- Management states that AI infrastructure investment supports future capacity.

### Invalid

- Azure is Microsoft's most important revenue driver.
- Management's AI strategy is likely to succeed.
- Management appears credible.
- The company has a strong competitive advantage.

---

# 2. Position in Architecture

```text
                Themes
             ┌──────────────┐
             │              │
             ▼              ▼
Topic Assignment   Structured Intelligence
                          │
                          ▼
          Company Knowledge Candidate
```

Themes own filing-scoped observations.

Topic Assignment owns deterministic topic classification.

Structured Intelligence owns filing-scoped business understanding.

Company Knowledge Candidate evaluates Structured Intelligence for governance.

Structured Intelligence never consumes Topic Assignment.

---

# 3. Responsibilities

Structured Intelligence is responsible for:

* Understanding one reporting period.
* Organizing business understanding.
* Producing structured business intelligence.
* Preserving evidence references.
* Producing an immutable Structured Intelligence artifact.

---

# 4. Non-Responsibilities

Structured Intelligence must never:

* Compare reporting periods.
* Detect business changes.
* Produce Company Knowledge.
* Produce Business Signals.
* Produce Trust Signals.
* Produce Quarter Understanding.
* Produce Investor Intelligence.
* Perform governance.
* Perform topic classification.
* Consume Platform Intelligence artifacts.
* Execute prompts directly.
* Manage Prompt Packages.
* Make replay decisions.

These responsibilities belong to downstream Company Intelligence layers or Platform Foundation.

---

# 5. Inputs

## Required Inputs

* Filing Artifact
* Themes

The Filing Artifact provides the canonical filing evidence.

Themes provide filing-scoped observation clusters.

Structured Intelligence derives business understanding directly from these inputs.

---

## Forbidden Inputs

Structured Intelligence must never consume:

* Topic Assignment
* Topic Evolution
* Company Knowledge
* Quarter Change
* Business Signals
* Trust Signals
* Quarter Understanding
* Investor Intelligence
* Market Data

This preserves the separation between:

* Observation
* Business Understanding
* Business Interpretation
* Ownership Understanding

---

## Enrichment Inputs

None (Version 1).

Future enrichments require architectural review.

---

## Operational Inputs

Provided through Platform Foundation:

* Prompt Framework
* Prompt Registry
* LLM Execution Framework
* LLM Replay Policy
* Execution Context
* Artifact Framework

Structured Intelligence consumes these capabilities.

It never owns them.

---

# 6. Business Output Schema

Structured Intelligence produces one immutable artifact containing structured business understanding.

The governed business fields include:

## business_model

Describes how the business operates according to this filing.

---

## products

Products or services discussed in the filing.

---

## customers

Customer groups discussed in the filing.

---

## revenue_model

How revenue is generated according to the filing.

---

## revenue_drivers

Business drivers explicitly supported by filing evidence.

---

## competitive_positioning

Management's stated competitive positioning.

Structured Intelligence records the claim.

It never validates the claim.

---

## strategic_priorities

Management's stated strategic priorities.

---

## management_focus

Operational areas repeatedly emphasized during the filing.

---

## risks

Business risks discussed in the filing.

---

## dependencies

Operational or business dependencies supported by filing evidence.

The schema is versioned and governed independently from implementation.

---

# 7. Reasoning Scope

Structured Intelligence performs:

* Evidence synthesis.
* Business organization.
* Business explanation.
* Cross-section consolidation.
* Semantic normalization of filing evidence into the governed Structured Intelligence schema.

Structured Intelligence may:

* Organize business understanding into structured fields.
* Convert narrative observations into business fields.
* Describe management claims as filing-supported claims.
* Describe relationships between products, customers, operations, and revenue when supported by filing evidence.

Structured Intelligence must never:

* Predict future outcomes.
* Compare reporting periods.
* Produce Company Knowledge.
* Produce Business Signals.
* Produce Quarter Understanding.
* Produce Investor Intelligence.
* Produce Trust assessments.
* Perform topic classification.
* Produce investment conclusions.

---

# 8. Evidence Rules

Every business statement produced by Structured Intelligence must be supported by filing evidence.

Evidence must remain attributable to:

- Filing section
- Source excerpt
- Evidence Identity
- Theme(s)

Structured Intelligence never produces unsupported conclusions.

Every field in the Structured Intelligence artifact must be explainable back to filing evidence.

---

# 9. Prompt Contract

Structured Intelligence defines a governed Prompt Contract.

## Required Inputs

- Filing Artifact
- Themes

## Forbidden Inputs

- Topic Assignment
- Topic Evolution
- Company Knowledge
- Quarter Change
- Business Signals
- Trust Signals
- Quarter Understanding
- Investor Intelligence
- Market Data

## Expected Output

A Structured Intelligence payload conforming to the governed Structured Intelligence schema.

## Reasoning Constraints

- Use filing evidence only.
- Organize business understanding.
- Preserve evidence references.
- Do not compare reporting periods.
- Do not infer future changes.
- Do not perform investment reasoning.
- Do not generate Company Knowledge.
- Do not generate Business Signals.
- Do not validate management claims.
- Do not classify Topics.

---

# 10. Artifact Characteristics

Structured Intelligence artifacts are:

- Immutable
- Filing-scoped
- Replay-compatible
- Versioned
- Explainable
- Evidence-backed
- Schema-governed

Common artifact metadata is inherited from:

**020 – Intelligence Builder Pattern**

Structured Intelligence defines only its business payload.

---

# 11. Builder Lifecycle

Structured Intelligence follows the shared Intelligence Builder Pattern.

```text
Required Inputs
        │
        ▼
Input Validation
        │
        ▼
Prompt Plan Selection
        │
        ▼
Prompt Framework
        │
        ▼
LLM Execution Framework
        │
        ▼
Structured Result
        │
        ▼
Business Payload Construction
        │
        ▼
Artifact Assembly
        │
        ▼
Structured Intelligence Artifact
```

The builder lifecycle is inherited.

Structured Intelligence owns only the business-specific payload construction.

---

# 12. Downstream Consumers

Structured Intelligence is consumed by:

- Company Knowledge Candidate
- Quarter Change

Future Company Intelligence layers consume the outputs of these downstream artifacts rather than reconstructing filing understanding.

No downstream layer should re-read raw filings to reproduce business understanding.

---

# 13. Dependency Direction

```text
Filing Artifact
        │
        ▼
Themes
        │
        ▼
Structured Intelligence
        │
        ▼
Company Knowledge Candidate
        │
        ▼
Company Knowledge
```

Dependency direction is strictly one-way.

Structured Intelligence never depends on downstream Company Intelligence or Platform Intelligence artifacts.

---

# 14. Design Principles

Structured Intelligence must:

- Represent one reporting period only.
- Preserve filing evidence.
- Produce structured business understanding.
- Organize observations into governed business fields.
- Remain independent of business interpretation.
- Remain independent of ownership reasoning.
- Delegate reusable infrastructure to Platform Foundation.
- Follow the Intelligence Builder Pattern.

Structured Intelligence must never become a durable knowledge layer.

---

# 15. Relationship to Shared Pattern

This specification defines only the business-specific behavior of Structured Intelligence.

The following architectural concerns are inherited from:

**020 – Intelligence Builder Pattern**

- Builder lifecycle
- Input validation pattern
- Prompt Plan selection
- Platform Foundation delegation
- Replay model
- Artifact construction
- Metadata model
- Lineage model
- Dependency principles
- Ownership rules

These concerns must not be redefined here.

---

# 16. Relationship to Company Knowledge

Structured Intelligence describes the business according to one filing.

Company Knowledge determines what becomes canonically true across filings.

```text
Filing
    │
    ▼
Themes
    │
    ▼
Structured Intelligence
    │
    ▼
Company Knowledge Candidate
    │
    ▼
Governance Promotion
    │
    ▼
Company Knowledge
```

Structured Intelligence proposes understanding.

Governance determines durability.

---

# 17. Ownership Question

Structured Intelligence answers exactly one question:

> **Based on what this filing states, how does this business work?**

It does not answer:

- What changed?
- What is canonically true?
- What should investors believe?
- Can management be trusted?
- Should the stock be purchased?

Those questions belong to downstream architectural layers.

---

# 18. Version 1 Scope

Version 1 includes:

- Single filing business understanding.
- Evidence-backed reasoning.
- Structured business representation.
- Immutable artifact creation.
- Replay compatibility.
- Platform Foundation integration.

Version 1 excludes:

- Multi-period comparison.
- Durable knowledge creation.
- Topic classification.
- Business change detection.
- Trust analysis.
- Business interpretation.
- Investor reasoning.
- Ownership conclusions.

These responsibilities belong to downstream Company Intelligence subsystems.