# 003-company-knowledge.md

# Purpose

Company Knowledge is the durable memory layer of the platform.

It answers:

"What is durably true about this business across time?"

Company Knowledge is not a filing summary.

Company Knowledge is not a quarterly artifact.

Company Knowledge is canonical business memory.

---

# Architectural Position

Structured Intelligence
        ↓
Company Knowledge
        ↓
Business Signals
        ↓
Quarter Understanding

Company Knowledge sits between filing understanding and signal generation.

---

# Ownership

Company Knowledge owns:

- Business Model
- Revenue Structure
- Products
- Services
- Customers
- Revenue Drivers
- Competitive Positioning
- Strategic Priorities
- Key Dependencies
- Sector
- Sub-Sector

These are durable business truths.

---

# Does Not Own

Company Knowledge never owns:

- Quarterly observations
- Signals
- Filing language
- Trends
- Deltas
- Interpretations
- Recommendations
- Presentation

Those belong elsewhere.

---

# Inputs

## Structured Intelligence

Provides:

- Filing-level business understanding

## Prior Company Knowledge

Provides:

- Historical memory

---

# Outputs

Canonical company understanding.

Stored as:

company-knowledge/current.json

and

company-knowledge/archive/

---

# Stability Model

Not all fields behave the same way.

---

## Stable Fields

Change rarely.

Examples:

- Business Model
- Revenue Structure
- Products

Promotion Threshold:

HIGH

Human Review:

RECOMMENDED

---

## Semi-Stable Fields

Change occasionally.

Examples:

- Revenue Drivers
- Customers
- Competitive Positioning

Promotion Threshold:

MEDIUM

Human Review:

CONDITIONAL

---

## Dynamic Fields

Change frequently.

Examples:

- Strategic Priorities
- Management Focus
- Key Dependencies

Promotion Threshold:

LOWER

Human Review:

OPTIONAL

---

# Promotion Philosophy

Company Knowledge never overwrites blindly.

Promotion is a governance process.

Every candidate update produces one of four outcomes.

---

## Promote

New value replaces old value.

---

## Merge

New value enriches old value.

---

## Retain Prior

Old value remains.

---

## Flag Review

Human review required.

---

# Confidence Rules

Minimum promotion confidence:

0.60

Automatic promotion threshold:

0.80

Below threshold:

Retain Prior

or

Flag Review

---

# Human Review Triggers

Examples:

- Stable field change
- Business model change
- Revenue structure change
- Multiple field changes
- Contradiction with prior periods
- Confidence degradation
- Restatement context
- CFO / CEO transition

---

# Audit Requirements

Every promotion event must create:

- Audit Record
- Version Increment
- Promotion Decision
- Reason Code
- Reviewer Information (if applicable)

---

# Rollback

Rollback is first-class.

Rollback restores a prior Company Knowledge version.

Rollback never deletes history.

Rollback automatically invalidates:

- Business Signals
- Quarter Understanding
- Investor Intelligence
- Partner Domain

---

# Storage Structure

company-knowledge/
├── current.json
├── archive/
├── audit/
└── reviews/

---

# Multi-Language Requirement

Identifiers remain language-agnostic.

Example:

```json
{
  "concept_id": "cloud_platform_growth"
}
```

Display labels are localized.

Never use display strings as identifiers.

---

# Sector Classification

Company Knowledge owns:

```text
sector
sub_sector
```

These become mandatory inputs for:

- Business Signals
- Evaluation Framework
- Quarter Understanding

Future sector-aware logic depends on them.

---

# Versioning

Company Knowledge uses monotonic versions.

Example:

v1
v2
v3
v4

No semantic versioning.

No overwrite.

No delete.

Archive is permanent.

---

# Governance Principles

## Principle 1

Company Knowledge is memory.

Not a filing summary.

---

## Principle 2

Knowledge accumulates.

It does not reset every quarter.

---

## Principle 3

Promotion decisions must be deterministic.

---

## Principle 4

Every change must be auditable.

---

## Principle 5

Rollback must always be possible.

---

# Final Principle

Structured Intelligence asks:

"What does this filing say?"

Company Knowledge asks:

"What has proven true across many filings?"

Those are different questions.

Never merge them.

LOCKED.