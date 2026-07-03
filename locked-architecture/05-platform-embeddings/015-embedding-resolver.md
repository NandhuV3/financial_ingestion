# 015 - Embedding Resolver

**Status:** LOCKED  
**Layer:** Platform Foundation  
**Owner:** Platform Foundation Architecture  
**Producer:** Embedding Generator / Embedding Store  
**Consumer:** Company Intelligence Builders  
**Last Updated:** 2026-07-03

---

# Purpose

The Embedding Resolver is the single architectural entry point for obtaining embedding vectors during execution.

It hides the distinction between original execution and replay.

Builders never interact directly with the Embedding Generator or the Embedding Store.

Instead, every builder requests embeddings exclusively through the Embedding Resolver.

The Embedding Resolver owns embedding retrieval policy.

It does not own embedding generation policy.

It does not own persistence.

It does not own similarity computation.

---

# Core Principle

Builders request embeddings.

The Embedding Resolver determines where they come from.

```text
Builder

↓

Embedding Resolver

↓

Embedding Store
or
Embedding Generator

↓

Embedding Execution Record
```

Builders remain independent of execution mode.

---

# Why This Exists

Without an Embedding Resolver:

- every builder must implement replay detection
- every builder must know when to call the embedding provider
- replay policy becomes duplicated
- execution behavior diverges
- replay becomes difficult to verify

The Embedding Resolver centralizes this responsibility.

---

# Position In Architecture

```text
Builder

↓

Embedding Resolver

↓

Embedding Store

↓

Embedding Generator

↓

Embedding Provider
```

The Builder never communicates directly with any lower layer.

---

# Responsibilities

The Embedding Resolver is responsible for:

- resolving embedding requests
- enforcing replay policy
- retrieving persisted embedding records
- invoking the Embedding Generator during original execution
- returning immutable Embedding Execution Records

The Embedding Resolver is not responsible for:

- generating embeddings directly
- computing similarity
- Topic Assignment
- persistence implementation
- Platform Intelligence
- governance
- replay orchestration

---

# Execution Modes

The Embedding Resolver supports two execution modes.

## Original Execution

Original execution allows new embedding generation.

Execution flow:

```text
Builder

↓

Embedding Resolver

↓

Embedding Store lookup

↓

Embedding found?

↓

Yes

↓

Return persisted record

No

↓

Embedding Generator

↓

Persist Embedding Execution Record

↓

Return record
```

Original execution may create new Embedding Execution Records.

---

## Replay Execution

Replay never generates embeddings.

Execution flow:

```text
Builder

↓

Embedding Resolver

↓

Embedding Store lookup

↓

Return persisted Embedding Execution Record
```

Replay never contacts an embedding provider.

If the required Embedding Execution Record is missing, replay fails immediately.

---

# Resolver Inputs

The Embedding Resolver accepts:

- execution mode
- source_type
- source_id
- source_hash
- embedding_model
- embedding_model_version
- source_text

The resolver never accepts:

- Topic Registry
- similarity thresholds
- Topic Assignment state
- business context
- governance context

---

# Resolver Outputs

The Embedding Resolver always returns exactly one:

**Embedding Execution Record**

Builders consume the returned record.

Builders never consume raw provider responses.

---

# Original Execution Policy

During original execution the resolver may invoke the Embedding Generator only when a persisted Embedding Execution Record does not already exist.

The resolver never generates duplicate records for identical source identity and embedding model version.

---

# Replay Policy

During replay the resolver must:

- load persisted Embedding Execution Records
- validate record integrity
- return immutable records

The resolver must never:

- call an embedding provider
- regenerate vectors
- overwrite stored vectors
- silently repair missing records

Replay failure is deterministic.

---

# Relationship With Embedding Generator

The Embedding Generator owns embedding creation.

The Embedding Resolver owns the execution context for embedding generation.

During original execution, the resolver supplies execution-scoped metadata such as:

execution_id
producer

Builders never construct Embedding Execution Records directly and never provide execution provenance to the Embedding Generator.

The Embedding Resolver owns when generation is allowed.

Generation policy and retrieval policy remain separate responsibilities.

---

# Relationship With Embedding Store

The Embedding Store owns persisted Embedding Execution Records.

The Embedding Resolver consumes those records.

The resolver never manages storage.

---

# Relationship With Builders

Builders never determine execution mode.

Builders never call embedding providers.

Builders never query the Embedding Store.

Builders simply request an embedding.

The Embedding Resolver fulfills the request according to platform policy.

---

# Failure Behaviour

The Embedding Resolver fails deterministically when:

- the requested Embedding Execution Record is missing during replay
- the stored record fails validation
- the Embedding Generator fails during original execution
- the provider returns an invalid embedding

The resolver never silently regenerates data during replay.

---

# Replayability

Given identical:

- execution mode
- source identity
- Embedding Store contents

The Embedding Resolver must always return the identical Embedding Execution Record.

Replay never depends on external services.

---

# Future Compatibility

The Embedding Resolver provides a reusable abstraction for every future builder that requires embeddings.

Examples include:

- Topic Assignment
- Semantic Search
- Candidate Discovery
- Industry Classification
- Future similarity-based builders

All embedding-consuming builders inherit identical replay behavior without implementing replay logic themselves.

---

# Design Principles

The Embedding Resolver must be:

- deterministic
- replay-safe
- immutable
- provider-independent
- execution-mode aware
- implementation-independent

The Embedding Resolver must never:

- expose provider APIs to builders
- perform similarity computation
- own persistence
- duplicate replay policy
- bypass the Embedding Store
- bypass the Embedding Generator

---

# Architecture Summary

The Embedding Resolver is the single architectural boundary through which builders obtain embedding vectors.

By separating retrieval policy from generation policy, the platform centralizes replay behavior, prevents builders from depending on external embedding providers, and guarantees that replay remains deterministic while original execution continues to support controlled embedding generation.