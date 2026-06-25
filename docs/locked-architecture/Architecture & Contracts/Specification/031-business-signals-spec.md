# Business Signals Specification

Status: LOCKED

## 1. Purpose

Business Signals exists to answer:

> What is observably true about this business right now and how is it moving?

Business Signals converts structured upstream intelligence into deterministic, typed business observations.

Business Signals is an observation layer.

Business Signals is not an interpretation layer.

Business Signals is not an ownership layer.

Business Signals does not explain what signals mean.

Business Signals does not evaluate whether signals are positive or negative.

Business Signals only describes observable business conditions and business movement.

---

## 2. Position In Architecture

```text
Company Knowledge
        +
Quarter Change
        +
Topic Evolution
        ↓
Business Signals
        ↓
Quarter Understanding
```

Company Knowledge provides durable business understanding.

Quarter Change provides current-period business deltas.

Topic Evolution provides multi-period behavioral patterns.

Business Signals transforms those inputs into structured observations.

Quarter Understanding later interprets those observations.

---

## 3. Inputs

### Required Inputs

* Company Knowledge

Business Signals cannot exist without Company Knowledge.

Company Knowledge provides the durable baseline against which observations are generated.

---

### Enrichment Inputs

* Quarter Change
* Topic Evolution

Quarter Change contributes current-period movement.

Topic Evolution contributes multi-period behavioral patterns.

Business Signals remains functional without enrichments.

---

## 4. Forbidden Inputs

* Filing Artifact
* Evidence Catalog
* Themes
* Structured Intelligence
* Trust Signals
* Quarter Understanding
* Investor Intelligence
* Market Data

### Why Structured Intelligence Is Forbidden

Structured Intelligence is filing-scoped.

Business Signals operates on governed business understanding and approved enrichments.

Business Signals must not bypass Company Knowledge.

### Why Trust Signals Are Forbidden

Trust Architecture owns trust observations.

Business Signals owns business observations.

Trust and business remain separate until Quarter Understanding.

### Why Quarter Understanding Is Forbidden

Quarter Understanding interprets signals.

Business Signals generates signals.

### Why Investor Intelligence Is Forbidden

Investor Intelligence owns ownership reasoning.

Business Signals owns observations.

---

## 5. Core Principle

Business Signals must describe:

* What exists
* What changed
* What persisted
* What strengthened
* What weakened

Business Signals must not describe:

* Why it happened
* Whether it is good
* Whether it is bad
* Whether investors should care

---

## 6. Signal Definition

A Business Signal is:

> A deterministic observation about the state or movement of the business derived from structured upstream intelligence.

Every signal must be:

* Typed
* Evidence-backed
* Deterministic
* Traceable
* Reproducible

Signals are observations.

Signals are not conclusions.

---

## 7. Signal Classes

### Durable Signals

Derived from Company Knowledge.

Purpose:

Describe stable characteristics of the business.

Examples:

* Cloud Revenue Model Present
* Enterprise Customer Base Present
* Subscription Revenue Present
* Semiconductor Dependency Present

These signals describe business state.

---

### Change Signals

Derived from Quarter Change.

Purpose:

Describe current-period movement.

Examples:

* AI Infrastructure Priority Strengthening
* Commercial Cloud Emphasis Expansion
* Gaming Revenue Driver Weakening
* Supply Constraint Risk Appeared

These signals describe business movement.

---

### Trend Signals

Derived from Topic Evolution.

Purpose:

Describe multi-period patterns.

Examples:

* AI Investment Narrative Strengthening
* Cloud Consumption Topic Persistent
* Security Topic Increasing
* Gaming Topic Weakening

These signals describe business trajectory.

---

## 8. Allowed Signal Directions

Signals may use only:

* strengthening
* weakening
* stable
* appearing
* disappearing
* expanding
* contracting
* persistent

Signals may not use:

* positive
* negative
* attractive
* concerning
* favorable
* unfavorable
* bullish
* bearish

Those are interpretations.

---

## 9. Allowed Reasoning

Business Signals may:

* Derive observations from Company Knowledge.
* Classify Quarter Change outputs.
* Classify Topic Evolution outputs.
* Normalize business movement into signal structures.
* Aggregate related observations.
* Assign confidence.
* Assign signal categories.
* Attach evidence lineage.

Business Signals may organize.

Business Signals may classify.

Business Signals may not interpret.

---

## 10. Forbidden Reasoning

### No Causal Reasoning

Invalid:

"Cloud demand strengthened because AI adoption increased."

Reason:

Cause attribution belongs downstream.

---

### No Business Judgments

Invalid:

"The company has a strong cloud position."

Reason:

This is evaluation.

---

### No Investor Conclusions

Invalid:

"This improves the investment case."

Reason:

Investor Intelligence owns investment reasoning.

---

### No Trust Conclusions

Invalid:

"Management appears credible."

Reason:

Trust Architecture owns trust observations.

---

### No Strategic Assessment

Invalid:

"The company's AI strategy is working."

Reason:

Business Signals may observe expansion.

Business Signals cannot assess success.

---

### No Forecasting

Invalid:

"This will drive future growth."

Reason:

Forecasting belongs downstream.

---

## 11. Output Structure

Every signal must contain:

### signal_type

Examples:

* revenue_driver
* customer
* product
* strategy
* dependency
* competition
* risk
* operating_model

---

### signal_name

Examples:

* Cloud Consumption
* AI Infrastructure
* Enterprise Customers
* Subscription Revenue

---

### signal_direction

One of:

* strengthening
* weakening
* stable
* appearing
* disappearing
* expanding
* contracting
* persistent

---

### confidence

Deterministic confidence derived from evidence coverage and signal consistency.

---

### evidence_refs

Traceable references to upstream artifacts.

---

### lineage

Source artifacts used to derive the signal.

---

## 12. Ownership Boundaries

### Quarter Change vs Business Signals

| Dimension | Quarter Change                          | Business Signals                           |
| --------- | --------------------------------------- | ------------------------------------------ |
| Purpose   | Detect deltas                           | Produce observations                       |
| Output    | Change records                          | Typed signals                              |
| Example   | AI infrastructure priority strengthened | Strategic Investment Signal: strengthening |

Quarter Change identifies change.

Business Signals classifies change.

---

### Business Signals vs Trust Signals

| Dimension | Business Signals           | Trust Signals       |
| --------- | -------------------------- | ------------------- |
| Domain    | Business behavior          | Management behavior |
| Focus     | Business movement          | Trust evidence      |
| Example   | Cloud demand strengthening | Commitment overdue  |

Business Signals never produce trust observations.

Trust Signals never produce business observations.

---

### Business Signals vs Quarter Understanding

| Dimension | Business Signals                   | Quarter Understanding                                     |
| --------- | ---------------------------------- | --------------------------------------------------------- |
| Question  | What is true?                      | Why does it matter?                                       |
| Output    | Observation                        | Interpretation                                            |
| Example   | AI investment signal strengthening | AI investment became more important to business execution |

Business Signals never answer why.

Quarter Understanding owns why.

---

## 13. Relationship To Ownership Questions

### Q1 Ownership

What does this company actually sell?

Business Signals contribute supporting evidence only.

Company Knowledge owns the canonical answer.

---

### Q2 Ownership

Where does the next rupee come from?

Business Signals contribute primary observable revenue signals.

Investor Intelligence owns the answer.

---

### Q3 Ownership

Can the story be trusted?

Business Signals contribute supporting business observations only.

Trust Architecture owns trust evidence.

---

### Q4 Ownership

Is the story already too expensive?

Business Signals contribute nothing.

---

### Q5 Ownership

Why would I hold it and what would change that?

Business Signals provide observable change evidence.

Investor Intelligence determines whether those changes matter.

---

## 14. Golden Rule

Business Signals do not explain.

Business Signals do not evaluate.

Business Signals do not predict.

Business Signals do not recommend.

Business Signals only describe what is observably true about the business and how that business is moving.
