# 027-narrative-consistency-spec.md

Version: 1.0
Status: LOCKED
Owner: Trust Architecture Layer

---

# Purpose

Narrative Consistency answers:

```text
Is management telling the same story over time?
```

This is the second pillar of the Trust Architecture.

---

# Trust Architecture Position

```text
Commitment Tracking
Narrative Consistency
Accounting Stability
        ↓
Trust Signals
        ↓
Quarter Understanding
        ↓
Q3 Trust Assessment
```

---

# Core Responsibility

Track how management describes:

- strategy
- priorities
- growth drivers
- competitive positioning
- risks
- business direction

across multiple periods.

---

# What Narrative Consistency Owns

Owns:

- strategic priorities
- management narratives
- business framing
- language shifts
- priority persistence
- priority abandonment

---

# What Narrative Consistency Does NOT Own

Does NOT own:

- trust verdicts
- management credibility scores
- risk assessments
- business quality judgments

Those belong downstream.

---

# Architectural Principle

Narrative Consistency is:

```text
Observed Narrative Change
```

not

```text
Trust Interpretation
```

---

# Example

Allowed:

```text
AI became primary strategic priority
during FY2026.

Cloud expansion priority disappeared
without explanation.
```

Not Allowed:

```text
Management is becoming unreliable.
```

That belongs to Q3.

---

# Artifact Schema

```typescript
type NarrativeConsistencyArtifact = {
  artifact_type: "narrative_consistency";

  company: string;

  period: string;

  strategic_priorities: StrategicPriority[];

  narrative_themes: NarrativeTheme[];

  language_shifts: LanguageShift[];

  summary: NarrativeSummary;

  confidence: NarrativeConfidence;

  metadata: ArtifactMetadata;

  lineage: ArtifactLineage;
};
```

---

# Strategic Priority Schema

```typescript
type StrategicPriority = {
  priority_id: string;

  concept_ref: string;

  description: string;

  first_seen_period: string;

  last_seen_period: string;

  consecutive_periods: number;

  current_status: PriorityStatus;

  confidence: number;
};
```

---

# Priority Status

```typescript
type PriorityStatus =
  | "new"
  | "active"
  | "persistent"
  | "declining"
  | "dropped"
  | "reintroduced";
```

---

# Status Definitions

---

## New

```text
First observed.
```

---

## Active

```text
Appears regularly.
```

---

## Persistent

```text
Observed across multiple periods.
```

---

## Declining

```text
Mention frequency decreasing.
```

---

## Dropped

```text
No longer discussed.
```

---

## Reintroduced

```text
Previously dropped,
now discussed again.
```

---

# Narrative Theme Schema

```typescript
type NarrativeTheme = {
  theme_id: string;

  concept_ref: string;

  narrative_category: NarrativeCategory;

  first_seen_period: string;

  current_period_mentions: number;

  historical_average_mentions: number;

  trend: NarrativeTrend;

  confidence: number;
};
```

---

# Narrative Categories

```typescript
type NarrativeCategory =
  | "growth"
  | "competition"
  | "efficiency"
  | "innovation"
  | "capital_allocation"
  | "customer"
  | "risk"
  | "strategy";
```

---

# Narrative Trend

```typescript
type NarrativeTrend =
  | "increasing"
  | "stable"
  | "decreasing"
  | "volatile";
```

---

# Language Shift Schema

```typescript
type LanguageShift = {
  shift_id: string;

  concept_ref: string;

  prior_framing: string;

  current_framing: string;

  shift_magnitude: ShiftMagnitude;

  shift_reason_detected: boolean;

  supporting_evidence: string[];

  confidence: number;
};
```

---

# Shift Magnitude

```typescript
type ShiftMagnitude =
  | "minor"
  | "moderate"
  | "significant";
```

---

# Example

FY2025:

```text
Cloud remains our primary growth engine.
```

FY2026:

```text
AI is now our primary growth engine.
```

Result:

```text
Shift Magnitude:
moderate/significant
```

depending on context.

---

# Narrative Summary

```typescript
type NarrativeSummary = {
  active_priorities: number;

  new_priorities: number;

  dropped_priorities: number;

  significant_language_shifts: number;

  stable_priority_ratio: number;
};
```

---

# Stable Priority Ratio

```typescript
stable_priority_ratio =
persistent_priorities
/
total_priorities
```

Purpose:

```text
Measures narrative stability.
```

Not trust.

---

# Priority Lifecycle

```text
NEW
 ↓
ACTIVE
 ↓
PERSISTENT

OR

ACTIVE
 ↓
DECLINING
 ↓
DROPPED

OR

DROPPED
 ↓
REINTRODUCED
```

---

# Stable Priority Identity

Critical.

Priority IDs must remain stable.

---

# Example

FY2024:

```text
Expand Cloud Infrastructure
```

FY2025:

```text
Continue Cloud Expansion
```

FY2026:

```text
Cloud remains growth engine
```

All map to:

```text
PRIORITY-001
```

not three priorities.

---

# Language Shift Detection

Narrative Consistency tracks:

```text
What changed?
```

not

```text
Whether the change is good or bad.
```

---

# Examples

---

## Acceptable Shift

```text
AI becomes major focus
after major AI acquisition.
```

---

## Potential Concern

```text
Cloud disappears from strategy
without explanation.
```

Narrative Consistency records:

```text
priority dropped
```

Nothing more.

---

# Relationship With Concept Registry

All priorities must map to:

```typescript
concept_ref
```

from Concept Registry.

---

# Example

```text
AI Expansion
```

maps to:

```text
ai_growth_acceleration
```

---

# Longitudinal Design

Narrative Consistency is inherently historical.

---

# Minimum History

Required:

```text
2 periods
```

Preferred:

```text
4+ periods
```

---

# Historical Storage

```typescript
type PriorityTimeline = {
  priority_id: string;

  periods: {
    period: string;
    status: PriorityStatus;
    mention_count: number;
  }[];
};
```

---

# Priority Persistence

Calculated using:

```text
Consecutive Periods
```

and

```text
Mention Stability
```

---

# Example

Appears:

```text
Q1
Q2
Q3
Q4
```

Result:

```text
Persistent
```

---

# Example

Appears:

```text
Q1
Q2

missing

Q3
Q4
```

Result:

```text
Reintroduced
```

---

# Confidence Model

```typescript
type NarrativeConfidence = {
  overall: number;

  extraction_confidence: number;

  linkage_confidence: number;

  shift_detection_confidence: number;

  history_depth_score: number;
};
```

---

# Extraction Confidence

Measures:

```text
How accurately narrative themes
were identified.
```

---

# Linkage Confidence

Measures:

```text
How accurately priorities
were tracked across periods.
```

---

# Shift Detection Confidence

Measures:

```text
How confidently narrative shifts
were detected.
```

---

# History Depth Score

Measures:

```text
How much historical context exists.
```

---

# Trust Signal Integration

Narrative Consistency never emits trust verdicts.

It emits observations.

---

# Example Outputs

```text
Priority Dropped
```

```text
Priority Reintroduced
```

```text
Significant Language Shift
```

```text
Stable Multi-Year Priority
```

---

# Consumer

Trust Signals layer.

---

# Example

Narrative Consistency:

```text
AI Priority Dropped
```

Trust Signals:

```text
STRATEGIC_PRIORITY_DROPPED
```

Quarter Understanding:

```text
Management narrative changed
materially this quarter.
```

Q3:

```text
Trust concerns emerging.
```

---

# Evaluation Metrics

---

## Priority Extraction Accuracy

Measures:

```text
Correct Priority Identification
```

---

## Priority Linkage Accuracy

Measures:

```text
Correct Tracking Across Periods
```

---

## Shift Detection Accuracy

Measures:

```text
Correct Narrative Change Detection
```

---

## Priority Persistence Accuracy

Measures:

```text
Correct Lifecycle Classification
```

---

## Historical Consistency

Measures:

```text
Stable Longitudinal Tracking
```

---

# Invalidation Rules

Regenerate when:

```text
New Filing Arrives
```

or

```text
Historical Filing Changes
```

or

```text
Concept Registry Changes
```

(if referenced concepts affected)

---

# Downstream Invalidation

When Narrative Consistency changes:

Mark stale:

```text
Trust Signals

Quarter Understanding

Investor Intelligence (Q3)

Partner Domain
```

---

# Governance Rules

No manual edits.

Corrections occur through:

```text
Regeneration
```

or

```text
Governed Annotation Layer
```

---

# Archive Strategy

```text
current.json

archive/
```

Required.

---

# Historical Preservation

All narrative states preserved.

Never overwritten.

---

# Example Timeline

FY2024:

```text
Cloud Primary
```

FY2025:

```text
Cloud + AI
```

FY2026:

```text
AI Primary
```

All preserved.

---

# Metadata

```typescript
type ArtifactMetadata = {
  schema_version: string;

  generated_at: string;

  artifact_version: number;
};
```

---

# Lineage

```typescript
type ArtifactLineage = {
  source_filings: string[];

  source_periods: string[];

  concept_registry_version: number;

  prompt_version: string;

  model_version: string;

  input_hash: string;
};
```

---

# Scaling Requirements

Target:

```text
10,000+ companies
```

---

# Operational Requirements

Support:

```text
Multi-year narratives

Priority persistence

Language shift detection

Trust signal generation
```

at scale.

---

# Architectural Invariants

LOCKED.

1. Narrative Consistency is descriptive, not judgmental.
2. Priority IDs remain stable across periods.
3. Every priority has lifecycle state.
4. Narrative shifts are observations, not trust verdicts.
5. All priorities map to Concept Registry concepts.
6. Historical timelines are mandatory.
7. Trust Signals consume this artifact.
8. Q3 consumes trust signals, not raw narrative changes.
9. Stable priority ratio is informational, not a trust score.
10. Every narrative observation remains traceable to source filings.

End of Specification.