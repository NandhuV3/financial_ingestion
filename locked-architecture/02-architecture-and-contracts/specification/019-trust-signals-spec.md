# Trust Signals Specification

Status: LOCKED

## 1. Purpose

Trust Signals exists to answer:

> What is observably true about management behavior?

Trust Signals converts Trust Architecture evidence into deterministic, typed trust observations.

Trust Signals is an observation layer.

Trust Signals is not an interpretation layer.

Trust Signals is not a trust-verdict layer.

Trust Signals does not determine whether management is trustworthy.

Trust Signals only describes observable management behavior.

---

## 2. Position In Architecture

```text
Commitment Tracking
        +
Narrative Consistency
        +
Accounting Stability
        +
Capital Allocation Tracking
        ↓
      Trust Signals
        ↓
   Quarter Understanding
        ↓
 Investor Intelligence (Q3)
```

Trust Signals aggregates observations from Trust Architecture pillars.

Trust Signals does not produce trust conclusions.

Quarter Understanding interprets trust observations.

Investor Intelligence produces the Q3 ownership answer.

---

## 3. Inputs

### Minimum Required Input

* Commitment Tracking

Trust Signals requires at least Commitment Tracking.

A Trust Signals artifact may be generated with only Commitment Tracking available.

---

### Enrichment Inputs

* Narrative Consistency
* Accounting Stability
* Capital Allocation Tracking

Additional pillars enrich trust depth and coverage.

Trust Signals must remain functional when enrichment inputs are absent.

---

## 4. Forbidden Inputs

* Filing Artifact
* Evidence Catalog
* Themes
* Structured Intelligence
* Company Knowledge
* Quarter Change
* Business Signals
* Quarter Understanding
* Investor Intelligence
* Market Data

### Why Company Knowledge Is Forbidden

Trust Signals evaluates management behavior.

Trust Signals does not evaluate business structure.

---

### Why Business Signals Are Forbidden

Business Signals owns business observations.

Trust Signals owns management behavior observations.

The domains remain separate.

---

### Why Quarter Understanding Is Forbidden

Quarter Understanding interprets observations.

Trust Signals generates observations.

---

### Why Investor Intelligence Is Forbidden

Investor Intelligence owns trust conclusions.

Trust Signals owns trust evidence.

---

## 5. Core Principle

Trust Signals describes:

* observed management behavior
* observed commitment behavior
* observed narrative behavior
* observed accounting behavior
* observed capital allocation behavior

Trust Signals does not describe:

* whether management is trustworthy
* whether management is credible
* whether investors should trust management
* whether a trust signal matters

---

## 6. Signal Definition

A Trust Signal is:

> A deterministic observation about management behavior derived from Trust Architecture evidence.

Every signal must be:

* deterministic
* reproducible
* evidence-backed
* traceable
* typed

Signals are observations.

Signals are not verdicts.

---

## 7. Trust Signal Dimensions

### Commitment Dimension

Derived from:

* Commitment Tracking

Purpose:

Observe management follow-through behavior.

Examples:

* Commitment Fulfilled
* Commitment Revised
* Commitment Abandoned
* Commitment Overdue

---

### Narrative Dimension

Derived from:

* Narrative Consistency

Purpose:

Observe management communication behavior.

Examples:

* Strategic Priority Persisted
* Strategic Priority Dropped
* Narrative Reframed
* Language Shift Detected
* Explanation Quality Generic

---

### Accounting Dimension

Derived from:

* Accounting Stability

Purpose:

Observe financial reporting behavior.

Examples:

* Accounting Policy Change
* Segment Redefinition
* Restatement Issued
* Non-GAAP Gap Widening

---

### Capital Allocation Dimension

Derived from:

* Capital Allocation Tracking

Purpose:

Observe capital deployment behavior.

Examples:

* Capital Allocation Consistent
* Capital Allocation Divergence
* Priority Not Funded
* Deployment Aligned

---

## 8. Allowed Signal Directions

Trust Signals may use:

* strengthening
* weakening
* stable
* appearing
* disappearing
* persistent

Trust Signals may not use:

* trustworthy
* untrustworthy
* credible
* not credible
* positive
* negative
* concerning
* reassuring

Those are interpretations.

---

## 9. Allowed Reasoning

Trust Signals may:

* classify pillar observations
* assign trust dimensions
* assign signal direction
* assign signal severity
* aggregate related trust observations
* attach evidence references
* compute confidence

Trust Signals may organize trust evidence.

Trust Signals may not interpret trust evidence.

---

## 10. Forbidden Reasoning

### No Trust Verdicts

Invalid:

Management can be trusted.

Reason:

Investor Intelligence owns trust conclusions.

---

### No Credibility Judgments

Invalid:

Management appears credible.

Reason:

Credibility is an interpretation.

---

### No Investor Conclusions

Invalid:

Investors should be concerned.

Reason:

Investor Intelligence owns investor reasoning.

---

### No Causal Explanations

Invalid:

Management abandoned the commitment because demand weakened.

Reason:

Trust Signals records abandonment.

It does not explain why.

---

### No Materiality Judgments

Invalid:

This is a serious trust issue.

Reason:

Severity may be classified.

Significance belongs downstream.

---

## 11. Output Structure

Every signal must contain:

### signal_dimension

One of:

* commitment
* narrative
* accounting
* capital_allocation

---

### signal_type

Examples:

* commitment_abandoned
* commitment_overdue
* strategic_priority_dropped
* language_shift_significant
* restatement_issued
* non_gaap_gap_widening

---

### signal_direction

One of:

* strengthening
* weakening
* stable
* appearing
* disappearing
* persistent

---

### severity

One of:

* low
* medium
* high

Severity is classification.

Severity is not interpretation.

---

### confidence

Deterministic confidence derived from evidence depth.

---

### evidence_refs

Traceable references to pillar evidence.

---

### lineage

Source pillar artifacts.

---

## 12. Ownership Boundaries

### Trust Pillars vs Trust Signals

| Dimension | Trust Pillars          | Trust Signals              |
| --------- | ---------------------- | -------------------------- |
| Purpose   | Produce trust evidence | Produce trust observations |
| Output    | Records                | Signals                    |
| Example   | Commitment overdue     | Commitment Overdue Signal  |

Trust Pillars create evidence.

Trust Signals create observations.

---

### Business Signals vs Trust Signals

| Dimension | Business Signals           | Trust Signals       |
| --------- | -------------------------- | ------------------- |
| Domain    | Business behavior          | Management behavior |
| Example   | Cloud Demand Strengthening | Commitment Overdue  |

Business Signals never generate trust observations.

Trust Signals never generate business observations.

---

### Trust Signals vs Quarter Understanding

| Dimension | Trust Signals            | Quarter Understanding                                                          |
| --------- | ------------------------ | ------------------------------------------------------------------------------ |
| Question  | What happened?           | Why does it matter?                                                            |
| Output    | Observation              | Interpretation                                                                 |
| Example   | Narrative Shift Detected | Narrative changes became more central to management communication this quarter |

Trust Signals never answer why.

Quarter Understanding owns why.

---

### Trust Signals vs Investor Intelligence

| Dimension | Trust Signals        | Investor Intelligence                                              |
| --------- | -------------------- | ------------------------------------------------------------------ |
| Purpose   | Trust observations   | Trust conclusion                                                   |
| Example   | Commitment Abandoned | Story trust weakened because commitments were repeatedly abandoned |

Only Investor Intelligence answers Q3.

---

## 13. Relationship To Ownership Questions

### Q1 Ownership

What does this company actually sell?

Trust Signals contribute nothing.

---

### Q2 Ownership

Where does the next rupee come from?

Trust Signals contribute nothing.

---

### Q3 Ownership

Can the story be trusted?

Trust Signals provide primary trust evidence.

Trust Signals do not answer the question.

Investor Intelligence owns the answer.

---

### Q4 Ownership

Is the story already too expensive?

Trust Signals contribute nothing.

---

### Q5 Ownership

Why would I hold it and what would change that?

Trust Signals provide trust-related change evidence.

Investor Intelligence determines whether that evidence affects the ownership thesis.

---

## 14. Golden Rule

Trust Signals do not determine whether management can be trusted.

Trust Signals do not determine whether management is credible.

Trust Signals do not explain trust observations.

Trust Signals only describe observable management behavior.
