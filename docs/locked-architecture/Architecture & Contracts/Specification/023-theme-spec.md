# Themes Specification

Status: LOCKED

## 1. Purpose

Themes exists to answer:

> What business narratives did management discuss in this filing?

Themes extracts filing-scoped, evidence-backed narrative clusters from filing content.

A Theme is a coherent business narrative discussed in a filing.

Themes identifies what management discussed.

Themes does not determine what is true.

Themes does not determine what matters.

Themes does not determine what investors should conclude.

Themes is an observation extraction layer.

---

## 2. Position In Architecture

```text
Filing Artifact
        +
Evidence Identity
        ↓
      Themes
        ↓
Topic Assignment
        ↓
Structured Intelligence
```

Themes is the first intelligence layer.

Themes transforms filing evidence into structured narrative observations.

Themes does not create business understanding.

Themes does not create Company Knowledge.

Themes does not create signals.

---

## 3. Inputs

### Required Inputs

* Filing Artifact
* Evidence Identity

Themes consumes filing content and evidence references.

Every Theme must be traceable to filing evidence.

---

## 4. Forbidden Inputs

* Topic Assignment
* Topic Evolution
* Structured Intelligence
* Company Knowledge
* Quarter Change
* Business Signals
* Trust Signals
* Quarter Understanding
* Investor Intelligence
* Market Data

### Why Company Knowledge Is Forbidden

Themes must observe the filing.

Themes must not import prior understanding.

### Why Structured Intelligence Is Forbidden

Themes produces observations.

Structured Intelligence produces business understanding.

Themes must not consume downstream interpretation.

### Why Investor Intelligence Is Forbidden

Themes must remain filing-scoped.

Investor reasoning belongs downstream.

---

## 5. Theme Definition

A Theme is:

> A filing-supported business narrative discussed by management.

A Theme is not:

* a section heading
* a document label
* a metric
* a KPI
* a business conclusion
* a durable fact
* an investor conclusion
* a trust assessment

Themes describe narratives.

Themes do not describe truth.

---

## 6. What Themes Extract

Themes extract coherent business narratives.

Examples:

* AI infrastructure investment
* Azure demand growth
* Datacenter expansion
* Commercial cloud adoption
* Supply chain constraints
* Regulatory scrutiny
* Security investments
* Gaming revenue decline
* OpenAI partnership expansion

Themes group related evidence into narrative clusters.

---

## 7. What Themes Must Not Extract

### Section Headings

Invalid:

* Management Discussion Overview
* Risk Factors
* Competition

Reason:

These are document structures.

Not narratives.

---

### Isolated Metrics

Invalid:

* Revenue increased 12%
* Margin increased 3%
* Subscribers reached 100 million

Reason:

Metrics support Themes.

Metrics are not Themes.

---

### Business Conclusions

Invalid:

* Cloud is the primary business
* Enterprise customers are the core market

Reason:

These belong to Structured Intelligence.

---

### Durable Facts

Invalid:

* Microsoft is a cloud company

Reason:

Durable understanding belongs to Company Knowledge.

---

### Trust Assessments

Invalid:

* Management appears credible

Reason:

Trust Architecture owns trust evidence.

---

### Investor Conclusions

Invalid:

* AI investment strengthens the investment case

Reason:

Investor Intelligence owns ownership reasoning.

---

## 8. Allowed Reasoning

Themes may:

* Read filing text.
* Group related evidence.
* Aggregate related observations.
* Normalize narrative wording.
* Create concise narrative titles.
* Create concise narrative summaries.
* Attach supporting evidence.

Themes may identify narratives.

Themes may not interpret narratives.

---

## 9. Forbidden Reasoning

### No Business Understanding

Invalid:

"Cloud services are the company's primary revenue model."

Reason:

Structured Intelligence owns business understanding.

---

### No Durable Claims

Invalid:

"Microsoft's business model is cloud software."

Reason:

Company Knowledge owns durable truth.

---

### No Cross-Period Analysis

Invalid:

"AI investment has increased for three quarters."

Reason:

Topic Evolution owns longitudinal analysis.

---

### No Change Detection

Invalid:

"Cloud emphasis strengthened."

Reason:

Quarter Change owns delta detection.

---

### No Signal Generation

Invalid:

"Cloud demand signal strengthening."

Reason:

Business Signals owns signals.

---

### No Trust Reasoning

Invalid:

"Management appears consistent."

Reason:

Trust Architecture owns trust evidence.

---

### No Investor Reasoning

Invalid:

"This improves the ownership thesis."

Reason:

Investor Intelligence owns ownership reasoning.

---

## 10. Theme Quality Requirements

A valid Theme must satisfy all of the following:

### Filing Supported

Every Theme must be supported by filing evidence.

---

### Narrative Based

Every Theme must represent a business narrative.

Not a metric.

Not a section heading.

---

### Evidence Backed

Every Theme must contain evidence references.

No unsupported Themes are allowed.

---

### Filing Scoped

Every Theme belongs to one filing.

Themes do not span periods.

---

### Independently Understandable

A Theme title should remain understandable when viewed independently.

Good:

* AI Infrastructure Expansion
* Commercial Cloud Growth
* Supply Chain Constraints

Bad:

* Growth
* Operations
* Competition

---

## 11. Output Structure

Each Theme contains:

### title

Concise narrative name.

Example:

```text
AI Infrastructure Expansion
```

---

### summary

Short filing-supported narrative description.

---

### category

One of:

```text
strategy
product
customer
competition
operations
financial
capital_allocation
management
trust
regulatory
technology
other
```

---

### evidence

Evidence references supporting the Theme.

---

### evidence_count

Number of supporting evidence references.

---

## 12. Ownership Boundaries

### Themes vs Structured Intelligence

| Dimension | Themes                       | Structured Intelligence               |
| --------- | ---------------------------- | ------------------------------------- |
| Question  | What was discussed?          | How does the business work?           |
| Output    | Narrative clusters           | Structured business understanding     |
| Example   | AI Infrastructure Investment | Strategic Priority: AI Infrastructure |

Themes identify narratives.

Structured Intelligence organizes business understanding.

---

### Themes vs Topic Assignment

| Dimension | Themes               | Topic Assignment     |
| --------- | -------------------- | -------------------- |
| Purpose   | Narrative extraction | Topic classification |
| Output    | Theme                | Topic mapping        |

Themes do not assign Topic IDs.

Topic Assignment owns Topic mapping.

---

### Themes vs Quarter Change

| Dimension | Themes        | Quarter Change |
| --------- | ------------- | -------------- |
| Scope     | Single filing | Two periods    |
| Output    | Narrative     | Delta          |

Themes do not detect change.

Quarter Change detects change.

---

## 13. Relationship To Ownership Questions

### Q1 Ownership

What does the company actually sell?

Themes contribute raw narrative evidence only.

Structured Intelligence and Company Knowledge own the answer.

---

### Q2 Ownership

Where does the next rupee come from?

Themes contribute raw narrative evidence only.

Investor Intelligence owns the answer.

---

### Q3 Ownership

Can the story be trusted?

Themes contribute management statements only.

Trust Architecture owns trust evidence.

---

### Q4 Ownership

Is the story already too expensive?

Themes contribute nothing.

---

### Q5 Ownership

Why would I hold it and what would change that?

Themes contribute raw narrative evidence only.

Investor Intelligence owns the answer.

---

## 14. Golden Rule

Themes identify what management discussed.

Themes do not determine what it means.

Themes do not determine whether it is true.

Themes do not determine whether it matters.

Themes do not determine what investors should conclude.
