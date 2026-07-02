# 010 - Topic Signal Observation Boundary

**Status:** LOCKED  
**Layer:** Platform Intelligence  
**Owner:** Platform Intelligence Architecture  
**Last Updated:** 2026-07-01

---

# Purpose

This specification defines the observation boundary for Topic Signals.

Builder 012 performs many deterministic computations during Topic Assignment.

Not every computation becomes Platform Intelligence.

This document defines which execution information is promoted into Topic Signals and which information remains transient execution state.

---

# Core Principle

Platform Intelligence learns from execution observations.

It does not learn from every intermediate computation.

```text
Execution

↓

Computation

↓

Execution Decision

↓

Execution Observation

↓

Platform Intelligence
```

Only execution observations cross the boundary into Platform Intelligence.

---

# Why This Exists

Topic Assignment evaluates many possible Topic candidates for every Theme.

Most candidate comparisons are internal implementation details.

Persisting every comparison would:

- inflate execution records
- increase storage cost
- introduce execution noise
- weaken aggregation quality
- obscure recurring evidence

Platform Intelligence should preserve only meaningful execution outcomes.

---

# Execution Layers

Builder 012 execution consists of three conceptual layers.

## Layer 1 — Computation

Computation is transient execution work.

Examples:

- embedding generation
- cosine similarity calculations
- candidate sorting
- qualification evaluation
- ranking
- tie-breaking

Computation exists only to support execution.

Computation is never Platform Intelligence.

---

## Layer 2 — Execution Decisions

Execution decisions determine how Builder 012 classifies a Theme.

Examples:

- assigned
- partially assigned
- unassigned

Execution decisions are deterministic.

They describe what Builder 012 concluded.

---

## Layer 3 — Execution Observations

Execution observations describe the meaningful evidence produced by execution.

These observations become Topic Signals.

Platform Intelligence consumes execution observations.

---

# Deterministic Qualification Boundary

Execution observations are determined by the **Deterministic Qualification Boundary**.

The Deterministic Qualification Boundary is defined by the Builder Specification.

It determines which execution results qualify as execution observations.

Qualified execution results become Topic Signals.

Execution results that do not satisfy the qualification rules remain transient computation.

The Deterministic Qualification Boundary is:

- deterministic
- versioned
- replayable
- specification-defined
- implementation-independent

The Builder implementation applies the qualification rules.

The Builder Specification owns the qualification rules.

---

# Observation Boundary

Only information required to explain Builder 012's deterministic execution outcome may become a Topic Signal.

Everything else remains transient.

```text
Builder Specification

↓

Deterministic Qualification Rules

↓

Builder 012 Execution

↓

Qualified Execution Observation

↓

Topic Signal
```

The observation boundary prevents implementation details from leaking into Platform Intelligence.

---

# Persisted Information

Topic Signals preserve only qualified execution observations.

Examples include:

## Execution Context

- company_id
- period_id
- filing_id
- execution_id

## Theme Context

- theme_id
- theme_title

## Execution Outcome

- assignment_status
- final_assignments
- assignment_method
- confidence

## Qualified Diagnostic Observations

Qualified diagnostic observations explain why Builder 012 reached its deterministic execution outcome.

Examples include:

- accepted assignments
- qualified rejected candidates
- deterministic rejection reasons

Only candidates satisfying the Deterministic Qualification Boundary may be persisted.

Candidates that do not qualify remain transient computation.

## Registry Context

- registry_version

## Execution Metadata

- embedding model
- generated_at

---

# Transient Information

The following information remains internal to Builder 012 execution.

Examples:

- unqualified Topic comparisons
- discarded similarity evaluations
- intermediate ranking structures
- temporary lookup tables
- embedding vectors
- sorting state
- qualification evaluation internals
- implementation-specific caches

These computations support execution but do not become Platform Intelligence.

---

# Diagnostic Evidence

Diagnostic evidence exists to explain deterministic execution.

Diagnostic evidence is preserved only when it satisfies the Deterministic Qualification Boundary.

Examples include:

- accepted assignments
- qualified rejected candidates
- deterministic rejection reasons

Diagnostic evidence explains execution.

It does not preserve the complete computational trace.

---

# Aggregation Responsibility

Cross-Company Aggregation aggregates execution observations.

It does not aggregate transient execution computation.

Aggregation answers:

> What recurring execution observations exist?

It does not answer:

> What intermediate computations occurred?

---

# Candidate Discovery Responsibility

Candidate Discovery evaluates recurring execution observations.

Candidate Discovery must never infer platform evolution from discarded execution computation.

Only persisted Topic Signals are valid Platform Intelligence evidence.

---

# Replayability

Given identical:

- Themes
- Topic Registry
- Builder Specification
- Builder implementation
- embedding model

Builder 012 must produce identical Topic Signals.

Replayability applies only to persisted execution observations.

Transient computation is not part of the replay contract.

---

# Future Signal Types

The Deterministic Qualification Boundary applies to all future Platform Signals.

Examples:

- Topic Signals
- Industry Signals
- Trust Signals
- Coverage Signals
- Taxonomy Signals

Every Platform Signal must define:

- deterministic qualification rules
- qualified execution observations
- transient computation

Platform Intelligence remains evidence-driven rather than implementation-driven.

---

# Design Principles

Execution observations must be:

- deterministic
- replayable
- explainable
- evidence-focused
- specification-defined
- implementation-independent
- useful for downstream aggregation

Execution observations must never:

- expose internal algorithms
- persist every intermediate computation
- leak implementation-specific state
- duplicate execution internals
- weaken aggregation quality

---

# Architecture Summary

Topic Signals form the bridge between Company Intelligence and Platform Intelligence.

The observation boundary ensures that only qualified execution observations cross that bridge.

The Builder Specification defines deterministic qualification rules.

Builder implementations apply those rules consistently during execution.

By separating qualified execution observations from transient computation, the platform preserves explainability, replayability, deterministic execution, and scalable evidence accumulation while preventing implementation details from becoming long-term platform knowledge.