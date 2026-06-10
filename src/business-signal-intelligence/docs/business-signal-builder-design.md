# Business Signal Builder Design

## 1. Purpose

The Business Signal Builder creates Business Signal artifacts from structured intelligence.

Its responsibility is to identify observable business signals that deserve attention.

It answers:

* What changed?
* What emerged?
* What strengthened?
* What weakened?
* What deserves further understanding?

The builder does not:

* Explain signals
* Generate narratives
* Generate recommendations
* Generate owner questions
* Modify Company Knowledge

Business Signal Builder is the final observation layer before interpretation begins.

---

## 2. Architectural Position

```text
Source Filings
    ↓
Structured Intelligence
    ↓
Company Knowledge
    ↓
Business Signal Builder
    ↓
Business Signal Artifact
    ↓
Quarter Understanding Intelligence
    ↓
Owner Questions Intelligence
```

Business Signal Builder consumes structured intelligence and Company Knowledge.

Business Signal Builder produces Business Signal artifacts.

Quarter Understanding consumes Business Signals.

Quarter Understanding owns interpretation.

---

## 3. Inputs

Future Business Signal Builder may consume:

### Company Knowledge

Provides business context.

Examples:

* Business model
* Products
* Customers
* Revenue drivers
* Competitive positioning
* Dependencies

### Filing Intelligence

Provides quarter-specific observations.

Examples:

* Revenue trends
* Segment performance
* Margin trends
* Operational changes
* Management commentary
* Risk disclosures

### Historical Artifacts

Provides prior-period comparison context.

Examples:

* Prior quarter signals
* Prior quarter extraction
* Prior quarter understanding

Historical inputs may be introduced in later phases.

---

## 4. Builder Responsibilities

Business Signal Builder is responsible for:

### Signal Detection

Detect potentially meaningful observations.

Examples:

```text
Cloud growth accelerated.
Margin pressure increased.
Customer concentration increased.
AI infrastructure investment increased.
```

### Signal Classification

Assign signal categories.

Examples:

```text
Revenue
Margin
Growth
Customer
Product
Competitive
Dependency
Operational
Capital Allocation
Management Commentary
```

### Signal Prioritization

Determine which signals deserve downstream attention.

Not every observation becomes a signal.

Builder should suppress noise where possible.

### Signal Attribution

Every signal should be traceable to supporting evidence.

Signals must remain auditable.

---

## 5. Builder Non-Responsibilities

Business Signal Builder must not:

### Explain Signals

Example:

Allowed:

```text
Cloud growth acceleration observed.
```

Not Allowed:

```text
Cloud growth accelerated because enterprise AI demand increased.
```

Explanation belongs to Quarter Understanding.

---

### Recommend Actions

Not Allowed:

```text
Buy because cloud demand accelerated.
Sell because margin pressure increased.
```

Recommendations belong to separate future systems.

---

### Generate Owner Questions

Not Allowed:

```text
Should owners worry about margin pressure?
```

Owner Questions Intelligence owns this responsibility.

---

### Create Narratives

Not Allowed:

```text
The company appears well positioned for long-term growth.
```

Narratives belong to future presentation layers.

---

## 6. Detection Philosophy

Business Signal Builder should operate using evidence-first detection.

Signals should emerge from:

* Numeric movement
* Disclosure emphasis
* New disclosures
* Removed disclosures
* Repeated disclosures
* Comparative changes
* Dependency changes
* Business focus changes

Signals should not emerge solely from persuasive language.

Evidence must exist.

---

## 7. Relationship To Company Knowledge

Company Knowledge owns facts.

Business Signals own movement around facts.

Example:

```text
Company Knowledge:
Microsoft sells cloud services.

Business Signal:
Cloud demand accelerated.
```

The signal references a business fact.

It does not redefine that fact.

Business Signal Builder must never mutate Company Knowledge.

---

## 8. Relationship To Quarter Understanding

Business Signals identify observations.

Quarter Understanding explains observations.

Example:

```text
Business Signal:
Margin pressure increased.
```

Quarter Understanding:

```text
Margin pressure increased because infrastructure investment grew faster than revenue contribution.
```

Business Signal Builder stops at observation.

Quarter Understanding begins interpretation.

---

## 9. Deterministic vs LLM Responsibilities

Business Signal Builder should remain primarily evidence-driven.

LLMs may assist with:

* signal normalization
* signal grouping
* signal deduplication
* signal summarization

LLMs should not invent signals unsupported by evidence.

Every generated signal must remain attributable to source evidence.

Business Signal Intelligence remains an auditable layer.

Future model upgrades should improve signal quality without changing ownership boundaries.

---

## 10. Output Characteristics

Every future Business Signal should conceptually support:

* Identity
* Category
* Summary
* Direction
* Magnitude
* Confidence
* Evidence
* Lineage
* Time Awareness

This document does not define schema fields.

It defines required characteristics only.

---

## 11. Future Evolution

Future versions may introduce:

* Historical signal comparison
* Signal persistence tracking
* Signal emergence detection
* Signal disappearance detection
* Cross-quarter signal evolution
* Cross-company signal comparison

These capabilities should extend Business Signal Intelligence without changing ownership boundaries.

---

## 12. Design Principles

### Observation Before Interpretation

Signals identify what happened.

Quarter Understanding explains why.

### Evidence Before Narrative

Signals must be attributable.

Narratives are downstream.

### Auditability Before Sophistication

Every signal should be traceable.

### Company Knowledge Remains Authoritative

Signals reference facts.

Signals do not redefine facts.

### Intelligence Layers Remain Separate

Business Signal Intelligence observes.

Quarter Understanding interprets.

Owner Questions challenges.

Narratives communicate.

---

## 13. Non Goals

This phase does not define:

* TypeScript contracts
* Builders
* Repositories
* Storage
* Commands
* Prompts
* Enrichment pipelines
* Runtime implementation
* Generated artifacts

This document defines builder architecture only.
