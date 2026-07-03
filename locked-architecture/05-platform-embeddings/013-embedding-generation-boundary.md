# 013 - Embedding Generation Boundary

**Status:** LOCKED  
**Layer:** Platform Foundation  
**Owner:** Platform Foundation Architecture  
**Last Updated:** 2026-07-03

---

# Purpose

This specification defines the architectural boundary between embedding generation and deterministic execution.

Embedding generation depends upon external embedding providers.

Deterministic execution depends upon immutable Embedding Execution Records.

This boundary ensures that external computation occurs exactly once while all downstream execution remains deterministic and replayable.

---

# Core Principle

Embedding generation is an execution event.

Replay is a deterministic computation.

Replay never regenerates embeddings.

```text
Input Text

↓

Embedding Generation

↓

Embedding Execution Record

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Embedding Generation Boundary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

↓

Deterministic Execution

↓

Topic Assignment

↓

Topic Signal
```

Everything above the boundary may contact external systems.

Everything below the boundary must remain deterministic.

---

# Why This Boundary Exists

Embedding providers are external systems.

External systems evolve independently of the platform.

Examples include:

- embedding model improvements
- floating-point implementation changes
- provider infrastructure updates
- batching optimizations
- quantization changes

These changes may produce different embedding vectors for identical input.

If replay regenerates embeddings:

- similarity calculations change
- Topic Signals change
- execution hashes change
- execution lineage changes
- Platform Intelligence becomes non-deterministic

Persisting Embedding Execution Records prevents this instability.

---

# Execution Layers

Embedding-based execution consists of three conceptual layers.

## Layer 1 — External Computation

External computation generates embedding vectors.

Examples:

- embedding provider inference
- vector generation
- embedding normalization

External computation may contact external services.

It is not replayable.

---

## Layer 2 — Execution Record

Embedding Generation produces one immutable Embedding Execution Record.

The record contains:

- embedding vector
- embedding model version
- execution provenance
- deterministic identity

This record forms the execution boundary.

---

## Layer 3 — Deterministic Execution

Deterministic execution consumes persisted Embedding Execution Records.

Examples:

- similarity computation
- candidate ranking
- Topic Assignment
- Topic Signal generation

Execution below the boundary never regenerates embeddings.

---

# Boundary Rule

Everything above the boundary is performed only during original execution.

Everything below the boundary is performed during both original execution and replay.

```text
Original Execution

↓

Embedding Provider

↓

Embedding Execution Record

↓

Topic Assignment

↓

Topic Signal
```

Replay begins at the Embedding Execution Record.

---

# Replay Rule

Replay must always consume persisted Embedding Execution Records.

Replay must never:

- contact embedding providers
- regenerate embedding vectors
- substitute newer embedding models
- modify persisted embedding vectors

Replay is a closed operation over persisted execution records.

---

# Original Execution Rule

Original execution generates embeddings only when an Embedding Execution Record does not already exist for the required input and embedding model version.

Once generated:

- the Embedding Execution Record is persisted
- downstream execution consumes the persisted record
- future replay reuses the same record

Embedding generation never repeats for replay.

---

# Responsibility Separation

Embedding Generation owns:

- embedding provider interaction
- embedding vector creation
- Embedding Execution Record production

Topic Assignment owns:

- embedding retrieval
- similarity computation
- Topic Assignment
- Topic Signal generation

Responsibilities must never overlap.

---

# Relationship with Replay

Replay begins after the boundary.

Replay consumes only:

- persisted Execution Records
- Platform Artifacts
- Governance Artifacts
- Platform Registries

Replay never performs external computation.

---

# Relationship with Execution Lineage

Embedding Execution Records participate in execution lineage.

Builders reference consumed Embedding Execution Records through:

- execution_references

Lineage always records the persisted record consumed.

It never records an external embedding provider call.

---

# Future Compatibility

This boundary applies to every future computational component whose outputs become deterministic execution inputs.

Examples include:

- embedding generation
- feature extraction
- vector transformation
- future deterministic computational representations

External computation always ends at an immutable Execution Record.

---

# Design Principles

Embedding Generation must be:

- deterministic within one execution
- immutable after persistence
- replay-independent
- implementation-independent

Deterministic execution must:

- consume persisted Execution Records
- remain independent of external providers
- produce identical outputs for identical inputs
- preserve replayability

The boundary must never:

- allow replay to regenerate embeddings
- leak provider behavior into deterministic execution
- mix external computation with replay
- weaken execution lineage

---

# Architecture Summary

The Embedding Generation Boundary separates external computation from deterministic execution.

Embedding providers participate only during original execution to produce immutable Embedding Execution Records.

Replay begins at those persisted records and never contacts external providers again.

By establishing this boundary, the platform guarantees deterministic similarity computation, stable execution lineage, immutable replay inputs, and fully reproducible Platform Intelligence execution regardless of future embedding model or provider changes.