# 035-investor-intelligence-q5-spec.md

Version: 1.0
Status: LOCKED
Owner: Investor Intelligence Layer

---

# Purpose

Q5 answers:

> "Why would I hold this business and what would change that?"

Q5 is the Ownership Thesis Layer.

Q5 is the final synthesis layer of Investor Intelligence.

Q5 combines:

- Q1 Business Understanding
- Q2 Growth Understanding
- Q3 Trust Understanding
- Q4 Valuation Understanding (optional)

into a structured ownership thesis.

---

# Architectural Position

Q5 sits at the boundary between:

```text
Business Intelligence
```

and

```text
Investment Recommendation
```

Q5 must never cross into recommendation.

This boundary is enforced by architecture,
governance,
evaluation,
and prompt controls.

---

# Ownership

Q5 owns:

- ownership thesis generation
- change condition generation
- thesis strength assessment
- cross-question synthesis

Q5 does NOT own:

- buy recommendations
- sell recommendations
- price targets
- expected returns
- portfolio allocation advice

---

# Core Question

Q5 must answer:

```text
Why would an owner continue
to own this business?

What specific conditions
would weaken or break
that ownership thesis?
```

---

# Inputs

## Required

Q1 Answer

Q2 Answer

Q3 Answer

Company Knowledge

---

## Optional

Q4 Answer

Historical Investor Intelligence

Topic Evolution

---

# Forbidden Inputs

Q5 MUST NOT consume:

Raw Filings

Market Data directly

Price Targets

Analyst Reports

Partner Domain

News

Social Media

Broker Research

Investment Recommendations

---

# Architectural Principle

Q5 consumes:

```text
Q1–Q4 outputs
```

NOT

```text
Raw upstream artifacts
```

This preserves:

- replayability metadata
- auditability
- explainability

---

# Core Responsibility

Transform:

```text
Q1

Q2

Q3

Q4 (optional)
```

into:

```text
Ownership Thesis
```

---

# Output Schema

```typescript
type Q5Answer = {
  ownership_thesis: OwnershipThesis;

  change_conditions: ChangeCondition[];

  answer: string;

  status:
    | "answered"
    | "partial"
    | "insufficient_inputs";

  partial_reason?: Q5PartialReason;

  depth_indicator:
    | "longitudinal"
    | "current_period_only";

  input_confidence_summary:
    Q5InputConfidenceSummary;

  confidence: Q5Confidence;

  replayability_metadata:
    Q5ReplayabilityMetadata;
};
```

---

# Ownership Thesis

```typescript
type OwnershipThesis = {
  summary: string;

  grounded_in: {
    q1_contribution: string;

    q2_contribution: string;

    q3_contribution: string;

    q4_contribution: string | null;
  };

  thesis_strength:
    | "strong"
    | "moderate"
    | "conditional"
    | "weak";

  thesis_strength_rationale: string;
};
```

---

# Thesis Strength Rules

### Strong

Requires:

- strong business understanding
- durable growth
- healthy trust profile
- high confidence inputs

---

### Moderate

Some uncertainty exists.

Ownership rationale remains valid.

---

### Conditional

Ownership depends on specific assumptions.

Monitoring required.

---

### Weak

Ownership rationale poorly supported.

Significant concerns exist.

---

# Q4 Dependency Rule

Q4 absence MUST NOT prevent Q5 generation.

When:

```typescript
Q4.status === "insufficient_data"
```

Q5 becomes:

```typescript
status = "partial"
```

and:

```typescript
q4_contribution = null
```

---

# Change Conditions

Purpose:

Identify what would weaken
or invalidate the ownership thesis.

---

# Schema

```typescript
type ChangeCondition = {
  condition_id: string;

  condition_type: ConditionType;

  description: string;

  upstream_source:
    | "q1"
    | "q2"
    | "q3"
    | "q4"
    | "longitudinal";

  signal_to_watch: string;

  severity:
    | "thesis_breaking"
    | "thesis_weakening"
    | "monitoring";

  current_status:
    | "not_triggered"
    | "early_warning"
    | "triggered";
};
```

---

# Condition Types

```typescript
type ConditionType =
  | "revenue_model_change"
  | "trust_deterioration"
  | "competitive_displacement"
  | "valuation_threshold"
  | "management_change"
  | "regulatory_change"
  | "capital_allocation_shift"
  | "strategic_priority_abandonment";
```

---

# Condition Governance

Condition Types are governed.

LLM may NOT invent new types.

New types require:

Concept Registry governance process.

---

# Signal Linkage Requirement

Every change condition MUST include:

```typescript
signal_to_watch
```

No signal linkage:

```text
Governance Failure
```

---

# Example

```typescript
{
  condition_type:
    "trust_deterioration",

  signal_to_watch:
    "COMMITMENT_ABANDONED",

  severity:
    "thesis_breaking"
}
```

---

# Condition Severity

### Thesis Breaking

Ownership thesis invalidated.

---

### Thesis Weakening

Ownership thesis weakened.

---

### Monitoring

Condition worth tracking.

Not yet material.

---

# Longitudinal Tracking

Condition IDs must remain stable.

Purpose:

```text
Historical tracking
```

across periods.

---

# Example

```text
trust_deterioration_msft
```

must persist.

---

# Partial Operation

Q5 may operate without:

Q4

but not without:

Q1

Q2

Q3

---

# Status Rules

### Answered

Q1–Q3 available.

Confidence above threshold.

---

### Partial

Q4 unavailable.

or

Some non-critical inputs missing.

---

### Insufficient Inputs

Cannot construct ownership thesis.

Q1/Q2/Q3 unavailable.

---

# Input Confidence Summary

```typescript
type Q5InputConfidenceSummary = {
  q1_confidence: number;

  q2_confidence: number;

  q3_confidence: number;

  q4_confidence: number | null;

  q4_available: boolean;

  weakest_input:
    | "q1"
    | "q2"
    | "q3"
    | "q4"
    | "none";
};
```

---

# Confidence Model

Confidence is derived.

Never self-assessed.

```typescript
type Q5Confidence = {
  overall: number;

  input_completeness: {
    score: number;

    q4_available: boolean;

    minimum_periods_met: boolean;
  };

  thesis_grounding: {
    score: number;

    grounded_claims: number;

    ungrounded_claims: number;
  };

  change_condition_specificity: {
    score: number;

    conditions_with_signals: number;

    conditions_without_signals: number;
  };

  weakest_input_penalty: number;
};
```

---

# Confidence Constraints

Q5 confidence cannot exceed:

```typescript
min(
  Q1,
  Q2,
  Q3
)
```

plus tolerance.

---

# Trust Constraint

If:

```typescript
Q3.trust_assessment === null

or

Q3.trust_depth_limitation !== null
```

then:

```typescript
thesis_strength !== "strong"
```

This is deterministic.

Not LLM-controlled.

---

# Historical Comparison

Track:

```typescript
type Q5HistoricalComparison = {
  thesis_strength_changed: boolean;

  change_conditions_added: number;

  change_conditions_removed: number;

  change_conditions_triggered: number;

  confidence_changed: boolean;
};
```

---

# Longitudinal Index

```typescript
type Q5LongitudinalIndex = {
  company: string;

  periods: {
    period: string;

    thesis_strength: string;

    overall_confidence: number;

    change_conditions: {
      condition_id: string;

      condition_type: string;

      status: string;
    }[];
  }[];
};
```

---

# Evaluation Metrics

## Thesis Grounding

Measures:

```text
How much of the thesis
is traceable to Q1–Q4.
```

---

## Condition Completeness

Measures:

```text
Coverage of major thesis risks.
```

---

## Condition Specificity

Measures:

```text
Signal linkage quality.
```

---

## Internal Consistency

Measures:

```text
Alignment with Q1–Q4.
```

---

## Recommendation Boundary

Measures:

```text
Absence of recommendation language.
```

---

# Governance Rules

Q5 must never:

recommend buying

recommend selling

recommend holding

predict returns

predict stock prices

provide allocation guidance

---

# Forbidden Language

Examples:

```text
Buy

Sell

Strong Buy

Outperform

Expected Return

Upside

Downside

Price Target

Investors Should
```

Any occurrence:

```text
Governance Failure
```

---

# Invalidation Rules

Full Regeneration:

```text
Q1 changes

Q2 changes

Q3 changes
```

---

# Partial Regeneration

```text
Q4 changes
```

Only:

```text
valuation_threshold
```

conditions require update.

---

# Regeneration Trigger

Q5 input hash includes:

```text
Q1

Q2

Q3

Q4
```

hashes.

Any change:

```text
candidate invalidation
```

Hybrid invalidation determines propagation.

---

# Replayability Metadata

```typescript
type Q5ReplayabilityMetadata = {
  q1_version: number;

  q2_version: number;

  q3_version: number;

  q4_version: number | null;

  company_knowledge_version: number;

  prompt_version: string;

  model_version: string;

  input_hash: string;
};
```

This is replayability metadata owned by Investor Intelligence and is not
Artifact Framework lineage.

---

# Artifact Framework Metadata

Metadata, artifact_version, Artifact Framework lineage, artifact-level hashes,
persistence, current pointer, and archive/history are provided by Artifact
Framework and are not part of Q5 content.

---

# Scaling Requirements

Target:

```text
10,000+ companies
```

Must support:

- thesis tracking
- condition tracking
- historical comparison
- partial invalidation
- Q4-independent operation

---

# Architectural Invariants

LOCKED.

1. Q5 is the final synthesis layer.
2. Q5 consumes Q1–Q4, not raw artifacts.
3. Q5 must operate without Q4.
4. Q5 produces structured change conditions.
5. Every condition requires signal linkage.
6. Q5 must remain auditable.
7. Q5 must remain explainable.
8. Q5 must not provide recommendations.
9. Trust limits thesis strength.
10. Ownership Thesis and Change Conditions are primary artifacts, not prose.

End of Specification.
