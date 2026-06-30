# 004 - Candidate Discovery

**Status:** LOCKED  
**Layer:** Platform Intelligence  
**Owner:** Platform Intelligence Architecture  
**Last Updated:** 2026-06-30

---

# Purpose

Candidate Discovery is responsible for converting recurring cross-company evidence into governed Platform Knowledge Candidates.

A Candidate represents a reusable business concept that appears sufficiently supported by Platform Signals but has **not yet** become part of the Platform Registry.

Candidate Discovery does not approve, reject, promote, merge, or deprecate platform knowledge.

Its sole responsibility is discovering candidate concepts worthy of governance review.

---

# Core Principle

Observations become evidence.

Evidence becomes Candidates.

Governance produces Platform Knowledge.

```text
Platform Signals
        │
        ▼
Cross-Company Aggregation
        │
        ▼
Candidate Discovery
        │
        ▼
Governance
```

---

# Why Candidate Discovery Exists

Recurring evidence alone is insufficient to evolve Platform Knowledge.

A governance process requires explicit candidate objects that:

- summarize evidence,
- explain why evolution is being proposed,
- remain immutable,
- can be reviewed,
- can be replayed.

Candidate Discovery creates those objects.

---

# Position in Platform Intelligence

```text
Platform Signals
        │
        ▼
Cross-Company Aggregation
        │
        ▼
Candidate Discovery
        │
        ▼
Governance
        │
        ▼
Platform Registry
```

---

# Inputs

Candidate Discovery consumes only Aggregation Results.

It never consumes:

- SEC filings
- Themes
- Topic Assignment artifacts
- Company Knowledge
- Platform Signals directly

Aggregation has already normalized those observations.

---

# Outputs

Candidate Discovery produces Platform Knowledge Candidates.

Candidates are governance artifacts.

They are **not** Platform Registries.

They are **not** active ontology.

They are proposals.

---

# Responsibilities

Candidate Discovery is responsible for:

- evaluating recurring evidence
- grouping related observations
- proposing reusable concepts
- explaining supporting evidence
- producing deterministic candidates

Candidate Discovery is **not** responsible for:

- approving candidates
- rejecting candidates
- editing registries
- merging ontology
- deprecating ontology

---

# Candidate Requirements

Every Candidate must represent:

- a reusable business concept,
- supported recurring evidence,
- company-independent meaning,
- deterministic construction,
- complete supporting evidence.

Candidates must never represent:

- company names,
- products,
- quarters,
- metrics,
- temporary events.

---

# Candidate Formation

Candidates emerge from recurring patterns.

Example:

```text
Microsoft

↓

Strategic Partnership with OpenAI

Apple

↓

Foundation Model Partnership

Google

↓

AI Collaboration

Amazon

↓

Generative AI Alliance
```

Cross-Company Aggregation discovers:

```text
Recurring AI partnership pattern
```

Candidate Discovery proposes:

```text
Strategic AI Partnerships
```

Governance later decides whether this belongs in the Platform Registry.

---

# Candidate Independence

Candidates describe reusable concepts.

They must never describe observations.

Example:

Correct:

```text
Hardware and Devices
```

Incorrect:

```text
Windows OEM Revenue Decline
```

The first is reusable.

The second is a company-specific observation.

---

# Candidate Stability

Candidates should remain stable across:

- companies,
- industries,
- reporting periods.

Candidate identity must not depend on:

- one filing,
- one company,
- one quarter.

---

# Determinism

Given identical Aggregation Results:

- identical Candidates must be produced.

Candidate generation must never depend on execution order.

Candidate identifiers must be deterministic.

---

# Evidence Preservation

Every Candidate must preserve traceability.

Governance must always be able to answer:

- Why was this Candidate created?
- Which recurring observations support it?
- Which companies contributed?
- Over what time period?
- What evidence exists?

Candidate Discovery must never lose supporting evidence.

---

# Relationship with Governance

Candidate Discovery proposes.

Governance decides.

Candidate Discovery cannot:

- activate concepts,
- modify registries,
- merge concepts,
- deprecate concepts.

Only Governance owns Platform Knowledge evolution.

---

# Candidate Lifecycle

```text
Aggregation Result
        │
        ▼
Candidate
        │
        ▼
Governance Review
        │
        ├─────────────► Rejected
        │
        ▼
Approved
        │
        ▼
Platform Registry
```

Candidate Discovery owns only the first step.

---

# Design Principles

Candidate Discovery must be:

- deterministic,
- evidence-backed,
- replayable,
- explainable,
- ontology-independent.

Candidate Discovery must never:

- bypass governance,
- create active Platform Knowledge,
- mutate Platform Registries,
- infer company-specific concepts.

---

# Architecture Summary

Candidate Discovery converts recurring cross-company evidence into governed Platform Knowledge Candidates.

It forms the architectural boundary between analytical observation and governance.

By separating Candidate creation from Governance, the platform ensures that reusable business concepts emerge only from evidence while all ontology evolution remains deliberate, explainable, versioned, and replayable.