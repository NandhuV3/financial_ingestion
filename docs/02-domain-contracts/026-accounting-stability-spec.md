# 026-commitment-tracking-spec.md

Version: 1.0
Status: LOCKED
Owner: Trust Architecture Layer

---

# Purpose

Commitment Tracking answers:

```text
Did management do what they said they would do?
```

This is the first pillar of the Trust Architecture.

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

Track management commitments across time.

Detect:

- commitments made
- commitments maintained
- commitments achieved
- commitments delayed
- commitments abandoned
- commitments modified

---

# What Commitment Tracking Owns

Owns:

- commitment extraction
- commitment lifecycle
- commitment status
- commitment resolution
- commitment confidence

---

# What Commitment Tracking Does NOT Own

Does NOT own:

- trust verdicts
- business quality assessment
- investor recommendations
- management credibility conclusions

Those belong to Q3.

---

# Architectural Principle

Commitment Tracking is:

```text
Descriptive
```

not

```text
Judgmental
```

---

# Example

Allowed:

```text
Management stated AI capacity
would be operational by Q4.

Q4 filing indicates deployment
did not occur.

Status: delayed
```

Not Allowed:

```text
Management cannot be trusted.
```

That belongs to Q3.

---

# Artifact Schema

```typescript
type CommitmentTrackingArtifact = {
  artifact_type: "commitment_tracking";

  company: string;

  period: string;

  commitments: Commitment[];

  summary: CommitmentSummary;

  confidence: CommitmentTrackingConfidence;

  metadata: ArtifactMetadata;

  lineage: ArtifactLineage;
};
```

---

# Commitment Schema

```typescript
type Commitment = {
  commitment_id: string;

  commitment_type: CommitmentType;

  statement: string;

  commitment_period: string;

  expected_resolution_period: string | null;

  actual_resolution_period: string | null;

  status: CommitmentStatus;

  evidence: CommitmentEvidence[];

  confidence: number;
};
```

---

# Commitment Types

```typescript
type CommitmentType =
  | "product_launch"
  | "capacity_expansion"
  | "cost_reduction"
  | "margin_improvement"
  | "revenue_growth"
  | "customer_growth"
  | "strategic_initiative"
  | "acquisition_integration"
  | "capital_allocation"
  | "other";
```

---

# Commitment Status

```typescript
type CommitmentStatus =
  | "new"
  | "active"
  | "achieved"
  | "delayed"
  | "modified"
  | "abandoned"
  | "expired";
```

---

# Status Definitions

---

## New

```text
First appearance of commitment.
```

---

## Active

```text
Still being pursued.
```

---

## Achieved

```text
Management delivered.
```

---

## Delayed

```text
Management still pursuing
but missed expected timeline.
```

---

## Modified

```text
Commitment materially changed.
```

---

## Abandoned

```text
Management stopped pursuing.
```

---

## Expired

```text
No longer relevant.
```

---

# Commitment Evidence

```typescript
type CommitmentEvidence = {
  evidence_id: string;

  filing_period: string;

  source_type:
    | "10K"
    | "10Q"
    | "earnings_call"
    | "investor_day";

  evidence_text: string;

  evidence_role:
    | "creation"
    | "confirmation"
    | "modification"
    | "resolution";

  confidence: number;
};
```

---

# Commitment Lifecycle

```text
NEW
 ↓
ACTIVE
 ↓
ACHIEVED

OR

ACTIVE
 ↓
DELAYED

OR

ACTIVE
 ↓
MODIFIED

OR

ACTIVE
 ↓
ABANDONED
```

---

# Lifecycle Rules

Every commitment must have:

```typescript
status
```

at all times.

No commitment can exist without lifecycle state.

---

# Stable Commitment Identity

Critical.

---

# Commitment ID

```typescript
commitment_id
```

must remain stable.

---

# Example

Q1:

```text
Expand AI datacenter capacity
```

Q2:

```text
Continue AI datacenter expansion
```

Q3:

```text
Capacity rollout delayed
```

All reference:

```text
COMMITMENT-001
```

not three separate commitments.

---

# Resolution Logic

Deterministic layer.

No trust judgment.

---

# Resolution Categories

```typescript
type ResolutionResult =
  | "fulfilled"
  | "partially_fulfilled"
  | "not_fulfilled"
  | "unable_to_determine";
```

---

# Example

Commitment:

```text
Launch product by Q3
```

Outcome:

```text
Launched in Q3
```

Result:

```text
fulfilled
```

---

# Example

Commitment:

```text
Expand margins by 300bps
```

Outcome:

```text
Expanded by 100bps
```

Result:

```text
partially_fulfilled
```

---

# Commitment Summary

```typescript
type CommitmentSummary = {
  total_commitments: number;

  active_commitments: number;

  achieved_commitments: number;

  delayed_commitments: number;

  modified_commitments: number;

  abandoned_commitments: number;

  fulfillment_rate: number;
};
```

---

# Fulfillment Rate

```typescript
fulfillment_rate =
achieved_commitments
/
resolved_commitments
```

---

# Purpose

Provides signal input.

Not trust verdict.

---

# Confidence Model

```typescript
type CommitmentTrackingConfidence = {
  overall: number;

  extraction_confidence: number;

  linkage_confidence: number;

  resolution_confidence: number;

  history_depth_score: number;
};
```

---

# Extraction Confidence

Measures:

```text
How certain are we that
a commitment was identified?
```

---

# Linkage Confidence

Measures:

```text
How certain are we that
multiple statements refer
to same commitment?
```

---

# Resolution Confidence

Measures:

```text
How certain are we about
commitment outcome?
```

---

# History Depth Score

Measures:

```text
How much historical evidence
supports the assessment?
```

---

# Longitudinal Design

Commitment Tracking is inherently multi-period.

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

# Historical Tracking

Each commitment stores:

```typescript
timeline: CommitmentTimelineEvent[];
```

---

# Timeline Event

```typescript
type CommitmentTimelineEvent = {
  period: string;

  status: CommitmentStatus;

  evidence_ref: string;

  confidence: number;
};
```

---

# Trust Signal Integration

Commitment Tracking does NOT emit trust verdicts.

It emits structured observations.

---

# Example Outputs

```text
Commitment Achieved
```

```text
Commitment Delayed
```

```text
Commitment Abandoned
```

```text
Repeated Commitment Failure
```

---

# Consumer

Trust Signals layer.

---

# Example

Commitment Tracking:

```text
3 commitments abandoned
```

Trust Signals:

```text
COMMITMENT_ABANDONED_MULTI_PERIOD
```

Quarter Understanding:

```text
Management execution concerns emerging.
```

Q3:

```text
Trust weakening.
```

---

# Evaluation Metrics

---

## Extraction Accuracy

Measures:

```text
Correct Commitments Extracted
```

---

## Linkage Accuracy

Measures:

```text
Correctly Matched Commitments
Across Periods
```

---

## Resolution Accuracy

Measures:

```text
Correct Outcome Classification
```

---

## Lifecycle Completeness

Measures:

```text
Commitments With Full Lifecycle
```

---

## Historical Consistency

Measures:

```text
Stable Tracking Across Time
```

---

# Invalidation Rules

Regenerate when:

```text
New Filing Arrives
```

or

```text
Prior Filing Amended
```

---

# Downstream Invalidation

When Commitment Tracking changes:

Mark stale:

```text
Trust Signals

Quarter Understanding

Investor Intelligence (Q3)

Partner Domain
```

---

# Governance Rules

No manual editing.

Corrections occur through:

```text
Source Artifact Regeneration
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

Every commitment state retained.

Never overwritten.

---

# Example

Q1:

```text
active
```

Q2:

```text
active
```

Q3:

```text
delayed
```

Q4:

```text
achieved
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
Multi-year histories

Commitment timelines

Auditability

Trust signal generation
```

at scale.

---

# Architectural Invariants

LOCKED.

1. Commitment Tracking is descriptive, not judgmental.
2. Commitment IDs are stable across periods.
3. Every commitment has lifecycle state.
4. Every status change is preserved.
5. Trust verdicts are not generated here.
6. Historical timelines are mandatory.
7. Trust Signals consume this artifact.
8. Q3 consumes trust signals, not raw commitments.
9. Fulfillment rate is informational, not a trust score.
10. Every commitment remains traceable to source evidence.

End of Specification.