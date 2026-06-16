# 004-business-signals.md

# Purpose

Business Signals is the deterministic observation layer of the platform.

It answers:

"What is observably true right now, and how is it moving?"

Business Signals exists to transform structured artifacts into atomic, typed, replayable observations.

It does not explain.

It does not interpret.

It does not conclude.

It only observes.

---

# Architectural Position

Company Knowledge
        ↓
Quarter Change
        ↓
Topic Evolution
        ↓
Business Signals
        ↓
Quarter Understanding

Business Signals is the final deterministic layer before investor interpretation begins.

---

# Ownership

Business Signals owns:

- Durable business signals
- Trend signals
- Movement signals
- Operational signals
- Strategic signals

All signals must be:

- Typed
- Deterministic
- Replayable
- Auditable

---

# Does Not Own

Business Signals never owns:

- Interpretation
- Recommendations
- Conclusions
- Investor insights
- Trust Signals
- Trust Signal lifecycle
- Trust evidence ownership
- Management credibility verdicts
- Narrative explanations

Those belong downstream.

---

# Inputs

## Company Knowledge

Provides:

- Business Model
- Revenue Structure
- Revenue Drivers
- Competitive Position
- Strategic Priorities

## Quarter Change

Provides:

- Appeared
- Disappeared
- Strengthened
- Weakened

## Topic Evolution

Provides:

- Emerging
- Growing
- Stable
- Declining

# Signal Categories

## Business Signals

Examples:

- REVENUE_DRIVER_STRENGTHENING
- REVENUE_DRIVER_WEAKENING
- COMPETITIVE_POSITION_IMPROVING
- COMPETITIVE_POSITION_DECLINING

---

## Strategic Signals

Examples:

- STRATEGIC_PRIORITY_EMERGING
- STRATEGIC_PRIORITY_ABANDONED
- STRATEGIC_PRIORITY_STRENGTHENING

---

## Operational Signals

Examples:

- DEPENDENCY_INCREASING
- DEPENDENCY_DECREASING
- CUSTOMER_CONCENTRATION_INCREASING

---

# Signal Structure

Every signal follows a common schema.

```typescript
type BusinessSignal = {
  signal_id: string;

  signal_type: string;

  category:
    | "business"
    | "strategic"
    | "operational";

  company_id: string;

  period_id: string;

  severity:
    | "low"
    | "medium"
    | "high";

  evidence: string[];

  generated_at: string;
}
```

# Signal Generation

Signal generation is fully deterministic.

No LLM allowed.

Rules derive signals from:

- Company Knowledge
- Quarter Change
- Topic Evolution

Every signal must have:

- Explicit rule
- Explicit evidence
- Explicit lineage

---

# Architectural Rules

## Rule 1

Business Signals never use LLMs.

LOCKED.

## Rule 2

Signals are observations only.

LOCKED.

## Rule 3

Signals must be replayable.

LOCKED.

## Rule 4

Signals must contain evidence references.

LOCKED.

# Trust Boundary

Business Signals owns deterministic business observations.

Business Signals does not generate Trust Signals.

Trust Signals are owned by Trust Architecture.

Trust Architecture consists of:

* Commitment Tracking
* Narrative Consistency
* Accounting Stability
* Trust Signals

Business Signals and Trust Signals are independent artifacts.

Quarter Understanding may consume:

* Business Signals
* Trust Signals

through separate inputs.

LOCKED.

---

# Scaling Considerations

Future architecture must support:

- Sector-aware signals
- Geography-aware signals
- Industry-specific thresholds

Example:

A margin signal for SaaS and a margin signal for a commodity producer should not use the same evaluation thresholds.

Sector-aware signal taxonomy is a future requirement.

---

# Output

Business Signals produces:

business-signals/current.json

and

business-signals/archive/

These become the primary inputs to Quarter Understanding.

---

# Final Principle

Business Signals answers:

"What happened?"

Quarter Understanding answers:

"So what?"

Never mix these responsibilities.

LOCKED.
