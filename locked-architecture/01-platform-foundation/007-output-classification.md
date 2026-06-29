# 007-output-classification.md

Status: LOCKED

# 1. Purpose

This document defines the three output types produced by builders across the platform.

Every Builder produces exactly one execution result.

That result may be represented as one of three output classifications:

* Platform Artifact
* Execution Record
* Transient BuilderResult

These classifications exist to separate:

* business knowledge
* execution
* operational observability

A Builder Specification defines ownership.

It does **not** determine how the Builder's output is persisted.

---

# 2. Core Principle

A Builder owns execution.

Its output is classified according to its purpose.

```text
Builder
    ↓
Output
    ├── Platform Artifact
    ├── Execution Record
    └── Transient BuilderResult
```

Output classification is determined by architectural value, not by the existence of a specification.

---

# 3. Platform Artifact

A Platform Artifact is a first-class platform object.

It represents governed platform knowledge.

Platform Artifacts participate in the platform dependency graph.

Platform Artifacts are:

* persisted
* versioned
* immutable
* addressable
* replayable
* lineage-aware

Platform Artifacts exist because their output has independent business or governance value.

Examples:

* Filing Artifact
* Evidence Identity
* Themes
* Topic Assignment
* Structured Intelligence
* Company Knowledge
* Quarter Change
* Business Signals
* Quarter Understanding
* Investor Intelligence

---

# 4. Execution Record

An Execution Record captures operational information about Builder execution.

It exists for:

* debugging
* observability
* operational monitoring
* execution history
* quality metrics

Execution Records are operational.

They are not platform knowledge.

Execution Records:

* may be persisted
* are not versioned as artifacts
* are not dependency graph nodes
* are not consumed as business intelligence

Typical information includes:

* execution status
* duration
* warnings
* validation results
* metrics
* retry information
* execution timestamps

Execution Records must never replace Platform Artifacts.

---

# 5. Transient BuilderResult

A Transient BuilderResult exists only during execution.

It is passed directly from one Builder to the next.

It is never persisted.

It is never versioned.

It is never independently governed.

Transient BuilderResults exist only when:

* the output has no independent business value
* the output has no governance value
* the output carries no independently referenced lineage
* the output is consumed only by the immediately following Builder
* the output is inexpensive to reproduce

Transient BuilderResults are implementation objects.

They are not platform objects.

---

# 6. Choosing an Output Type

Every Builder should answer the following questions.

## Question 1

Does the output represent governed business knowledge?

If yes,

use a Platform Artifact.

---

## Question 2

Will multiple downstream Builders consume this output?

If yes,

use a Platform Artifact.

---

## Question 3

Will downstream lineage reference this output?

If yes,

use a Platform Artifact.

---

## Question 4

Is the output valuable independently of the immediately following Builder?

If yes,

use a Platform Artifact.

---

## Question 5

Is only the fact that execution occurred important?

If yes,

use an Execution Record.

---

## Question 6

Is the output consumed only by the immediately following Builder and inexpensive to reproduce?

If yes,

use a Transient BuilderResult.

---

# 7. Relationship To Builder Specifications

Builder Specifications define:

* ownership
* inputs
* outputs
* contracts
* invariants

Builder Specifications do **not** define persistence.

Persistence is determined by this document.

A Builder may have:

* a specification
* a contract
* validation rules

without producing a Platform Artifact.

---

# 8. Relationship To Artifact Framework

Only Platform Artifacts participate in the Artifact Framework.

Execution Records and Transient BuilderResults are outside the Artifact Framework.

Only Platform Artifacts require:

* artifact identity
* artifact version
* artifact hash
* lineage
* dependency indexing
* governance lifecycle

---

# 9. Relationship To Execution

The platform maintains two distinct graphs.

## Execution Graph

Represents Builder execution order.

Example:

```text
Filing Builder
        ↓
Evidence Identity Builder
        ↓
Themes Quality Builder
        ↓
Theme Grounding Builder
        ↓
Theme Input Boundary Builder
        ↓
Themes Builder
```

The Execution Graph defines how work flows through the platform.

---

## Artifact Graph

Represents governed platform knowledge.

Example:

```text
Filing Artifact
        ↓
Evidence Identity
        ↓
Themes
        ↓
Topic Assignment
        ↓
Structured Intelligence
        ↓
Company Knowledge
```

The Artifact Graph defines durable platform knowledge.

The Execution Graph and Artifact Graph are intentionally different.

---

# 10. Current Platform Classification

| Layer                   | Builder                         | Output Type                                |
| ----------------------- | ------------------------------- | ------------------------------------------ |
| Filing                  | Filing Builder                  | Platform Artifact                          |
| Evidence Identity       | Evidence Identity Builder       | Platform Artifact                          |
| Themes Quality          | Themes Quality Builder          | Execution Record + Transient BuilderResult |
| Theme Grounding         | Theme Grounding Builder         | Transient BuilderResult                    |
| Theme Input Boundary    | Theme Input Boundary Builder    | Transient BuilderResult                    |
| Themes                  | Themes Builder                  | Platform Artifact                          |
| Topic Assignment        | Topic Assignment Builder        | Platform Artifact                          |
| Structured Intelligence | Structured Intelligence Builder | Platform Artifact                          |
| Company Knowledge       | Company Knowledge Builder       | Platform Artifact                          |
| Quarter Change          | Quarter Change Builder          | Platform Artifact                          |
| Business Signals        | Business Signals Builder        | Platform Artifact                          |
| Quarter Understanding   | Quarter Understanding Builder   | Platform Artifact                          |
| Investor Intelligence   | Investor Intelligence Builder   | Platform Artifact                          |

---

# 11. Golden Rules

## Rule 1

Do not create a Platform Artifact solely because a Builder has its own specification.

---

## Rule 2

Persist Platform Artifacts only when the output has independent business or governance value.

---

## Rule 3

Execution Records capture operational history.

They never replace business artifacts.

---

## Rule 4

Transient BuilderResults must never be referenced by downstream lineage.

---

## Rule 5

Only Platform Artifacts participate in the platform dependency graph.

---

## Rule 6

The Execution Graph and Artifact Graph must remain independent architectural concepts.

---

# 12. Final Principle

Architecture defines ownership.

Builders perform execution.

Output Classification determines persistence.

These are three separate architectural concerns.

Confusing them leads to unnecessary artifacts, unnecessary governance, and unnecessary operational complexity.

Every Builder must produce the simplest output classification that satisfies governance, replayability, and downstream consumption requirements.

No Builder should produce a Platform Artifact unless the platform gains lasting value from persisting it.
