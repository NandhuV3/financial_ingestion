# 007 - Topic Signal Specification

**Status:** LOCKED  
**Layer:** Platform Intelligence  
**Owner:** Platform Intelligence Architecture  
**Producer:** Builder 012 - Topic Assignment  
**Consumer:** Cross-Company Aggregation  
**Last Updated:** 2026-06-30

---

# Purpose

Topic Signals capture deterministic execution observations produced during Topic Assignment.

They describe how Builder 012 interpreted each Theme against the current Topic Registry.

Topic Signals are evidence.

They are **not** business knowledge.

They are **not** governance decisions.

They are **not** Platform Registry mutations.

---

# Why Topic Signals Exist

Topic Assignment has two responsibilities:

1. Produce governed Topic Assignments for Company Intelligence.
2. Produce execution observations for Platform Intelligence.

The Topic Assignment Artifact serves Company Intelligence.

Topic Signals serve Platform Intelligence.

This separation ensures Company Intelligence remains deterministic while Platform Intelligence continuously learns about ontology quality.

---

# Position in Company Intelligence

```text
Themes
    │
    ▼
Topic Assignment
    ├──────────────────────┐
    │                      │
    ▼                      ▼
Topic Assignment      Topic Signals
Platform Artifact     Execution Record
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

Topic Signals are the entry point into Platform Intelligence.

---

# Output Classification

Topic Signals are:

**Execution Records**

They are:

- deterministic
- replayable
- immutable
- execution-scoped

Topic Signals are NOT:

- Platform Artifacts
- Governance Artifacts
- Operational Records
- Platform Registries

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

- Registry Analytics
- Ontology Quality Monitoring
- Semantic Drift Detection

Company Intelligence must never consume Topic Signals.

---

# Inputs

Topic Signals are derived only from Builder 012 execution.

Inputs include:

- Themes Artifact
- Topic Registry
- Assignment Result
- Assignment Confidence
- Similarity Evaluation

Topic Signals must never reopen:

- SEC filings
- Evidence Identity
- Themes
- Topic Evolution
- Structured Intelligence

---

# Signal Granularity

Exactly one Topic Signal is produced for every Theme processed by Builder 012.

Example:

```text
5 Themes

↓

5 Topic Signals
```

Signal count must always equal Theme count.

---

# Assignment States

Every Topic Signal represents one deterministic execution outcome.

Allowed states:

- assigned
- human_review
- unassigned

No other execution states are permitted.

---

# Required Information

Every Topic Signal must preserve enough information to explain the execution outcome.

This includes:

Execution Context

- company_id
- period_id
- filing_id
- execution_id

Theme Context

- theme_id
- theme_title

Assignment Context

- assigned_topic_id (nullable)
- assignment_method
- similarity_score
- assignment_status

Registry Context

- registry_version

Execution Metadata

- embedding_model
- generated_at

---

# Forbidden Information

Topic Signals must never contain:

- governance decisions
- ontology mutations
- Topic Candidates
- Platform Registry updates
- Company Knowledge
- Business Signals
- Quarter Understanding
- Investor Intelligence

Topic Signals describe observations only.

---

# Immutability

Topic Signals are immutable.

Historical Topic Signals are never edited.

Corrections produce new Topic Signals through replay.

---

# Replayability

Given identical:

- Themes
- Topic Registry
- embedding model
- Builder implementation

Builder 012 must emit identical Topic Signals.

Replay must produce identical execution observations.

---

# Relationship with Topic Assignment

Topic Assignment answers:

> Which canonical Topic represents this Theme?

Topic Signal answers:

> What happened during Topic Assignment?

These responsibilities are intentionally different.

---

# Relationship with Platform Registry

Topic Signals never modify Platform Registries.

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

Topic Registry
```

Execution remains read-only.

---

# Relationship with Governance

Topic Signals never recommend governance actions.

They preserve evidence only.

Governance independently evaluates recurring evidence collected across many Topic Signals.

---

# Lifecycle

```text
Builder 012
        │
        ▼
Topic Signal
        │
        ▼
Signal Store
        │
        ▼
Cross-Company Aggregation
```

Topic Signals never bypass this lifecycle.

---

# Design Principles

Topic Signals must be:

- deterministic
- replayable
- immutable
- explainable
- evidence-backed
- execution-scoped

Topic Signals must never:

- create Topics
- modify Topics
- merge Topics
- delete Topics
- bypass Governance

---

# Architecture Summary

Topic Signals provide the deterministic bridge between Company Intelligence and Platform Intelligence.

They preserve execution observations without altering Company Intelligence outputs.

By separating Topic Assignment from Platform Intelligence, the platform ensures that ontology evolution is driven by accumulated evidence rather than individual execution decisions, preserving determinism, replayability, and governed knowledge evolution.