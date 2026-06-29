# Partner Investing Intelligence Platform

> Production-grade business intelligence platform for transforming SEC filings into long-term ownership intelligence.

Status: **Architecture Locked**

---

# Vision

This platform is designed to transform raw SEC filings into structured, explainable, evidence-backed ownership intelligence.

The system is built around one principle:

> Every conclusion must be traceable to filing evidence through well-defined architectural layers.

The architecture prioritizes:

- Clear ownership boundaries
- Explainable intelligence
- Governance over heuristics
- Long-term maintainability
- Production-grade traceability

---

# Repository Philosophy

This repository is built from architecture first.

The implementation must never redefine the architecture.

Every Builder, Prompt, Artifact, and API exists to implement an approved specification.

The architecture is considered the source of truth.

---

# Repository Reading Order

New contributors should read the documentation in the following order.

---

## Phase 1 — Platform Foundation

Read first.

These documents explain the platform before any implementation details.

```
README.md

↓

docs/000-platform-glossary.md

↓

docs/001-layer-ownership.md

↓

docs/002-platform-execution.md

↓

docs/003-repository-roadmap.md
```

After reading these four documents, an engineer should understand:

- What the platform does
- Why it exists
- How it executes
- How implementation should proceed

---

## Phase 2 — Core Architecture

Read next.

```
008-filing-artifact-spec.md

009-evidence-identity-spec.md

010-themes-quality-spec.md

023-themes-spec.md

024-structured-intelligence-spec.md

025-company-knowledge-spec.md

026-quarter-change-spec.md

027-business-signals-spec.md

028-topic-assignment-spec.md

029-topic-evolution-spec.md
```

These define the Business Intelligence pipeline.

---

## Phase 3 — Trust Architecture

```
030-commitment-tracking-spec.md

031-narrative-consistency-spec.md

032-accounting-stability-spec.md

033-capital-allocation-tracking-spec.md

034-trust-architecture-spec.md
```

These define the Trust Intelligence pipeline.

---

## Phase 4 — Governance

```
035-topic-registry-governance-contract.md

036-topic-registry-schema.md

037-first-period-handling-spec.md

038-prompt-registry-contract.md

039-builder-contract.md
```

These documents define platform governance.

---

## Phase 5 — Prompt Contracts

```
040-themes-prompt-contract.md

041-structured-intelligence-prompt-contract.md

042-quarter-understanding-prompt-contract.md

043-investor-intelligence-prompt-contract.md
```

These documents define the behavior of every LLM layer.

---

# Architectural Layers

```
SEC Filing

↓

Extraction

↓

Normalization

↓

Filing Artifact

↓

Evidence Identity

↓

Themes Quality

↓

Themes

├──────────────┐
│              │
▼              ▼

Topic Pipeline

Business Pipeline

↓

Business Signals

↓

Quarter Understanding

↓

Investor Intelligence

↓

Partner Domain
```

The complete execution model is documented in:

> `002-platform-execution.md`

---

# Repository Structure

```
docs/
    Platform documentation

src/
    Production implementation

tests/
    Automated validation

builders/
    Intelligence builders

prompt-registry/
    Versioned LLM prompts

topic-registry/
    Canonical Topics

schemas/
    Artifact schemas

validators/
    Artifact validation

repositories/
    Artifact persistence
```

---

# Repository Rules

Every implementation must satisfy the following rules.

## Architecture First

Architecture is written before code.

Code never changes architecture.

---

## One Owner

Every responsibility has one owner.

No duplicated intelligence.

No overlapping Builders.

---

## Upstream Only

A layer may consume approved upstream artifacts only.

Downstream access is forbidden.

---

## Deterministic Before LLM

Deterministic processing is preferred whenever possible.

LLMs are used only where reasoning is required.

---

## Governance Before Mutation

No Builder may modify durable knowledge.

Governance owns promotion.

---

## Evidence First

Every conclusion must be traceable to filing evidence.

---

# LLM Layers

Only four architectural layers perform reasoning.

| Layer | Purpose |
|---------|----------|
| Themes | Extract filing narratives |
| Structured Intelligence | Describe business structure |
| Quarter Understanding | Interpret the quarter |
| Investor Intelligence | Produce ownership intelligence |

Everything else is deterministic or governed.

---

# Deterministic Layers

The following layers contain no business reasoning.

- Extraction
- Normalization
- Filing Artifact
- Evidence Identity
- Themes Quality
- Topic Assignment
- Topic Evolution
- Quarter Change
- Business Signals
- Trust Pillars
- Trust Signals
- Governance Promotion

---

# Ownership Questions

The platform ultimately answers five ownership questions.

## Q1

What does this company actually sell?

---

## Q2

Where does the next rupee come from?

---

## Q3

Can the story be trusted?

---

## Q4

Is the story already too expensive?

(Currently requires future Market Data integration.)

---

## Q5

Why would I own this business, and what would change my mind?

Only Investor Intelligence answers these questions.

---

# Implementation Order

Implementation follows the roadmap.

```
Foundation

↓

Themes

↓

Topic Assignment

↓

Structured Intelligence

↓

Company Knowledge

↓

Quarter Change

↓

Topic Evolution

↓

Business Signals

↓

Trust Architecture

↓

Quarter Understanding

↓

Investor Intelligence

↓

Partner Domain
```

The detailed implementation plan is defined in:

> `003-repository-roadmap.md`

---

# Current Status

## Architecture

✅ Locked

## Specifications

✅ Locked

## Contracts

✅ Locked

## Prompt Contracts

✅ Locked

## Implementation

🚧 Beginning

---

# Engineering Principles

This platform is built on a small number of principles.

- One responsibility per layer.
- One producer per artifact.
- Governance before mutation.
- Evidence before conclusions.
- Architecture before implementation.
- Long-term maintainability over short-term convenience.
- Every output must remain explainable and reproducible.

---

# Final Principle

The goal of this repository is not to build another financial application.

The goal is to build an explainable intelligence platform where every investor-facing conclusion can be traced back through governed artifacts to the original SEC filing evidence.