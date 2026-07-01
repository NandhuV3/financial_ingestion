# 003 - Cross-Company Aggregation

**Status:** LOCKED  
**Layer:** Platform Intelligence  
**Owner:** Platform Intelligence Architecture  
**Classification:** Derived Platform Artifact Producer  
**Last Updated:** 2026-07-01

---

# Purpose

Cross-Company Aggregation transforms immutable Topic Signals into deterministic aggregated evidence across companies, reporting periods, filings, and Topic Registry versions.

Its responsibility is to accumulate execution evidence.

It does **not** interpret that evidence.

It does **not** evaluate ontology quality.

It does **not** propose new Topics.

It does **not** modify the Platform Registry.

---

# Core Principle

One Topic Signal represents an observation.

Many independent Topic Signals represent evidence.

Cross-Company Aggregation never changes observations.

It only accumulates evidence from them.

---

# Why Aggregation Exists

Builder 012 produces deterministic execution observations for individual Themes.

Those observations answer:

> What happened during this execution?

Cross-Company Aggregation answers:

> What recurring execution patterns exist across many independent executions?

Only recurring evidence across companies and time should influence future Platform Registry evolution.

---

# Position in Platform Intelligence

```text
Builder 012
        │
        ▼
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
Platform Governance
        │
        ▼
Platform Registry
```

Aggregation is the first Platform Intelligence component that operates across multiple executions.

---

# Ownership

Cross-Company Aggregation owns exactly one responsibility:

> Transform immutable Topic Signals into deterministic aggregated evidence.

It owns aggregation.

It does not own interpretation.

---

# Inputs

Cross-Company Aggregation currently consumes only:

- Topic Signals

Future Platform Intelligence stages may introduce additional Platform Signal types, including:

- Industry Signals
- Taxonomy Signals
- Registry Coverage Signals

Those signal types are outside the scope of this specification.

Cross-Company Aggregation must never consume:

- SEC Filings
- Filing Artifact
- Evidence Identity
- Themes
- Topic Assignment Artifact
- Topic Registry
- Topic Evolution
- Structured Intelligence
- Company Knowledge

All required execution information already exists inside Topic Signals.

---

# Output Classification

Cross-Company Aggregation produces an **Aggregation Result**.

Aggregation Results are classified as:

**Derived Platform Artifacts**

Derived Platform Artifacts are:

- persisted
- immutable
- replayable
- lineage-aware
- independently consumable

Derived Platform Artifacts do **not** require governance promotion.

They represent deterministic accumulated evidence.

They do not represent canonical platform knowledge.

---

# Why Aggregation Results Are Platform Artifacts

Aggregation Results:

- have independent consumers
- participate in lineage
- require versioning
- must remain replayable
- are independently auditable

Although they contain evidence rather than governed knowledge, they satisfy the behavioral requirements of Platform Artifacts.

Their distinction from governed Platform Artifacts is behavioral:

```text
Derived Platform Artifact

↓

requires_governance_promotion = false
```

---

# Aggregation Responsibilities

Cross-Company Aggregation is responsible for:

- collecting Topic Signals
- grouping observations
- counting observations
- calculating deterministic statistics
- measuring recurrence
- measuring company diversity
- measuring reporting-period diversity
- measuring registry-version coverage
- measuring assignment distributions
- measuring candidate distributions
- measuring similarity distributions

Cross-Company Aggregation is NOT responsible for:

- semantic similarity evaluation
- embedding generation
- Topic Assignment
- Candidate Discovery
- Platform Governance
- Platform Registry mutation
- ontology evolution
- business interpretation

---

# Allowed Operations

Cross-Company Aggregation performs deterministic analytical operations only.

Allowed operations:

- group
- filter
- sort
- count
- sum
- average
- minimum
- maximum
- percentile
- histogram
- distribution

Aggregation must never perform:

- embedding generation
- cosine similarity computation
- semantic search
- clustering
- candidate generation
- ontology inference
- LLM reasoning

Similarity values recorded inside Topic Signals may be aggregated.

They must never be recomputed.

---

# Evidence Requirements

Recurring evidence requires multiple independent Topic Signals.

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
```

Independent observations provide stronger evidence than repeated observations from a single company.

---

# Company Diversity Principle

Evidence quality increases with diversity.

Preferred:

```text
Microsoft
Apple
Google
Amazon
```

Less persuasive:

```text
Microsoft
Microsoft
Microsoft
Microsoft
```

Company diversity is a statistic.

It is not a governance decision.

---

# Temporal Principle

Recurring observations across reporting periods strengthen evidence.

Example:

```text
Microsoft
2026-Q1

↓

Topic Signal

Microsoft
2026-Q2

↓

Topic Signal

Apple
2026-Q2

↓

Topic Signal

Google
2026-Q2

↓

Topic Signal
```

Aggregation records recurrence.

It does not determine whether recurrence justifies Platform Registry evolution.

---

# Aggregation Dimensions

Aggregation may group observations across:

- topic_id
- registry_version
- company_id
- reporting period
- filing_id
- assignment status
- assignment method
- accepted candidates
- rejected candidates
- similarity score distributions

Aggregation must never compute new semantic relationships.

---

# Aggregation Configuration

Aggregation behavior is controlled by versioned configuration.

Examples include:

- observation windows
- aggregation policies
- filtering policies
- registry-version boundaries

Aggregation configuration must never be hardcoded into implementation.

Configuration forms part of replayability.

Changing aggregation configuration produces a new Aggregation Result.

Historical Aggregation Results remain unchanged.

---

# Artifact Lineage

Every Aggregation Result records:

- consumed Topic Signal set
- aggregation version
- aggregation configuration version

This guarantees complete downstream auditability.

Candidate Discovery and Platform Governance must always know exactly which Aggregation Result they consumed.

---

# No Ontology Mutation

Cross-Company Aggregation never modifies the Platform Registry.

It never:

- creates Topics
- merges Topics
- renames Topics
- deprecates Topics
- promotes Candidates

It only accumulates evidence.

---

# Relationship with Candidate Discovery

Cross-Company Aggregation has no knowledge of Candidate Discovery policies.

It does not:

- prioritize candidates
- rank candidates
- apply discovery thresholds
- infer ontology gaps

Its sole responsibility is producing deterministic aggregated evidence.

Candidate Discovery independently determines whether that evidence justifies proposing ontology evolution.

---

# Determinism

Given identical:

- Topic Signals
- Aggregation Configuration
- Aggregation Version

Cross-Company Aggregation must produce identical Aggregation Results.

Replay must produce identical aggregated evidence.

---

# Replayability

Historical Aggregation Results are immutable.

Replaying with identical inputs produces identical outputs.

Changing:

- Topic Signals
- Aggregation Configuration
- Aggregation Version

produces a new Aggregation Result.

Historical Aggregation Results are never modified.

---

# Design Principles

Cross-Company Aggregation must be:

- deterministic
- replayable
- immutable
- evidence-driven
- company-independent
- registry-aware
- lineage-aware
- statistically grounded

Cross-Company Aggregation must never:

- interpret evidence
- infer ontology changes
- create candidates
- mutate registries
- bypass governance
- discard execution evidence

---

# Architecture Summary

Cross-Company Aggregation is the deterministic bridge between execution evidence and ontology evolution.

It transforms many immutable Topic Signals into persisted, replayable, lineage-aware Aggregation Results without interpreting their meaning.

By separating evidence accumulation from Candidate Discovery, Platform Governance, and Platform Registry evolution, the platform ensures that ontology growth is driven by recurring, statistically grounded execution evidence rather than individual company observations or implementation-specific behavior.