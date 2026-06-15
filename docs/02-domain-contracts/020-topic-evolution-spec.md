# 020-topic-evolution-spec.md

# Topic Evolution Specification

Version: 1.0
Status: LOCKED
Owner: Longitudinal Intelligence Layer

---

# Purpose

Topic Evolution answers:

```text
How is a topic changing over time?
```

It is the first longitudinal artifact in the platform.

Themes and Topic Assignment are filing-scoped.

Topic Evolution is company-scoped and multi-period.

---

# Architectural Position

```text
Themes
    ↓
Topic Assignment
    ↓
Topic Evolution
    ↓
Business Signals
    ↓
Quarter Understanding
```

Topic Evolution is the source of truth for:

```text
Topic Trend Analysis
```

across time.

---

# Core Responsibility

Track:

- topic persistence
- topic emergence
- topic decline
- topic acceleration
- topic deceleration
- topic volatility

across filing periods.

---

# Topic Evolution Does NOT Do

Topic Evolution never:

- interpret business meaning
- generate investor conclusions
- create signals
- assess importance
- assess trust
- assess management quality

Those belong downstream.

---

# Example

Periods:

```text
Q1
AI Strategy
frequency: 2

Q2
AI Strategy
frequency: 5

Q3
AI Strategy
frequency: 9
```

Topic Evolution Output:

```text
AI Strategy

trajectory:
accelerating

trend_strength:
high
```

NOT:

```text
AI will drive future growth
```

That is interpretation.

---

# Design Principles

---

## Principle 1

Topic Evolution is deterministic.

No LLM.

LOCKED.

---

## Principle 2

Topic Evolution operates only on assigned topics.

Never themes.

---

## Principle 3

Topic Evolution measures change.

Not meaning.

---

## Principle 4

Topic Evolution is company-specific.

Cross-company comparisons belong elsewhere.

---

## Principle 5

Every trend must be explainable.

No black-box scoring.

---

# Inputs

```typescript
type TopicEvolutionInputs = {
  topic_assignments: TopicAssignmentArtifact[];
};
```

Requires historical periods.

---

# Minimum History Requirement

LOCKED

```text
2 periods
```

minimum.

---

# Recommended History

LOCKED

```text
8 periods
```

target.

---

# Outputs

```typescript
type TopicEvolutionArtifact = {
  artifact_type: "topic_evolution";

  company: string;

  period: string;

  topic_evolutions: TopicEvolution[];

  confidence: TopicEvolutionConfidence;

  metadata: ArtifactMetadata;

  lineage: ArtifactLineage;
};
```

---

# Topic Evolution Schema

```typescript
type TopicEvolution = {
  topic_id: string;

  first_seen_period: string;

  last_seen_period: string;

  periods_present: number;

  current_state: TopicState;

  trajectory: TopicTrajectory;

  trend_strength: TrendStrength;

  volatility_score: number;

  evidence: TopicEvolutionEvidence;
};
```

---

# Topic States

```typescript
type TopicState =
  | "new"
  | "active"
  | "persistent"
  | "declining"
  | "dormant"
  | "retired";
```

---

# State Definitions

---

## New

Appears first time.

---

## Active

Present but history limited.

---

## Persistent

Present consistently.

---

## Declining

Presence decreasing.

---

## Dormant

Absent recently but historically important.

---

## Retired

Absent for extended period.

---

# Topic Trajectory

```typescript
type TopicTrajectory =
  | "accelerating"
  | "growing"
  | "stable"
  | "slowing"
  | "declining"
  | "volatile";
```

---

# Trend Strength

```typescript
type TrendStrength =
  | "low"
  | "medium"
  | "high";
```

---

# Evidence Schema

```typescript
type TopicEvolutionEvidence = {
  periods_analyzed: string[];

  topic_occurrences: {
    period: string;
    frequency: number;
  }[];

  supporting_assignments: string[];
};
```

---

# Evolution Calculation

Based on:

```text
Frequency

Persistence

Consistency
```

only.

---

# Frequency

Derived from:

```text
Number of Topic Assignments
```

per period.

---

# Persistence

Measures:

```text
How often topic appears
across periods.
```

---

# Consistency

Measures:

```text
Continuous appearance
without gaps.
```

---

# Volatility Score

Measures instability.

```typescript
0.0 → stable

1.0 → highly volatile
```

---

# Example

```text
Q1 Present

Q2 Missing

Q3 Present

Q4 Missing
```

Produces:

```text
High Volatility
```

---

# Trend Detection

---

## Accelerating

Frequency increasing.

Multiple consecutive periods.

---

## Growing

Frequency increasing moderately.

---

## Stable

Minimal change.

---

## Slowing

Frequency growth decreasing.

---

## Declining

Frequency decreasing.

---

## Volatile

No clear direction.

---

# Emergence Detection

Topic becomes:

```text
New
```

when:

```text
First observed
```

for company.

---

# Persistence Detection

Topic becomes:

```text
Persistent
```

after:

```text
4 consecutive periods
```

LOCKED.

---

# Dormancy Detection

Topic becomes:

```text
Dormant
```

after:

```text
2 consecutive absences
```

LOCKED.

---

# Retirement Detection

Topic becomes:

```text
Retired
```

after:

```text
4 consecutive absences
```

LOCKED.

---

# Confidence

```typescript
type TopicEvolutionConfidence = {
  overall: number;

  history_depth_score: number;

  consistency_score: number;

  coverage_score: number;
};
```

---

# Confidence Meaning

High confidence:

```text
Long history
+
Stable observations
```

---

Low confidence:

```text
Short history
+
Sparse observations
```

---

# Outputs Used By

Primary consumers:

```text
Business Signals

Investor Intelligence

Quarter Understanding
```

---

# Relationship to Quarter Change

Important distinction:

---

## Topic Evolution

Measures:

```text
Long-term trajectory
```

---

## Quarter Change

Measures:

```text
Current-period delta
```

---

# Example

Topic:

```text
AI Strategy
```

May be:

```text
Evolution:
Persistent Growth

Quarter Change:
Flat This Quarter
```

Both can be true.

---

# Invalidation Rules

Topic Evolution becomes stale when:

- Topic Assignment changes
- Topic Registry changes
- Evolution rules change

---

# Regeneration Rules

Regenerate:

```text
Current Period

+
Affected Future Periods
```

for company.

---

# Evaluation Metrics

---

## Topic Continuity Accuracy

Measures:

```text
Correct persistence tracking
```

---

## Trend Accuracy

Measures:

```text
Correct trajectory assignment
```

against ground truth.

---

## Volatility Accuracy

Measures:

```text
Observed instability
vs
calculated instability
```

---

## Coverage

Measures:

```text
Topics Evaluated
/
Topics Available
```

---

# Governance

Topic Evolution has:

```text
No Human Review
```

Deterministic layer.

---

# Metadata

```typescript
type ArtifactMetadata = {
  schema_version: string;

  evolution_rules_version: string;

  generated_at: string;

  artifact_version: number;
};
```

---

# Lineage

```typescript
type ArtifactLineage = {
  topic_assignment_versions: number[];

  topic_registry_version: number;

  input_hash: string;
};
```

---

# Archive Strategy

Store:

```text
current.json

archive/
```

for every company-period.

---

# Scaling Requirements

Target:

```text
10,000+ companies
```

---

# Performance Target

```text
< 5 seconds
```

per company-period.

---

# Architectural Invariants

The following are LOCKED:

1. Topic Evolution is deterministic.
2. Topic Evolution uses no LLM.
3. Topic Evolution operates on topics, not themes.
4. Topic Evolution measures change, not meaning.
5. Topic Evolution is company-scoped.
6. Topic Evolution is longitudinal.
7. Quarter Change and Topic Evolution are separate responsibilities.
8. Persistence requires 4 consecutive periods.
9. Dormancy requires 2 consecutive absences.
10. Retirement requires 4 consecutive absences.

End of Specification.