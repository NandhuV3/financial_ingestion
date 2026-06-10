# Business Signal Definition Contract

## 1. Signal Definition

Business Signal Intelligence owns observations about business change, movement, emphasis, acceleration, deceleration, concentration, dependency shifts, operational shifts, customer shifts, product shifts, and competitive shifts.

A business signal must be:

- Observable
- Evidence-based
- Attributable to source intelligence
- Time-aware
- Independent of recommendations

A business signal is not:

- A business fact
- A narrative
- An explanation
- A recommendation
- An owner question

Business signals are concise observations that something meaningful appears to be happening in the business. They do not define the company, explain the full cause, or tell an owner what to do.

## 2. Signal Vs Fact

Company Knowledge owns durable business facts.

Business Signal Intelligence owns observations about changes or movements related to those facts.

Example:

```text
Company Knowledge:
  "Microsoft sells cloud services."

Business Signal:
  "Cloud growth acceleration observed."
```

The signal references the business fact but does not redefine it.

Additional examples:

```text
Company Knowledge:
  "Apple sells consumer devices and services."

Business Signal:
  "Services revenue received increased emphasis."
```

```text
Company Knowledge:
  "Visa earns revenue from payment volume and transaction activity."

Business Signal:
  "Cross-border payment activity appeared as a growth signal."
```

```text
Company Knowledge:
  "Amazon operates retail, cloud infrastructure, advertising, and logistics businesses."

Business Signal:
  "Cloud margin pressure appeared as an operating signal."
```

Facts describe what the company is and how it works. Signals describe movement around those facts.

## 3. Signal Vs Explanation

The signal layer identifies that something noteworthy exists.

Quarter Understanding explains why it matters.

Examples:

```text
Business Signal:
  "Gross margin declined."

Quarter Understanding:
  "Gross margin declined as the company increased infrastructure spending."
```

```text
Business Signal:
  "AI infrastructure investment increased."

Quarter Understanding:
  "The company appears to be prioritizing AI capacity to support future product and cloud demand."
```

```text
Business Signal:
  "Customer concentration risk received more attention."

Quarter Understanding:
  "The business may be more exposed to a small number of large customers than in prior filings."
```

```text
Business Signal:
  "Competitive pressure intensified."

Quarter Understanding:
  "Competition appears more relevant this quarter because the company highlighted pricing pressure and faster product cycles."
```

Business Signal Intelligence observes. Quarter Understanding interprets.

## 4. Signal Vs Recommendation

Signals must never contain:

- Buy or sell language
- Portfolio guidance
- Investment advice
- Owner recommendations
- Position sizing language
- Timing suggestions

Examples of prohibited signal language:

```text
"Buy because cloud growth accelerated."
"Sell due to margin pressure."
"Increase allocation because AI investment is rising."
"Avoid this company because competition intensified."
```

Signals may identify what changed, but they must not tell a user what action to take. Recommendations, if ever introduced, belong to a separate governed layer and are outside the scope of Business Signal Intelligence.

## 5. Signal Vs Narrative

Signals must remain concise observations.

Narratives belong to future narrative layers.

Example:

```text
Business Signal:
  "Cloud revenue acceleration observed."

Narrative:
  "Cloud remains one of the company’s most important growth engines, with management continuing to emphasize enterprise demand and infrastructure investment."
```

The signal is short, attributable, and time-aware. The narrative may synthesize and explain multiple signals, but that responsibility does not belong to Business Signal Intelligence.

## 6. Signal Categories

Future signal categories may include:

- Revenue Signals
- Margin Signals
- Growth Signals
- Customer Signals
- Product Signals
- Competitive Signals
- Dependency Signals
- Operational Signals
- Capital Allocation Signals
- Management Commentary Signals

These categories define ownership and intent only. They do not define a schema.

Signal categories should help downstream systems understand what kind of business movement was observed. They should not become company facts, explanations, recommendations, or frontend presentation models.

## 7. Signal Lifecycle

```text
Source Intelligence
    ↓
Signal Detection
    ↓
Business Signal Intelligence
    ↓
Quarter Understanding
    ↓
Owner Questions
```

Signals are inputs to later intelligence layers.

Source Intelligence provides structured evidence. Signal Detection identifies noteworthy observations. Business Signal Intelligence preserves those observations as a signal layer. Quarter Understanding explains their meaning. Owner Questions may later convert that understanding into useful questions for a business owner.

Signals do not skip ahead in the lifecycle. They should not explain themselves as quarter understanding, and they should not become owner questions.

## 8. Required Signal Characteristics

Future signals should conceptually support:

- Direction
- Magnitude
- Evidence
- Category
- Confidence

Direction matters because signals often describe movement, such as strengthening, weakening, increasing, decreasing, accelerating, decelerating, emerging, or disappearing.

Magnitude matters because not every movement deserves the same attention. A small wording change and a major operating shift should not be treated as equivalent.

Evidence matters because every signal must be attributable to source intelligence. Signals should remain auditable.

Category matters because downstream systems need to distinguish revenue movement from operational movement, customer movement, competitive movement, and other signal types.

Confidence matters because not every signal will have the same quality or coverage. Confidence should help later layers decide how much weight to give a signal.

This section is conceptual only. It does not define fields, TypeScript types, storage shape, or schema contracts.

## 9. Ownership Boundaries

Business Signal Intelligence may:

- Detect signals
- Classify signals
- Prioritize signals

Business Signal Intelligence may not:

- Explain signals
- Recommend actions
- Generate owner questions
- Modify Company Knowledge
- Redefine company facts
- Produce narratives

Business Signal Intelligence is responsible for observation quality. Later layers are responsible for interpretation, owner-facing questions, and presentation.

## 10. Non Goals

This phase does not define:

- Schemas
- Storage
- Repositories
- Builders
- Prompts
- Enrichment
- TypeScript contracts
- Generated artifacts
- Dashboards
- Narratives
- Owner questions

This document is a semantic definition contract only.


## Signal Persistence Principle

Business Signals are snapshots of observed business movement at the
time of detection.

Signals may expire, weaken, strengthen, or disappear in future periods.

Unlike Company Knowledge, signals are not expected to be durable
business facts.

Signals represent observations, not permanent truth.