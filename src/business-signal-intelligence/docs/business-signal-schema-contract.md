# Business Signal Schema Contract

## 1. Purpose

The Business Signal artifact stores observable business signals detected from filings and structured intelligence.

It represents observations.

It does not represent:

* company facts
* explanations
* narratives
* recommendations
* owner questions

Business Signals are inputs to Quarter Understanding Intelligence.

---

## 2. Artifact Ownership

Business Signal Intelligence owns:

* signal detection
* signal classification
* signal prioritization
* signal attribution

Business Signal Intelligence does not own:

* Company Knowledge
* Quarter Understanding
* Owner Questions
* Narratives

---

## 3. Conceptual Schema

```ts
type BusinessSignal = {
  signal_id: string;

  category: string;

  summary: string;

  direction:
    | "positive"
    | "negative"
    | "neutral"
    | "emerging"
    | "weakening";

  magnitude:
    | "low"
    | "medium"
    | "high";

  confidence: number;

  evidence: string[];

  source_period: string;
};

type BusinessSignalArtifact = {
  company: string;

  signals: BusinessSignal[];

  metadata: {
    schema_version: string;
    pipeline_version: string;
    generated_at: string;
    input_hash: string;
  };

  lineage: {
    source_filings: string[];
    derived_from: string[];
    model_version: string;
    prompt_version: string;
  };
};
```

---

## 4. Signal Categories

Approved categories:

* Revenue
* Margin
* Growth
* Customer
* Product
* Competitive
* Dependency
* Operational
* Capital Allocation
* Management Commentary

Future categories require explicit review.

---

## 5. Direction Semantics

Positive:

```text
Revenue acceleration observed.
```

Negative:

```text
Margin pressure increased.
```

Neutral:

```text
Revenue mix remained stable.
```

Emerging:

```text
AI infrastructure dependency appeared.
```

Weakening:

```text
Customer concentration risk decreased.
```

Direction is observational.

Direction is not recommendation.

---

## 6. Magnitude Semantics

Low:

Minor movement.

Medium:

Noticeable movement.

High:

Material movement.

Magnitude prioritizes signals.

Magnitude does not represent investment attractiveness.

---

## 7. Evidence Requirements

Every signal must have evidence.

Signals without evidence are invalid.

Evidence may originate from:

* filing intelligence
* structured extraction
* deterministic calculations
* future approved enrichment

Signals must remain auditable.

---

## 8. Confidence Requirements

Confidence represents:

* evidence quality
* evidence coverage
* consistency

Confidence does not represent investment conviction.

Confidence must remain within:

```text
0.0 → 1.0
```

---

## 9. Relationship To Company Knowledge

Company Knowledge owns:

```text
What the company is.
```

Business Signals own:

```text
What appears to be changing.
```

Signals may reference Company Knowledge.

Signals may not modify Company Knowledge.

---

## 10. Relationship To Quarter Understanding

Business Signals:

```text
Observation
```

Quarter Understanding:

```text
Interpretation
```

Example:

Signal:

```text
Margin pressure increased.
```

Quarter Understanding:

```text
Infrastructure spending appears to be the primary driver.
```

---

## 11. Artifact Principles

### Evidence First

Signals require evidence.

### Time Awareness

Signals must be attributable to a period.

### Auditability

Signals must be traceable.

### Separation Of Concerns

Signals observe.

Quarter Understanding explains.

### Reproducibility

Signals should be regeneratable from the same inputs.

---

## 12. Non Goals

This phase does not define:

* repositories
* storage
* builders
* commands
* prompts
* enrichment
* runtime implementation

This document freezes the Business Signal artifact contract.
