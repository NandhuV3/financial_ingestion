# Repository Roadmap

Status: LOCKED

---

# 1. Purpose

This document defines the implementation roadmap for the platform.

It does **not** define architecture.

It does **not** define ownership.

It defines:

- what gets built
- when it gets built
- why it is built in that order
- what must already exist before the next component may begin

This roadmap ensures implementation follows architecture instead of gradually redefining it.

---

# 2. Guiding Principles

The repository is built from the bottom upward.

Never implement a downstream layer before its upstream dependencies exist.

Architecture is always implemented before optimization.

Every implementation must satisfy its specification before the next component begins.

No builder may invent architecture.

No prompt may redefine ownership.

Every implementation must trace back to its specification document.

---

# 3. Repository Philosophy

The repository evolves through four phases.

```
Architecture

↓

Platform Foundation

↓

Core Intelligence

↓

Applications
```

Each phase must be complete before the next begins.

---

# Phase 1 — Architecture

Purpose

Define the platform.

Deliverables

- Glossary
- Layer Ownership
- Platform Execution
- Specifications
- Contracts
- Governance

Status

✅ Complete

No implementation begins until architecture is locked.

---

# Phase 2 — Platform Foundation

Purpose

Build reusable infrastructure used by every intelligence layer.

This foundation should never contain business intelligence.

It provides shared services only.

---

## Step 1

Repository Structure

Deliver

- folders
- package structure
- workspace
- tsconfig
- lint
- formatting

Status

Foundation

---

## Step 2

Artifact Framework

Deliver

- artifact interfaces
- artifact metadata
- versioning
- lineage
- archive support

Everything else depends on this.

---

## Step 3

Builder Framework

Deliver

- Base Builder
- Builder Contract implementation
- validation pipeline
- retry handling
- parsing pipeline
- lineage generation

Every builder inherits from this.

---

## Step 4

Prompt Registry

Deliver

- Prompt Registry
- prompt versions
- activation
- rendering
- prompt lineage

No LLM builder should exist before Prompt Registry.

---

## Step 5

Topic Registry

Deliver

- Topic schema
- governance
- registry storage
- aliases
- lifecycle
- versioning

Topic Assignment depends on this.

---

## Step 6

Evidence Infrastructure

Deliver

- Filing Artifact framework
- Evidence Identity framework
- Evidence lookup
- citation utilities

Every intelligence artifact depends on this.

---

## Step 7

Quality Framework

Deliver

- validators
- schema validation
- confidence helpers
- enrichment helpers

Shared by every builder.

---

# Phase 3 — Core Intelligence

This phase builds intelligence in dependency order.

Never violate the sequence.

---

## Stage 1

Themes

Deliver

- prompt
- builder
- parser
- validator
- tests

Output

Themes

---

## Stage 2

Topic Assignment

Deliver

- builder
- deterministic classifier
- tests

Output

Topic Assignment

---

## Stage 3

Structured Intelligence

Deliver

- prompt
- builder
- parser
- validator

Output

Structured Intelligence

---

## Stage 4

Company Knowledge Candidate

Deliver

comparison engine

candidate builder

confidence scoring

---

## Stage 5

Governance Promotion

Deliver

promotion engine

rule evaluation

decision recording

---

## Stage 6

Company Knowledge

Deliver

repository

versioning

current pointer

history

---

## Stage 7

Quarter Change

Deliver

delta engine

comparison engine

first-period handling

---

## Stage 8

Topic Evolution

Deliver

trend engine

topic persistence

topic emergence

topic drift

---

## Stage 9

Business Signals

Deliver

signal derivation

signal enrichment

typed observations

---

## Stage 10

Trust Pillars

Build independently.

Order

1. Commitment Tracking

2. Narrative Consistency

3. Accounting Stability

4. Capital Allocation Tracking

Each pillar must pass validation before Trust Signals begin.

---

## Stage 11

Trust Signals

Deliver

aggregation

classification

severity

dimensions

---

## Stage 12

Quarter Understanding

Deliver

prompt

builder

parser

validator

---

## Stage 13

Investor Intelligence

Deliver

prompt

builder

Q1–Q5 synthesis

ownership reasoning

---

## Stage 14

Partner Domain

Deliver

presentation

API models

view models

dashboard support

No intelligence generation.

---

# 4. Standard Builder Checklist

Every builder follows exactly the same sequence.

```
Specification
↓
Artifact Schema
↓
Prompt (if LLM)
↓
Prompt Contract
↓
Builder
↓
Parser
↓
Validator
↓
Tests
↓
Integration
```

Nothing is skipped.

---

# 5. Standard LLM Layer Checklist

Every LLM layer must contain

```
Prompt Contract
↓
Prompt
↓
Builder
↓
Parser
↓
Validator
↓
Regression Tests
↓
Golden Dataset
↓
Integration Tests
```

---

# 6. Standard Deterministic Layer Checklist

Every deterministic layer contains

```
Specification
↓
Builder
↓
Rules
↓
Validation
↓
Unit Tests
↓

Integration Tests
```

---

# 7. Repository Dependency Graph

```
Platform Foundation
        │
        ▼

Themes
        │
        ├──────────────┐
        ▼              ▼
Topic Assignment   Structured Intelligence
        │              │
        ▼              ▼
Topic Evolution   Company Knowledge
        │              │
        └──────┬───────┘
               ▼
        Business Signals

Trust Pillars
       │
       ▼
Trust Signals

Business Signals
Trust Signals
Company Knowledge
Topic Evolution
        │
        ▼
Quarter Understanding
        │
        ▼
Investor Intelligence
        │
        ▼
Partner Domain
```

---

# 8. Definition of Done

A layer is considered complete only when all of the following exist.

✓ Specification

✓ Prompt Contract (LLM only)

✓ Prompt (LLM only)

✓ Builder

✓ Parser

✓ Validator

✓ Tests

✓ Golden Dataset

✓ Documentation

✓ Artifact Schema

✓ Lineage

✓ Versioning

✓ Integration Tests

---

# 9. Pull Request Rules

Every Pull Request must answer

1. Which specification does this implement?

2. Which ownership boundary does this respect?

3. Which upstream artifacts does it consume?

4. Which downstream artifacts depend on it?

5. Does this modify architecture?

If architecture changes,

implementation must stop

until architecture is updated.

---

# 10. Things That Must Never Happen

Never change architecture inside a Builder.

Never redefine ownership inside a Prompt.

Never bypass Governance.

Never read downstream artifacts.

Never duplicate intelligence already produced upstream.

Never make investor conclusions before Investor Intelligence.

Never make durable claims before Company Knowledge.

Never compare periods before Quarter Change.

Never evaluate trust before Trust Signals and Quarter Understanding.

Never generate intelligence inside Partner Domain.

---

# 11. Repository Growth Strategy

The repository grows in layers.

```
Architecture
↓
Foundation
↓
Builders
↓
Artifacts
↓
Signals
↓
Understanding
↓
Ownership
↓
Presentation
```

Each layer should remain independently testable.

No implementation should require downstream code to exist.

---

# 12. Production Readiness Checklist

Before production, the repository must provide:

✓ Locked Architecture

✓ Locked Contracts

✓ Prompt Registry

✓ Topic Registry

✓ Builder Framework

✓ Artifact Framework

✓ Versioned Prompts

✓ Versioned Artifacts

✓ Complete Lineage

✓ Regression Test Suite

✓ Golden Evaluation Dataset

✓ First-Period Handling

✓ Governance Promotion

✓ Rollback Support

✓ Audit Trail

✓ Observability

✓ Documentation

Only after every item is complete may the platform be considered production-ready.

---

# 13. Roadmap Summary

The repository is built in this order:

1. Architecture
2. Foundation
3. Themes
4. Topic Assignment
5. Structured Intelligence
6. Company Knowledge Candidate
7. Governance Promotion
8. Company Knowledge
9. Quarter Change
10. Topic Evolution
11. Business Signals
12. Trust Pillars
13. Trust Signals
14. Quarter Understanding
15. Investor Intelligence
16. Partner Domain

This order is mandatory.

It preserves architectural ownership, minimizes coupling, and ensures every downstream layer is built upon validated upstream artifacts.