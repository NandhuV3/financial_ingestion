# 046-investor-intelligence-q3-prompt-contract.md

Version: 1.0
Status: LOCKED
Owner: Investor Intelligence Layer

Inherits:
040-prompt-governance-spec.md

Produces:
Q3 Answer

Depends On:

- Quarter Understanding
- Prior Investor Intelligence (optional)

---

# Purpose

This contract governs the Q3 Prompt.

Q3 answers:

> Can the story be trusted?

Q3 is the Trust Understanding prompt.

Its responsibility is to synthesize:

- trust understanding from Quarter Understanding
- trust-depth limitations
- longitudinal context when Prior Investor Intelligence is available

using observable evidence.

---

# Architectural Position

```text
Trust Pillars
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
  quarter_understanding:
    QuarterUnderstandingArtifact;
};
```

Optional:

```typescript
type Q3PromptEnrichmentInput = {
  prior_investor_intelligence?:
    InvestorIntelligenceArtifact;
};
```

---

# Allowed Inputs

Prompt may consume:

```text
Quarter Understanding

Prior Investor Intelligence, when available
```

Quarter Understanding is the sole trust interpretation source.

Q3 synthesizes investor-facing trust understanding.

Q3 does not reinterpret raw trust evidence.

Prior Investor Intelligence may be used only for:

- historical context
- longitudinal comparison
- trust-assessment evolution tracking
- confidence trend tracking
- prior Q3 comparison

Prior Investor Intelligence is not a trust interpretation, trust assessment,
trust evidence, trust verdict, or trust synthesis source.

Prior Investor Intelligence must not influence trust interpretation
independently.

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

Trust Signals

Commitment Tracking

Narrative Consistency

Accounting Stability

Capital Allocation Tracking

Trust Pillar artifacts

Raw trust evidence
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
Quarter Understanding indicates incomplete trust coverage.
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

# Trust Interpretation Rules

Quarter Understanding is the sole trust interpretation source.

Q3 synthesizes investor-facing trust understanding.

Q3 does not reinterpret raw trust evidence.

Q3 may not consume Trust Signals, Commitment Tracking, Narrative Consistency,
Accounting Stability, Capital Allocation Tracking, Trust Pillar artifacts, or
raw trust evidence directly.

---

# Grounding Rules

Every trust claim must trace to:

```text
Quarter Understanding trust interpretation
```

Prior Investor Intelligence may contextualize comparison over time but may not
independently ground or alter a trust claim.

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
  trust_interpretation_coverage: number;

  historical_depth: number;

  trust_interpretation_strength: number;

  evidence_density: number;

  overall: number;
};
```

All Q3 confidence inputs derive from Quarter Understanding trust interpretation,
with historical context from Prior Investor Intelligence when available.

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
  understanding_refs:
    string[];
};
```

Evidence references may only reference Quarter Understanding trust
interpretation.

Direct Trust Signals, Commitment Tracking, and Trust Pillar references are
forbidden.

---

# Evaluation Hooks

Supports:

```text
Trust Calibration

Trust Coverage Limitation Handling

Historical Context Usage
```

---

# Evaluation Metrics

## Trust Calibration

Measures:

```text
Appropriate trust assessment or limitation.
```

---

## Historical Depth Usage

Measures:

```text
Use of Prior Investor Intelligence for longitudinal comparison only.
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

Uses unsupported trust claims

Consumes Trust Signals directly

Consumes Commitment Tracking directly

Consumes Trust Pillar artifacts directly

Reinterprets raw trust evidence

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

# Replayability Ownership

Q3 owns only content-level replayability metadata.

Artifact Framework owns:

- identity
- metadata
- lineage
- versioning
- persistence
- current pointers
- archive/history
- framework hashes

Q3 content-level replayability metadata is not Artifact Framework lineage.

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
3. Quarter Understanding is mandatory.
4. Prior Investor Intelligence is optional.
5. Quarter Understanding is the sole trust interpretation source.
6. Q3 may not consume Trust Signals or Trust Pillar artifacts directly.
7. Trust assessments must be evidence-based.
8. Confidence is builder-generated.
9. Q3 does not assess valuation.
10. Q3 must not reinterpret raw trust evidence.

End of Specification.
