# 003 - Cross-Company Aggregation

**Status:** LOCKED  
**Layer:** Platform Intelligence  
**Owner:** Platform Intelligence Architecture  
**Last Updated:** 2026-06-30

---

# Purpose

Cross-Company Aggregation is responsible for discovering recurring patterns across Platform Signals emitted by Company Intelligence.

It transforms isolated execution observations into statistically meaningful evidence.

Cross-Company Aggregation does **not** create ontology.

It only determines whether multiple independent observations indicate that the platform's current knowledge may be incomplete.

---

# Core Principle

One company represents an observation.

Many companies represent evidence.

Platform Intelligence evolves only from recurring evidence.

---

# Why Aggregation Exists

Execution pipelines process companies independently.

A single filing cannot determine whether:

- a reusable business concept exists,
- an ontology gap exists,
- a new Topic should exist,
- a registry should evolve.

Those questions require evidence collected across many companies and many reporting periods.

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
```

Aggregation exists before Candidate Discovery.

---

# Inputs

Cross-Company Aggregation consumes only immutable Platform Signals.

Examples:

- Topic Signals
- Industry Signals
- Taxonomy Signals
- Registry Coverage Signals

Aggregation never consumes Company Intelligence artifacts directly.

---

# Outputs

Aggregation produces Aggregation Results.

Aggregation Results are analytical summaries describing recurring patterns.

They are **not** governance decisions.

They are **not** ontology changes.

They are evidence packages for Candidate Discovery.

---

# Aggregation Responsibilities

Cross-Company Aggregation is responsible for:

- collecting Platform Signals
- grouping similar observations
- identifying recurring patterns
- measuring recurrence
- measuring consistency
- measuring cross-company coverage
- measuring temporal persistence

Aggregation is **not** responsible for:

- creating Candidates
- creating Topics
- modifying registries
- governance decisions

---

# Evidence Requirements

Recurring patterns must be supported by multiple independent observations.

Examples:

```text
Microsoft
        │
        ▼
Topic Signal

Apple
        │
        ▼
Topic Signal

Google
        │
        ▼
Topic Signal

Amazon
        │
        ▼
Topic Signal
```

Independent observations produce stronger evidence than repeated observations from a single company.

---

# Cross-Company Principle

Platform knowledge should emerge from reusable business concepts.

It must never emerge from company-specific terminology.

Example:

Observed:

- OpenAI Partnership
- Anthropic Partnership
- AI Collaboration
- Foundation Model Alliance

Aggregation may discover:

```text
Strategic AI Partnerships
```

Aggregation must never conclude:

```text
OpenAI
```

The platform evolves reusable concepts, not company names.

---

# Temporal Principle

Aggregation considers recurrence over time.

A concept appearing once is weak evidence.

A concept appearing repeatedly across multiple quarters strengthens confidence.

Example:

```text
Microsoft
2026-Q1

↓

Signal

Microsoft
2026-Q2

↓

Signal

Apple
2026-Q2

↓

Signal

Google
2026-Q2

↓

Signal
```

Together these provide stronger evidence than a single isolated observation.

---

# Company Diversity Principle

Platform Intelligence values diversity of evidence.

Signals originating from multiple independent companies carry more weight than repeated signals from one company.

Example:

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

---

# Aggregation Dimensions

Aggregation may analyze observations across:

- companies
- industries
- reporting periods
- filing types
- business sectors
- existing ontology proximity

The aggregation process remains deterministic.

---

# No Ontology Mutation

Aggregation never modifies Platform Registries.

It only produces evidence.

Example:

```text
Signals

↓

Recurring Pattern

↓

Aggregation Result
```

Not:

```text
Signals

↓

New Topic
```

---

# Determinism

Given identical Platform Signals:

- identical groups must be produced.
- identical statistics must be produced.
- identical Aggregation Results must be produced.

Aggregation algorithms must remain deterministic and replayable.

---

# Relationship with Candidate Discovery

Aggregation identifies recurring evidence.

Candidate Discovery evaluates whether that evidence justifies proposing new reusable platform knowledge.

Aggregation never creates Candidates directly.

---

# Design Principles

Cross-Company Aggregation must be:

- deterministic
- replayable
- evidence-driven
- company-independent
- ontology-independent
- statistically grounded

Aggregation must never:

- invent concepts
- create Topics
- merge Topics
- approve Topics
- deprecate Topics

Those responsibilities belong to later Platform Intelligence stages.

---

# Architecture Summary

Cross-Company Aggregation transforms isolated execution observations into reusable evidence.

It provides the analytical bridge between Platform Signals and Candidate Discovery.

By requiring recurring, cross-company evidence before proposing ontology evolution, the platform prevents transient company-specific observations from polluting reusable platform knowledge while allowing the ontology to improve continuously over time.