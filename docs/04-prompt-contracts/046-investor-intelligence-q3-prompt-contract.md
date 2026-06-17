# 046-investor-intelligence-q3-prompt-contract.md

Version: 1.0
Status: LOCKED
Owner: Investor Intelligence Layer

Inherits:
040-prompt-governance-spec.md

Produces:
Q3 Answer

Depends On:

- Company Knowledge
- Quarter Understanding
- Trust Signals (conditional exception only)
- Commitment Tracking (longitudinal depth only)

---

# Purpose

This contract governs the Q3 Prompt.

Q3 answers:

> Can the story be trusted?

Q3 is the Trust Understanding prompt.

Its responsibility is to synthesize:

- trust understanding from Quarter Understanding
- trust-depth limitations
- longitudinal depth when Commitment Tracking is available
- conditional fallback trust evidence when Quarter Understanding trust depth is absent

using observable evidence.

---

# Architectural Position

```text
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

only as investor-facing synthesis from approved inputs.

Q3 does NOT own:

- growth assessment
- valuation assessment
- ownership thesis
- investment recommendation
- trust signal generation
- trust pillar artifact processing
- raw trust evidence reinterpretation

---

# Core Responsibility

Transform:

```text
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
  company_knowledge:
    CompanyKnowledgeArtifact;

  quarter_understanding:
    QuarterUnderstandingArtifact;

  commitment_tracking:
    CommitmentTrackingArtifact | null;

  trust_signals:
    TrustSignalArtifact[] | null;
};
```

---

# Allowed Inputs

Prompt may consume:

```text
Quarter Understanding

Company Knowledge

Commitment Tracking (longitudinal depth only)

Trust Signals (only when Quarter Understanding trust_dimension = absent)
```

Trust Signals must not be consumed directly when:

```text
quarter_understanding.depth_indicator.trust_dimension = "present"
```

Quarter Understanding remains the sole trust interpretation source in that mode.

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
  trust_assessment:
    TrustAssessment | null;

  trust_summary: string;

  trust_depth_limitation:
    string | null;

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

# Trust Assessment

Allowed Values:

```typescript
type TrustAssessment =
  | "supported_by_quarter_understanding"
  | "limited_by_missing_trust_dimension"
  | "limited_by_partial_trust_coverage";
```

---

# Assessment Meaning

---

## supported_by_quarter_understanding

Used when:

```text
Quarter Understanding contains trust interpretation.
```

---

## limited_by_missing_trust_dimension

Used when:

```text
Quarter Understanding trust_dimension is absent.
```

---

## limited_by_partial_trust_coverage

Used when:

```text
Quarter Understanding or Trust Signals indicate incomplete trust coverage.
```

---

# Trust Summary

Purpose:

Provide concise explanation of:

```text
What the trust assessment or limitation means.
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

Using Commitment Tracking for anything other than longitudinal depth:

```text
Prompt Failure
```

---

# Narrative Consistency Usage

Direct Narrative Consistency artifact consumption is forbidden in Sprint 11.

Narrative consistency may be reflected only through Quarter Understanding trust interpretation.

---

# Accounting Stability Usage

Direct Accounting Stability artifact consumption is forbidden in Sprint 11.

Accounting stability may be reflected only through Quarter Understanding trust interpretation.

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
Quarter Understanding

Trust Signals when quarter_understanding.depth_indicator.trust_dimension = "absent"

Commitment Tracking for longitudinal depth only
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

Commitment Depth Usage

Trust Coverage Limitation Handling
```

---

# Evaluation Metrics

## Commitment Depth Usage

Measures:

```text
Correct use of Commitment Tracking for longitudinal depth only.
```

---

## Trust Calibration

Measures:

```text
Appropriate trust assessment or limitation.
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
3. Company Knowledge is mandatory.
4. Quarter Understanding is mandatory.
5. Trust Signals are conditional fallback only.
6. Commitment Tracking is Q3 longitudinal depth enrichment only.
7. Trust assessments must be evidence-based.
8. Confidence is builder-generated.
9. Q3 does not assess valuation.
10. Q3 must not reinterpret raw trust evidence.

End of Specification.
