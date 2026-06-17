# 047-investor-intelligence-q4-prompt-contract.md

Version: 1.0
Status: LOCKED
Owner: Investor Intelligence Layer

Inherits:
040-prompt-governance-spec.md

Produces:
Q4 Answer

Depends On:

- Company Knowledge
- Quarter Understanding
- Investor Intelligence Q1
- Investor Intelligence Q2
- Investor Intelligence Q3
- Market Data (Deferred)
- Valuation Inputs (Future Layer)

---

# Purpose

This contract governs the Q4 Prompt.

Q4 answers:

> Is the story already too expensive?

Q4 is the Valuation Understanding prompt.

Its responsibility is to explain:

- insufficient-data status in Sprint 11
- market-data limitation when valuation inputs are unavailable
- future valuation context only after Market Data and Valuation Architecture exist

without providing investment recommendations.

---

# Architectural Position

```text
Q1 Business Understanding
            ↓

Q2 Growth Understanding
            ↓

Q3 Trust Understanding
            ↓

Valuation Inputs
            ↓

Q4 Prompt
            ↓

Q4 Answer
            ↓

Q5 Ownership Thesis
```

---

# Core Question

Q4 answers:

```text
Does the current valuation
appear supported by
the business story?
```

---

# Architectural Principle

Q4 evaluates:

```text
Valuation Context
```

Q4 does NOT evaluate:

```text
Investment Attractiveness
```

---

# Ownership

Q4 owns:

- expectation framing
- market-data limitation reporting
- valuation-depth limitation reporting

Q4 does NOT own:

- business understanding
- growth understanding
- trust understanding
- ownership thesis
- investment recommendation

---

# Core Responsibility

Transform:

```text
Business Understanding

+

Growth Understanding

+

Trust Understanding
```

into:

```text
Price Question Output
```

---

# Optional Layer

Q4 is optional.

The platform must continue operating when:

```text
Valuation Inputs
```

are unavailable.

---

# Input Contract

Required When Available:

```typescript
type Q4PromptInput = {
  q1: Q1Answer;

  q2: Q2Answer;

  q3: Q3Answer;

  valuation_inputs:
    ValuationInputArtifact | null;
};
```

Sprint 11 behavior:

```text
Q4.status = "insufficient_data"

Q4.absent_reason = "market_data_unavailable"
```

Market data integration is deferred.

Valuation methodology is future work and is not implemented in Sprint 11.

---

# Allowed Inputs

Prompt may consume:

```text
Q1

Q2

Q3

Market Data (deferred in Sprint 11)

Valuation Inputs (future)
```

---

# Forbidden Inputs

Prompt must NOT consume:

```text
Q5

Partner Domain

Analyst Recommendations

Broker Reports

Target Prices

Portfolio Positions
```

---

# Reason

Prevent:

```text
Recommendation Leakage

External Opinion Contamination
```

---

# Output Contract

```typescript
type Q4Answer = {
  status:
    Q4Status;

  valuation_summary: string;

  valuation_supports:
    ValuationSupport[];

  valuation_concerns:
    ValuationConcern[];

  confidence: null;

  evidence_package:
    Q4EvidencePackage;
};
```

---

# Q4 Status

```typescript
type Q4Status =
  | "answered"
  | "insufficient_data";
```

---

# Insufficient Data Handling

Allowed.

---

# Rule

If:

```text
Valuation Inputs Missing
```

then:

```typescript
status =
  "insufficient_data";
```

---

# Failure Rule

Do NOT fabricate:

```text
Valuation Analysis
```

when inputs are unavailable.

---

# Valuation Summary

Purpose:

Explain:

```text
Relationship Between

Business

Growth

Trust

and

Valuation
```

---

# Example

Allowed:

```text
Current valuation appears
to rely heavily on continued
AI-related growth execution.
```

Forbidden:

```text
The stock should rise.
```

---

# Valuation Support Schema

```typescript
type ValuationSupport = {
  title: string;

  description: string;

  evidence_refs: string[];
};
```

---

# Support Rules

Supports explain:

```text
Why valuation may be supported.
```

---

# Examples

```text
Durable Revenue Drivers

Strong Trust Profile

Consistent Execution

High Switching Costs
```

---

# Valuation Concern Schema

```typescript
type ValuationConcern = {
  title: string;

  description: string;

  severity:
    | "low"
    | "medium"
    | "high";

  evidence_refs: string[];
};
```

---

# Concern Rules

Concerns explain:

```text
What assumptions
must remain true.
```

---

# Examples

```text
Growth Deceleration

Trust Deterioration

Execution Risk

Narrative Dependence
```

---

# Valuation Interpretation Rules

Q4 may discuss:

```text
Valuation Sensitivity
```

Q4 may NOT discuss:

```text
Future Stock Performance
```

---

# Allowed

```text
Current valuation appears
sensitive to continued
enterprise adoption trends.
```

---

# Forbidden

```text
Shares are likely to rise.
```

---

# Evidence Package

Required.

---

# Schema

```typescript
type Q4EvidencePackage = {
  q1_refs:
    string[];

  q2_refs:
    string[];

  q3_refs:
    string[];

  valuation_refs:
    string[];
};
```

---

# Grounding Rules

Every valuation statement must trace to:

```text
Q1

Q2

Q3

Valuation Inputs
```

---

# Hallucination Prevention

Prompt must not introduce:

```text
Valuation Metrics

Market Assumptions

Comparables

Price Targets
```

not present in inputs.

---

# Business Dependency Rule

Q4 must connect valuation to:

```text
Business Reality
```

---

# Failure Example

Bad:

```text
PE ratio is high.
```

Good:

```text
The valuation appears
to assume continued success
of the cloud expansion strategy.
```

---

# Trust Dependency Rule

Q4 must incorporate:

```text
Q3 Trust Understanding
```

when available.

---

# Example

Allowed:

```text
Valuation support is strengthened
by a history of consistent
management execution.
```

---

# Ownership Boundary

Q4 does NOT answer:

```text
Should I own this business?
```

That belongs to:

```text
Q5
```

---

# Recommendation Boundary

Q4 must never generate:

```text
Buy

Sell

Hold

Outperform

Underperform
```

---

# Price Target Boundary

Forbidden:

```text
Target Price

Expected Return

Upside %

Downside %
```

---

# Confidence Rules

Prompt does NOT generate confidence.

---

# Builder Computes

```typescript
type Q4Confidence = {
  valuation_data_quality: number;

  business_alignment_score: number;

  trust_alignment_score: number;

  evidence_density: number;

  overall: number;
};
```

---

# Forbidden Output Fields

Prompt must NOT generate:

```text
Confidence

Ownership Thesis

Recommendations

Price Targets

Return Expectations
```

---

# Evaluation Hooks

Supports:

```text
Valuation Context Quality

Business Alignment

Trust Alignment

Data Sufficiency Handling
```

---

# Evaluation Metrics

## Valuation Grounding

Measures:

```text
Evidence support.
```

---

## Business Alignment

Measures:

```text
Connection to Q1 and Q2.
```

---

## Trust Alignment

Measures:

```text
Connection to Q3.
```

---

## Insufficient Data Handling

Measures:

```text
Correct use of
insufficient_data.
```

---

## Recommendation Compliance

Measures:

```text
Absence of investment advice.
```

---

# Prompt Failure Conditions

Prompt fails if it:

Creates ownership thesis

Creates investment advice

Creates price targets

Creates return forecasts

Ignores trust context

Uses unsupported valuation claims

Invents valuation data

---

# Recommendation Boundary

Forbidden:

```text
Buy

Sell

Hold

Strong Buy

Outperform

Underperform
```

---

# Investment Return Boundary

Forbidden:

```text
Expected Return

Upside

Downside

Target Price

Fair Value Estimate
```

---

# Lineage Requirements

Artifact records:

```typescript
type Q4PromptLineage = {
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

# Q4 Optionality Invariant

Critical.

Q5 must remain valid when:

```text
Q4 = null
```

---

# Therefore

Q4 must never become:

```text
Required
```

for Investor Intelligence generation.

---

# Scaling Requirements

Target:

```text
10,000+ companies
```

Must support:

- optional valuation architecture
- deterministic valuation interpretation
- replayability
- auditability
- recommendation-free outputs

---

# Architectural Invariants

LOCKED.

1. Q4 is optional.
2. Q4 evaluates valuation context, not investment attractiveness.
3. Q4 may return insufficient_data.
4. Q5 must remain valid without Q4.
5. Q4 must connect valuation to business, growth, and trust.
6. Q4 cannot generate price targets.
7. Q4 cannot generate return forecasts.
8. Confidence is builder-generated.
9. Recommendation language is forbidden.
10. Q4 is the sole owner of valuation understanding within Investor Intelligence.

End of Specification.
