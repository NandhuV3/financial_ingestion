# 004 - Company Intelligence

**Status:** LOCKED  
**Layer:** Company Intelligence  
**Owner:** Company Intelligence Architecture  
**Last Updated:** 2026-07-07

---

# Purpose

Company Intelligence transforms filing observations into durable, company-specific business understanding.

It identifies how an individual business evolves across reporting periods while preserving deterministic execution, replayability, and complete historical traceability.

Company Intelligence never creates Platform Knowledge.

It produces Company Knowledge.

---

# Why Company Intelligence Exists

Every company is unique.

Although companies discuss many of the same Topics, the meaning, importance, persistence, and business impact of those Topics differ from company to company.

Platform Intelligence answers:

> What reusable Topics exist across companies?

Company Intelligence answers:

> What do those Topics mean for this specific company?

This separation allows reusable Platform Knowledge and company-specific business understanding to evolve independently.

---

# Position in Overall Architecture

```text
                    Platform Intelligence
                            │
                            ▼
                    Platform Registry
                            │
                            ▼
                    Topic Assignment
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
Platform Intelligence                  Company Intelligence
Topic Signals                          Topic Evolution
                                       Structured Intelligence
                                       Company Knowledge Candidate
                                       Governance Promotion
                                       Company Knowledge
                                       Quarter Change
                                       Business Signals
                                       Quarter Understanding
                                       Investor Intelligence
```

Platform Intelligence produces governed Platform Knowledge.

Company Intelligence consumes governed Platform Knowledge but never modifies it.

---

# Core Principle

Platform Intelligence answers:

> What knowledge is reusable?

Company Intelligence answers:

> What does this knowledge reveal about one company?

Platform Intelligence owns canonical Topics.

Company Intelligence owns company understanding.

Neither layer owns the other's responsibility.

---

# Responsibilities

Company Intelligence is responsible for:

- company-specific Topic behavior
- company-specific business understanding
- longitudinal company analysis
- business signal generation
- quarter-over-quarter business change
- company knowledge evolution
- investor-oriented company understanding

Company Intelligence is **not** responsible for:

- discovering new Platform Topics
- governing Platform Knowledge
- evolving the Platform Registry
- cross-company Topic aggregation
- Topic assignment
- Platform Governance

---

# Inputs

Company Intelligence consumes:

Required inputs:

- Filing Artifacts
- Topic Assignment Artifacts
- Structured Intelligence
- Company Knowledge
- Trust Signals

Enrichment inputs:

- Topic Evolution
- Quarter Change
- Market Context
- Industry Context

Company Intelligence consumes only governed Platform artifacts.

It never consumes Platform Intelligence implementation details.

---

# Outputs

Company Intelligence produces:

- Topic Evolution
- Structured Intelligence
- Company Knowledge Candidate
- Company Knowledge
- Quarter Change
- Business Signals
- Quarter Understanding
- Investor Intelligence

These artifacts represent progressively richer company-specific understanding.

---

# Relationship with Platform Intelligence

Platform Intelligence and Company Intelligence are independent architectural layers.

Platform Intelligence produces reusable Platform Knowledge.

Company Intelligence consumes that knowledge.

Company Intelligence must never:

- modify Platform Registry
- modify Topic Assignment
- modify Governance Decisions
- modify Topic Candidates
- invoke Platform Governance

Platform Intelligence remains a closed subsystem.

Company Intelligence interacts only through published Platform artifacts.

---

# Relationship with Platform Registry

Company Intelligence treats the Platform Registry as governed canonical knowledge.

The Platform Registry provides the vocabulary used by Topic Assignment.

Company Intelligence does not evolve or govern the Platform Registry.

Registry evolution remains exclusively owned by Platform Governance.

---

# Relationship with Topic Assignment

Topic Assignment is the architectural boundary between Platform Intelligence and Company Intelligence.

Topic Assignment:

- classifies filing observations
- records the Platform Registry version used during assignment
- produces deterministic Topic Assignment artifacts

Company Intelligence consumes persisted Topic Assignment artifacts.

It never regenerates Topic Assignment.

---

# Relationship with Structured Intelligence

Structured Intelligence transforms filing evidence into structured business understanding.

It operates independently from Topic Evolution.

Both artifacts contribute different evidence into downstream Company Intelligence.

Structured Intelligence focuses on business structure.

Topic Evolution focuses on temporal Topic behavior.

---

# Relationship with Company Knowledge

Company Knowledge represents governed, durable business understanding.

Company Knowledge evolves through governance.

Company Intelligence may produce Company Knowledge Candidates.

Company Knowledge itself remains immutable between governed promotions.

---

# Relationship with Business Signals

Business Signals consume multiple Company Intelligence artifacts.

Examples include:

- Company Knowledge
- Quarter Change
- Topic Evolution
- Trust Signals

Business Signals combine these artifacts into reusable business observations.

Business Signals perform interpretation.

Topic Evolution does not.

---

# Relationship with Quarter Understanding

Quarter Understanding interprets business observations.

It consumes:

- Business Signals
- Company Knowledge
- Trust Signals

Quarter Understanding does not perform Topic evolution.

It interprets the evidence produced upstream.

---

# Relationship with Investor Intelligence

Investor Intelligence represents the highest interpretation layer.

It consumes Company Intelligence artifacts.

It never reconstructs upstream reasoning.

Investor Intelligence produces investor-facing understanding rather than business observations.

---

# Architectural Principles

Company Intelligence must be:

- deterministic
- replayable
- artifact-driven
- company-specific
- longitudinal
- lineage-preserving
- immutable
- governed where required

Company Intelligence must never:

- modify Platform Knowledge
- duplicate Platform Intelligence
- bypass governed artifacts
- regenerate upstream artifacts
- perform cross-company governance
- mix execution metadata with business content

---

# Replayability

Every Company Intelligence artifact must be replayable.

Replay consumes persisted upstream artifacts.

Replay never regenerates upstream layers.

Given identical upstream artifacts, Company Intelligence must produce byte-identical outputs.

Replay behavior follows the platform-wide Deterministic Replay Guarantee.

---

# Lineage

Every Company Intelligence artifact preserves complete lineage.

Business lineage references upstream Company Intelligence and Platform artifacts.

Execution lineage remains owned by the Artifact Framework.

Company Intelligence must never duplicate execution metadata inside business content.

---

# Architecture Summary

Company Intelligence is the deterministic company-understanding layer of the platform.

It transforms governed Platform Knowledge into durable company-specific understanding while preserving replayability, lineage, immutability, and clear ownership boundaries.

Platform Intelligence answers what knowledge exists.

Company Intelligence answers what that knowledge means for an individual business.

By separating reusable Platform Knowledge from company-specific understanding, the platform maintains deterministic execution, independent evolution of each layer, and a scalable architecture capable of supporting thousands of companies without compromising governance or replay guarantees.