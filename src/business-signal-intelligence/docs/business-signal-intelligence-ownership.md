# Business Signal Intelligence Ownership Contract

## 1. Purpose

Business Signal Intelligence identifies meaningful business signals emerging from filings and structured intelligence.

It answers:

- What changed?
- What appears important?
- What deserves attention?

It does not answer:

- What is the company?
- What should an owner conclude?
- What questions should an owner ask?

Business Signal Intelligence is an observation layer. It detects business movement, change, and attention-worthy signals without redefining the durable facts about the company.

## 2. Position In Architecture

```text
Source Filings
    ↓
Structured Intelligence
    ↓
Company Knowledge
    ↓
Business Signal Intelligence
    ↓
Quarter Understanding Intelligence
    ↓
Owner Questions Intelligence
```

Business Signal Intelligence consumes Company Knowledge.

Business Signal Intelligence does not redefine Company Knowledge.

Company Knowledge remains the source of truth for durable business understanding. Business Signal Intelligence uses that understanding as context for detecting observations about change, movement, emphasis, or emerging attention areas.

## 3. Business Signal Intelligence Owns

Business Signal Intelligence owns signals, not business facts.

Examples of owned signal categories:

- Emerging business signals
- Revenue-related signals
- Margin-related signals
- Customer-related signals
- Product-related signals
- Dependency-related signals
- Competitive signals
- Growth signals
- Operational signals

These signals may reference known company facts, but they do not create or modify those facts.

## 4. Business Signal Intelligence Does Not Own

Business Signal Intelligence does not own:

- Company description
- Products
- Customers
- Revenue model
- Business model
- Competitive positioning
- Dependencies
- Narratives
- Health dashboards
- Recommendations
- Owner questions

These responsibilities belong to other layers.

## 5. Relationship To Company Knowledge

Company Knowledge owns durable business understanding.

Business Signal Intelligence owns observations about change and movement.

Example:

```text
Company Knowledge:
  "Microsoft sells cloud services."

Business Signal Intelligence:
  "Cloud revenue acceleration observed."
```

The signal references the business.

It does not redefine the business.

Business Signal Intelligence may depend on Company Knowledge to understand whether a signal is relevant, but it must not mutate, replace, or duplicate Company Knowledge ownership.

## 6. Relationship To Quarter Understanding

Business Signal Intelligence produces signals.

Quarter Understanding explains signals.

Example:

```text
Signal:
  "Gross margin declined."

Quarter Understanding:
  "Margin declined due to AI infrastructure investment."
```

Signal detection and interpretation are separate responsibilities.

Business Signal Intelligence should identify that a signal exists. Quarter Understanding should explain why the signal matters in the context of the quarter.

## 7. Relationship To Owner Questions

Business Signal Intelligence does not generate questions.

Owner Questions consumes:

- Company Knowledge
- Business Signal Intelligence
- Quarter Understanding

Signals become inputs.

Signals are not questions.

Owner Questions Intelligence may transform signals into owner-facing prompts, but Business Signal Intelligence must remain focused on signal observation.

## 8. Ownership Principles

### Signal Ownership

Business Signal Intelligence owns observations, not facts.

### No Narrative Ownership

Signals are not stories.

### No Recommendation Ownership

Signals are not recommendations.

### No Company Redefinition

Signals may reference Company Knowledge but may not modify it.

### Separation Of Observation And Interpretation

Business Signal Intelligence observes.

Quarter Understanding interprets.

## 9. Future Consumers

Future consumers include:

- Quarter Understanding Intelligence
- Owner Questions Intelligence
- Future Health Dashboard
- Future Journal Intelligence

These consumers may use Business Signal Intelligence as an input, but they should not push presentation, question generation, recommendation, or narrative responsibilities back into the signal layer.

## 10. Non Goals

This phase does not define:

- Schemas
- Builders
- Repositories
- Commands
- Prompts
- Enrichment
- Storage
- Dashboards
- Questions

This document is an ownership boundary only.
