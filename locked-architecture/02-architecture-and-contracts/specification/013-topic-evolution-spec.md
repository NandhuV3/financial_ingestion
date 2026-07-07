# Topic Evolution Specification

Status: LOCKED

## 1. Purpose

Topic Evolution exists to track how Topics behave across filing periods.

Topic Evolution answers:

> How has this Topic evolved over time for this company?

Topic Evolution operates on Topics that have already been assigned by Topic Assignment.

Topic Evolution does not explain why a Topic changed.

Topic Evolution does not determine whether a Topic change is good or bad.

Topic Evolution does not produce investor conclusions.

Topic Evolution identifies longitudinal Topic behavior.

---

## 2. Position In Architecture

```text
Themes
        │
        ▼
Topic Assignment
(Produced against the governed Platform Registry)
        │
        ▼
Topic Evolution
        │
        ▼
Business Signals (Enrichment)
```

Themes identify filing observations.

Topic Assignment maps observations to canonical Topics using the governed Platform Registry.

Topic Evolution consumes persisted Topic Assignment artifacts across filing periods.

Business Signals may consume Topic Evolution as enrichment.

---

## 3. Inputs

### Required Inputs

• Current Topic Assignment Artifact
• Historical Topic Assignment Artifacts

Each consumed Topic Assignment must preserve:

- Topic Registry version
- Assignment version
- Execution lineage

Topic Evolution consumes Topic Assignment artifacts only.

It never reconstructs Topic Assignment.

Topic Evolution requires historical Topic history.

A single filing is insufficient.

Topic Evolution reads Topic Registry version metadata from Topic Assignment lineage.

It does not consume the Platform Registry directly.

---

## 4. Forbidden Inputs

* Company Knowledge
* Quarter Change
* Business Signals
* Trust Signals
* Quarter Understanding
* Investor Intelligence
* Market Data
* Topic Signals
* Cross-Company Aggregation
* Aggregation Result
* Topic Candidates
* Governance Decisions
* Platform Registry Evolution

Platform Registry is not a direct input.

Topic Evolution relies on the registry version recorded within Topic Assignment artifacts.

Topic Evolution operates only on Topic history.

Topic Evolution must not consume downstream interpretation.

---

## 5. Core Question

Topic Evolution answers:

```text
What happened to this Topic over time?
```

Topic Evolution does not answer:

```text
Why did it happen?
```

Topic Evolution does not answer:

```text
What does it mean?
```

Those responsibilities belong downstream.

---

## 6. Outputs

Topic Evolution produces a deterministic Company Intelligence Artifact describing longitudinal Topic behavior across filing periods.

Example:

```json
{
  "topic_id": "topic_ai_investment",

  "evolution_type": "strengthening",

  "periods_observed": 8,

  "current_period": "2026-Q3",

  "first_observed_period": "2024-Q4",

  "confidence": 0.93
}
```

---

## 7. Supported Evolution Types

### Persistence

Definition:

Topic remains present across periods.

Example:

```text
Cloud Infrastructure
appears in every filing for six periods.
```

Output:

```text
persistent
```

---

### Emergence

Definition:

Topic appears after previously being absent.

Example:

```text
Generative AI Revenue
appears for the first time.
```

Output:

```text
emerging
```

---

### Disappearance

Definition:

Previously recurring Topic no longer appears.

Example:

```text
Metaverse Strategy
no longer appears.
```

Output:

```text
disappearing
```

---

### Strengthening

Definition:

Topic receives increasing emphasis over time.

Example:

```text
AI Infrastructure
appears more frequently and more prominently.
```

Output:

```text
strengthening
```

---

### Weakening

Definition:

Topic receives decreasing emphasis over time.

Example:

```text
Gaming Hardware
receives progressively less discussion.
```

Output:

```text
weakening
```

---

### Narrative Drift

Definition:

The Topic remains present but the associated Theme language changes materially.

Example:

```text
AI Strategy

Earlier:
"Research Investment"

Later:
"Commercial Monetization"
```

Topic remains.

Narrative framing changes.

Output:

```text
narrative_drift
```

---

## 8. Allowed Reasoning

Topic Evolution may:

* Compare Topic presence across periods
* Compare Topic absence across periods
* Compare Topic frequency across periods
* Compare Topic emphasis across periods
* Compare Topic framing using Theme summaries
* Compare Topic behavior across Topic Assignment artifacts produced under different Topic Registry versions
* Detect Topic emergence
* Detect Topic disappearance
* Detect Topic strengthening
* Detect Topic weakening
* Detect Topic drift

Topic Evolution may answer:

```text
How has Topic behavior changed?
```

---

## 9. Forbidden Reasoning

Topic Evolution must not:

* Explain why Topics changed
* Explain business significance
* Explain investor significance
* Explain trust implications
* Produce ownership conclusions
* Produce revenue conclusions
* Produce management credibility conclusions

Invalid:

```text
AI investment strengthened because management
expects future demand growth.
```

Reason:

Causal interpretation is forbidden.

---

Invalid:

```text
AI investment strengthening is positive
for investors.
```

Reason:

Investor interpretation is forbidden.

---

Invalid:

```text
Cloud infrastructure is becoming a durable
competitive advantage.
```

Reason:

Company Knowledge and Investor Intelligence own that reasoning.

---

## 10. Theme Summary Usage

Topic Evolution may consume Theme summaries only when referenced by Topic Assignment artifacts for deterministic narrative comparison.

Topic Evolution must not reopen Themes independently unless explicitly permitted by its input contract.

Purpose:

Narrative comparison.

Example:

Period 1 Theme:

```text
AI Research Investment
```

Period 2 Theme:

```text
AI Product Commercialization
```

Topic Assignment:

```text
topic_ai_strategy
```

Topic Evolution may detect:

```text
narrative_drift
```

Topic Evolution may not determine whether the drift is beneficial.

---

## 11. Ownership Boundaries

### Topic Assignment vs Topic Evolution

| Topic Assignment       | Topic Evolution             |
| ---------------------- | --------------------------- |
| What Topic is present? | How Topic behaves over time |
| Single filing          | Multiple periods            |
| Classification         | Pattern detection           |

Topic Assignment classifies.

Topic Evolution detects behavior.

Topic Assignment is a governed boundary artifact shared between Platform Intelligence and Company Intelligence.

Topic Evolution consumes the persisted Topic Assignment artifact rather than invoking Topic Assignment directly.

---

### Topic Evolution vs Quarter Change

| Topic Evolution       | Quarter Change                 |
| --------------------- | ------------------------------ |
| Topic behavior        | Business understanding changes |
| Topic Registry based  | Structured Intelligence based  |
| Multi-period patterns | Consecutive-period deltas      |
| Longitudinal          | Boundary comparison            |

Example:

Topic Evolution:

```text
AI Investment Topic strengthened
for six consecutive periods.
```

Quarter Change:

```text
AI Infrastructure Investment
increased this quarter.
```

These are different responsibilities.

---

### Topic Evolution vs Business Signals

| Topic Evolution   | Business Signals     |
| ----------------- | -------------------- |
| Pattern detection | Business observation |
| Topic behavior    | Business meaning     |
| Input             | Enrichment           |

Topic Evolution provides evidence.

Business Signals may consume it.

---

## 12. Relationship To Ownership Questions

### Q1 Ownership

No direct contribution.

---

### Q2 Ownership

Provides longitudinal evidence regarding:

* Revenue Topics
* Growth Topics
* Investment Topics

Used as enrichment.

---

### Q3 Ownership

Provides narrative consistency evidence.

Used as enrichment.

Does not produce trust conclusions.

---

### Q4 Ownership

No contribution.

---

### Q5 Ownership

Provides evidence regarding:

* Persistent Topics
* Emerging Topics
* Disappearing Topics
* Long-term strategic shifts

Used as enrichment.

Does not produce ownership conclusions.

---

## 13. Replay

Topic Evolution is fully replayable.

Replay consumes persisted Topic Assignment artifacts.

Replay never regenerates Topic Assignments.

Given identical:

- Current Topic Assignment Artifact
- Historical Topic Assignment Artifacts

Topic Evolution must produce byte-identical outputs.

Replay depends upon the Topic Registry versions preserved within consumed Topic Assignment artifacts.

---

## 13. Execution Model

Execution Type:

```text
Deterministic
```

Topic Evolution should be reproducible.

Given:

* Current Topic Assignment Artifact
* Historical Topic Assignment Artifacts
* Referenced Theme summaries (when permitted)

the same Topic Evolution outputs must always be produced.

the same Topic Evolution outputs should be produced.

Topic Evolution is a pattern-detection layer.

It is not an interpretation layer.

It is not a business-understanding layer.

It is not an investor-intelligence layer.

---

## First-Period Handling

Topic Evolution requires historical Topic Assignment history.

When no historical Topic Assignment exists:

- no temporal comparison is possible
- no longitudinal conclusions are produced

First-period behavior follows the platform-wide First-Period Handling Contract.

Topic Evolution must never fabricate historical observations.
