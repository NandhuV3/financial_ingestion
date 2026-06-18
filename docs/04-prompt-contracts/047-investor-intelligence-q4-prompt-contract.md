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
- Investor Intelligence Q1
- Investor Intelligence Q2
- Investor Intelligence Q3
- Market Data (optional)
- Valuation Data (optional)
- Peer Data (optional)

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
Can valuation be assessed?

If not, why not?
```

---

# Architectural Principle

Future-state only.

Not executed during Sprint 11.

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

Sprint 11 Q4 owns:

- market-data limitation reporting
- valuation-depth limitation reporting

Future-state Q4 ownership additionally includes:

- expectation framing

Q4 does NOT own:

- business understanding
- growth understanding
- trust understanding
- ownership thesis
- investment recommendation

---

# Core Responsibility

Future-state only.

Not executed during Sprint 11.

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

# Sprint 11 Presence

Q4 is always present.

Q4 returns:

```typescript
status = "insufficient_data";

absent_reason = "market_data_unavailable";
```

Q4 is not omitted.

---

# Input Contract

Required:

```typescript
type Q4PromptInput = {
  company_knowledge:
    CompanyKnowledgeArtifact;

  q1: Q1Answer;

  q2: Q2Answer;

  q3: Q3Answer;
};
```

Optional:

```typescript
type Q4PromptEnrichmentInput = {
  market_data?:
    MarketDataArtifact;

  valuation_data?:
    ValuationDataArtifact;

  peer_data?:
    PeerDataArtifact;
};
```

Sprint 11 behavior:

```typescript
status = "insufficient_data";

absent_reason = "market_data_unavailable";
```

Market data integration is deferred.

Valuation methodology is future work and is not implemented in Sprint 11.

---

# Sprint 11 Execution Inputs

Prompt may consume:

```text
Company Knowledge

Q1

Q2

Q3
```

---

# Future-State Valuation Architecture Inputs

Future-state only.

Not executed during Sprint 11.

```text
Market Data, when available

Valuation Data, when available

Peer Data, when available
```

---

# Sprint 11 Execution Boundary

During Sprint 11, the prompt may generate only:

- valuation limitations
- insufficient-data reporting
- evidence references

During Sprint 11, the prompt must not generate:

- valuation synthesis
- expectation context
- valuation drivers
- cheap or expensive conclusions
- demanding, reasonable, or conservative conclusions
- fair value
- intrinsic value
- target prices
- return expectations

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
    | "answered"
    | "insufficient_data";

  absent_reason?:
    Q4AbsentReason;

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

```typescript
type Q4AbsentReason =
  | "market_data_unavailable"
  | "insufficient_peer_data"
  | "valuation_pipeline_disabled"
  | "data_quality_failure";
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

Future-state only.

Not executed during Sprint 11.

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

Future-state only.

Not executed during Sprint 11.

```typescript
type ValuationSupport = {
  title: string;

  description: string;

  evidence_refs: string[];
};
```

During Sprint 11:

```typescript
valuation_summary = "Market data is unavailable; valuation cannot be assessed.";

valuation_supports = [];

valuation_concerns = [];
```

`valuation_summary` contains limitation reporting only.

`valuation_supports` and `valuation_concerns` are future-state fields and remain
empty during Sprint 11.

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

Future-state only.

Not executed during Sprint 11.

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

Future-state only.

Not executed during Sprint 11.

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

During Sprint 11:

```typescript
valuation_refs = [];
```

`valuation_refs` is future-state only and does not imply valuation data exists
during Sprint 11.

---

# Grounding Rules

Future-state only.

Not executed during Sprint 11.

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

Future-state only.

Not executed during Sprint 11.

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

Future-state only.

Not executed during Sprint 11.

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

# Replayability Ownership

Q4 owns only content-level replayability metadata.

Artifact Framework owns:

- artifact identity
- artifact metadata
- framework lineage
- artifact versioning
- persistence
- current pointers
- archive/history
- framework hashes

Q4 content-level replayability metadata is not Artifact Framework lineage.

---

# Scaling Requirements

Target:

```text
10,000+ companies
```

Must support:

- required Q4 presence
- Sprint 11 insufficient-data reporting
- replayability
- auditability
- recommendation-free outputs

---

# Architectural Invariants

LOCKED.

1. Q4 is always present.
2. Sprint 11 Q4 returns insufficient_data with market_data_unavailable.
3. Q4 is not omitted.
4. Sprint 11 Q4 generates limitations, insufficient-data reporting, and evidence references only.
5. Future-state Q4 evaluates valuation context, not investment attractiveness.
6. Q4 cannot generate price targets.
7. Q4 cannot generate return forecasts.
8. Confidence is builder-generated.
9. Recommendation language is forbidden.
10. Q4 owns valuation-context reporting within Investor Intelligence; full valuation synthesis is deferred in Sprint 11.

End of Specification.
