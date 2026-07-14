# 020 — Intelligence Builder Pattern

**Layer:** Company Intelligence (Shared Pattern)
**Type:** Architecture Pattern
**Status:** Locked

---

# 1. Purpose

The Intelligence Builder Pattern defines the canonical architecture for constructing **LLM-native Intelligence Artifacts** within the Company Intelligence subsystem.

Its purpose is to establish a single, reusable pattern for transforming governed business inputs into immutable intelligence artifacts while consuming Platform Foundation capabilities without re-implementing them.

Every future LLM-native intelligence subsystem (e.g., Structured Intelligence, Company Knowledge Candidate, Quarter Understanding, Investor Intelligence) must follow this pattern.

The pattern exists to ensure:

* Consistent ownership boundaries.
* Reusable execution infrastructure.
* Deterministic orchestration.
* Immutable artifact creation.
* Replay compatibility.
* Long-term maintainability.

---

# 2. Architectural Position

```text
Platform Foundation
│
├── LLM Execution Framework
├── Prompt Framework
├── Prompt Registry
└── LLM Replay Policy
        │
        ▼
Intelligence Builder Pattern
        │
        ├──────────────┬──────────────┬──────────────┐
        ▼              ▼              ▼              ▼
Structured        Company        Quarter        Investor
Intelligence      Knowledge      Understanding  Intelligence
```

The Intelligence Builder Pattern is **not** a Platform Foundation component.

It is the shared architectural pattern used by Company Intelligence builders.

---

# 3. Purpose of an Intelligence Builder

An Intelligence Builder transforms governed business inputs into a single immutable Intelligence Artifact.

The builder owns **assembly**, not execution.

The builder is responsible for producing business intelligence while delegating all reusable infrastructure concerns to the Platform Foundation.

---

# 4. Responsibilities

Every Intelligence Builder owns:

* Input validation.
* Business context preparation.
* Prompt Plan selection.
* Prompt Framework invocation.
* Business output interpretation.
* Artifact assembly.
* Intelligence metadata assembly.
* Artifact creation.
* Artifact validation.

---

# 5. Non-Responsibilities

An Intelligence Builder never owns:

* Provider invocation.
* Prompt execution.
* Prompt governance.
* Replay policy.
* Replay execution.
* Artifact persistence.
* Provider selection.
* Execution records.
* Prompt version management.
* Platform governance.

Those concerns remain owned by the Platform Foundation.

---

# 6. Delegation Model

Every Intelligence Builder follows the same delegation pattern.

```text
Builder
        │
        ▼
Prompt Framework
        │
        ▼
LLM Execution Framework
        │
        ▼
Provider
```

Supporting services:

```text
Builder
│
├── Prompt Registry
├── Replay Policy
├── Artifact Framework
└── Execution Context
```

The builder consumes these services but never implements them.

---

# 7. Builder Lifecycle

Every builder follows the same lifecycle.

```text
Input Artifacts
        │
        ▼
Input Validation
        │
        ▼
Prompt Plan Selection
        │
        ▼
Prompt Framework
        │
        ▼
LLM Execution Framework
        │
        ▼
Structured Result
        │
        ▼
Business Interpretation
        │
        ▼
Artifact Assembly
        │
        ▼
Intelligence Artifact
```

Only the **Business Interpretation** and **Artifact Assembly** stages are specific to the individual builder.

---

# 8. Standard Input Categories

Every builder classifies inputs as:

### Required Inputs

Artifacts that must exist before execution.

### Enrichment Inputs

Optional artifacts that enrich reasoning without changing ownership.

### Operational Inputs

Execution Context and other Platform Foundation services.

---

# 9. Standard Output

Every builder produces exactly one primary Intelligence Artifact.

The artifact contains:

* Artifact Identity
* Artifact Version
* Schema Version
* Business Payload
* Input References
* Prompt Package Reference
* Execution Record Reference
* Replay Reference
* Lineage Metadata

The builder does not embed operational execution details beyond references.

---

# 10. Prompt Contract

Each Intelligence Builder defines a Prompt Contract consisting of:

* Required Inputs
* Enrichment Inputs
* Expected Output Schema
* Evidence Requirements
* Reasoning Constraints
* Forbidden Reasoning

Prompt execution is delegated to the Prompt Framework.

---

# 11. Replay Model

Replay follows the Platform Foundation policy.

```text
Replay Request
        │
        ▼
LLM Replay Policy
        │
        ▼
Replay Decision
```

If replay is approved:

```text
Historical Artifact
        │
        ▼
Historical References
```

No LLM execution occurs.

For regeneration:

```text
Replay Policy
        │
        ▼
Builder
        │
        ▼
Prompt Framework
        │
        ▼
Execution Framework
```

The builder follows the decision but never determines replay behavior.

---

# 12. Ownership Model

The Intelligence Builder owns:

* Business interpretation.
* Artifact assembly.
* Business validation.

The builder consumes:

* Prompt Framework.
* Prompt Registry.
* LLM Execution Framework.
* LLM Replay Policy.
* Artifact Framework.

This preserves a strict separation between business reasoning and reusable infrastructure.

---

# 13. Dependency Direction

Dependencies always flow in one direction.

```text
Company Intelligence Builder
        │
        ▼
Platform Foundation
```

No Platform Foundation component depends on a Company Intelligence builder.

No builder depends on another builder unless explicitly defined by the architecture.

---

# 14. Design Principles

Every Intelligence Builder must:

* Own one business responsibility.
* Produce one immutable Intelligence Artifact.
* Delegate reusable infrastructure.
* Preserve ownership boundaries.
* Preserve replay compatibility.
* Preserve lineage.
* Preserve versioning.
* Avoid business logic outside its defined responsibility.

---

# 15. Applicability

This pattern is mandatory for all future Company Intelligence builders, including:

* Structured Intelligence
* Company Knowledge Candidate
* Quarter Understanding
* Investor Intelligence
* Any future LLM-native intelligence subsystem

No subsystem may introduce an alternative builder architecture without an approved architectural review.

---

# 16. Relationship to Subsystem Specifications

This document defines the **shared architectural pattern**.

Each subsystem specification (e.g., `014-structured-intelligence.md`) defines only:

* The subsystem's unique business responsibility.
* Its specific inputs and outputs.
* Its reasoning contract.
* Its artifact schema.
* Its business rules.

Common builder behavior must not be duplicated across subsystem specifications and should instead reference this pattern.

---