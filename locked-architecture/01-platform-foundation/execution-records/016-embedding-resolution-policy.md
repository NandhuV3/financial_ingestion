# 016 - Embedding Resolution Policy

**Status:** LOCKED  
**Layer:** Platform Foundation  
**Owner:** Platform Foundation Architecture  
**Producer:** Platform Foundation  
**Consumer:** Embedding Resolver  
**Last Updated:** 2026-07-03

---

# Purpose

This specification defines the deterministic policy used by the Embedding Resolver to obtain Embedding Execution Records.

It specifies **when** persisted embeddings must be used, **when** new embeddings may be generated, and **when** execution must fail.

It does not define how embeddings are generated.

It does not define how embeddings are stored.

It defines only the platform-wide embedding resolution policy.

---

# Core Principle

Embedding resolution is deterministic.

Execution mode determines resolution behavior.

Builders never determine resolution policy.

```text
Builder

↓

Embedding Resolver

↓

Resolution Policy

↓

Embedding Store
or
Embedding Generator
```

---

# Why This Exists

Without a shared resolution policy:

- builders would implement replay differently
- embedding providers could be contacted during replay
- execution would become inconsistent
- replay would become non-deterministic
- lineage integrity would degrade

A single platform policy prevents divergence.

---

# Resolution Inputs

Embedding resolution is based only on:

- execution mode
- source_type
- source_id
- source_hash
- embedding_model
- embedding_model_version

The policy never depends on:

- Topic Assignment
- Topic Registry
- similarity scores
- business context
- governance state
- downstream execution

---

# Resolution Modes

The platform supports exactly two resolution modes.

- Original Execution
- Replay

Every embedding request executes under one of these modes.

---

# Original Execution Policy

Original execution may generate new Embedding Execution Records.

Resolution sequence:

```text
Builder

↓

Embedding Resolver

↓

Embedding Store lookup

↓

Record exists?

↓

Yes

↓

Return persisted record

↓

No

↓

Generate embedding

↓

Create Embedding Execution Record

↓

Persist record

↓

Return persisted record
```

Generation occurs only when no compatible persisted record exists.

---

# Replay Policy

Replay never generates embeddings.

Resolution sequence:

```text
Builder

↓

Embedding Resolver

↓

Embedding Store lookup

↓

Return persisted record
```

Replay must never contact an embedding provider.

Replay must never regenerate vectors.

Replay must never overwrite stored records.

---

# Missing Record Policy

If replay requests an Embedding Execution Record that does not exist:

```text
Replay

↓

Record Missing

↓

Execution Failure
```

The resolver must fail immediately.

The resolver must never attempt recovery by generating a new embedding.

---

# Validation Policy

Before returning an Embedding Execution Record, the resolver validates:

- execution record schema version
- record integrity
- record hash
- embedding model version
- vector dimensions
- vector integrity

Invalid records are rejected.

The resolver never silently repairs stored records.

---

# Generation Policy

The Embedding Generator may be invoked only when all of the following are true:

- execution mode is Original Execution
- no compatible persisted record exists
- source identity is valid
- embedding model version is valid

No other condition permits generation.

---

# Record Reuse Policy

A persisted Embedding Execution Record may be reused only when:

- source identity matches
- source hash matches
- embedding model version matches

The resolver must never reuse records across different model versions or different source content.

The Embedding Resolver performs deterministic lookup using:

- source_type
- source_id
- source_hash
- embedding_model_version

The Embedding Store is responsible for supporting deterministic lookup using these fields.

Builders never perform record lookup directly.

---

# Model Version Policy

Embedding model versions are immutable execution dependencies.

Changing the embedding model version creates new Embedding Execution Records.

Historical records remain valid.

Historical records are never overwritten.

---

# Provider Boundary

Only the Embedding Generator may communicate with an embedding provider.

The Embedding Resolver never communicates directly with provider APIs.

Builders never communicate with provider APIs.

---

# Persistence Policy

Embedding persistence occurs only during original execution.

Replay never creates new records.

Replay never updates existing records.

The Embedding Store remains immutable during replay.

---

# Failure Behaviour

Resolution fails when:

- replay record is missing
- stored record fails validation
- provider generation fails
- generated record fails validation

Failures are deterministic.

No automatic fallback exists during replay.

---

# Lineage Policy

Builders record consumed Embedding Execution Records through execution references.

Execution lineage records:

- embedding record ID
- embedding record hash
- producer
- execution ID

Builders never record provider interactions directly.

---

# Relationship With Replay

Replay is a closed execution.

All required Embedding Execution Records must already exist.

Replay consumes persisted execution evidence.

Replay never creates new execution evidence.

---

# Future Compatibility

This policy applies to every future embedding consumer.

Examples:

- Topic Assignment
- Semantic Search
- Candidate Discovery
- Industry Classification
- Trust Classification
- Future embedding-based builders

No builder may define its own embedding resolution policy.

---

# Design Principles

Embedding resolution must be:

- deterministic
- replay-safe
- provider-independent
- immutable
- implementation-independent
- centrally governed

Embedding resolution must never:

- regenerate embeddings during replay
- bypass the Embedding Store
- bypass the Embedding Generator
- expose provider APIs to builders
- depend on downstream business logic

---

# Architecture Summary

The Embedding Resolution Policy establishes a single deterministic mechanism for resolving embedding vectors across the platform.

Original execution may generate and persist new Embedding Execution Records when required.

Replay consumes only persisted Embedding Execution Records and never contacts external embedding providers.

By centralizing embedding resolution policy within the Embedding Resolver, the platform guarantees deterministic replay, stable lineage, reproducible execution, and reusable embedding infrastructure for all future builders.