# 007 - Topic Signal Specification

**Status:** LOCKED  
**Layer:** Platform Intelligence  
**Owner:** Platform Intelligence Architecture  
**Producer:** Builder 012 - Topic Assignment  
**Consumer:** Cross-Company Aggregation  
**Last Updated:** 2026-07-01

---

# Purpose

Topic Signals capture the qualified deterministic execution observations produced by Builder 012 while evaluating a Theme against the current Topic Registry.

They preserve the execution evidence required to explain Builder 012's deterministic Topic Assignment outcome.

Topic Signals are execution evidence.

They are **not** business knowledge.

They are **not** governance decisions.

They are **not** Platform Registry mutations.

They are **not** complete execution traces.

---

# Why Topic Signals Exist

Builder 012 has two independent responsibilities.

1. Produce Topic Assignments for Company Intelligence.
2. Produce execution observations for Platform Intelligence.

These outputs intentionally serve different consumers.

The Topic Assignment Artifact answers:

> Which canonical Topics represent this Theme?

The Topic Signal answers:

> What qualified execution observations explain that deterministic decision?

Platform Intelligence depends on execution observations rather than business knowledge.

---

# Position in Company Intelligence

```text
Themes
    │
    ▼
Builder 012
    ├───────────────────────────┐
    │                           │
    ▼                           ▼
Topic Assignment          Topic Signal
Platform Artifact         Execution Record
```

---

# Position in Platform Intelligence

```text
Topic Signals
        │
        ▼
Cross-Company Aggregation
        │
        ▼
Candidate Discovery
        │
        ▼
Platform Governance
        │
        ▼
Platform Registry
```

Topic Signals are the sole execution input into Platform Intelligence.

---

# Output Classification

Topic Signals are:

**Execution Records**

Properties:

- deterministic
- replayable
- immutable
- execution-scoped

Topic Signals are NOT:

- Platform Artifacts
- Governance Artifacts
- Platform Registries
- Company Intelligence outputs

---

# Producer

Topic Signals are produced exclusively by:

Builder 012 — Topic Assignment

No other builder may emit Topic Signals.

---

# Consumer

Topic Signals are consumed exclusively by Platform Intelligence.

Current consumer:

- Cross-Company Aggregation

Future consumers may include:

- Candidate Discovery
- Registry Analytics
- Ontology Quality Monitoring
- Semantic Drift Detection

Company Intelligence must never consume Topic Signals.

---

# Inputs

Topic Signals are derived only from Builder 012 execution.

Builder inputs:

- Themes Artifact
- Topic Registry

Builder outputs observed:

- deterministic execution decisions
- qualified execution observations

Topic Signals must never reopen:

- SEC filings
- Filing Artifact
- Evidence Identity
- Theme Grounding
- Theme Input Boundary
- Topic Evolution
- Structured Intelligence
- Company Knowledge

---

# Signal Granularity

Exactly one Topic Signal is produced for every Theme processed by Builder 012.

Example

```text
5 Themes

↓

5 Topic Signals
```

Signal count must always equal Theme count.

---

# Deterministic Qualification Boundary

The Builder Specification defines deterministic qualification rules.

These rules determine which execution results qualify as execution observations.

Qualified execution observations become Topic Signals.

Execution results that do not satisfy the qualification rules remain transient computation.

The qualification boundary is:

- deterministic
- versioned
- replayable
- specification-defined
- implementation-independent

Builder implementations apply the qualification rules.

They never redefine them.

---

# Execution Observations

A Topic Signal preserves qualified execution observations.

It does not preserve the builder's complete computational trace.

The execution observation consists of:

```text
Execution Context

↓

Theme

↓

Qualified Observations

↓

Final Result
```

---

# Required Information

Every Topic Signal must preserve sufficient qualified execution observations to explain Builder 012's deterministic execution outcome.

## Execution Context

- company_id
- period_id
- filing_id
- execution_id

---

## Theme

- theme_id
- theme_title

---

## Qualified Observations

Qualified observations include only execution evidence that satisfies the Deterministic Qualification Boundary.

Examples include:

- accepted assignments
- qualified rejected candidates
- deterministic rejection reasons

Each qualified observation contains:

- topic_id
- similarity_score
- assignment_method
- decision
- rejection_reason (when applicable)

Only qualified observations may be persisted.

Unqualified comparisons remain transient computation.

---

## Final Result

The final result records Builder 012's deterministic execution outcome.

It contains:

- assignment_status

Examples:

- assigned
- partially_assigned
- unassigned

and

- final_assignments

Each assignment contains:

- topic_id
- confidence
- assignment_method

A Theme may contain zero, one, or many final assignments.

---

## Registry Context

- registry_version

---

## Execution Metadata

- embedding_model
- generated_at

---

# Execution Evidence

Topic Signals preserve qualified execution evidence.

This includes:

- accepted assignments
- qualified rejected candidates
- deterministic assignment decisions

Execution evidence exists to explain Builder 012's deterministic outcome.

Transient execution computation is intentionally discarded.

Platform Intelligence learns from execution observations rather than implementation details.

---

# Forbidden Information

Topic Signals must never contain:

- governance decisions
- Platform Registry mutations
- Company Knowledge
- Business Signals
- Quarter Understanding
- Investor Intelligence
- embedding vectors
- complete candidate rankings
- discarded execution computation
- implementation-specific state

Topic Signals preserve qualified execution observations only.

---

# Immutability

Topic Signals are immutable.

Historical Topic Signals are never modified.

Replay produces new Topic Signals.

Historical execution observations remain unchanged.

---

# Replayability

Given identical:

- Themes
- Topic Registry
- Builder Specification
- Builder implementation
- embedding model

Builder 012 must emit identical Topic Signals.

Replay must reproduce identical qualified execution observations.

---

# Relationship with Topic Assignment

Topic Assignment records Builder 012's business conclusion.

Topic Signals record the qualified execution observations that explain that conclusion.

These outputs intentionally contain different information.

Neither replaces the other.

---

# Relationship with Platform Registry

Topic Signals never modify the Platform Registry.

Instead:

```text
Topic Signal

↓

Cross-Company Aggregation

↓

Candidate Discovery

↓

Platform Governance

↓

Platform Registry
```

Execution remains strictly read-only.

---

# Relationship with Governance

Topic Signals never recommend governance actions.

They preserve qualified execution observations only.

Platform Governance evaluates accumulated execution evidence across many Topic Signals.

Individual executions never evolve the Platform Registry.

---

# Lifecycle

```text
Builder 012
        │
        ▼
Topic Signal
        │
        ▼
Platform Signal Store
        │
        ▼
Cross-Company Aggregation
```

The bootstrap implementation may persist Topic Signals as JSON execution outputs.

Future implementations should persist Topic Signals in the Platform Signal Store without changing the Topic Signal contract.

---

# Design Principles

Topic Signals must be:

- deterministic
- replayable
- immutable
- explainable
- evidence-focused
- execution-scoped
- specification-defined

Topic Signals must never:

- preserve complete execution computation
- expose implementation internals
- create Topics
- modify Topics
- merge Topics
- bypass Governance
- leak transient computation into Platform Intelligence

---

# Architecture Summary

Topic Signals provide the deterministic execution observations that connect Company Intelligence to Platform Intelligence.

Unlike the Topic Assignment Artifact, which records Builder 012's business conclusions, Topic Signals preserve only the qualified execution observations required to explain those conclusions.

The Builder Specification defines deterministic qualification rules that separate qualified execution observations from transient computation.

By persisting only qualified execution observations, the platform enables scalable evidence accumulation, deterministic replay, explainability, and autonomous Platform Intelligence while preventing implementation details from becoming long-term platform knowledge.