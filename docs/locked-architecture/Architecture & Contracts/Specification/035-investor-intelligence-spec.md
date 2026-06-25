# Investor Intelligence Specification

Status: LOCKED

## 1. Purpose

Investor Intelligence exists to answer the five Ownership Questions.

The five Ownership Questions are:

### Q1 Ownership

What does this company actually sell?

### Q2 Ownership

Where does the next rupee come from?

### Q3 Ownership

Can the story be trusted?

### Q4 Ownership

Is the story already too expensive?

### Q5 Ownership

Why would I hold it and what would change that?

Investor Intelligence is the only layer in the architecture that directly answers these questions.

All upstream layers contribute evidence.

Investor Intelligence produces conclusions.

---

## 2. Position In Architecture

```text
Company Knowledge
        +
Business Signals
        +
Trust Signals
        +
Quarter Understanding
        +
Topic Evolution
        +
Market Data (Q4)
        ↓
Investor Intelligence
        ↓
Partner Domain
```

Investor Intelligence is the terminal intelligence layer.

Partner Domain presents Investor Intelligence.

Partner Domain does not generate intelligence.

---

## 3. Core Responsibility

Investor Intelligence synthesizes all approved upstream intelligence into owner-oriented business understanding.

Investor Intelligence owns:

* Ownership reasoning
* Trust conclusions
* Ownership thesis construction
* Change-condition identification
* Evidence synthesis across domains
* Q1–Q5 answers

Investor Intelligence does not create new evidence.

Investor Intelligence does not create new signals.

Investor Intelligence does not perform filing extraction.

Investor Intelligence does not re-run upstream intelligence.

---

## 4. Inputs

### Required Inputs

#### Company Knowledge

Required for:

* Q1
* Q2
* Q5

Company Knowledge provides canonical business understanding.

---

#### Quarter Understanding

Required for:

* Q2
* Q3
* Q5

Quarter Understanding provides period interpretation.

---

## 5. Enrichment Inputs

### Business Signals

Used as supporting evidence for:

* Q2
* Q5

Business Signals provide observable business movement.

---

### Trust Signals

Used as supporting evidence for:

* Q3
* Q5

Trust Signals provide observable management behavior.

---

### Topic Evolution

Used as supporting evidence for:

* Q2
* Q5

Topic Evolution provides longitudinal narrative behavior.

---

### Commitment Tracking

Used as supporting evidence for:

* Q3

Commitment history provides longitudinal trust depth.

---

### Prior Investor Intelligence

Used for:

* Ownership thesis evolution
* Thesis change detection

---

### Market Data

Used only for:

* Q4

Without Market Data, Q4 cannot be fully answered.

---

## 6. Forbidden Inputs

### Filing Artifact

Forbidden.

Investor Intelligence must never read filings directly.

---

### Evidence Catalog

Forbidden.

Investor Intelligence consumes intelligence artifacts.

It does not consume raw evidence.

---

### Themes

Forbidden.

Themes belong upstream.

Investor Intelligence consumes synthesized outputs.

---

### Structured Intelligence

Forbidden.

Company Knowledge and Quarter Understanding already own the promoted interpretation path.

Investor Intelligence should not bypass architecture.

---

### Quarter Change

Forbidden.

Quarter Understanding owns interpretation of Quarter Change.

Investor Intelligence consumes the interpretation.

---

### Trust Pillars

Forbidden.

Investor Intelligence consumes Trust Signals.

It does not consume raw trust evidence.

---

## 7. Ownership Model

Investor Intelligence owns conclusions.

Upstream layers own evidence.

### Upstream Layers Answer:

```text
What happened?
```

### Investor Intelligence Answers:

```text
What does this mean for an owner?
```

This is the defining boundary.

---

## 8. Q1 Ownership

### Question

What does this company actually sell?

### Primary Source

Company Knowledge

### Supporting Sources

Quarter Understanding

### Purpose

Describe the business in owner language.

Q1 should explain:

* Products
* Services
* Customers
* Revenue model
* Value creation

Q1 must reflect canonical Company Knowledge.

Q1 must not merely repeat filing language.

---

## 9. Q2 Ownership

### Question

Where does the next rupee come from?

### Primary Sources

Company Knowledge

Quarter Understanding

### Supporting Sources

Business Signals

Topic Evolution

### Purpose

Explain future business performance drivers.

Q2 should identify:

* Revenue drivers
* Growth engines
* Business expansion mechanisms
* Demand drivers

Q2 is not a forecast.

Q2 explains where future business performance is expected to originate based on available evidence.

---

## 10. Q3 Ownership

### Question

Can the story be trusted?

### Primary Sources

Quarter Understanding

Trust Signals

### Supporting Sources

Commitment Tracking

Topic Evolution

### Purpose

Synthesize trust evidence.

Q3 owns the trust verdict.

No other layer may produce a trust verdict.

Q3 may conclude:

* Trust strengthened
* Trust stable
* Trust weakened
* Insufficient evidence

Q3 must explain:

* Why
* Which trust dimensions contributed
* Which evidence supports the conclusion

---

## 11. Q4 Ownership

### Question

Is the story already too expensive?

### Primary Source

Market Data

### Supporting Sources

Company Knowledge

Quarter Understanding

### Purpose

Assess valuation relative to business understanding.

Q4 requires market data.

Without market data:

```text
status = insufficient_inputs
```

Investor Intelligence must not invent valuation conclusions.

---

## 12. Q5 Ownership

### Question

Why would I hold it and what would change that?

### Primary Sources

Company Knowledge

Quarter Understanding

### Supporting Sources

Business Signals

Trust Signals

Topic Evolution

Prior Investor Intelligence

### Purpose

Construct the ownership thesis.

Q5 explains:

* Why the business is owned
* What assumptions support ownership
* What conditions support continued ownership
* What conditions would challenge ownership

Q5 owns change-condition identification.

No other layer owns change conditions.

---

## 13. Allowed Reasoning

Investor Intelligence may:

* Synthesize evidence across layers
* Produce ownership conclusions
* Produce trust conclusions
* Produce ownership thesis reasoning
* Explain business significance
* Explain signal significance
* Explain trust significance
* Explain change conditions
* Explain business implications

Investor Intelligence is the first layer permitted to reason directly from an owner perspective.

---

## 14. Forbidden Reasoning

### No Filing Extraction

Invalid:

Re-reading MD&A paragraphs.

Reason:

Themes and Structured Intelligence own extraction.

---

### No Signal Generation

Invalid:

Creating new Business Signals.

Reason:

Business Signals owns signal derivation.

---

### No Trust Signal Generation

Invalid:

Creating new Trust Signals.

Reason:

Trust Architecture owns trust observations.

---

### No Company Knowledge Creation

Invalid:

Declaring new durable facts.

Reason:

Governance owns Company Knowledge promotion.

---

### No Bypassing Architecture

Invalid:

Using filing text instead of Company Knowledge.

Reason:

Investor Intelligence consumes intelligence artifacts, not raw evidence.

---

## 15. Output Structure

Investor Intelligence produces:

### Q1 Section

Answer

Evidence Package

Confidence

Status

---

### Q2 Section

Answer

Evidence Package

Confidence

Status

---

### Q3 Section

Answer

Evidence Package

Confidence

Status

---

### Q4 Section

Answer

Evidence Package

Confidence

Status

---

### Q5 Section

Answer

Evidence Package

Confidence

Status

---

## 16. Ownership Boundaries

### Quarter Understanding vs Investor Intelligence

| Dimension | Quarter Understanding  | Investor Intelligence             |
| --------- | ---------------------- | --------------------------------- |
| Question  | What happened and why? | What does this mean for an owner? |
| Output    | Interpretation         | Ownership conclusion              |
| Trust     | Trust interpretation   | Trust verdict                     |
| Revenue   | Revenue interpretation | Ownership impact                  |

---

### Company Knowledge vs Investor Intelligence

| Dimension | Company Knowledge                  | Investor Intelligence                         |
| --------- | ---------------------------------- | --------------------------------------------- |
| Purpose   | Canonical business truth           | Ownership reasoning                           |
| Example   | Cloud is the primary revenue model | Cloud remains central to the ownership thesis |

---

### Business Signals vs Investor Intelligence

| Dimension | Business Signals           | Investor Intelligence                             |
| --------- | -------------------------- | ------------------------------------------------- |
| Purpose   | Observation                | Meaning                                           |
| Example   | Cloud demand strengthening | Cloud demand supports future business performance |

---

### Trust Signals vs Investor Intelligence

| Dimension | Trust Signals        | Investor Intelligence                                        |
| --------- | -------------------- | ------------------------------------------------------------ |
| Purpose   | Trust observations   | Trust conclusion                                             |
| Example   | Commitment abandoned | Trust weakened because commitments were repeatedly abandoned |

---

## 17. Relationship To Partner Domain

Investor Intelligence is the final intelligence artifact.

Partner Domain consumes Investor Intelligence.

Partner Domain may:

* Format
* Prioritize
* Present

Partner Domain may not:

* Create intelligence
* Modify ownership conclusions
* Generate new Q1–Q5 answers

---

## 18. Golden Rule

Investor Intelligence is the only layer allowed to answer the Ownership Questions.

Every upstream layer contributes evidence.

Investor Intelligence produces the ownership conclusions.

No upstream layer may answer Q1, Q2, Q3, Q4, or Q5 directly.
