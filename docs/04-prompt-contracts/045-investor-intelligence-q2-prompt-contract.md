# 045-investor-intelligence-q2-prompt-contract.md

Version: 1.0
Status: LOCKED
Owner: Investor Intelligence Layer

Inherits:
040-prompt-governance-spec.md

Produces:
Q2 Answer

Depends On:

- Company Knowledge
- Quarter Understanding
- Business Signals (Q2 enrichment only)
- Topic Evolution (enrichment)

---

# Purpose

This contract governs the Q2 Prompt.

Q2 answers:

> Where does the next rupee come from?

Q2 is the Growth Understanding prompt.

Its responsibility is to explain:

- growth drivers
- growth durability
- growth constraints
- business momentum
- future revenue sources

using observable evidence.

---

# Architectural Position

```text
Company Knowledge
        ↓

Business Signals
        ↓

Topic Evolution
        ↓

Quarter Understanding
        ↓

Q2 Prompt
        ↓

Q2 Answer
        ↓

Q5 Ownership Thesis
```

---

# Core Question

Q2 answers:

```text
What appears most likely
to drive future revenue
for this business?
```

---

# Ownership

Q2 owns:

- revenue driver identification
- growth reasoning
- growth durability reasoning
- growth constraint identification
- business momentum interpretation

Q2 does NOT own:

- trust assessment
- valuation assessment
- ownership thesis
- investment recommendation

---

# Core Responsibility

Transform:

```text
Company Knowledge

+

Quarter Understanding

+

Business Signals

+

Topic Evolution
```

into:

```text
Growth Understanding
```

---

# Architectural Principle

Q2 is:

```text
Forward Looking
```

but must remain:

```text
Evidence Grounded
```

---

# Input Contract

Required:

```typescript
type Q2PromptInput = {
  company_knowledge:
    CompanyKnowledgeArtifact;

  quarter_understanding:
    QuarterUnderstandingArtifact;

  business_signals:
    BusinessSignalArtifact[] | null;

  topic_evolution:
    TopicEvolutionArtifact | null;
};
```

---

# Allowed Inputs

Prompt may consume:

```text
Company Knowledge

Quarter Understanding

Business Signals

Topic Evolution
```

Business Signals and Topic Evolution are enrichment inputs.

Q2 must still produce a valid output when either enrichment input is absent, with limitations recorded.

---

# Forbidden Inputs

Prompt must NOT consume:

```text
Q3

Q4

Q5

Market Data

Valuation Data

Partner Domain

Analyst Reports

Price Targets

Trust Verdicts
```

---

# Reason

Prevent:

```text
Future Leakage

Circular Reasoning

Valuation Contamination
```

---

# Output Contract

```typescript
type Q2Answer = {
  revenue_outlook_summary: string;

  primary_growth_drivers:
    GrowthDriver[];

  growth_constraints:
    GrowthConstraint[];

  growth_durability:
    GrowthDurability;

  revenue_direction:
    RevenueDirection;

  confidence: null;

  evidence_package:
    Q2EvidencePackage;
};
```

---

# Revenue Outlook Summary

Purpose:

Provide a concise explanation of:

```text
Where future revenue
appears likely to originate.
```

---

# Example

Allowed:

```text
Enterprise cloud adoption
and AI workload growth
appear to be the primary
drivers of future revenue expansion.
```

Forbidden:

```text
Revenue will increase 25%
next year.
```

---

# Growth Driver Schema

```typescript
type GrowthDriver = {
  title: string;

  description: string;

  durability:
    | "durable"
    | "moderately_durable"
    | "uncertain"
    | "temporary";

  evidence_refs:
    string[];
};
```

---

# Growth Driver Rules

Every driver must trace to:

```text
Company Knowledge

Quarter Understanding

Business Signals

Topic Evolution
```

---

# Growth Constraint Schema

```typescript
type GrowthConstraint = {
  title: string;

  description: string;

  severity:
    | "low"
    | "medium"
    | "high";

  evidence_refs:
    string[];
};
```

---

# Constraint Rules

Constraints must be:

```text
Observed

Evidence-Based
```

Not speculative.

---

# Growth Durability

Purpose:

Assess persistence of growth drivers.

---

# Allowed Values

```typescript
type GrowthDurability =
  | "durable"
  | "moderately_durable"
  | "uncertain"
  | "temporary";
```

---

# Durability Rules

Use:

```text
Topic Evolution

Historical Signals

Company Context
```

---

# Example

Durable:

```text
Cloud Migration

Subscription Adoption

Platform Expansion
```

Temporary:

```text
One-Time Contracts

Temporary Demand Spike
```

---

# Revenue Direction

Purpose:

Summarize observed growth trajectory.

---

# Allowed Values

```typescript
type RevenueDirection =
  | "accelerating"
  | "stable_growth"
  | "mixed"
  | "slowing"
  | "uncertain";
```

---

# Revenue Direction Rules

Must be supported by:

```text
Business Signals

Quarter Understanding
```

---

# Forward-Looking Rule

Q2 may explain:

```text
Potential Revenue Drivers
```

Q2 may NOT:

```text
Forecast Revenue
```

---

# Allowed

```text
AI demand appears positioned
to contribute to future growth.
```

---

# Forbidden

```text
Revenue will increase
next quarter.
```

---

# Evidence Package

Enrichment.

---

# Schema

```typescript
type Q2EvidencePackage = {
  company_knowledge_refs:
    string[];

  understanding_refs:
    string[];

  signal_refs:
    string[];

  topic_refs:
    string[];
};
```

---

# Grounding Rules

Every growth claim must trace to:

```text
Company Knowledge

Quarter Understanding

Business Signals

Topic Evolution
```

---

# Hallucination Prevention

Prompt must not introduce:

```text
Products

Markets

Growth Drivers

Customers

Strategies
```

not supported by inputs.

---

# Growth Driver Selection Rules

Q2 should prioritize:

```text
Most Material Drivers
```

---

# Avoid

```text
Exhaustive Lists
```

---

# Target

```text
3–7 major drivers
```

per company.

---

# Constraint Selection Rules

Q2 should identify:

```text
Most Material Constraints
```

---

# Target

```text
1–5 major constraints
```

---

# Topic Evolution Usage

Required.

---

# Purpose

Determine:

```text
Persistence

Acceleration

Decline
```

of themes.

---

# Missing Enrichment Condition

When Topic Evolution is unavailable:

```text
Record limitation.
```

---

# Confidence Rules

Prompt does NOT generate confidence.

---

# Builder Computes

```typescript
type Q2Confidence = {
  revenue_driver_clarity: number;

  signal_strength_score: number;

  growth_consistency_score: number;

  durability_score: number;

  overall: number;
};
```

---

# Forbidden Output Fields

Prompt must NOT generate:

```text
Confidence

Trust Verdicts

Valuation Views

Ownership Thesis

Recommendations
```

---

# Trust Boundary

Forbidden:

```text
Management Credibility

Trustworthiness

Execution Reliability
```

Those belong to:

```text
Q3
```

---

# Valuation Boundary

Forbidden:

```text
Cheap

Expensive

Undervalued

Overvalued
```

Those belong to:

```text
Q4
```

---

# Ownership Boundary

Forbidden:

```text
Why Investors Should Own It
```

Those belong to:

```text
Q5
```

---

# Forecasting Boundary

Forbidden:

```text
Revenue Targets

Growth Targets

Numerical Forecasts

Probability Forecasts
```

---

# Evaluation Hooks

Supports:

```text
Growth Driver Quality

Grounding Quality

Durability Quality

Forward-Looking Reasoning
```

---

# Evaluation Metrics

## Revenue Driver Grounding

Measures:

```text
Evidence support.
```

---

## Growth Durability Accuracy

Measures:

```text
Persistence assessment quality.
```

---

## Constraint Quality

Measures:

```text
Materiality of identified constraints.
```

---

## Revenue Direction Consistency

Measures:

```text
Alignment with observed signals.
```

---

## Forward-Looking Quality

Measures:

```text
Ability to explain future revenue
without forecasting.
```

---

# Prompt Failure Conditions

Prompt fails if it:

Forecasts revenue

Creates trust assessments

Creates valuation opinions

Creates ownership theses

Uses unsupported growth drivers

Ignores Topic Evolution

Produces recommendation language

---

# Recommendation Boundary

Forbidden:

```text
Buy

Sell

Hold

Outperform

Underperform

Expected Return

Price Target
```

---

# Lineage Requirements

Artifact records:

```typescript
type Q2PromptLineage = {
  prompt_id: string;

  prompt_version: string;

  model_version: string;
};
```

---

# Replayability Requirements

Production execution:

```text
Temperature = 0
```

required.

---

# Scaling Requirements

Target:

```text
10,000+ companies
```

Must support:

- durable growth analysis
- cross-sector growth reasoning
- deterministic generation
- replayability
- auditability

---

# Architectural Invariants

LOCKED.

1. Q2 explains future revenue drivers.
2. Q2 remains evidence-grounded.
3. Q2 is forward-looking but not predictive.
4. Topic Evolution is enrichment input.
5. Growth durability must be explicit.
6. Constraints must be evidence-based.
7. Q2 does not assess trust.
8. Q2 does not assess valuation.
9. Q2 does not create ownership theses.
10. Q2 is a primary input into Q5.

End of Specification.
