# 006-investor-intelligence.md

# Purpose

Investor Intelligence is the ownership understanding layer of the platform.

It answers:

"What should an owner understand about this business?"

Investor Intelligence is not a filing interpretation layer.

Investor Intelligence is not a presentation layer.

Investor Intelligence is the company-level synthesis layer.

---

# Architectural Position

Company Knowledge
        ↓

Business Signals
        ↓

Topic Evolution
        ↓

Trust Artifacts
        ↓

Quarter Understanding
        ↓

Investor Intelligence
        ↓

Partner Domain

Investor Intelligence sits above Quarter Understanding and synthesizes information across time.

---

# Core Business Question

Investor Intelligence answers:

What does this company sell?

Where does future growth come from?

Can management be trusted?

Is valuation justified?

Why would an owner continue holding the business?

---

# Ownership

Investor Intelligence owns:

- Q1 Business Understanding
- Q2 Growth Understanding
- Q3 Trust Understanding
- Q4 Valuation Understanding
- Q5 Ownership Thesis

Investor Intelligence owns company-level synthesis.

---

# Does Not Own

Investor Intelligence never owns:

- Signal generation
- Filing interpretation
- Company memory
- Presentation
- Portfolio construction
- Buy recommendations
- Sell recommendations
- Price targets

Those belong elsewhere.

---

# Five Question Framework

Investor Intelligence is structured around five questions.

---

# Q1

## What does this company actually sell?

Primary Inputs:

- Company Knowledge

Purpose:

Create a durable understanding of:

- Business Model
- Revenue Structure
- Products
- Customers

Q1 is mostly company-scoped.

Not quarter-scoped.

---

# Q2

## Where does the next rupee come from?

Primary Inputs:

- Company Knowledge
- Quarter Understanding
- Topic Evolution

Purpose:

Identify:

- Revenue Drivers
- Growth Engines
- Expansion Opportunities

Requires synthesis.

---

# Q3

## Can the story be trusted?

Primary Inputs:

- Trust Interpretation
- Commitment Tracking
- Narrative Consistency
- Accounting Stability

Purpose:

Evaluate:

- Management Consistency
- Commitment Follow-Through
- Reporting Stability

Trust is:

Management credibility versus observable reality.

Trust is NOT risk.

LOCKED.

---

# Q4

## Is the story already too expensive?

Primary Inputs:

- Market Data
- Company Knowledge
- Investor Intelligence Context

Purpose:

Evaluate:

- Valuation Context
- Market Expectations
- Business Quality versus Price

Q4 may return:

```text
INSUFFICIENT_DATA
```

until valuation infrastructure exists.

LOCKED.

---

# Q5

## Why would an owner continue holding this business?

Primary Inputs:

- Q1
- Q2
- Q3
- Q4

Purpose:

Create ownership thesis.

Identify thesis-breaking conditions.

Q5 is the highest synthesis layer.

---

# Architectural Principle

Q5 never reads raw artifacts.

Q5 only reads:

- Q1
- Q2
- Q3
- Q4

This ensures:

- Traceability
- Auditability
- Replayability

LOCKED.

---

# Artifact Structure

Investor Intelligence is a single artifact.

Per-question versioning exists internally.

---

## Artifact Schema

```typescript
type InvestorIntelligenceArtifact = {
  company_id: string;

  period_id: string;

  questions: {
    q1: Q1Answer;
    q2: Q2Answer;
    q3: Q3Answer;
    q4: Q4Answer;
    q5: Q5Answer;
  };

  artifact_version: number;

  coherence_hash: string;

  metadata: ArtifactMetadata;

  lineage: ArtifactLineage;
}
```

---

# Why Single Artifact

Chosen Architecture:

Single Artifact

Internal Question Versioning

Reason:

Provides:

- Partial Invalidation
- Easier Governance
- Easier Historical Comparison
- Easier Auditability

Without:

- Distributed Artifact Complexity
- Manifest Management
- Orchestration Overhead

LOCKED.

---

# Question Versioning

Each question maintains its own version.

```typescript
type QuestionSection = {
  answer: string;

  question_version: number;

  input_hash: string;

  prompt_version: string;

  model_version: string;

  confidence: StructuredConfidence;

  generated_at: string;
}
```

---

# Partial Invalidation

Supported.

Examples:

Q2 changes

↓

Only Q2 regenerates.

Q1, Q3, Q4 remain unchanged.

---

Q4 changes

↓

Q4 regenerates.

Q5 regenerates.

Q1-Q3 remain unchanged.

---

# Q5 Ownership Thesis

Q5 produces:

- Ownership Thesis
- Change Conditions
- Holding Rationale

Not recommendations.

---

## Ownership Thesis Structure

```typescript
type OwnershipThesis = {
  summary: string;

  thesis_strength:
    | "strong"
    | "moderate"
    | "conditional"
    | "weak";

  rationale: string;
}
```

---

# Change Conditions

Most important Q5 structure.

These define:

"What would change the thesis?"

---

## Change Condition Schema

```typescript
type ChangeCondition = {
  condition_id: string;

  condition_type:
    | "revenue_model_change"
    | "trust_deterioration"
    | "competitive_displacement"
    | "valuation_threshold"
    | "management_change"
    | "regulatory_change"
    | "capital_allocation_shift"
    | "strategic_priority_abandonment";

  description: string;

  signal_to_watch: string;

  severity:
    | "monitoring"
    | "thesis_weakening"
    | "thesis_breaking";

  current_status:
    | "not_triggered"
    | "early_warning"
    | "triggered";
}
```

---

# Q4 Dependency

Q5 can operate without Q4.

When Q4 is unavailable:

```text
Status = PARTIAL
```

Q5 remains valid.

Valuation-related conditions are omitted.

Confidence penalty applied.

LOCKED.

---

# Confidence Model

Confidence is inherited from inputs.

Q5 cannot be more confident than its weakest major input.

Example:

Q3 = Low Confidence

↓

Q5 cannot produce Strong Thesis.

This constraint is deterministic.

LOCKED.

---

# LLM Usage

Investor Intelligence uses LLMs.

Reason:

Cross-period synthesis.

Ownership reasoning.

Trust synthesis.

Growth synthesis.

No deterministic system can perform this reliably.

---

# Governance Rules

Investor Intelligence must never:

- Recommend buying
- Recommend selling
- Predict price targets
- Predict future returns

Forbidden Language:

- Buy
- Sell
- Target Price
- Expected Return
- Upside
- Downside

Investor Intelligence explains.

It does not advise.

LOCKED.

---

# Evaluation Requirements

Investor Intelligence evaluated on:

---

## Completeness

Did Q1-Q5 answer the question?

---

## Grounding

Can every answer trace to evidence?

---

## Consistency

Do Q1-Q5 tell the same story?

---

## Confidence Calibration

Does confidence match evidence?

---

## Ownership Thesis Quality

Are thesis-breaking conditions explicit?

---

# Storage Structure

investor-intelligence/
├── current.json
├── archive/
├── lineage/
├── evaluations/
└── longitudinal-index/

---

# Final Principle

Quarter Understanding answers:

"What happened?"

Investor Intelligence answers:

"What should an owner understand?"

Partner Domain answers:

"How should that understanding be presented?"

These responsibilities must never overlap.

LOCKED.