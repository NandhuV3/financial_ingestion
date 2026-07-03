# 011 - Topic Candidate Specification

**Status:** LOCKED  
**Layer:** Platform Intelligence  
**Owner:** Platform Intelligence Architecture  
**Producer:** Builder 014 - Candidate Discovery  
**Consumer:** Platform Governance  
**Last Updated:** 2026-07-01

---

# Purpose

Topic Candidates represent reusable Platform Knowledge proposals produced from recurring aggregated evidence.

A Topic Candidate proposes that a reusable business concept may be missing from the current Platform Registry.

A Topic Candidate is not Platform Knowledge.

A Topic Candidate is a governance proposal.

---

# Core Principle

Execution observations become evidence.

Evidence becomes Topic Candidates.

Platform Governance determines whether Topic Candidates become Platform Knowledge.

```text
Topic Signals

↓

Aggregation Result

↓

Candidate Discovery

↓

Topic Candidate

↓

Platform Governance

↓

Platform Registry
```

Topic Candidates never bypass Platform Governance.

---

# Why Topic Candidates Exist

Recurring evidence alone is insufficient to evolve the Platform Registry.

Platform Governance requires deterministic proposal objects that:

- summarize recurring evidence
- preserve evidence lineage
- describe reusable concepts
- remain replayable
- remain immutable

Topic Candidates provide this proposal layer.

---

# Output Classification

Topic Candidates are persisted as:

**Topic Candidate Governance Artifacts**

Each Topic Candidate Governance Artifact contains exactly one Topic Candidate.

Every Topic Candidate Governance Artifact has:

- one artifact identity
- one Topic Candidate
- one lineage
- one version history

Properties:

- deterministic
- replayable
- immutable
- governance-scoped
- evidence-backed

Topic Candidate Governance Artifacts are NOT:

- Platform Artifacts
- Execution Records
- Platform Registries
- Company Intelligence outputs

---

# Producer

Topic Candidates are produced exclusively by:

Builder 014 — Candidate Discovery

No other builder may produce Topic Candidates.

---

# Consumer

Topic Candidates are consumed exclusively by:

Platform Governance

Future governance tooling may consume Topic Candidates.

Company Intelligence must never consume Topic Candidates.

---

# Inputs

Topic Candidates are derived only from:

- Aggregation Result Platform Artifacts

Topic Candidates must never consume:

- Topic Signals
- Themes
- Topic Assignment
- Company Knowledge
- Platform Registry

Candidate Discovery operates only on accumulated evidence.

---

# Identity

Every Topic Candidate must have a deterministic identity.

Identity must not depend upon:

- execution order
- timestamps
- company ordering

Identity should remain stable for identical evidence.

---

# Artifact Identity

Platform Governance assigns identity at the artifact level.

Therefore:

```text
One Topic Candidate

↓

One Topic Candidate Governance Artifact

↓

One Governance Decision
```

A Topic Candidate Governance Artifact must never contain multiple Topic Candidates.

Every Topic Candidate must have its own:

artifact identity
lineage
version history
governance lifecycle

This allows every governance proposal to be independently replayed, audited, evaluated, approved, rejected, or superseded.


This is the heart of the architectural correction.

---

# Required Information

Every Topic Candidate preserves sufficient information for governance evaluation.

## Candidate Identity

- candidate_id
- candidate_type
- candidate_version

---

## Proposed Concept

The proposed reusable concept.

Examples:

- Strategic AI Partnerships
- Hardware and Devices
- Carbon Transition Risk

The proposed concept must be:

- reusable
- company-independent
- registry-compatible

---

## Evidence Summary

Evidence supporting the proposal.

Examples:

- recurring occurrence count
- company diversity
- reporting period diversity
- registry versions observed
- similarity statistics

Evidence summarizes Aggregation Results.

It does not reconstruct execution.

---

## Supporting Aggregation

Every Topic Candidate Governance Artifact preserves lineage to exactly one supporting Aggregation Result.

Candidate Discovery may produce many Topic Candidate Governance Artifacts from one Aggregation Result.

Each Topic Candidate Governance Artifact preserves its lineage independently.

Topic Candidates never reference Topic Signals directly.

---

## Candidate Metadata

Examples:

- generated_at
- builder_version
- candidate_discovery_version

---

# Candidate Requirements

Every Topic Candidate must represent:

- reusable business concepts
- recurring evidence
- deterministic construction
- preserved evidence lineage

Topic Candidates must never represent:

- company names
- product names
- filing-specific observations
- temporary events
- metrics

---

# Candidate Stability

Topic Candidates should remain stable across:

- companies
- industries
- reporting periods

Candidate identity must never depend upon:

- one filing
- one company
- one reporting period

---

# Evidence Preservation

Topic Candidates preserve sufficient evidence for governance.

Governance must always be able to answer:

- Why does this candidate exist?
- What recurring evidence supports it?
- Which Aggregation Results contributed?
- Which Registry versions were evaluated?
- What diversity of evidence exists?

Topic Candidates preserve evidence summaries.

They never duplicate execution observations.

---

# Relationship with Candidate Discovery

Candidate Discovery constructs Topic Candidates.

Topic Candidate is the immutable output of Builder 014.

Candidate Discovery never performs governance.

---

# Relationship with Platform Governance

Platform Governance evaluates Topic Candidates.

Governance may:

- approve
- reject
- defer
- merge
- supersede

Topic Candidates never determine their own outcome.

---

# Relationship with Platform Registry

Topic Candidates never modify the Platform Registry.

Only Platform Governance may transform an approved Topic Candidate into a new Platform Registry version.

---

# Lifecycle

```text
Aggregation Result
        │
        ▼
Candidate Discovery
        │
        ├────────────► Topic Candidate Artifact A
        │
        ├────────────► Topic Candidate Artifact B
        │
        ├────────────► Topic Candidate Artifact C
        │
        ▼
Platform Governance

↓

Platform Registry
```

Topic Candidates remain immutable regardless of governance outcome.

Governance produces new Governance Artifacts rather than modifying existing Topic Candidates.

---

# Replayability

Given identical:

- Aggregation Results
- Candidate Discovery Specification
- Builder implementation

Builder 014 must produce identical Topic Candidates.

Topic Candidate identifiers must remain deterministic.

---

# Immutability

Topic Candidates are immutable.

Governance never edits existing Topic Candidates.

Each Topic Candidate Governance Artifact remains immutable after publication.

Governance outcomes never modify an existing Topic Candidate Governance Artifact.

Every governance action references the Topic Candidate through lineage rather than mutation.

Changes produce new Governance Artifacts.

Historical Topic Candidates remain available for audit and replay.

---

# Design Principles

Topic Candidates must be:

- deterministic
- replayable
- immutable
- evidence-backed
- governance-ready
- company-independent
- specification-defined
- one artifact represents exactly one Topic Candidate
- independently governable

Topic Candidates must never:

- become active Platform Knowledge
- mutate Platform Registries
- expose implementation details
- duplicate execution records
- bypass Platform Governance
- contain multiple Topic Candidates


---

# Architecture Summary

Topic Candidates are the proposal objects of Platform Intelligence.

They transform recurring aggregated evidence into immutable Governance Artifacts that Platform Governance evaluates for potential Platform Registry evolution.

By separating candidate construction from governance decisions, the platform preserves deterministic execution, complete evidence traceability, replayability, and autonomous Platform Intelligence while ensuring that reusable Platform Knowledge evolves only through governed processes.