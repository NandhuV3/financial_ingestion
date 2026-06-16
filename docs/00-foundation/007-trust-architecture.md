# 007-trust-architecture.md

# Purpose

Trust Architecture exists to answer one question:

"Can management's version of reality be trusted?"

Trust is not risk.

Trust is not business quality.

Trust is not competitive position.

Trust is a measurement of alignment between:

What management says

and

What observable reality shows.

This distinction is fundamental and must remain enforced throughout the platform.

---

# Core Principle

Trust measures:

Management Narrative

versus

Observed Reality

over time.

A company can have:

- High Risk + High Trust
- Low Risk + Low Trust

These are independent dimensions.

Trust must never be merged with risk.

LOCKED.

---

# Architectural Position

```text
Trust Pillars
        ↓
Trust Signals
        ↓
Quarter Understanding
        ↓
Investor Intelligence
        ↓
Partner Domain
```

Trust flows through dedicated trust artifacts.

It is not generated from general business signals.

LOCKED.

---

# Trust Dimensions

Trust is evaluated through five dimensions.

---

## Narrative Consistency

Question:

Does management describe the business consistently across periods?

Examples:

- Strategic priorities remain stable
- Competitive positioning remains coherent
- Business narrative evolves logically

Trust increases when consistency exists.

Trust decreases when narratives shift without explanation.

---

## Commitment Follow-Through

Question:

Did management do what it said it would do?

Examples:

- Market expansion commitments
- Product launch commitments
- Capital allocation commitments

Trust increases when commitments are fulfilled.

Trust decreases when commitments disappear.

---

## Explanation Quality

Question:

When performance changes, are explanations specific?

Examples:

Good:

"Our largest customer delayed renewal by six months."

Bad:

"Macroeconomic uncertainty affected performance."

Trust increases with specificity.

Trust decreases with generic explanations.

---

## Accounting Stability

Question:

Is financial reporting stable and transparent?

Examples:

- Segment definitions
- Revenue recognition
- Non-GAAP adjustments
- Restatements

Trust increases with consistency.

Trust decreases with instability.

---

## Capital Allocation Consistency

Question:

Does management deploy capital according to stated priorities?

Examples:

- Buybacks
- Dividends
- Acquisitions
- Organic Investment

Trust increases when actions match words.

Trust decreases when actions diverge.

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

# Trust Artifacts

Four dedicated trust pillar artifacts exist.

---

# 1. Commitment Tracking Artifact

Purpose:

Track promises and outcomes.

---

## Ownership

Owns:

- Forward-looking commitments
- Commitment status
- Resolution tracking

---

## Schema

```typescript
type CommitmentTrackingArtifact = {
  company_id: string;

  commitments: {
    commitment_id: string;

    commitment_text: string;

    commitment_type:
      | "expansion"
      | "product"
      | "financial_target"
      | "capital_allocation"
      | "operational";

    target_period: string | null;

    status:
      | "open"
      | "fulfilled"
      | "revised"
      | "abandoned"
      | "overdue";

    periods_open: number;

    resolution?: {
      period: string;
      evidence: string;
    };
  }[];
}
```

---

# 2. Narrative Consistency Artifact

Purpose:

Track narrative stability across time.

---

## Ownership

Owns:

- Strategic priorities
- Narrative shifts
- Framing changes

---

## Schema

```typescript
type NarrativeConsistencyArtifact = {
  company_id: string;

  strategic_priorities: {
    priority_id: string;

    concept_ref: string;

    first_appeared: string;

    last_appeared: string;

    consecutive_periods: number;

    dropped_without_explanation: boolean;
  }[];

  language_shifts: {
    topic_ref: string;

    prior_framing: string;

    current_framing: string;

    shift_magnitude:
      | "minor"
      | "moderate"
      | "significant";
  }[];
}
```

---

# 3. Accounting Stability Artifact

Purpose:

Track reporting consistency.

---

## Ownership

Owns:

- Policy Changes
- Segment Changes
- Restatements
- Non-GAAP Evolution

---

## Schema

```typescript
type AccountingStabilityArtifact = {
  company_id: string;

  policy_changes: {
    change_type:
      | "revenue_recognition"
      | "segment_definition"
      | "non_gaap_exclusion"
      | "restatement";

    period: string;

    proactively_disclosed: boolean;

    comparability_impact:
      | "none"
      | "minor"
      | "material";
  }[];

  non_gaap_gap_trend: {
    period: string;

    gap_percentage: number;

    exclusion_items: string[];
  }[];
}
```

---

# 4. Capital Allocation Tracking Artifact

Purpose:

Track stated capital priorities versus observed capital deployment.

---

## Ownership

Owns:

- Stated capital priorities
- Observed capital deployment
- Capital allocation gaps
- Priority-versus-deployment evidence

Does not own:

- Commitment lifecycle
- Trust conclusions
- Recommendations
- Valuation
- Interpretation

---

## Schema

```typescript
type CapitalAllocationTrackingArtifact = {
  company_id: string;

  period_id: string;

  stated_priorities: {
    priority_id: string;

    priority_text: string;

    priority_type:
      | "buybacks"
      | "dividends"
      | "acquisitions"
      | "organic_investment"
      | "debt_reduction"
      | "capital_expenditure"
      | "other";

    evidence_refs: string[];
  }[];

  observed_deployments: {
    deployment_id: string;

    deployment_type:
      | "buybacks"
      | "dividends"
      | "acquisitions"
      | "organic_investment"
      | "debt_reduction"
      | "capital_expenditure"
      | "other";

    amount: number | null;

    evidence_refs: string[];
  }[];

  gaps: {
    gap_id: string;

    priority_id: string;

    deployment_refs: string[];

    gap_type:
      | "aligned"
      | "under_supported"
      | "unsupported_deployment"
      | "insufficient_evidence";

    evidence_refs: string[];
  }[];
}
```

LOCKED.

---

# Trust Signals

Trust Signals derive trust observations from Trust Pillar Artifacts.

No LLM involvement.

---

## Trust Signal Types

```text
COMMITMENT_OVERDUE

COMMITMENT_FULFILLED

COMMITMENT_ABANDONED

STRATEGIC_PRIORITY_DROPPED

SEGMENT_REDEFINED

ACCOUNTING_POLICY_CHANGED

NON_GAAP_GAP_WIDENING

RESTATEMENT_ISSUED

LANGUAGE_SHIFT_SIGNIFICANT

CAPITAL_ALLOCATION_DIVERGENCE

EXPLANATION_QUALITY_GENERIC
```

---

# Trust Signal Rules

Every trust signal must be:

- Atomic
- Typed
- Deterministic
- Replayable
- Auditable

Trust signals are observations.

Not conclusions.

LOCKED.

---

# Trust Boundary

Trust Signals produce observations.

Quarter Understanding produces interpretation.

Investor Intelligence produces investor-facing synthesis.

Trust Signals must not emit:

- Trust conclusions
- Management credibility conclusions
- Recommendations
- Valuation opinions
- Investor conclusions

LOCKED.

---

# Quarter Understanding Responsibility

Quarter Understanding receives trust signals.

Quarter Understanding interprets:

- Signal clustering
- Signal severity
- Narrative coherence
- Pattern evolution

Quarter Understanding owns:

Trust Interpretation

It does not own:

Trust Signal Detection

LOCKED.

---

# Investor Intelligence Responsibility

Investor Intelligence owns:

Q3

"Can the story be trusted?"

Q3 synthesizes:

- Commitment Tracking
- Narrative Consistency
- Accounting Stability
- Trust Interpretation

into a trust verdict.

---

# Q3 Trust Structure

```typescript
type Q3TrustAnswer = {
  verdict:
    | "high_trust"
    | "moderate_trust"
    | "trust_concerns"
    | "low_trust";

  consistency_assessment: {
    commitment_follow_through:
      | "strong"
      | "mixed"
      | "weak"
      | "insufficient_history";

    narrative_stability:
      | "stable"
      | "minor_shifts"
      | "significant_shifts";

    periods_assessed: number;
  };

  structural_concerns: {
    accounting_concerns: boolean;

    non_gaap_concerns: boolean;

    restatement_history: boolean;
  };

  current_period_assessment: string;

  depth_indicator:
    | "longitudinal"
    | "current_period_only";

  confidence: StructuredConfidence;
}
```

---

# History Requirements

Trust requires history.

Minimum history levels:

```text
1-2 Periods
Current Period Only

3-4 Periods
Limited Longitudinal

5+ Periods
Longitudinal Trust Assessment
```

---

# Confidence Model

Trust confidence derives from:

- Source evidence quality
- Rule evaluation confidence
- Evidence completeness
- Artifact coverage

Available pillar evidence may include:

- Commitment Tracking
- Narrative Consistency
- Accounting Stability
- Capital Allocation Tracking

All pillars are not required.

Confidence must decrease when:

- History is short
- Signals conflict
- Evidence is missing
- Pillar coverage is limited

High confidence without evidence is forbidden.

LOCKED.

---

# Governance Rules

## Rule 1

Trust is not risk.

LOCKED.

---

## Rule 2

Trust signals must measure narrative versus reality.

LOCKED.

---

## Rule 3

Trust signals are deterministic.

LOCKED.

---

## Rule 4

Trust verdicts originate in Quarter Understanding and Investor Intelligence.

LOCKED.

---

## Rule 5

Trust requires longitudinal evidence.

LOCKED.

---

# Storage Structure

trust/
├── commitment-tracking/
├── narrative-consistency/
├── accounting-stability/
├── capital-allocation-tracking/
├── signals/
├── interpretations/
└── evaluations/

---

# Final Principle

Risk asks:

"What could happen to the business?"

Trust asks:

"Should management's explanation of reality be believed?"

These are different questions.

The platform must never merge them.

LOCKED.
