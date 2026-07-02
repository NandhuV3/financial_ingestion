# Embedding Infrastructure

Status: BACKLOG

Priority: Future Architecture

---

# 1. Purpose

This document captures a future architectural evolution for semantic embedding generation.

It is **not part of Sprint 002**.

The current Topic Assignment implementation remains valid.

This document records a future separation of responsibilities to improve:

- replayability
- reproducibility
- embedding governance
- infrastructure reuse
- version isolation

---

# 2. Current Architecture

Current execution:

```text
Themes
    │
    ▼
Topic Assignment
    │
    ├── Generate Theme Embeddings
    ├── Load Topic Registry Embeddings
    └── Perform Semantic Assignment
```

This architecture is acceptable for the current platform maturity.

---

# 3. Motivation

Topic Assignment currently performs two distinct transformations.

```text
Representation

↓

Classification
```

Representation converts text into vector embeddings.

Classification compares embeddings against the Topic Registry and assigns canonical Topics.

These are separate responsibilities.

Future architecture should separate them.

---

# 4. Future Target Architecture

```text
Themes
    │
    ▼
Theme Embedding
    │
    ▼
Topic Assignment
```

Topic Registry becomes:

```text
Topic Registry
    │
    ▼
Topic Registry Embedding
```

Topic Assignment consumes only precomputed embeddings.

---

# 5. Responsibility Separation

## Theme Embedding

Owns:

- embedding generation
- embedding model execution
- embedding version tracking
- embedding reproducibility

Does not own:

- Topic selection
- similarity thresholds
- classification
- business interpretation

---

## Topic Registry Embedding

Owns:

- canonical Topic embeddings
- registry embedding generation
- registry embedding version

Embeddings are regenerated only when the Topic Registry changes.

---

## Topic Assignment

Owns only:

- semantic comparison
- similarity calculation
- threshold evaluation
- Topic selection
- assignment confidence
- deterministic assignment rules

Topic Assignment must never generate embeddings once this architecture is adopted.

---

# 6. Benefits

Separating representation from classification provides:

- reusable embedding infrastructure
- simpler Topic Assignment Builder
- independent model upgrades
- clearer ownership
- improved replayability
- easier auditing
- easier testing

---

# 7. Replayability

Future replay should preserve:

- embedding model
- embedding model version
- embedding dimensions
- embedding provider
- assignment algorithm version

Replay should not require regenerating embeddings.

---

# 8. Assignment Algorithm Version

Future Topic Assignment should record:

```text
assignment_algorithm_version
```

Example:

```text
topic-assignment-v1
```

Changes requiring a new version include:

- similarity threshold
- ranking algorithm
- tie-breaking
- multi-assignment rules
- confidence calculation

Changing embedding models does not necessarily require changing the assignment algorithm version.

---

# 9. Platform Impact

Potential future reusable consumers include:

- Topic Assignment
- Company Research
- News Intelligence
- Earnings Call Analysis
- Document Search
- Semantic Retrieval
- Knowledge Discovery

Embedding infrastructure should become a shared platform capability rather than remaining builder-specific.

---

# 10. Current Decision

This proposal is intentionally deferred.

Sprint 002 will continue using the current Topic Assignment implementation.

The existing architecture remains valid.

This document records a future evolution rather than a current implementation requirement.

---

# 11. Exit Criteria

This backlog item should be revisited when one or more of the following becomes true:

- multiple builders require semantic embeddings
- embedding generation becomes a noticeable execution cost
- embedding model upgrades require independent governance
- replayability requirements expand beyond the current implementation
- semantic infrastructure becomes a shared platform service

Until then, Topic Assignment remains responsible for generating and consuming embeddings within its own execution.
