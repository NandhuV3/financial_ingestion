# 002 - Platform Signal Architecture

**Status:** LOCKED  
**Layer:** Platform Intelligence  
**Owner:** Platform Intelligence Architecture  
**Last Updated:** 2026-06-30

---

# Purpose

Platform Signals are deterministic observations emitted by Company Intelligence execution pipelines.

A Platform Signal does **not** represent new platform knowledge.

Instead, it represents evidence that the current platform knowledge may be incomplete, ambiguous, or evolving.

Platform Signals are the only mechanism through which Company Intelligence communicates with Platform Intelligence.

---

# Core Principle

Execution produces observations.

Governance produces knowledge.

Execution must never directly modify platform knowledge.

Instead:

```text
Execution
      │
      ▼
Platform Signal
      │
      ▼
Platform Intelligence
```

---

# Why Platform Signals Exist

Execution pipelines process individual companies.

Platform Intelligence reasons across many companies.

Execution cannot determine whether a reusable concept exists.

Execution can only report observations.

Example:

```text
Theme

↓

Nearest Topic

↓

Similarity = 0.42

↓

Platform Signal
```

The signal is evidence.

It is not a decision.

---

# Signal Ownership

Platform Signals are owned by Company Intelligence.

Platform Signals are consumed by Platform Intelligence.

No other subsystem may produce or modify Platform Signals.

---

# Signal Characteristics

Every Platform Signal must be:

- deterministic
- replayable
- versioned
- attributable
- explainable
- reproducible

Signals must never contain governance decisions.

Signals must never propose ontology mutations.

Signals must never modify Platform Registries.

---

# Platform Signal Lifecycle

```text
Execution
      │
      ▼
Platform Signal
      │
      ▼
Signal Store
      │
      ▼
Cross-Company Aggregation
      │
      ▼
Candidate Discovery
```

Signals remain immutable after emission.

---

# Signal Categories

Platform Intelligence may define multiple Signal types.

Examples include:

- Topic Signals
- Industry Signals
- Taxonomy Signals
- Trust Signals
- Registry Coverage Signals
- Ontology Conflict Signals

Each Signal type owns its own contract.

---

# Topic Signals

Builder 012 (Topic Assignment) emits Topic Signals.

Example observations include:

- nearest Topic below assignment threshold
- repeated semantic near misses
- missing reusable concepts
- ambiguous Topic selection
- ontology coverage gaps

Builder 012 does **not** create Topics.

It only emits observations.

---

# Future Signal Producers

Additional builders may emit Platform Signals.

Examples:

Structured Intelligence

↓

Industry Signals

Business Signals

↓

Taxonomy Signals

Trust Architecture

↓

Trust Signals

Every execution layer may emit observations.

No execution layer may evolve registries.

---

# Signal Storage

Platform Signals are operational records.

They are immutable.

Signals are retained for future aggregation.

Signals are never edited after creation.

---

# Cross-Company Aggregation

Platform Intelligence does not reason over a single Signal.

It reasons over collections of Signals.

Example:

```text
Microsoft

↓

Topic Signal

Apple

↓

Topic Signal

Google

↓

Topic Signal

Amazon

↓

Topic Signal

↓

Cross-Company Aggregation
```

Only aggregation may identify recurring patterns.

---

# Candidate Discovery

A single Signal is insufficient to justify ontology evolution.

Candidates emerge only from recurring evidence.

```text
Signal

×

100 companies

↓

Pattern

↓

Candidate
```

Execution never creates Candidates directly.

---

# Separation of Responsibilities

Company Intelligence is responsible for:

- emitting observations

Platform Intelligence is responsible for:

- collecting observations
- aggregating observations
- discovering reusable concepts
- governance

Responsibilities must never overlap.

---

# Determinism

Given identical execution inputs:

- identical Platform Signals must be produced.

Given identical Platform Signals:

- identical aggregation results must be produced.

Given identical governance decisions:

- identical Platform Registries must be produced.

Determinism is preserved throughout the lifecycle.

---

# Relationship with Platform Registries

Platform Signals are inputs.

Platform Registries are governed outputs.

Signals never mutate registries.

Registries never modify historical signals.

---

# Design Principles

Platform Signals must be:

- immutable
- append-only
- deterministic
- replayable
- company-attributed
- period-attributed
- evidence-backed

Platform Signals must never:

- create ontology
- delete ontology
- merge ontology
- promote ontology
- deprecate ontology

Those responsibilities belong exclusively to Governance.

---

# Architecture Summary

Platform Signals provide the boundary between Company Intelligence and Platform Intelligence.

Execution reports observations.

Platform Intelligence discovers patterns.

Governance decides whether platform knowledge should evolve.

This separation ensures that ontology evolution is evidence-driven while execution remains deterministic and replayable.