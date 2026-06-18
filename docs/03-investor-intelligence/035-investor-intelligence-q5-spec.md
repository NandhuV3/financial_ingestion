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
- Q4 Valuation Context

into a structured ownership thesis.

---

# Classification

Q5 is:

- an Investor Intelligence Q5 section
- an LLM-assisted investor-facing synthesis
- an ownership-thesis synthesis layer

Q5 is not:

- an investment recommendation engine
- a deterministic observation layer

Generation requirements:

- `temperature = 0`
- pinned prompt version
- pinned model version
- replayable generation

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

Q4 Answer

---

## Optional

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

Q4
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

    q4_contribution: string;
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

Sprint 11 Q4 is always present.

Q4 returns:

```typescript
status = "insufficient_data";

absent_reason = "market_data_unavailable";
```

Q5 always consumes Q4 output.

When:

```typescript
Q4.status = "insufficient_data"
```

Then:

- valuation conclusions are limited
- `valuation_threshold` conditions are forbidden
- valuation limitations must be propagated

Q5 still generates normally.

Q5 may not fabricate valuation conclusions.

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

When `Q4.status = "insufficient_data"`, Q5 may not emit
`valuation_threshold` conditions.

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

Q5 always consumes Q4 output.

Q4 may have insufficient-data status.

Q5 may not ignore Q4.

Q5 may not operate without:

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

Required inputs are available.

Ownership thesis generation remains possible.

One or more optional enrichments are unavailable.

Examples:

- Historical Investor Intelligence unavailable
- Topic Evolution unavailable

Depth is reduced.

Core thesis generation remains valid.

---

### Insufficient Inputs

Cannot construct ownership thesis.

Q1/Q2/Q3 unavailable.

---

# Partial Status Rules

Q5 may return:

```typescript
status = "partial"
```

only when:

- all required inputs are available
- at least one optional enrichment is unavailable

Optional enrichments:

```text
Historical Investor Intelligence
Topic Evolution
```

Q4 insufficient-data status alone does not cause:

```typescript
status = "partial"
```

because Sprint 11 Q4 is expected to return:

```typescript
status = "insufficient_data"

absent_reason = "market_data_unavailable"
```

and Q5 must handle this normally.

---

# Input Confidence Summary

```typescript
type Q5InputConfidenceSummary = {
  q1_confidence: number;

  q2_confidence: number;

  q3_confidence: number;

  q4_confidence: number;

  q4_has_sufficient_data: boolean;

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

`q4_has_sufficient_data` reflects valuation-data availability only.

It does not indicate whether Q4 exists.

Q4 is always present in Sprint 11.

```typescript
type Q5Confidence = {
  overall: number;

  input_completeness: {
    score: number;

    q4_has_sufficient_data: boolean;

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

Evaluation metadata is content-level replayability metadata.

Evaluation execution belongs to Evaluation Architecture.

Q5 does not execute evaluations.

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

Regeneration triggers:

- Q1 changes
- Q2 changes
- Q3 changes
- Q4 changes

Q5 publishes immutable content only.

Dependency Index owns dependency registration.

Invalidation Engine owns staleness determination and propagation.

Q5 does not make invalidation decisions.

---

# Replayability Metadata

```typescript
type Q5ReplayabilityMetadata = {
  q1_version: number;

  q2_version: number;

  q3_version: number;

  q4_version: number;

  company_knowledge_version: number;

  prompt_lineage: string;

  prompt_version: string;

  model_version: string;

  section_input_hash: string;

  section_output_hash: string;

  evaluation_metadata: Record<string, unknown>;
};
```

Q5 may own:

- `prompt_lineage`
- `prompt_version`
- `model_version`
- `section_input_hash`
- `section_output_hash`
- `evaluation_metadata`

These are content-level replayability metadata.

They are not Artifact Framework lineage.

---

# Artifact Framework Metadata

Artifact Framework owns:

- artifact identity
- artifact metadata
- framework lineage
- artifact versioning
- persistence
- current pointers
- archive/history
- framework hashes

These are not part of Q5 content-level replayability metadata.

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
- replayability
- auditability

---

# Architectural Invariants

LOCKED.

1. Q5 is the final synthesis layer.
2. Q5 consumes Q1–Q4, not raw artifacts.
3. Q5 consumes Q4 output and propagates Q4 limitations.
4. Q5 produces structured change conditions.
5. Every condition requires signal linkage.
6. Q5 must remain auditable.
7. Q5 must remain explainable.
8. Q5 must not provide recommendations.
9. Trust limits thesis strength.
10. Ownership Thesis and Change Conditions are primary artifacts, not prose.
11. Q5 may not fabricate valuation conclusions when Q4 status is insufficient_data.

End of Specification.
