# 034-investor-intelligence-q4-spec.md

Version: 1.0
Status: LOCKED
Owner: Investor Intelligence Layer

---

# Purpose

Q4 answers:

> "Is the story already too expensive?"

Q4 is the valuation intelligence layer.

Q4 evaluates:

- expectation context when market data is available
- limitations when market data is unavailable

Q4 does NOT:

- predict stock prices
- produce price targets
- forecast returns
- recommend buying
- recommend selling

Q4 exists to answer:

```text
How much optimism
appears embedded
in the current valuation?
```

---

# Ownership

Q4 owns:

- expectation context
- valuation limitation reporting
- Q4 evidence references

Q4 does NOT own:

- business quality
- growth quality
- trust quality
- ownership thesis

Those belong to:

Q1

Q2

Q3

Q5

---

# Core Question

Q4 must answer:

```text
Does current valuation
appear aligned,
conservative,
or demanding
relative to business fundamentals?
```

---

# Architectural Position

Q4 is OPTIONAL.

Investor Intelligence must function without Q4.

Q5 must function without Q4.

Q4 absence must never block:

- Investor Intelligence generation
- Q5 generation
- Partner Domain generation

---

# Inputs

## Required

Company Knowledge

Q1 Answer

Q2 Answer

Q3 Answer

---

# Optional

Market Data

Valuation Data

Peer Benchmark Data

Sector Multiples

Historical Valuation Data

---

# Forbidden Inputs

Q4 MUST NOT consume:

Q5 Outputs

Partner Domain

Analyst Ratings

Buy/Sell Recommendations

Social Media

News Sentiment

Broker Research

Price Targets

---

# Output Schema

```typescript
type Q4Answer = {
  valuation_summary: string;

  valuation_assessment: ValuationAssessment;

  valuation_drivers: ValuationDriver[];

  confidence: Q4Confidence;

  status:
    | "answered"
    | "insufficient_data";

  absent_reason?: Q4AbsentReason;

  evidence_package: Q4EvidencePackage;

  replayability_metadata:
    Q4ReplayabilityMetadata;
};
```

---

# Status Rules

## Sprint 11

Sprint 11 always returns:

```typescript
status = "insufficient_data";

absent_reason = "market_data_unavailable";
```

Market data integration is deferred.

Valuation methodology is future work and is not implemented in Sprint 11.

---

## Answered

Answered status is reserved for a future Market Data and Valuation Architecture.

Valuation data available.

Minimum valuation evidence present.

Confidence above minimum threshold.

---

## Insufficient Data

Required market inputs unavailable.

Valuation cannot be assessed reliably.

Q4 generation skipped.

---

# Absent Reasons

```typescript
type Q4AbsentReason =
  | "market_data_unavailable"
  | "insufficient_peer_data"
  | "valuation_pipeline_disabled"
  | "data_quality_failure";
```

---

# Valuation Assessment

```typescript
type ValuationAssessment =
  | "demanding"
  | "reasonable"
  | "conservative"
  | "uncertain";
```

Definitions:

### Demanding

Current valuation assumes strong future execution.

### Reasonable

Valuation broadly aligns with observed business quality.

### Conservative

Valuation embeds limited expectations.

### Uncertain

Insufficient confidence to classify.

---

# Valuation Drivers

Purpose:

Explain why valuation appears as assessed.

```typescript
type ValuationDriver = {
  driver_id: string;

  title: string;

  description: string;

  category:
    | "growth"
    | "profitability"
    | "trust"
    | "market_expectation"
    | "sector_comparison";

  source: string;
};
```

---

# Evidence Package

```typescript
type Q4EvidencePackage = {
  valuation_sources: string[];

  peer_sources: string[];

  q1_refs: string[];

  q2_refs: string[];

  q3_refs: string[];

  supporting_artifacts: string[];
};
```

---

# Grounding Rules

All valuation reasoning must trace to:

- valuation data
- peer comparisons
- business fundamentals

No speculative valuation claims.

No unsupported assertions.

---

# Confidence Model

Confidence is derived.

Never self-assessed.

```typescript
type Q4Confidence = {
  overall: number;

  market_data_quality: number;

  peer_comparison_quality: number;

  valuation_signal_quality: number;

  business_alignment_score: number;
};
```

---

# Confidence Interpretation

High Confidence

```text
Rich valuation data exists
and comparisons are reliable.
```

Moderate Confidence

```text
Valuation view exists
but evidence is mixed.
```

Low Confidence

```text
Valuation assessment is uncertain.
```

---

# Valuation Framework

Q4 evaluates:

```text
Business Quality
+
Growth Quality
+
Trust Quality
+
Current Valuation
```

It does NOT evaluate:

```text
Future Share Price
```

Sprint 11 does not execute this valuation framework.

The framework remains deferred until Market Data and Valuation Architecture are implemented.

---

# Evaluation Metrics

## Data Freshness

Measures:

```text
Age of market data inputs.
```

---

## Valuation Consistency

Measures:

```text
Consistency across companies
within the same sector.
```

---

## Evidence Coverage

Measures:

```text
Completeness of valuation evidence.
```

---

## Business Alignment

Measures:

```text
Whether valuation reasoning
aligns with Q1–Q3 findings.
```

---

# Governance Rules

Q4 must remain:

```text
Valuation Intelligence
```

Q4 must never become:

```text
Investment Recommendation

Stock Prediction

Trading Advice
```

---

# Forbidden Language

Examples:

```text
Buy

Sell

Strong Buy

Outperform

Underperform

Price Target

Expected Return

Upside

Downside
```

Any occurrence fails governance checks.

---

# Q5 Dependency Rules

Q5 may consume Q4 when available.

Q5 must not require Q4.

If:

```typescript
Q4.status === "insufficient_data"
```

then:

```typescript
Q5.status = "partial"
```

with:

```typescript
partial_reason = "q4_unavailable"
```

---

# Q5 Integration

When Q4 exists:

Q5 may generate:

```text
valuation_threshold
```

change conditions.

When Q4 absent:

valuation_threshold conditions forbidden.

---

# Invalidation Rules

Regenerate when:

```text
Market Data changes

Valuation Data changes

Peer Data changes

Q1 changes

Q2 changes

Q3 changes
```

---

# No Regeneration Required

Do NOT regenerate for:

```text
Partner Domain changes

Presentation changes

Q5 changes
```

---

# Historical Comparison

Track:

```typescript
type Q4HistoricalComparison = {
  valuation_assessment_changed: boolean;

  valuation_driver_changes: boolean;

  confidence_changed: boolean;

  peer_position_changed: boolean;
};
```

---

# Longitudinal Requirements

Q4 should support:

```text
Valuation Trend Analysis

Historical Valuation Context

Peer Relative Valuation Tracking
```

---

# Replayability Metadata

```typescript
type Q4ReplayabilityMetadata = {
  q1_version: number;

  q2_version: number;

  q3_version: number;

  market_data_version: number;

  valuation_data_version: number;

  prompt_version: string;

  model_version: string;

  input_hash: string;
};
```

This is replayability metadata owned by Investor Intelligence and is not
Artifact Framework lineage.

---

# Artifact Framework Metadata

Metadata, artifact_version, Artifact Framework lineage, artifact-level hashes,
persistence, current pointer, and archive/history are provided by Artifact
Framework and are not part of Q4 content.

---

# Scaling Requirements

Target:

```text
10,000+ companies
```

Must support:

- valuation refresh cycles
- market data updates
- partial invalidation
- Q5 integration

without triggering full Investor Intelligence regeneration.

---

# Architectural Invariants

LOCKED.

1. Q4 is optional.
2. Q4 absence must not block Investor Intelligence.
3. Q4 absence must not block Q5.
4. Q4 evaluates valuation context only.
5. Q4 never predicts stock prices.
6. Q4 never provides investment recommendations.
7. All valuation claims require evidence.
8. Q4 integrates Q1–Q3 but does not replace them.
9. Q4 may create valuation-related change conditions for Q5.
10. Q4 must support partial invalidation and independent refresh cycles.

End of Specification.
