# 008 - Aggregation Result Specification

**Status:** LOCKED  
**Layer:** Platform Intelligence  
**Owner:** Platform Intelligence Architecture  
**Producer:** Builder 013 - Cross-Company Aggregation  
**Consumer:** Candidate Discovery  
**Classification:** Derived Platform Artifact  
**Last Updated:** 2026-07-01

---

# Purpose

Aggregation Results represent deterministic, replayable evidence accumulated from immutable Topic Signals.

They summarize recurring execution observations across many companies, reporting periods, filings, and registry versions.

Aggregation Results are evidence.

They are **not** governance decisions.

They are **not** Platform Registry mutations.

They are **not** ontology proposals.

---

# Why Aggregation Results Exist

Individual Topic Signals describe one execution.

Candidate Discovery requires evidence collected across many executions.

Aggregation Results bridge that gap.

They answer:

> What recurring execution patterns exist across the platform?

They do not answer:

> What should the Platform Registry become?

---

# Position in Platform Intelligence

```text
Builder 012
        │
        ▼
Topic Signals
        │
        ▼
Builder 013
Cross-Company Aggregation
        │
        ▼
Aggregation Result
(Derived Platform Artifact)
        │
        ▼
Candidate Discovery
```

Aggregation Results are the first persisted Platform Artifact produced by Platform Intelligence.

---

# Output Classification

Aggregation Results are classified as:

**Derived Platform Artifacts**

Derived Platform Artifacts:

- are persisted
- are immutable
- are replayable
- are lineage-aware
- are independently consumable
- do not require governance promotion

Aggregation Results contain accumulated evidence.

They do not contain governed platform knowledge.

---

# Ownership

Aggregation Results own exactly one responsibility:

> Preserve deterministic aggregated evidence produced from Topic Signals.

They never:

- interpret evidence
- recommend governance actions
- propose ontology mutations
- modify Platform Registries

---

# Required Inputs

Aggregation Results are derived only from:

- Topic Signals

No other inputs are permitted.

Aggregation Results must never consume:

- SEC Filings
- Filing Artifact
- Themes
- Topic Assignment Artifact
- Topic Registry
- Candidate Discovery
- Platform Governance

---

# Required Information

Every Aggregation Result must preserve enough information to explain the accumulated evidence.

This includes:

Aggregation Context

- aggregation_id
- aggregation_version
- aggregation_configuration_version

Registry Context

- registry_version

Evidence Statistics

- accepted assignment counts
- human review counts
- unassigned counts
- assignment method distributions
- similarity score distributions
- company diversity
- reporting period diversity
- filing diversity

Artifact Metadata

- generated_at

The contract intentionally preserves statistics.

It never preserves conclusions.

---

# Forbidden Information

Aggregation Results must never contain:

- candidate proposals
- governance recommendations
- ontology mutations
- Platform Registry edits
- business interpretation
- company-specific conclusions
- LLM reasoning

Aggregation Results preserve evidence only.

---

# Statistical Responsibility

Aggregation Results may summarize:

- counts
- frequencies
- averages
- minimums
- maximums
- percentiles
- distributions

Aggregation Results must never:

- generate embeddings
- compute semantic similarity
- cluster observations
- infer new Topics
- rank ontology candidates

Those responsibilities belong to later Platform Intelligence stages.

---

# Lineage

Aggregation Results must record:

- consumed Topic Signal set
- aggregation version
- aggregation configuration version

This guarantees complete replayability and downstream auditability.

---

# Replayability

Given identical:

- Topic Signals
- Aggregation Configuration
- Aggregation Version

Builder 013 must produce identical Aggregation Results.

Replay must always reproduce identical accumulated evidence.

---

# Immutability

Aggregation Results are immutable.

Historical Aggregation Results are never modified.

Changes to:

- Topic Signals
- Aggregation Configuration
- Aggregation Version

produce a new Aggregation Result.

---

# Relationship with Candidate Discovery

Aggregation Results are consumed by Candidate Discovery.

Candidate Discovery evaluates whether recurring evidence justifies proposing reusable Platform Knowledge.

Aggregation Results never perform this evaluation themselves.

---

# Relationship with Platform Registry

Aggregation Results never modify Platform Registries.

Instead:

```text
Aggregation Result

↓

Candidate Discovery

↓

Platform Governance

↓

Platform Registry
```

Registry evolution always occurs downstream.

---

# Relationship with Governance

Aggregation Results never recommend governance actions.

They provide deterministic evidence only.

Platform Governance independently determines whether accumulated evidence justifies a registry mutation.

---

# Lifecycle

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
```

Aggregation Results never bypass this lifecycle.

---

# Design Principles

Aggregation Results must be:

- deterministic
- replayable
- immutable
- lineage-aware
- statistically grounded
- evidence-driven
- independently consumable

Aggregation Results must never:

- infer ontology changes
- recommend governance actions
- mutate Platform Registries
- bypass Candidate Discovery
- lose execution evidence

---

# Architecture Summary

Aggregation Results are deterministic, persisted evidence packages produced by Cross-Company Aggregation.

They accumulate immutable Topic Signals into statistically meaningful observations while remaining completely independent from ontology evolution.

By separating accumulated evidence from candidate generation, governance, and Platform Registry mutation, the platform ensures that ontology evolution is always driven by replayable evidence rather than implementation-specific interpretation.