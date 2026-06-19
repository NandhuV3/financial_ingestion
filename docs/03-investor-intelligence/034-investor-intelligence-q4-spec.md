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

# Classification

Q4 is:

- an Investor Intelligence Q4 section
- an LLM-assisted investor-facing synthesis
- a valuation-context synthesis layer

Q4 is not:

- a deterministic valuation engine
- a market-data processing layer
- a pricing engine

Generation requirements:

- `temperature = 0`
- pinned prompt version
- pinned model version
- replayable generation

---

# Ownership

Q4 future-state ownership includes:

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

# Sprint 11 Ownership Boundary

Sprint 11 Q4 currently owns:

- valuation limitation reporting
- insufficient-data reporting
- valuation evidence references

Sprint 11 Q4 does not perform:

- valuation assessment synthesis
- expectation-context synthesis
- valuation-driver generation

These capabilities are future-state responsibilities that become active only
after:

- Market Data Architecture
- Valuation Architecture

are implemented.

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

Full valuation assessment is deferred in Sprint 11.

---

# Architectural Position

Sprint 11 behavior:

```text
Q4 is always present.
```

Q4 always returns:

```typescript
status = "insufficient_data";

absent_reason = "market_data_unavailable";
```

Q4 is not omitted.

Q4 remains a required section of Investor Intelligence.

Q5 always consumes Q4 output.

Q4 may contain insufficient-data status.

Q4 may not be absent.

---

# Inputs

## Required

Company Knowledge

Q1

Q2

Q3

---

## Optional

Market Data

Valuation Data

Peer Benchmark Data

Sector Multiples

Historical Valuation Data

Missing optional inputs reduce valuation depth.

Missing optional inputs do not remove Q4.

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

Q4 remains present with insufficient-data status.

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

This is a future-state contract and is not executed during Sprint 11.

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

This is a future-state contract and is not executed during Sprint 11.

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

  supporting_artifacts: Array<{
    artifact_ref: string;

    artifact_version: number;
  }>;
};
```

`artifact_ref` and `artifact_version` are Artifact Framework-provided
references.

Q4 does not own:

- artifact identity
- artifact versioning
- persistence
- storage mechanics
- framework lineage

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

This is a future-state contract and is not executed during Sprint 11.

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

Evaluation metadata is content-level replayability metadata.

Evaluation execution belongs to Evaluation Architecture.

Q4 does not execute evaluations.

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

Q5 always consumes Q4 output.

When:

```typescript
status = "insufficient_data"
```

Q5 must propagate valuation limitations.

Q5 may not fabricate valuation conclusions.

---

# Q5 Integration

Future Q4 implementations may create valuation-related change conditions for
Q5 when valuation architecture is available.

```text
valuation_threshold
```

Sprint 11 does not generate valuation-related change conditions.

When Q4 has insufficient-data status:

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

Q4 publishes immutable content only.

Dependency Index owns dependency registration.

Invalidation Engine owns staleness determination and propagation.

Q4 does not make invalidation decisions.

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

  market_data_version: number | null;

  valuation_data_version: number | null;

  prompt_lineage: string;

  prompt_version: string;

  model_version: string;

  section_input_hash: string;

  section_output_hash: string;

  evaluation_metadata: Record<string, unknown>;
};
```

Q4 may own:

- `prompt_lineage`
- `prompt_version`
- `model_version`
- `section_input_hash`
- `section_output_hash`
- `evaluation_metadata`

These are content-level replayability metadata.

They are not Artifact Framework lineage.

---

# Artifact Framework Metadata

Artifact Framework owns:

- artifact identity
- artifact metadata
- framework lineage
- artifact versioning
- persistence
- current pointers
- archive/history
- framework hashes

These are not part of Q4 content-level replayability metadata.

---

# Scaling Requirements

Target:

```text
10,000+ companies
```

Must support:

- valuation refresh cycles
- market data updates
- replayability
- auditability

Dependency Index owns dependency registration.

Invalidation Engine owns staleness determination and propagation.

---

# Architectural Invariants

LOCKED.

1. Q4 is a required Investor Intelligence section.
2. Q4 remains present in Sprint 11.
3. Q4 may return insufficient-data status.
4. Q5 consumes Q4 output.
5. Q4 evaluates valuation context only.
6. Q4 never predicts stock prices.
7. Q4 never provides investment recommendations.
8. All valuation claims require evidence.
9. Q4 integrates Q1–Q3 but does not replace them.
10. Future Q4 implementations may create valuation-related change conditions for Q5 when valuation architecture exists.

End of Specification.
