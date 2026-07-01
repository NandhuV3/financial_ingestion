# 007 - Topic Signal Specification

**Status:** LOCKED  
**Layer:** Platform Intelligence  
**Owner:** Platform Intelligence Architecture  
**Producer:** Builder 012 - Topic Assignment  
**Consumer:** Cross-Company Aggregation  
**Last Updated:** 2026-06-30

---

# Purpose

Topic Signals capture the complete deterministic execution trace produced by Builder 012 while evaluating a Theme against the current Topic Registry.

They preserve the evaluation process that produced the final Topic Assignment.

Topic Signals are execution evidence.

They are **not** business knowledge.

They are **not** governance decisions.

They are **not** Platform Registry mutations.

---

# Why Topic Signals Exist

Builder 012 has two independent responsibilities.

1. Produce Topic Assignment for Company Intelligence.
2. Produce execution evidence for Platform Intelligence.

These outputs intentionally serve different consumers.

The Topic Assignment Artifact answers:

> Which canonical Topics represent this Theme?

The Topic Signal answers:

> How did Builder 012 reach that decision?

Platform Intelligence depends on execution evidence rather than business knowledge.

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

- evaluation
- final assignment

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

# Execution Trace

A Topic Signal preserves the complete deterministic evaluation performed for a Theme.

The execution trace consists of four logical sections.

```text
Execution Context

↓

Theme

↓

Evaluation

↓

Final Result
```

---

# Required Information

Every Topic Signal must preserve sufficient evidence to completely explain the Builder execution.

## Execution Context

- company_id
- period_id
- filing_id
- execution_id

## Theme

- theme_id
- theme_title

## Evaluation

The evaluation records every Topic candidate considered by Builder 012.

Each candidate contains:

- topic_id
- similarity_score
- assignment_method
- decision

Decision values:

- accepted
- rejected

The evaluation preserves the ranking produced during execution.

No candidate ranking may be recomputed later.

---

## Final Result

The final result records the Builder's deterministic decision.

It contains:

- assignment_status
  - assigned
  - human_review
  - unassigned

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

Topic Signals preserve execution evidence.

This includes:

- accepted candidates
- rejected candidates
- similarity measurements
- assignment decisions

Execution evidence must never be discarded.

Platform Intelligence depends on historical execution evidence to evolve the Platform Registry.

---

# Forbidden Information

Topic Signals must never contain:

- governance decisions
- Topic Candidates
- Platform Registry mutations
- Company Knowledge
- Business Signals
- Quarter Understanding
- Investor Intelligence

Topic Signals preserve execution evidence only.

---

# Immutability

Topic Signals are immutable.

Historical Topic Signals are never modified.

Replay produces new Topic Signals.

Historical execution evidence remains unchanged.

---

# Replayability

Given identical:

- Themes
- Topic Registry
- embedding model
- Builder implementation

Builder 012 must emit identical Topic Signals.

Replay must reproduce identical execution evidence.

---

# Relationship with Topic Assignment

Topic Assignment records the Builder's business conclusion.

Topic Signals record the Builder's execution trace.

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

They preserve execution evidence only.

Governance evaluates accumulated evidence across many Topic Signals.

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
- evidence-complete
- execution-scoped

Topic Signals must never:

- create Topics
- modify Topics
- merge Topics
- bypass Governance
- discard evaluated execution evidence

---

# Architecture Summary

Topic Signals provide the deterministic execution evidence that connects Company Intelligence to Platform Intelligence.

Unlike the Topic Assignment Artifact, which records the Builder's business conclusions, Topic Signals preserve the complete execution trace that produced those conclusions.

This separation allows Platform Intelligence to learn from historical execution evidence across companies while Company Intelligence continues to consume only governed Platform Knowledge, preserving determinism, replayability, explainability, and governed ontology evolution.