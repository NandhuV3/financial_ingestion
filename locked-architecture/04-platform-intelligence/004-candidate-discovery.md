# 004 - Candidate Discovery

**Status:** LOCKED  
**Layer:** Platform Intelligence  
**Owner:** Platform Intelligence Architecture  
**Producer:** Builder 014 - Candidate Discovery  
**Consumer:** Platform Governance  
**Last Updated:** 2026-07-01

---

# Purpose

Candidate Discovery converts recurring aggregated evidence into governed Topic Candidates.

A Topic Candidate represents a reusable platform concept that is sufficiently supported by aggregated execution evidence but has not yet become part of the Platform Registry.

Candidate Discovery proposes candidate concepts.

It never evolves the Platform Registry.

---

# Core Principle

Execution observations become aggregated evidence.

Aggregated evidence becomes Topic Candidates.

Platform Governance determines Registry evolution.

```text
Topic Signals
        │
        ▼
Cross-Company Aggregation
        │
        ▼
Aggregation Result
        │
        ▼
Candidate Discovery
        │
        ▼
Topic Candidate
        │
        ▼
Platform Governance
        │
        ▼
Platform Registry
```

Candidate Discovery transforms evidence into governed proposals.

It never transforms proposals into Platform Knowledge.

---

# Why Candidate Discovery Exists

Recurring evidence alone does not justify Platform Registry evolution.

Platform Governance requires explicit candidate objects that:

- summarize recurring evidence
- preserve evidence traceability
- propose reusable concepts
- remain deterministic
- remain replayable
- remain immutable

Candidate Discovery creates these governed candidate objects.

---

# Position in Platform Intelligence

```text
Aggregation Result
        │
        ▼
Builder 014
        │
        ▼
Topic Candidate
        │
        ▼
Platform Governance
        │
        ▼
Platform Registry
```

Candidate Discovery exists between evidence accumulation and governance.

---

# Input

Candidate Discovery consumes only:

- Aggregation Result Platform Artifacts

Candidate Discovery must never consume:

- Topic Signals
- Themes
- Topic Assignment Artifacts
- Company Knowledge
- SEC filings
- Platform Registry
- Company Intelligence artifacts

Aggregation has already accumulated and normalized execution evidence.

Candidate Discovery never recomputes aggregation.

---

# Output

Candidate Discovery produces:

**Topic Candidates**

Topic Candidates are:

**Governance Artifacts**

Properties:

- deterministic
- replayable
- immutable
- evidence-backed
- governance-scoped

Topic Candidates are NOT:

- Platform Artifacts
- Platform Registries
- Company Intelligence artifacts
- Execution Records

---

# Responsibilities

Candidate Discovery is responsible for:

- evaluating Aggregation Results
- identifying reusable platform concepts
- constructing deterministic Topic Candidates
- preserving supporting evidence
- explaining why a candidate exists

Candidate Discovery is NOT responsible for:

- aggregating Topic Signals
- recomputing evidence
- semantic similarity evaluation
- embedding generation
- LLM reasoning
- ontology mutation
- Platform Registry updates
- governance decisions

---

# Deterministic Candidate Formation

Candidate Discovery follows deterministic candidate formation rules.

The Candidate Discovery Specification defines these rules.

Builder implementations apply them.

They never redefine them.

Candidate formation must always be:

- deterministic
- replayable
- specification-defined
- implementation-independent

Given identical Aggregation Results:

Builder 014 must produce identical Topic Candidates.

---

# Candidate Formation

Candidate Discovery evaluates accumulated evidence.

It determines whether the accumulated evidence represents a reusable platform concept.

Example:

```text
Aggregation Result

↓

Recurring evidence:

- Strategic Partnership with OpenAI
- Foundation Model Partnership
- AI Collaboration
- Generative AI Alliance

↓

Proposed reusable concept

↓

Strategic AI Partnerships

↓

Topic Candidate
```

Candidate Discovery proposes reusable concepts.

Platform Governance determines whether they become Platform Knowledge.

---

# Candidate Requirements

Every Topic Candidate must represent:

- a reusable business concept
- company-independent meaning
- recurring evidence
- deterministic construction
- preserved evidence traceability

Topic Candidates must never represent:

- company names
- products
- individual filings
- reporting periods
- metrics
- temporary business events

---

# Evidence Preservation

Every Topic Candidate must preserve sufficient evidence for governance.

Governance must always be able to determine:

- why the candidate exists
- what recurring evidence supports it
- which Aggregation Results contributed
- what companies contributed
- what reporting periods contributed
- what Registry version was evaluated

Candidate Discovery preserves evidence lineage.

It never consumes or references Topic Signals directly.

---

# Candidate Stability

Topic Candidates should remain stable across:

- companies
- industries
- reporting periods

Candidate identity must never depend upon:

- one company
- one filing
- one reporting period

Topic Candidates represent reusable Platform Knowledge proposals.

---

# Relationship with Cross-Company Aggregation

Cross-Company Aggregation answers:

> What recurring execution evidence exists?

Candidate Discovery answers:

> Does this recurring evidence justify proposing a reusable platform concept?

These responsibilities intentionally remain separate.

Candidate Discovery never performs aggregation.

Cross-Company Aggregation never proposes candidates.

---

# Relationship with Platform Governance

Candidate Discovery proposes.

Platform Governance evaluates.

Candidate Discovery never:

- approves candidates
- rejects candidates
- merges concepts
- edits Platform Registries
- activates Platform Knowledge

Only Platform Governance evolves the Platform Registry.

---

# Candidate Lifecycle

```text
Aggregation Result
        │
        ▼
Builder 014
        │
        ▼
Topic Candidate
(Governance Artifact)
        │
        ▼
Platform Governance
        │
        ├────────────► Rejected
        │
        ├────────────► Deferred
        │
        ▼
Approved
        │
        ▼
Platform Registry
```

Candidate Discovery owns only Topic Candidate construction.

---

# Lineage

Topic Candidates preserve lineage through Aggregation Results.

Evidence traceability follows:

```text
Topic Signals
        │
        ▼
Aggregation Result
        │
        ▼
Topic Candidate
```

Candidate Discovery preserves upstream evidence.

It never reconstructs execution history.

---

# Determinism

Given identical:

- Aggregation Results
- Candidate Discovery Specification
- Builder implementation

Builder 014 must produce identical Topic Candidates.

Candidate identifiers must be deterministic.

Candidate construction must never depend upon execution order.

---

# Design Principles

Candidate Discovery must be:

- deterministic
- replayable
- evidence-backed
- aggregation-driven
- specification-defined
- explainable
- immutable

Candidate Discovery must never:

- aggregate execution observations
- recompute similarity
- invent evidence
- bypass Platform Governance
- mutate Platform Registries
- expose implementation details

---

# Architecture Summary

Candidate Discovery is the proposal layer of Platform Intelligence.

It transforms recurring aggregated evidence into deterministic Topic Candidates while preserving complete evidence traceability.

By separating evidence accumulation, candidate formation, governance, and registry evolution, the platform ensures that reusable Platform Knowledge emerges only from deterministic evidence and governed decisions, preserving explainability, replayability, and long-term autonomous Platform Intelligence.