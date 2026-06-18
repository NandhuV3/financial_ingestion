# 028-accounting-stability-spec.md

Version: 1.0
Status: LOCKED
Owner: Trust Architecture Layer

---

# Purpose

Accounting Stability answers:

```text
Has management maintained
consistent financial reporting
over time?
```

This is the third pillar of the Trust Architecture.

---

# Trust Architecture Position

```text
Commitment Tracking
Narrative Consistency
Accounting Stability
Capital Allocation Tracking
        ↓
Trust Signals
        ↓
Quarter Understanding
        ↓
Investor Intelligence Q3
```

Accounting Stability is a Trust Pillar artifact.

Its canonical trust flow is:

```text
Accounting Stability
        ↓
Trust Signals
        ↓
Quarter Understanding
        ↓
Investor Intelligence Q3
```

Accounting Stability does not bypass Trust Signals.

Accounting Stability does not bypass Quarter Understanding.

LOCKED.

---

# Core Responsibility

Track changes in:

- accounting policies
- segment definitions
- reporting structure
- non-GAAP adjustments
- financial disclosures
- restatements

across time.

Accounting Stability executes deterministically.

It does not perform LLM reasoning or trust interpretation.

---

# What Accounting Stability Owns

Owns:

- accounting policy change detection
- accounting policy tracking
- segment redefinition detection
- non-GAAP exclusion tracking
- non-GAAP gap computation
- non-GAAP gap trend tracking
- restatement detection
- proactive disclosure evidence
- coverage status
- depth indicators
- accounting-level extraction, change-detection, and computation confidence

---

# What Accounting Stability Does NOT Own

Does NOT own:

- trust verdicts
- trust observations
- trust dimensions
- trust severity
- trust direction
- trust confidence
- trust interpretation
- investor synthesis
- recommendations
- valuation opinions
- LLM reasoning
- fraud detection
- management credibility conclusions
- investment risk assessment

Trust observations, dimensions, severity, direction, and trust confidence belong
to Trust Signals.

Trust interpretation belongs to Quarter Understanding.

Investor-facing trust synthesis and trust verdicts belong to Investor
Intelligence Q3.

---

# Architectural Principle

Accounting Stability is:

```text
Observed Reporting Behavior
```

not

```text
Management Judgment
```

---

# Example

Allowed:

```text
Revenue recognition policy changed.

Segment structure redefined.

Non-GAAP exclusions increased.
```

Not Allowed:

```text
Management is manipulating earnings.
```

That belongs nowhere unless supported by governance review.

---

# Artifact Content Schema

```typescript
type AccountingStabilityArtifactContent = {
  artifact_type: "accounting_stability";

  company: string;

  period: string;

  policy_changes: PolicyChange[];

  segment_changes: SegmentChange[];

  non_gaap_analysis: NonGAAPAnalysis;

  restatements: RestatementRecord[];

  summary: AccountingSummary;

  confidence: AccountingStabilityConfidence;
};
```

Artifact identity, metadata, Artifact Framework lineage, versioning, persistence,
current pointer, archive/history, and framework-owned hashes belong to:

```text
Artifact Framework
```

LOCKED.

---

# Policy Change Schema

```typescript
type PolicyChange = {
  policy_change_id: string;

  policy_type: PolicyType;

  prior_policy: string;

  current_policy: string;

  change_detected_period: string;

  proactively_disclosed: boolean;

  comparability_impact: ComparabilityImpact;

  confidence: number;
};
```

---

# Policy Types

```typescript
type PolicyType =
  | "revenue_recognition"
  | "expense_recognition"
  | "inventory"
  | "depreciation"
  | "goodwill"
  | "tax"
  | "segment_reporting"
  | "other";
```

---

# Comparability Impact

```typescript
type ComparabilityImpact =
  | "none"
  | "minor"
  | "moderate"
  | "material";
```

---

# Segment Change Schema

```typescript
type SegmentChange = {
  segment_change_id: string;

  prior_segments: string[];

  current_segments: string[];

  change_type: SegmentChangeType;

  disclosed_reason: string | null;

  comparability_impact: ComparabilityImpact;

  confidence: number;
};
```

---

# Segment Change Types

```typescript
type SegmentChangeType =
  | "added"
  | "removed"
  | "merged"
  | "split"
  | "renamed"
  | "restructured";
```

---

# Example

FY2025:

```text
Cloud
Productivity
Gaming
```

FY2026:

```text
Cloud & AI
Productivity
Gaming
```

Result:

```text
Segment Renamed
```

---

# Non-GAAP Analysis

```typescript
type NonGAAPAnalysis = {
  periods: NonGAAPPeriod[];

  trend_assessment: NonGAAPTrend;

  confidence: number;
};
```

---

# Non-GAAP Period

```typescript
type NonGAAPPeriod = {
  period: string;

  gaap_value: number;

  non_gaap_value: number;

  gap_percentage: number;

  exclusion_items: string[];
};
```

---

# Non-GAAP Trend

```typescript
type NonGAAPTrend = {
  direction:
    | "widening"
    | "stable"
    | "narrowing";

  consecutive_periods: number;

  materiality:
    | "low"
    | "medium"
    | "high";
};
```

---

# Example

GAAP EPS:

```text
2.00
```

Non-GAAP EPS:

```text
3.20
```

Gap:

```text
60%
```

Recorded.

No interpretation.

---

# Restatement Record

```typescript
type RestatementRecord = {
  restatement_id: string;

  period_announced: string;

  periods_affected: string[];

  scope: RestatementScope;

  description: string;

  materiality:
    | "low"
    | "medium"
    | "high";

  confidence: number;
};
```

---

# Restatement Scope

```typescript
type RestatementScope =
  | "financial_statement"
  | "segment_reporting"
  | "revenue"
  | "expense"
  | "tax"
  | "other";
```

---

# Example

```text
FY2024 revenue restated.
```

Stored as:

```text
Restatement Record
```

Nothing more.

---

# Accounting Summary

```typescript
type AccountingSummary = {
  policy_changes_detected: number;

  segment_changes_detected: number;

  restatements_detected: number;

  non_gaap_gap_direction:
    | "widening"
    | "stable"
    | "narrowing";

  reporting_stability_score: number;
};
```

---

# Reporting Stability Score

Purpose:

```text
Measure reporting consistency.
```

Not trust.

---

# Example Formula

```typescript
Base = 1.0

Policy Change = -0.10

Material Segment Change = -0.15

Restatement = -0.25

Score bounded:
0.0 → 1.0
```

---

# Architectural Rule

Score is informational only.

Never used directly as trust score.

---

# Longitudinal Design

Accounting Stability is historical.

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
type AccountingTimeline = {
  period: string;

  policy_changes: string[];

  segment_changes: string[];

  restatements: string[];

  reporting_stability_score: number;
};
```

---

# Policy Change Tracking

Policy changes remain permanently visible.

---

# Example

FY2024:

```text
Revenue Recognition A
```

FY2025:

```text
Revenue Recognition B
```

Stored forever.

---

# Segment Evolution Tracking

Every segment structure preserved.

---

# Example

FY2023:

```text
Cloud
```

FY2024:

```text
Cloud + AI
```

FY2025:

```text
Cloud + AI Platform
```

All versions preserved.

---

# Non-GAAP Monitoring

Track:

```text
Gap Magnitude

Gap Direction

Gap Persistence
```

Not:

```text
Intent
```

---

# Example Outputs

Allowed:

```text
Gap Widening
```

```text
Gap Stable
```

```text
Gap Narrowing
```

Not:

```text
Aggressive Earnings Management
```

That is interpretation.

---

# Confidence Model

```typescript
type AccountingStabilityConfidence = {
  overall: number;

  extraction_confidence: number;

  policy_detection_confidence: number;

  segment_detection_confidence: number;

  historical_depth_score: number;
};
```

---

# Extraction Confidence

Measures:

```text
Reporting changes correctly identified.
```

---

# Policy Detection Confidence

Measures:

```text
Accounting policy changes
correctly classified.
```

---

# Segment Detection Confidence

Measures:

```text
Segment changes correctly classified.
```

---

# Historical Depth Score

Measures:

```text
Amount of longitudinal evidence.
```

---

# Trust Signal Integration

Accounting Stability never emits trust verdicts.

It emits deterministic accounting evidence and pillar-specific observations.

It does not emit Trust Signals or deterministic trust observations.

---

# Example Outputs

```text
Policy Change Detected
```

```text
Segment Redefined
```

```text
Restatement Issued
```

```text
Non-GAAP Gap Widening
```

---

# Consumer

Trust Signals layer.

---

# Example

Accounting Stability:

```text
Material Restatement
```

Trust Signals:

```text
RESTATEMENT_ISSUED
```

Quarter Understanding:

```text
Reporting consistency weakened.
```

Q3:

```text
Trust concerns increased.
```

---

# Evaluation Metrics

---

## Policy Detection Accuracy

Measures:

```text
Correct Policy Change Detection
```

---

## Segment Change Accuracy

Measures:

```text
Correct Segment Classification
```

---

## Restatement Detection Accuracy

Measures:

```text
Correct Restatement Identification
```

---

## Non-GAAP Accuracy

Measures:

```text
Correct Gap Calculations
```

---

## Historical Consistency

Measures:

```text
Stable Longitudinal Tracking
```

---

# Invalidation Rules

Accounting Stability publishes a new immutable artifact version when:

```text
New Filing Arrives
```

or

```text
Historical Filing Updated
```

or

```text
Restatement Detected
```

---

# Downstream Invalidation

When Accounting Stability changes:

- Accounting Stability publishes a new artifact version.
- Dependency Index records dependency relationships.
- Invalidation Engine determines downstream staleness and propagation.

Accounting Stability does not mark Trust Signals, Quarter Understanding,
Investor Intelligence Q3, or any other downstream consumer stale directly.

Accounting Stability does not own invalidation decisions.

---

# Governance Rules

No manual editing.

Corrections occur through:

```text
Regeneration
```

or

```text
Governed Annotation Layer
```

---

# Storage Ownership

Artifact Framework owns storage mechanics, persistence, current pointer
resolution, archive/history, and framework hashes.

Accounting Stability does not own storage structure.

Accounting Stability does not define storage trees, archive layouts,
`current.json` layouts, persistence structures, or filesystem paths.

---

# Historical Preservation

All accounting observations retained.

Never overwritten.

---

# Example Timeline

FY2023:

```text
Stable Reporting
```

FY2024:

```text
Segment Change
```

FY2025:

```text
Restatement
```

All preserved.

---

# Replayability Metadata

```typescript
type AccountingStabilityReplayabilityMetadata = {
  schema_version: string;

  generated_at: string;

  source_references: string[];

  evidence_references: string[];

  accounting_change_references: string[];

  coverage_status: string;

  depth_indicators: string[];

  builder_version?: string;

  calibration_version?: string;

  rule_version?: string;
};
```

This is content-owned replayability metadata when emitted by Accounting
Stability. It is not Artifact Framework metadata, Artifact Framework lineage, or
artifact versioning.

Accounting Stability is deterministic and does not require prompt lineage or
model lineage.

Artifact Framework owns artifact identity, artifact metadata, framework
lineage, artifact versioning, persistence, current pointers, archive/history,
and framework hashes.

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
Multi-year reporting histories

Restatement tracking

Policy evolution

Trust signal generation
```

at scale.

---

# Architectural Invariants

LOCKED.

1. Accounting Stability is descriptive, not judgmental.
2. Every reporting change remains historically visible.
3. Every restatement remains permanently recorded.
4. Segment evolution is preserved across time.
5. Non-GAAP tracking measures gaps, not intent.
6. Reporting stability score is informational only.
7. Trust Signals consume this artifact.
8. Quarter Understanding consumes Trust Signals and produces trust interpretation.
9. Historical timelines are mandatory.
10. Every accounting observation remains traceable to source filings.
11. Investor Intelligence Q3 consumes Quarter Understanding trust interpretation.
12. Accounting Stability does not own invalidation decisions or storage mechanics.

End of Specification.
