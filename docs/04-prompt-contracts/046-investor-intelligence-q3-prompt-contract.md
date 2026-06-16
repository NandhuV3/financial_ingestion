# 046-investor-intelligence-q3-prompt-contract.md

Version: 1.0
Status: LOCKED
Owner: Investor Intelligence Layer

Inherits:
040-prompt-governance-spec.md

Produces:
Q3 Answer

Depends On:

- Commitment Tracking
- Narrative Consistency
- Accounting Stability
- Trust Signals
- Quarter Understanding

---

# Purpose

This contract governs the Q3 Prompt.

Q3 answers:

> Can the story be trusted?

Q3 is the Trust Understanding prompt.

Its responsibility is to assess:

- management credibility
- commitment reliability
- narrative consistency
- accounting stability
- trustworthiness of the business story

using observable evidence.

---

# Architectural Position

```text
Commitment Tracking
          ↓

Narrative Consistency
          ↓

Accounting Stability
          ↓

Trust Signals
          ↓

Quarter Understanding
          ↓

Q3 Prompt
          ↓

Q3 Answer
          ↓

Q5 Ownership Thesis
```

---

# Core Question

Q3 answers:

```text
Can investors reasonably trust
management's story
based on observable behavior?
```

---

# Architectural Principle

Trust means:

```text
Management Credibility
vs
Observable Reality
```

Trust does NOT mean:

```text
Business Risk

Stock Risk

Competitive Risk

Industry Risk
```

---

# Ownership

Q3 owns:

- trust assessment
- commitment assessment
- credibility assessment
- narrative consistency assessment
- accounting stability assessment

Q3 does NOT own:

- growth assessment
- valuation assessment
- ownership thesis
- investment recommendation

---

# Core Responsibility

Transform:

```text
Commitment Tracking

+

Narrative Consistency

+

Accounting Stability

+

Trust Signals

+

Quarter Understanding
```

into:

```text
Trust Understanding
```

---

# Input Contract

Required:

```typescript
type Q3PromptInput = {
  commitment_tracking:
    CommitmentTrackingArtifact;

  narrative_consistency:
    NarrativeConsistencyArtifact;

  accounting_stability:
    AccountingStabilityArtifact;

  trust_signals:
    TrustSignalArtifact[];

  quarter_understanding:
    QuarterUnderstandingArtifact;
};
```

---

# Allowed Inputs

Prompt may consume:

```text
Commitment Tracking

Narrative Consistency

Accounting Stability

Trust Signals

Quarter Understanding
```

---

# Forbidden Inputs

Prompt must NOT consume:

```text
Q1

Q2

Q4

Q5

Market Data

Valuation Data

Analyst Reports

Stock Performance

Partner Domain
```

---

# Reason

Prevent:

```text
Valuation Contamination

Performance Bias

Outcome Leakage
```

---

# Output Contract

```typescript
type Q3Answer = {
  trust_verdict:
    TrustVerdict;

  trust_summary: string;

  supporting_observations:
    TrustObservation[];

  strengths:
    TrustStrength[];

  concerns:
    TrustConcern[];

  depth_indicator:
    DepthIndicator;

  confidence: null;

  evidence_package:
    Q3EvidencePackage;
};
```

---

# Trust Verdict

Allowed Values:

```typescript
type TrustVerdict =
  | "high_trust"
  | "moderate_trust"
  | "trust_concerns"
  | "insufficient_history";
```

---

# Verdict Meaning

---

## High Trust

Evidence suggests:

```text
Commitments generally fulfilled

Narratives consistent

Accounting stable
```

---

## Moderate Trust

Evidence suggests:

```text
Mixed record

Minor concerns

No major credibility issues
```

---

## Trust Concerns

Evidence suggests:

```text
Repeated commitment failures

Narrative instability

Accounting concerns
```

---

## Insufficient History

Used when:

```text
Historical depth is inadequate.
```

---

# Trust Summary

Purpose:

Provide concise explanation of:

```text
Why the verdict
was reached.
```

---

# Observation Schema

```typescript
type TrustObservation = {
  title: string;

  description: string;

  evidence_refs: string[];
};
```

---

# Observation Rules

Must be:

```text
Evidence-Based

Observable

Specific
```

---

# Trust Strength Schema

```typescript
type TrustStrength = {
  title: string;

  explanation: string;

  evidence_refs: string[];
};
```

---

# Trust Concern Schema

```typescript
type TrustConcern = {
  title: string;

  explanation: string;

  severity:
    | "low"
    | "medium"
    | "high";

  evidence_refs: string[];
};
```

---

# Depth Indicator

```typescript
type DepthIndicator =
  | "longitudinal"
  | "limited_history";
```

---

# Depth Rules

Longitudinal:

```text
4+ periods available
```

Limited History:

```text
Less than 4 periods
```

---

# Trust Assessment Rules

Trust must be based on:

```text
Observed Behavior
```

not:

```text
Business Outcomes
```

---

# Example

Allowed:

```text
Management committed
to margin improvement
and subsequently delivered it.
```

Forbidden:

```text
Revenue increased,
therefore management is trustworthy.
```

---

# Commitment Tracking Usage

Required.

---

# Purpose

Evaluate:

```text
Promises

Guidance

Strategic Commitments
```

against:

```text
Subsequent Outcomes
```

---

# Failure Condition

Ignoring Commitment Tracking:

```text
Prompt Failure
```

---

# Narrative Consistency Usage

Required.

---

# Purpose

Evaluate:

```text
Consistency of Management Story
```

across periods.

---

# Example

Concern:

```text
Management repeatedly changes
its explanation
for declining margins.
```

---

# Accounting Stability Usage

Required.

---

# Purpose

Evaluate:

```text
Financial Reporting Stability
```

---

# Examples

Signals:

```text
Restatements

Aggressive Adjustments

Accounting Volatility
```

---

# Trust Signal Usage

Required.

---

# Purpose

Provide:

```text
Deterministic Trust Evidence
```

for interpretation.

---

# Example Signals

```text
COMMITMENT_OVERDUE

COMMITMENT_ABANDONED

LANGUAGE_SHIFT_SIGNIFICANT

RESTATEMENT_ISSUED

NON_GAAP_GAP_WIDENING
```

---

# Signal Ignoring Rule

Material trust signal ignored:

```text
Prompt Failure
```

---

# Grounding Rules

Every trust claim must trace to:

```text
Trust Signals

Commitment Tracking

Narrative Consistency

Accounting Stability
```

---

# Hallucination Prevention

Prompt must not invent:

```text
Commitments

Accounting Issues

Narrative Changes

Trust Events
```

not present in inputs.

---

# Confidence Rules

Prompt does NOT generate confidence.

---

# Builder Computes

```typescript
type Q3Confidence = {
  commitment_coverage: number;

  historical_depth: number;

  signal_strength: number;

  evidence_density: number;

  overall: number;
};
```

---

# Forbidden Output Fields

Prompt must NOT generate:

```text
Confidence

Valuation View

Ownership Thesis

Recommendations
```

---

# Growth Boundary

Forbidden:

```text
Revenue Forecast

Growth Outlook
```

Those belong to:

```text
Q2
```

---

# Valuation Boundary

Forbidden:

```text
Cheap

Expensive

Undervalued

Overvalued
```

Those belong to:

```text
Q4
```

---

# Ownership Boundary

Forbidden:

```text
Investors Should Own

Investors Should Sell
```

Those belong to:

```text
Q5
```

---

# Trust vs Risk Rule

Critical.

Q3 evaluates:

```text
Trust
```

NOT:

```text
Risk
```

---

# Example

Allowed:

```text
Management consistently
meets stated objectives.
```

Forbidden:

```text
The semiconductor market
is risky.
```

---

# Evidence Package

Required.

---

# Schema

```typescript
type Q3EvidencePackage = {
  commitment_refs:
    string[];

  narrative_refs:
    string[];

  accounting_refs:
    string[];

  trust_signal_refs:
    string[];

  understanding_refs:
    string[];
};
```

---

# Evaluation Hooks

Supports:

```text
Trust Calibration

Commitment Accuracy

Narrative Consistency Quality

Accounting Stability Quality
```

---

# Evaluation Metrics

## Commitment Accuracy

Measures:

```text
Correct interpretation
of commitments.
```

---

## Trust Calibration

Measures:

```text
Appropriate trust verdict.
```

---

## Historical Depth Usage

Measures:

```text
Use of available history.
```

---

## Signal Coverage

Measures:

```text
Use of trust signals.
```

---

## Outcome Validation

Measures:

```text
Whether trust assessments
align with later outcomes.
```

---

# Prompt Failure Conditions

Prompt fails if it:

Assesses business risk

Assesses valuation

Creates ownership thesis

Ignores trust signals

Ignores commitment tracking

Uses unsupported trust claims

Generates recommendation language

---

# Recommendation Boundary

Forbidden:

```text
Buy

Sell

Hold

Outperform

Underperform

Expected Return

Price Target
```

---

# Lineage Requirements

Artifact records:

```typescript
type Q3PromptLineage = {
  prompt_id: string;

  prompt_version: string;

  model_version: string;
};
```

---

# Replayability Requirements

Production execution:

```text
Temperature = 0
```

required.

---

# Scaling Requirements

Target:

```text
10,000+ companies
```

Must support:

- multi-period trust assessment
- deterministic trust reasoning
- replayability
- auditability
- outcome calibration

---

# Architectural Invariants

LOCKED.

1. Trust = management credibility vs observable reality.
2. Trust is not risk.
3. Commitment Tracking is mandatory.
4. Narrative Consistency is mandatory.
5. Accounting Stability is mandatory.
6. Trust Signals are mandatory.
7. Trust verdicts must be evidence-based.
8. Confidence is builder-generated.
9. Q3 does not assess valuation.
10. Q3 is the sole owner of trust verdicts within Investor Intelligence.

End of Specification.