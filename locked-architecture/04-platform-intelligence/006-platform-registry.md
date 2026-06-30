# 006 - Platform Registry

**Status:** LOCKED  
**Layer:** Platform Intelligence  
**Owner:** Platform Intelligence Architecture  
**Last Updated:** 2026-06-30

---

# Purpose

A Platform Registry is the governed source of truth for reusable platform knowledge.

Platform Registries contain canonical concepts that Company Intelligence consumes during execution.

Unlike execution artifacts, Platform Registries evolve slowly through governance and are shared across all companies.

Platform Registries are read-only during execution.

---

# Core Principle

Execution consumes Platform Knowledge.

Platform Intelligence evolves Platform Knowledge.

Execution never mutates Platform Registries.

```text
Platform Intelligence
        │
        ▼
Platform Registry
        │
        ▼
Company Intelligence
```

---

# Why Platform Registries Exist

Execution pipelines require reusable knowledge that is:

- canonical
- versioned
- deterministic
- governed
- replayable

Platform Registries provide this reusable knowledge.

Without Platform Registries:

- execution would invent concepts,
- ontology would drift,
- replayability would be impossible,
- semantic consistency would degrade over time.

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
Platform Governance
        │
        ▼
Platform Registry
        │
        ▼
Company Intelligence
```

Platform Registries are the final output of Platform Intelligence.

---

# Registry Characteristics

Every Platform Registry must be:

- governed
- canonical
- versioned
- immutable after publication
- replayable
- deterministic
- company-independent

Platform Registries represent reusable knowledge.

They never represent observations.

---

# Registry Ownership

Platform Registries are owned exclusively by Platform Intelligence.

Execution pipelines are consumers.

Execution pipelines are never owners.

---

# Registry Evolution

Platform Registries evolve only through Platform Governance.

Execution pipelines cannot:

- create registry entries
- modify registry entries
- merge registry entries
- delete registry entries
- promote registry entries

Registry evolution always follows:

```text
Signal
        │
        ▼
Aggregation
        │
        ▼
Candidate
        │
        ▼
Governance
        │
        ▼
Registry
```

---

# Registry Versioning

Every approved governance action produces a new Registry version.

Example:

```text
Registry v18

↓

Governance Approval

↓

Registry v19
```

Historical versions remain immutable.

Historical execution must always remain replayable.

---

# Registry Consumption

Execution pipelines consume a single approved Registry version.

Example:

```text
Topic Assignment

↓

Topic Registry v12
```

Execution never mixes Registry versions.

Every execution records the Registry version used.

---

# Registry Immutability

Published Registry versions are immutable.

Corrections never overwrite previous versions.

Instead:

```text
Registry v4

↓

Correction

↓

Registry v5
```

Historical versions remain available for replay.

---

# Registry Independence

Platform Registries are independent of:

- companies
- quarters
- filings
- individual observations

Registry entries describe reusable business concepts.

They do not describe company-specific events.

---

# Registry Scope

Platform Registries may govern:

- Topics
- Industries
- Business Signal Taxonomies
- Trust Taxonomies
- Market Context Ontologies
- Future reusable knowledge structures

Each registry specializes the same governance architecture.

---

# Registry Relationships

Platform Registries may reference other Platform Registries.

Example:

```text
Industry Registry

↓

Technology

↓

Related Topics

Cloud

Artificial Intelligence

Cybersecurity
```

Relationships remain governed.

Relationships are never inferred during execution.

---

# Registry Lifecycle

```text
Platform Signals
        │
        ▼
Aggregation
        │
        ▼
Candidate
        │
        ▼
Governance
        │
        ▼
Registry Version
        │
        ▼
Execution Consumption
```

Only approved Registry versions are visible to execution.

---

# Registry Retirement

Registry entries may be:

- deprecated
- merged
- superseded

Retirement never removes historical versions.

Historical execution must remain reproducible.

---

# Replayability

Every Company Intelligence execution must be reproducible using:

- execution artifacts,
- execution model versions,
- execution prompts,
- Platform Registry version.

Replayability requires immutable Registry versions.

---

# Separation of Responsibilities

Platform Intelligence owns:

- registry evolution
- registry governance
- registry versioning

Company Intelligence owns:

- registry consumption
- company reasoning
- business understanding

Responsibilities must never overlap.

---

# Future Bootstrap Strategy

Early platform versions may bootstrap Platform Registries from static source files (for example, `topics.json`).

These bootstrap files are implementation details.

They are not the long-term architectural source of truth.

As Platform Intelligence matures, bootstrap files are replaced by governed Platform Registries without changing Company Intelligence architecture.

---

# Design Principles

Platform Registries must be:

- canonical
- deterministic
- governed
- replayable
- reusable
- versioned
- immutable after publication

Platform Registries must never:

- mutate during execution
- contain company-specific knowledge
- contain filing-specific observations
- bypass governance
- break replayability

---

# Architecture Summary

Platform Registries are the governed, versioned, and reusable knowledge foundation of the platform.

They represent the final output of Platform Intelligence and the primary knowledge input for Company Intelligence.

By separating registry evolution from execution, the platform ensures that reusable knowledge improves continuously while execution remains deterministic, explainable, and fully replayable.