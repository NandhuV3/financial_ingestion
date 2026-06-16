# 029-trust-signals-spec.md

Version: 1.0
Status: LOCKED
Owner: Trust Architecture Layer

---

# Purpose

Trust Signals convert Trust Evidence into deterministic observations.

Trust Signals answer:

```text
What observable trust-related
events occurred?
```

They do NOT answer:

```text
Can management be trusted?
```

That belongs to Quarter Understanding and Q3.

---

# Architecture Position

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
Q3 Trust Assessment
```

---

# Core Responsibility

Transform trust artifacts into:

```text
Atomic

Typed

Deterministic

Auditable
```

signals.

---

# Architectural Principle

Trust Signals are:

```text
Observations
```

not

```text
Interpretations
```

---

# Example

Allowed:

```text
COMMITMENT_OVERDUE
```

Not Allowed:

```text
Management appears unreliable.
```

That belongs downstream.

---

# Ownership

Trust Signals owns:

- trust signal generation
- trust signal classification
- trust signal lifecycle
- trust signal evidence linking
- trust dimension assignment
- severity classification
- direction derivation
- confidence calculation
- enrichment status
- depth indicators

Trust Signals does NOT own:

- trust verdicts
- confidence in management
- credibility assessment
- investor interpretation
- evidence collection
- recommendations
- valuation

---

# Artifact Enrichment Pattern

Trust Signals follows:

```text
018-artifact-enrichment-pattern.md
```

Supported trust pillar artifacts:

```text
Commitment Tracking
Narrative Consistency
Accounting Stability
Capital Allocation Tracking
```

At least one supported trust pillar artifact is required to generate a valid Trust Signals artifact.

Missing pillars:

- reduce dimension coverage
- do not fail generation when at least one pillar exists
- must appear in enrichment_status
- must affect depth_indicator

Depth rules:

```text
1 pillar available
→ base
```

```text
2-3 pillars available
→ standard
```

```text
4 pillars available
→ full
```

LOCKED.

---

# Dimension Ownership

Every Trust Dimension must have exactly one owning Trust Pillar Artifact.

| Dimension | Owning Pillar |
| --- | --- |
| commitment_follow_through | Commitment Tracking |
| narrative_consistency | Narrative Consistency |
| explanation_quality | Narrative Consistency |
| accounting_stability | Accounting Stability |
| capital_allocation_consistency | Capital Allocation Tracking |

Trust Signals may emit observations only for dimensions whose owning pillar artifact exists.

Trust Signals must never fabricate a dimension from adjacent pillar evidence.

LOCKED.

---

# Artifact Schema

```typescript
type TrustSignalsArtifact = {
  artifact_type: "trust_signals";

  company: string;

  period: string;

  trust_signals: TrustSignal[];

  summary: TrustSignalSummary;

  confidence: TrustSignalConfidence;

  enrichment_status: EnrichmentStatus;

  depth_indicator: DepthIndicator;

  metadata: ArtifactMetadata;

  lineage: ArtifactLineage;
};
```

---

# Trust Signal Schema

```typescript
type TrustSignal = {
  signal_id: string;

  signal_type: TrustSignalType;

  dimension: TrustDimension;

  severity: SignalSeverity;

  direction: SignalDirection;

  evidence_refs: string[];

  source_artifact:
    | "commitment_tracking"
    | "narrative_consistency"
    | "accounting_stability"
    | "capital_allocation_tracking";

  confidence: number;
};
```

```typescript
type TrustDimension =
  | "commitment_follow_through"
  | "narrative_consistency"
  | "explanation_quality"
  | "accounting_stability"
  | "capital_allocation_consistency";
```

---

# Signal Severity

```typescript
type SignalSeverity =
  | "low"
  | "medium"
  | "high";
```

---

# Signal Direction

```typescript
type SignalDirection =
  | "positive"
  | "negative"
  | "neutral";
```

---

# Trust Signal Types

## Commitment Signals

```typescript
COMMITMENT_CREATED

COMMITMENT_FULFILLED

COMMITMENT_DELAYED

COMMITMENT_OVERDUE

COMMITMENT_MODIFIED

COMMITMENT_ABANDONED

COMMITMENT_ABANDONED_MULTI_PERIOD
```

---

## Narrative Signals

```typescript
STRATEGIC_PRIORITY_CREATED

STRATEGIC_PRIORITY_DROPPED

STRATEGIC_PRIORITY_REINTRODUCED

LANGUAGE_SHIFT_MINOR

LANGUAGE_SHIFT_MODERATE

LANGUAGE_SHIFT_SIGNIFICANT

NARRATIVE_STABILITY_HIGH

NARRATIVE_STABILITY_LOW
```

---

## Accounting Signals

```typescript
ACCOUNTING_POLICY_CHANGED

SEGMENT_REDEFINED

SEGMENT_RESTRUCTURED

RESTATEMENT_ISSUED

NON_GAAP_GAP_WIDENING

NON_GAAP_GAP_NARROWING

REPORTING_STABILITY_DECREASED
```

---

## Capital Allocation Signals

```typescript
CAPITAL_ALLOCATION_ALIGNED

CAPITAL_ALLOCATION_UNDER_SUPPORTED

CAPITAL_ALLOCATION_UNSUPPORTED_DEPLOYMENT

CAPITAL_ALLOCATION_EVIDENCE_INSUFFICIENT
```

These originate from Capital Allocation Tracking.

---

## Governance Signals

```typescript
CFO_DEPARTURE

CEO_DEPARTURE

MANAGEMENT_TURNOVER_CLUSTER
```

These originate from Business Signals governance feeds.

---

# Signal Generation Rules

Trust Signals are deterministic.

No LLM allowed.

---

# Example Rule

```typescript
IF
commitment.status == "abandoned"

THEN
emit COMMITMENT_ABANDONED
```

---

# Example Rule

```typescript
IF
language_shift.magnitude == "significant"

THEN
emit LANGUAGE_SHIFT_SIGNIFICANT
```

---

# Example Rule

```typescript
IF
restatement.materiality == "high"

THEN
emit RESTATEMENT_ISSUED
severity = HIGH
```

---

# Deterministic Rule Engine

```typescript
type TrustSignalRule = {
  rule_id: string;

  signal_type: TrustSignalType;

  source_artifact: string;

  conditions: RuleCondition[];

  severity_logic: SeverityLogic;
};
```

---

# Rule Governance

All rules:

```text
Versioned

Auditable

Deterministic
```

---

# Rule Changes

Rule changes require:

```text
Evaluation

Approval

Version Increment
```

before activation.

---

# Signal Identity

Signal IDs must be stable.

---

# Example

```text
COMMITMENT_OVERDUE
```

generated in Q2.

If still overdue in Q3:

```text
new signal instance
same signal type
```

not same signal ID.

---

# Signal Lifecycle

```text
CREATED
 ↓
ACTIVE
 ↓
RESOLVED

OR

ACTIVE
 ↓
ESCALATED
```

---

# Lifecycle Schema

```typescript
type SignalLifecycle = {
  status:
    | "active"
    | "resolved"
    | "escalated";

  first_seen_period: string;

  last_seen_period: string;
};
```

---

# Escalation Example

Q1:

```text
COMMITMENT_DELAYED
```

Q2:

```text
COMMITMENT_OVERDUE
```

Q3:

```text
COMMITMENT_ABANDONED
```

Escalation chain preserved.

---

# Trust Signal Summary

```typescript
type TrustSignalSummary = {
  total_signals: number;

  positive_signals: number;

  negative_signals: number;

  neutral_signals: number;

  high_severity_signals: number;
};
```

---

# Important Rule

Summary counts are:

```text
Operational Metrics
```

not

```text
Trust Score
```

---

# No Trust Score

Trust Signals never calculate:

```text
Management Score

Trust Score

Credibility Rating
```

Those belong downstream.

---

# Enrichment Status

```typescript
type EnrichmentInputStatus = {
  available: boolean;

  artifact_path: string | null;

  artifact_version: number | null;

  absent_reason: string | null;
};
```

```typescript
type EnrichmentStatus = {
  commitment_tracking: EnrichmentInputStatus;

  narrative_consistency: EnrichmentInputStatus;

  accounting_stability: EnrichmentInputStatus;

  capital_allocation_tracking: EnrichmentInputStatus;
};
```

LOCKED.

---

# Depth Indicator

```typescript
type DepthIndicator = {
  overall: "base" | "standard" | "full";

  commitment_dimension:
    | "present"
    | "absent";

  narrative_dimension:
    | "present"
    | "absent";

  explanation_dimension:
    | "present"
    | "absent";

  accounting_dimension:
    | "present"
    | "absent";

  capital_allocation_dimension:
    | "present"
    | "absent";
};
```

LOCKED.

---

# Evidence Linking

Every signal must link to evidence.

---

# Example

```typescript
COMMITMENT_ABANDONED
```

must contain:

```typescript
evidence_refs: [
  commitment_id,
  filing_ref,
  timeline_event_ref
]
```

---

# Traceability Requirement

Every signal must be traceable to:

```text
Source Artifact

Source Record

Source Filing
```

---

# Confidence Model

```typescript
type TrustSignalConfidence = {
  overall: number;

  source_data_confidence: number;

  rule_evaluation_confidence: number;

  evidence_completeness_score: number;
};
```

---

# Source Data Confidence

Inherited from:

```text
Commitment Tracking

Narrative Consistency

Accounting Stability
```

---

# Rule Evaluation Confidence

Measures:

```text
How confidently
rule conditions matched.
```

---

# Evidence Completeness

Measures:

```text
Presence of required evidence.
```

---

# Longitudinal Design

Trust Signals support history.

---

# Historical Storage

```typescript
type TrustSignalTimeline = {
  signal_type: TrustSignalType;

  periods: {
    period: string;

    severity: SignalSeverity;

    status: string;
  }[];
};
```

---

# Example

Q1:

```text
COMMITMENT_DELAYED
```

Q2:

```text
COMMITMENT_OVERDUE
```

Q3:

```text
COMMITMENT_ABANDONED
```

Timeline preserved.

---

# Signal Clustering

Trust Signals do not interpret clusters.

But clustering metadata may be stored.

---

# Example

Same quarter:

```text
COMMITMENT_ABANDONED

LANGUAGE_SHIFT_SIGNIFICANT

RESTATEMENT_ISSUED
```

Stored independently.

Interpretation happens later.

---

# Quarter Understanding Consumption

Quarter Understanding receives:

```typescript
trust_signals[]
```

as structured evidence.

---

# Quarter Understanding May Ask

```text
Are signals isolated?

Recurring?

Escalating?

Contextually justified?
```

Trust Signals never answer these.

---

# Q3 Consumption

Q3 consumes:

```text
Trust Interpretation
```

not raw Trust Signals.

---

# Evaluation Metrics

---

## Rule Accuracy

Measures:

```text
Correct Signal Generation
```

---

## False Positive Rate

Measures:

```text
Incorrect Signals Generated
```

---

## False Negative Rate

Measures:

```text
Missed Signals
```

---

## Evidence Completeness

Measures:

```text
Signal Traceability
```

---

## Historical Consistency

Measures:

```text
Stable Signal Lifecycle Tracking
```

---

# Invalidation Rules

Regenerate when:

```text
Commitment Tracking Changes

Narrative Consistency Changes

Accounting Stability Changes

Capital Allocation Tracking Changes
```

or

```text
Trust Signal Rules Change
```

---

# Downstream Invalidation

When Trust Signals change:

Mark stale:

```text
Quarter Understanding

Investor Intelligence (Q3)

Partner Domain
```

---

# Governance Rules

No LLM.

No manual signal creation.

No subjective interpretation.

---

# Allowed

```text
Rule-Based Signal Generation
```

---

# Not Allowed

```text
LLM-Based Trust Signal Generation
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

Every signal instance preserved.

Never overwritten.

---

# Example

Q1:

```text
LANGUAGE_SHIFT_MODERATE
```

Q2:

```text
LANGUAGE_SHIFT_SIGNIFICANT
```

Both remain.

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
  commitment_tracking_version: number | null;

  narrative_consistency_version: number | null;

  accounting_stability_version: number | null;

  capital_allocation_tracking_version: number | null;

  signal_rules_version: string;

  input_hash: string;
};
```

Unavailable pillar versions must be recorded as:

```text
null
```

and must match enrichment_status.

LOCKED.

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
Deterministic generation

Auditability

Historical tracking

Trust interpretation inputs
```

at scale.

---

# Architectural Invariants

LOCKED.

1. Trust Signals are deterministic.
2. No LLM is allowed in Trust Signal generation.
3. Every signal is traceable to evidence.
4. Signals are observations, not interpretations.
5. No trust score is calculated here.
6. Every signal has a governed rule.
7. Every signal remains historically visible.
8. Signal clustering is interpreted downstream.
9. Quarter Understanding consumes signals.
10. Q3 consumes trust interpretations, not raw signals.
11. Trust Signals follows the Artifact Enrichment Pattern.
12. Trust Signals may emit observations only for dimensions whose owning pillar artifact exists.

End of Specification.
