# 025-company-knowledge-spec.md

Status: LOCKED

## 1. Purpose

Company Knowledge exists to answer:

> What is canonically true about this business?

Company Knowledge is the durable, governed, slow-changing business memory of the platform.

Structured Intelligence changes every filing.

Quarter Understanding changes every quarter.

Investor Intelligence changes whenever ownership conclusions change.

Company Knowledge exists to maintain stable business understanding across time.

It serves as the canonical reference layer for understanding what a business is, how it operates, how it generates revenue, who it serves, and what durable characteristics define it.

Company Knowledge does not describe what happened this quarter.

Company Knowledge does not describe what management discussed in a filing.

Company Knowledge does not produce investor conclusions.

Company Knowledge maintains durable business understanding accumulated through governance.

---

## 2. Position In Architecture

```text
Themes
↓
Structured Intelligence
↓
Company Knowledge Candidate
↓
Governance Promotion
↓
Company Knowledge
↓
Quarter Change
↓
Business Signals
```

Ownership by layer:

| Layer                       | Responsibility                           |
| --------------------------- | ---------------------------------------- |
| Themes                      | Filing-scoped observation clusters       |
| Structured Intelligence     | Filing-scoped business understanding     |
| Company Knowledge Candidate | Proposed updates to durable knowledge    |
| Governance Promotion        | Promotion decisions                      |
| Company Knowledge           | Canonical durable business understanding |
| Quarter Change              | Detect business-level change             |
| Business Signals            | Produce typed business observations      |

Company Knowledge sits between governance and signal generation.

It is the authoritative business memory layer.

---

## 3. Inputs

### Direct Inputs

Company Knowledge accepts only:

* Governance Promotion Decisions

Company Knowledge does not directly consume filings.

Company Knowledge does not directly consume Themes.

Company Knowledge does not directly consume Structured Intelligence.

All updates must flow through governance.

---

### Forbidden Inputs

#### Filing Artifact

Reason:

Company Knowledge is not a filing interpretation layer.

---

#### Evidence Identity

Reason:

Evidence Identity supports traceability, not durable business understanding.

---

#### Themes

Reason:

Themes are filing-scoped observations.

Company Knowledge contains durable knowledge.

---

#### Topic Assignment

Reason:

Topic classification is not canonical business understanding.

---

#### Topic Evolution

Reason:

Topic behavior over time is not business knowledge.

---

#### Structured Intelligence

Reason:

Structured Intelligence proposes understanding.

Governance determines whether understanding becomes knowledge.

---

#### Quarter Change

Reason:

Company Knowledge stores durable understanding, not deltas.

---

#### Business Signals

Reason:

Signals describe movement.

Knowledge describes identity.

---

#### Trust Signals

Reason:

Trust observations are separate from business knowledge.

---

#### Quarter Understanding

Reason:

Interpretation is not durable knowledge.

---

#### Investor Intelligence

Reason:

Ownership conclusions are not business knowledge.

---

#### Market Data

Reason:

Market pricing is external and non-durable.

---

## 4. Purpose Of Company Knowledge Candidate

Company Knowledge Candidate exists to propose updates.

It does not update Company Knowledge.

It does not create canonical truth.

It does not make governance decisions.

Its purpose is to compare:

```text
Current Structured Intelligence
vs
Current Company Knowledge
```

and produce candidate changes.

Candidate outputs may include:

* proposed additions
* proposed removals
* proposed modifications
* proposed merges

Every proposal remains non-canonical until governance approval.

---

## 5. Purpose Of Governance Promotion

Governance Promotion exists to decide.

Governance Promotion is the gatekeeper between understanding and knowledge.

Responsibilities:

* Evaluate candidate updates
* Apply promotion rules
* Require review when necessary
* Preserve auditability
* Produce promotion decisions

Governance Promotion owns:

```text
Promote
Reject
Merge
Retain Existing
Escalate For Review
```

Company Knowledge never self-updates.

---

## 6. What Company Knowledge Contains

### business_model

Purpose:

Canonical description of how the company creates value.

Durability Expectation:

Very slow changing.

Examples:

* Subscription software model
* Cloud consumption model
* Transaction and marketplace model

---

### products

Purpose:

Durable product and service portfolio.

Durability Expectation:

Slow changing.

Examples:

* Azure
* Microsoft 365
* Windows

---

### customer_segments

Purpose:

Canonical customer groups.

Durability Expectation:

Slow changing.

Examples:

* Enterprise organizations
* Public sector organizations
* Consumers

---

### revenue_model

Purpose:

Durable revenue generation structure.

Durability Expectation:

Very slow changing.

Examples:

* Subscription revenue
* Consumption revenue
* Licensing revenue

---

### revenue_drivers

Purpose:

Recurring business drivers consistently observed across filings.

Durability Expectation:

Moderately slow changing.

Examples:

* Azure consumption
* Commercial subscriptions
* Productivity software adoption

---

### competitive_positioning

Purpose:

Durable competitive positioning accepted through governance.

Durability Expectation:

Slow changing.

Examples:

* Enterprise software ecosystem
* Cloud platform provider
* Productivity platform provider

---

### strategic_priorities

Purpose:

Long-duration priorities repeatedly supported across filings.

Durability Expectation:

Moderately slow changing.

Examples:

* AI infrastructure
* Cloud platform expansion
* Security platform development

---

### dependencies

Purpose:

Durable business dependencies.

Durability Expectation:

Slow changing.

Examples:

* Datacenter capacity
* Semiconductor supply
* Partner ecosystem

---

## 7. What Company Knowledge Must Never Contain

### Quarter-Specific Results

Invalid:

* Revenue increased 18%
* Margin declined 3%

Owner:

Quarter Change

---

### Filing-Specific Narratives

Invalid:

* Management emphasized AI investment this filing

Owner:

Themes

---

### Temporary Management Focus

Invalid:

* Cost discipline was highlighted this quarter

Owner:

Structured Intelligence

---

### Trust Conclusions

Invalid:

* Management is trustworthy

Owner:

Investor Intelligence

---

### Trust Signals

Invalid:

* Commitment overdue

Owner:

Trust Signals

---

### Topic Evolution Signals

Invalid:

* AI discussion strengthened for six quarters

Owner:

Topic Evolution

---

### Quarter Changes

Invalid:

* Revenue driver emphasis increased

Owner:

Quarter Change

---

### Investor Conclusions

Invalid:

* Attractive long-term investment

Owner:

Investor Intelligence

---

### Valuation Conclusions

Invalid:

* Shares are expensive

Owner:

Investor Intelligence Q4

---

## 8. Durable vs Filing-Scoped Boundary

| Filing Scoped (Structured Intelligence)                           | Durable Knowledge (Company Knowledge)                     |
| ----------------------------------------------------------------- | --------------------------------------------------------- |
| This filing describes cloud as a primary revenue driver           | Cloud is a canonical revenue driver                       |
| This filing identifies AI infrastructure investment as a priority | AI infrastructure is a durable strategic priority         |
| Management states enterprise customers are a focus area           | Enterprise customers are a durable customer segment       |
| This filing describes subscription revenue as important           | Subscription revenue is part of the durable revenue model |
| Management identifies datacenter capacity as important            | Datacenter capacity is a durable dependency               |

Structured Intelligence describes.

Company Knowledge remembers.

---

## 9. Governance Principles

### Governance Required

Company Knowledge may only change through governance.

---

### Single Filing Protection

A single filing cannot overwrite Company Knowledge.

---

### Promotion Required

Durable knowledge requires promotion.

---

### Conflict Handling

Conflicting evidence requires governance review.

---

### Auditability

Every knowledge change must be traceable.

---

### Versioning

Company Knowledge must be versioned.

---

### Lineage

Every knowledge item must retain lineage to promoted evidence.

---

### Stability

Company Knowledge changes slower than filings.

---

## 10. Examples Of Valid Company Knowledge

1. Cloud services are part of the company's core offering portfolio.
2. Enterprise organizations are a primary customer segment.
3. Subscription revenue is part of the revenue model.
4. Consumption-based pricing is part of the revenue model.
5. Azure is part of the product portfolio.
6. Microsoft 365 is part of the product portfolio.
7. AI infrastructure investment is a durable strategic priority.
8. Datacenter capacity is a durable operational dependency.
9. Productivity software is part of the offering portfolio.
10. Security offerings are part of the product portfolio.

---

## 11. Examples Of Invalid Company Knowledge

### Azure revenue increased 35%

Why invalid:

Quarter-specific.

Owner:

Quarter Change

---

### Commercial bookings increased this quarter

Why invalid:

Period-specific.

Owner:

Quarter Change

---

### Management emphasized AI this filing

Why invalid:

Filing-specific.

Owner:

Themes

---

### Management appears credible

Why invalid:

Trust assessment.

Owner:

Investor Intelligence

---

### Cloud growth strengthened this quarter

Why invalid:

Signal observation.

Owner:

Business Signals

---

### Stock is undervalued

Why invalid:

Valuation conclusion.

Owner:

Investor Intelligence

---

### AI discussion strengthened over six quarters

Why invalid:

Topic behavior.

Owner:

Topic Evolution

---

### This quarter materially improved execution

Why invalid:

Quarter interpretation.

Owner:

Quarter Understanding

---

### The business has a strong competitive advantage

Why invalid:

Investor evaluation.

Owner:

Investor Intelligence

---

### Investors should continue holding

Why invalid:

Ownership conclusion.

Owner:

Investor Intelligence

---

## 12. Relationship To Ownership Questions

### Q1 Ownership

What does this company actually sell?

Company Knowledge is the primary canonical source.

This is the most important ownership contribution.

---

### Q2 Ownership

Where does the next rupee come from?

Company Knowledge provides durable revenue foundations.

Business Signals and Investor Intelligence provide current trajectory.

---

### Q3 Ownership

Can the story be trusted?

Company Knowledge provides baseline expectations.

Trust Architecture provides trust evidence.

Investor Intelligence produces the trust conclusion.

---

### Q4 Ownership

Is the story already too expensive?

Company Knowledge contributes nothing directly.

Requires market data and Investor Intelligence.

---

### Q5 Ownership

Why would I hold it and what would change that?

Company Knowledge provides the durable business foundation.

Investor Intelligence owns the final synthesis.

---

## 13. Golden Rule

Company Knowledge does not describe what happened.

Company Knowledge describes what the company is.

Company Knowledge does not describe this filing.

Company Knowledge describes the durable business.

Company Knowledge does not determine what investors should do.

Company Knowledge provides the stable foundation upon which investor reasoning is built.

Examples:

Valid:

* Enterprise customers are a primary customer segment.
* Cloud services are part of the company's core offering portfolio.

Invalid:

* Cloud revenue increased this quarter.
* Management emphasized AI investment this filing.
* The stock remains attractive.
* Management appears trustworthy.
