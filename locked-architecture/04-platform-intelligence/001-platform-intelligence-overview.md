# 001 - Platform Intelligence Overview

**Status:** LOCKED  
**Layer:** Platform Foundation  
**Owner:** Platform Intelligence Architecture  
**Last Updated:** 2026-06-30

---

# Purpose

Platform Intelligence is responsible for learning, governing, and evolving the platform's reusable knowledge structures.

Unlike Company Intelligence, which learns about individual companies, Platform Intelligence learns about the concepts the platform itself uses to understand companies.

Its responsibility is to continuously improve the platform's ontology while preserving determinism, replayability, and governance.

Platform Intelligence is **not** part of the company intelligence execution pipeline.

It operates as a parallel governance system.

---

# Two Independent Intelligence Systems

The platform consists of two independent but connected intelligence systems.

## 1. Company Intelligence

Produces investment intelligence for individual companies.

```text
SEC Filing
    │
    ▼
Extraction
    ▼
Normalization
    ▼
Filing Artifact
    ▼
Evidence Identity
    ▼
Themes
    ▼
Topic Assignment
    ▼
Topic Evolution
    ▼
Structured Intelligence
    ▼
Company Knowledge
    ▼
Quarter Change
    ▼
Business Signals
    ▼
Quarter Understanding
    ▼
Investor Intelligence
```

Company Intelligence answers questions such as:

- What happened?
- Why did it happen?
- What changed?
- What should an investor understand?

---

## 2. Platform Intelligence

Produces knowledge about the platform itself.

```text
Company Intelligence Outputs
            │
            ▼
Platform Signals
            ▼
Cross-Company Aggregation
            ▼
Knowledge Candidates
            ▼
Governance
            ▼
Platform Registry
            │
            └──────────────► Company Intelligence
```

Platform Intelligence answers questions such as:

- Is our ontology complete?
- Are reusable concepts emerging?
- Should the platform vocabulary evolve?
- Should concepts be merged, promoted, or deprecated?

---

# Core Principle

Company Intelligence learns about companies.

Platform Intelligence learns about how to understand companies.

These responsibilities must remain independent.

---

# Scope

Platform Intelligence owns:

- Platform ontologies
- Canonical registries
- Taxonomies
- Ontology evolution
- Cross-company concept discovery
- Governance of reusable concepts
- Registry versioning
- Platform-wide semantic consistency

Platform Intelligence does NOT own:

- Company interpretation
- Filing interpretation
- Investment reasoning
- Company Knowledge
- Business Signals
- Quarter Understanding
- Investor Intelligence

---

# Architectural Boundary

Company Intelligence must never modify Platform Intelligence during execution.

Execution pipelines are read-only consumers of governed platform knowledge.

Example:

```text
Topic Assignment
```

may read

```text
Topic Registry
```

but it must never create, update, merge, or delete Topics.

Execution must remain deterministic.

---

# Platform Feedback Loop

Execution pipelines may emit observations that indicate platform knowledge is incomplete.

These observations become Platform Signals.

Platform Signals are inputs to Platform Intelligence.

They are NOT ontology changes.

```text
Execution
      │
      ▼
Platform Signal
      │
      ▼
Platform Intelligence
      │
      ▼
Governed Registry Evolution
```

---

# Governance Principle

Platform knowledge evolves through governance.

Execution never changes platform knowledge directly.

Every registry change must be:

- explainable
- replayable
- versioned
- reviewable
- deterministic after approval

---

# Platform Registries

Platform Intelligence governs reusable knowledge registries.

Examples include:

- Topic Registry
- Industry Registry
- Business Signal Taxonomy
- Trust Taxonomy
- Market Context Ontology

Additional registries may be introduced without changing Company Intelligence architecture.

---

# Relationship with Company Intelligence

Platform Intelligence supplies governed knowledge.

Company Intelligence consumes governed knowledge.

The relationship is one-way during execution.

```text
Platform Registry
        │
        ▼
Company Intelligence

Company Intelligence
        │
        ▼
Platform Signals

Platform Signals never directly modify Platform Registry.
```

---

# Platform Lifecycle

Every Platform Registry follows the same high-level lifecycle.

```text
Platform Signals
        │
        ▼
Knowledge Candidates
        │
        ▼
Governance Review
        │
        ▼
Approved Registry
        │
        ▼
Execution Consumption
```

Execution consumes only approved registries.

---

# Design Principles

Platform Intelligence must be:

- deterministic after governance
- replayable
- versioned
- explainable
- company-independent
- reusable
- ontology-driven
- extensible

Platform Intelligence must never:

- infer company-specific knowledge
- mutate registries during execution
- bypass governance
- introduce non-replayable behavior

---

# Future Platform Intelligence Subsystems

This architecture enables future subsystems including:

- Topic Governance
- Industry Governance
- Taxonomy Evolution
- Registry Version Management
- Cross-Company Concept Discovery
- Shared Embedding Infrastructure
- Semantic Ontology Management

Each subsystem follows the governance principles defined in this document.

---

# Architecture Summary

Company Intelligence and Platform Intelligence are separate systems with complementary responsibilities.

Company Intelligence produces business understanding.

Platform Intelligence produces the reusable knowledge structures required to make that understanding increasingly accurate over time.

This separation ensures that:

- execution remains deterministic,
- ontology evolution remains governed,
- platform knowledge improves continuously without compromising replayability.