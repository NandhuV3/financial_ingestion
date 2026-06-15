# 021-quarter-change-spec.md

Version: 1.0
Status: LOCKED
Owner: Longitudinal Intelligence Layer

---

# Purpose

Quarter Change answers:

```text
What changed this quarter compared to the previous quarter?
```

It is the platform's official:

```text
Period-over-Period Change Engine
```

Quarter Change is deterministic.

No LLM is allowed.

---

# Architectural Position

```text
Themes
    ↓
Topic Assignment
    ↓
Quarter Change
    ↓
Business Signals
    ↓
Quarter Understanding
```

Quarter Change is one of the primary inputs into Business Signals.

---

# Core Responsibility

Identify:

- new topics
- removed topics
- strengthened topics
- weakened topics
- stable topics

between two periods.

---

# Quarter Change Does NOT Do

Quarter Change never:

- interpret meaning
- determine importance
- create business conclusions
- create investor insights
- generate trust assessments
- generate recommendations

Those belong downstream.

---

# Design Principles

---

## Principle 1

Quarter Change is deterministic.

No LLM.

LOCKED.

---

## Principle 2

Quarter Change compares periods.

Not long-term history.

---

## Principle 3

Quarter Change measures delta.

Not significance.

---

## Principle 4

Quarter Change operates on Topic Assignments.

Never Themes.

---

## Principle 5

Every change must be explainable.

No black-box scoring.

---

# Inputs

```typescript
type QuarterChangeInputs = {
  current_period: TopicAssignmentArtifact;

  previous_period: TopicAssignmentArtifact;
};
```

---

# Minimum Requirements

Requires:

```text
Current Period

+
Previous Period
```

Both must exist.

---

# Output

```typescript
type QuarterChangeArtifact = {
  artifact_type: "quarter_change";

  company: string;

  current_period: string;

  previous_period: string;

  topic_changes: TopicChange[];

  summary: QuarterChangeSummary;

  confidence: QuarterChangeConfidence;

  metadata: ArtifactMetadata;

  lineage: ArtifactLineage;
};
```

---

# Topic Change Schema

```typescript
type TopicChange = {
  topic_id: string;

  change_type: ChangeType;

  direction: ChangeDirection;

  magnitude: ChangeMagnitude;

  current_frequency: number;

  previous_frequency: number;

  delta: number;

  evidence: ChangeEvidence;
};
```

---

# Change Types

```typescript
type ChangeType =
  | "new"
  | "removed"
  | "strengthened"
  | "weakened"
  | "stable";
```

---

# Change Definitions

---

## New

Topic exists now.

Did not exist before.

```text
Previous = 0

Current > 0
```

---

## Removed

Topic existed before.

Does not exist now.

```text
Previous > 0

Current = 0
```

---

## Strengthened

Topic frequency increased.

```text
Current > Previous
```

---

## Weakened

Topic frequency decreased.

```text
Current < Previous
```

---

## Stable

Minimal change.

```text
Current ≈ Previous
```

Within configured threshold.

---

# Direction

```typescript
type ChangeDirection =
  | "up"
  | "down"
  | "flat";
```

---

# Magnitude

```typescript
type ChangeMagnitude =
  | "minor"
  | "moderate"
  | "major";
```

---

# Magnitude Rules

LOCKED

---

## Minor

```text
Delta < 20%
```

---

## Moderate

```text
20% ≤ Delta < 50%
```

---

## Major

```text
Delta ≥ 50%
```

---

# Example

Previous:

```text
AI Strategy = 4
```

Current:

```text
AI Strategy = 8
```

Result:

```text
Change Type:
Strengthened

Direction:
Up

Magnitude:
Major
```

---

# Change Evidence

```typescript
type ChangeEvidence = {
  topic_assignment_refs: string[];

  current_frequency: number;

  previous_frequency: number;

  delta_percentage: number;
};
```

---

# Summary Schema

```typescript
type QuarterChangeSummary = {
  new_topics: number;

  removed_topics: number;

  strengthened_topics: number;

  weakened_topics: number;

  stable_topics: number;
};
```

---

# Example Summary

```json
{
  "new_topics": 2,
  "removed_topics": 1,
  "strengthened_topics": 5,
  "weakened_topics": 3,
  "stable_topics": 12
}
```

---

# Confidence

```typescript
type QuarterChangeConfidence = {
  overall: number;

  topic_coverage_score: number;

  period_completeness_score: number;
};
```

---

# Confidence Meaning

High confidence:

```text
Complete Topic Assignments

+
Strong topic coverage
```

---

Low confidence:

```text
Sparse assignments

or

Missing topics
```

---

# Missing Prior Period

If previous period unavailable:

```typescript
status: "insufficient_history"
```

Quarter Change cannot run.

---

# Relationship to Topic Evolution

Critical distinction.

---

## Quarter Change

Answers:

```text
What changed this quarter?
```

Uses:

```text
Current

vs

Previous
```

Only.

---

## Topic Evolution

Answers:

```text
How is the topic evolving?
```

Uses:

```text
Multiple Periods
```

History.

---

# Example

Topic:

```text
AI Strategy
```

Quarter Change:

```text
Stable
```

Topic Evolution:

```text
Accelerating
```

Both can be true.

---

# Output Consumption

Primary consumer:

```text
Business Signals
```

Quarter Change provides:

```text
Raw Topic Deltas
```

Business Signals decides:

```text
Whether those deltas matter.
```

---

# Example

Quarter Change:

```text
AI Strategy

Strengthened
```

Business Signals:

```text
AI_INVESTMENT_ACCELERATING
```

Quarter Change never creates signal types.

---

# Invalidation Rules

Quarter Change becomes stale when:

- current Topic Assignment changes
- previous Topic Assignment changes
- Topic Registry changes
- change rules version changes

---

# Regeneration Rules

Regenerate when:

```text
Current Period

or

Previous Period
```

changes.

---

# Evaluation Metrics

---

## Delta Accuracy

Measures:

```text
Correct frequency delta
```

---

## Classification Accuracy

Measures:

```text
Correct assignment of:

new
removed
strengthened
weakened
stable
```

---

## Coverage Accuracy

Measures:

```text
Topics Evaluated
/
Topics Available
```

---

## Consistency

Same inputs must always produce:

```text
Same Output
```

100%.

---

# Governance

Quarter Change has:

```text
No Human Review
```

Deterministic layer.

---

# Metadata

```typescript
type ArtifactMetadata = {
  schema_version: string;

  change_rules_version: string;

  generated_at: string;

  artifact_version: number;
};
```

---

# Lineage

```typescript
type ArtifactLineage = {
  current_topic_assignment_version: number;

  previous_topic_assignment_version: number;

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
< 2 seconds
```

per company-period.

---

# Architectural Invariants

The following are LOCKED:

1. Quarter Change is deterministic.
2. Quarter Change uses no LLM.
3. Quarter Change compares only two periods.
4. Quarter Change measures delta, not meaning.
5. Quarter Change operates on Topic Assignments only.
6. Quarter Change never creates Business Signals.
7. Quarter Change never performs interpretation.
8. Topic Evolution and Quarter Change remain separate layers.
9. Every change must be traceable to Topic Assignments.
10. Same inputs always produce identical outputs.

End of Specification.