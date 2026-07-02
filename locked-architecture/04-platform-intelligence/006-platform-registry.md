# 006 - Platform Registry

**Status:** LOCKED  
**Layer:** Platform Intelligence  
**Owner:** Platform Intelligence Architecture  
**Classification:** Platform Registry 
**Last Updated:** 2026-07-01

---

# Purpose

A Platform Registry is the governed source of truth for reusable platform knowledge.

Platform Registries contain canonical concepts that Company Intelligence consumes during execution.

Unlike execution artifacts and derived platform artifacts, Platform Registries evolve only through Platform Governance and are shared across all companies.

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
- replayability would become impossible,
- semantic consistency would degrade over time.

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
(Derived Platform Artifact)
        │
        ▼
Candidate Discovery
        │
        ▼
Topic Candidate
(Governance Artifact)
        │
        ▼
Platform Governance
        │
        ▼
Governance Decision
(Governance Artifact)
        │
        ▼
Platform Registry
(Platform Registry)
        │
        ▼
Company Intelligence
```

Platform Registries are the final governed knowledge output of Platform Intelligence.

---

# Output Classification

Platform Registries are classified as:

**Governed Platform Artifacts**

Governed Platform Artifacts:

- contain canonical reusable platform knowledge
- require governance promotion
- are persisted
- versioned
- immutable after publication
- replayable
- lineage-aware
- independently consumable

Unlike Derived Platform Artifacts, Platform Registries become the authoritative source of platform knowledge.

---

# Derived vs Governed Platform Artifacts

Platform Intelligence produces two categories of Platform Artifacts.

## Derived Platform Artifacts

Examples:

- Aggregation Result

Characteristics:

- deterministic
- accumulated execution evidence
- replayable
- lineage-aware
- do not require governance promotion
- do not modify platform knowledge

---

## Governed Platform Artifacts

Examples:

- Topic Registry
- Industry Registry
- Future Platform Registries

Characteristics:

- canonical platform knowledge
- governance approved
- reusable by execution
- versioned
- immutable after publication

Platform Governance transforms evidence into governed knowledge.

---

# Registry Characteristics

Every Platform Registry must be:

- governed
- canonical
- versioned
- immutable after publication
- replayable
- deterministic
- lineage-aware
- company-independent

Platform Registries represent reusable knowledge.

They never represent execution observations.

---

# Registry Ownership

Platform Registries are owned exclusively by Platform Intelligence.

Execution pipelines are consumers.

Execution pipelines are never owners.

No execution pipeline may directly mutate a Platform Registry.

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
Topic Signals
        │
        ▼
Cross-Company Aggregation
        │
        ▼
Aggregation Result
        │
        ▼
Topic Candidate
        │
        ▼
Governance Decision
        │
        ▼
Platform Registry
```

Every mutation is governed.

---

# Registry Versioning

Every approved governance action produces a new Registry version.

Example:

```text
Registry Version 18

        ↓

Approved Governance Decision

        ↓

Registry Version 19
```

Historical Registry versions remain immutable.

Historical execution must always remain replayable.

---

# Registry Consumption

Execution pipelines consume exactly one approved Registry version.

Example:

```text
Topic Assignment

        ↓

Topic Registry v12
```

Execution never mixes Registry versions.

Every execution records the Registry version it consumed.

---

# Registry Immutability

Published Registry versions are immutable.

Corrections never overwrite historical versions.

Instead:

```text
Platform Registry Version 4

        ↓

Approved Governance Decision

        ↓

Platform Registry Version 5
```

Historical Registry versions remain available for replay.

---

# Registry Independence

Platform Registries are independent of:

- companies
- reporting periods
- filings
- execution outcomes
- individual observations

Registry entries describe reusable business concepts.

They never describe company-specific events.

---

# Registry Scope

Platform Registries may govern:

- Topics
- Industries
- Business Signal Taxonomies
- Trust Taxonomies
- Market Context Ontologies
- Future reusable platform knowledge

Each registry follows the same governance architecture.

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
Execution

↓

Topic Signals

↓

Aggregation Result

↓

Topic Candidate

↓

Governance Decision

↓

Platform Registry Version

↓

Execution Consumption
```

Only approved Registry versions are visible to Company Intelligence.

---

# Registry Retirement

Registry entries may be:

- deprecated
- merged
- superseded

Retirement never removes historical versions.

Historical execution must always remain reproducible.

---

# Replayability

Every Company Intelligence execution must be reproducible using:

- execution artifacts
- execution model versions
- execution prompts
- Platform Registry version

Replayability requires immutable Registry versions.

---

# Separation of Responsibilities

Platform Intelligence owns:

- registry evolution
- registry governance
- registry versioning
- canonical platform knowledge

Company Intelligence owns:

- registry consumption
- company reasoning
- business understanding

Responsibilities must never overlap.

---

# Bootstrap Strategy

Early platform versions may bootstrap Platform Registries from static source files (for example, `topics.json`).

Bootstrap files are implementation details.

They are not the architectural source of truth.

As Platform Intelligence matures:

```text
topics.json

↓

Governed Platform Registry
```

The bootstrap source changes.

The Platform Registry contract does not.

Execution architecture remains unchanged.

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
- lineage-aware

Platform Registries must never:

- mutate during execution
- contain execution evidence
- contain company-specific knowledge
- contain filing-specific observations
- bypass governance
- break replayability

---

# Architecture Summary

Platform Registries are the governed, versioned, and reusable knowledge foundation of the platform.

Cross-Company Aggregation transforms execution observations into Derived Platform Artifacts. Candidate Discovery transforms derived evidence into immutable Governance Artifacts. 

Platform Governance evaluates those Governance Artifacts and produces Governance Decisions, which authorize new Platform Registry versions. 

Company Intelligence consumes only approved Platform Registry versions, ensuring that execution remains deterministic while reusable Platform Knowledge evolves through governed, evidence-driven decisions.