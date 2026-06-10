# Business Signal Schema Design

## 1. Design Goals

The future Business Signal schema must support:

- Observable signals
- Evidence-based signals
- Time-aware signals
- Signal prioritization
- Downstream Quarter Understanding
- Downstream Owner Questions

The schema must not support:

- Narratives
- Explanations
- Recommendations
- Owner questions
- Company fact ownership

Business Signal Intelligence should remain an observation layer. Its schema should make signals precise, traceable, and useful to downstream intelligence layers without allowing the signal layer to become a narrative, recommendation, or company knowledge system.

## 2. Signal Identity

Future schema work should include conceptual support for signal identity.

### Signal Identifier

A signal identifier exists so individual signals can be referenced, deduplicated, compared, and traced across processing runs.

The identifier should support auditability and downstream linking. It should not encode business interpretation or presentation language.

### Signal Category

A signal category exists to classify the kind of business movement being observed.

Categories help downstream systems distinguish revenue movement from margin movement, customer movement, competitive movement, dependency movement, and other signal types.

### Signal Title Or Summary

A signal title or summary exists to provide a concise observation.

It should state what was observed without explaining why it happened or what an owner should do.

Example:

```text
Cloud growth acceleration observed.
```

Not:

```text
Cloud growth acceleration makes the company more attractive.
```

### Signal Timestamp Or Period

A signal timestamp or period exists because signals are time-aware.

Signals should be attributable to a filing period, reporting period, or generation window. This allows downstream systems to reason about emergence, persistence, acceleration, deceleration, and disappearance.

## 3. Signal Categories

Future signal categories may include the following.

### Revenue

Revenue signals identify observations about sales activity, revenue growth, revenue mix, recurring revenue, transaction volume, or monetization movement.

### Margin

Margin signals identify observations about cost pressure, operating leverage, profitability movement, gross margin, operating margin, or expense intensity.

### Growth

Growth signals identify observations about expansion, acceleration, deceleration, demand momentum, segment growth, or market adoption.

### Customer

Customer signals identify observations about customer demand, customer concentration, customer retention, customer mix, or changes in buyer behavior.

### Product

Product signals identify observations about product launches, product adoption, product quality, product mix, platform usage, or product-related risk.

### Competitive

Competitive signals identify observations about pricing pressure, market rivalry, platform competition, product substitution, or competitive intensity.

### Dependency

Dependency signals identify observations about reliance on suppliers, platforms, technologies, customers, regulatory approvals, infrastructure, or other business dependencies.

### Operational

Operational signals identify observations about infrastructure, manufacturing, logistics, capacity, efficiency, execution, or operating complexity.

### Capital Allocation

Capital Allocation signals identify observations about investment, buybacks, dividends, acquisitions, debt usage, capital intensity, or resource allocation.

### Management Commentary

Management Commentary signals identify observations about what management emphasized, deemphasized, newly introduced, repeated, or changed in structured communications.

These categories define design intent only. They do not define a TypeScript enum or storage schema in this phase.

## 4. Signal Direction

Future schema work should support direction concepts such as:

- Positive
- Negative
- Neutral
- Emerging
- Weakening

Direction matters because signals describe movement. A downstream system must be able to distinguish a strengthening signal from a weakening signal, or an emerging signal from a stable observation.

Direction should remain observational. It should not become a recommendation.

Example:

```text
Positive:
  Cloud demand accelerated.

Negative:
  Gross margin pressure increased.

Emerging:
  AI infrastructure dependency appeared for the first time.
```

This phase does not define a direction enum.

## 5. Signal Magnitude

Future schema work should support magnitude concepts such as:

- Low
- Medium
- High

Magnitude helps prioritize signals. Not every observed change deserves the same downstream attention.

Magnitude should help downstream Quarter Understanding and Owner Questions decide what to focus on first. It should not be used as an investment score or recommendation.

This phase does not define a magnitude enum.

## 6. Signal Evidence

Signals should be traceable back to source material.

Future signal evidence should support references to:

- Filings
- Structured intelligence
- Deterministic artifacts

Signals must remain auditable. A future reader should be able to answer:

- Which filing or period produced this signal?
- Which structured artifact contributed to it?
- Which source observation supports it?
- Was the signal generated deterministically or enriched later?

Evidence should preserve provenance without exposing raw SEC text directly to user-facing layers.

## 7. Signal Confidence

Future schema work should include conceptual support for confidence.

Confidence should reflect:

- Evidence quality
- Source coverage
- Consistency

Confidence must not be narrative-based. It should not depend on persuasive wording, frontend presentation, or generated commentary.

Confidence should help downstream systems decide how much weight to give a signal. It should not tell users what action to take.

This phase does not define exact confidence formulas.

## 8. Relationship To Company Knowledge

Company Knowledge owns durable facts.

Business Signals own observations about movement around those facts.

Signals may reference Company Knowledge.

Signals may not redefine Company Knowledge.

Example:

```text
Company Knowledge:
  "The company sells cloud infrastructure."

Business Signal:
  "Cloud infrastructure demand accelerated."
```

The signal depends on the business fact but does not replace or mutate it.

## 9. Relationship To Quarter Understanding

Business Signals identify observations.

Quarter Understanding explains observations.

Business Signals remain explanation-free.

Example:

```text
Business Signal:
  "Margin pressure increased."

Quarter Understanding:
  "Margin pressure increased because infrastructure investments grew faster than revenue contribution."
```

Business Signal Intelligence should not absorb Quarter Understanding responsibilities.

## 10. Relationship To Owner Questions

Signals are inputs.

Signals are not questions.

Owner Questions may consume signals later.

Example:

```text
Business Signal:
  "Customer concentration risk increased."

Possible Future Owner Question:
  "How dependent is this business on its largest customers?"
```

The signal layer should not generate that question. It should only provide a clear, traceable observation that later layers can use.

## 11. Signal Lifecycle Metadata

Future schema work should support lifecycle metadata requirements.

### Source Lineage

Signals should preserve where they came from, including source filing periods and contributing structured artifacts.

### Generation Metadata

Signals should preserve when and how they were generated, including pipeline version and generation timestamp.

### Signal Provenance

Signals should preserve whether they came from deterministic detection, future enrichment, or another approved process.

This phase does not define schema fields. It only establishes the requirement that future signal artifacts must remain auditable and reproducible.

## 12. Future Design Constraints

Future Business Signal schema work must remain:

- Deterministic first
- Auditable
- Reproducible
- Explainable through lineage
- Free of recommendation ownership
- Free of narrative ownership

The schema should support downstream intelligence without creating duplicate ownership over company facts, explanations, recommendations, or questions.

## 13. Non Goals

This document does not define:

- TypeScript types
- Builders
- Repositories
- Storage
- Prompts
- Enrichment
- Runtime logic
- Generated artifacts
- Commands
- Tests

This document is schema design only.
