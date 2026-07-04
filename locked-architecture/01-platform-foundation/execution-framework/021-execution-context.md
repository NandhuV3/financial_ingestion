# 021 - Execution Context

**Status:** LOCKED  
**Layer:** Platform Foundation  
**Owner:** Builder Framework  
**Consumers:** All Execution Components  
**Last Updated:** 2026-07-04

---

# Purpose

Execution Context defines the canonical execution identity shared by all platform execution.

It provides a consistent, deterministic execution contract for builders, execution records, replay, governance, and future execution components.

Execution Context represents the execution that produced persisted platform state.

---

# Core Principle

Execution Context describes execution.

It does not describe business content.

Every execution component consumes the same Execution Context.

```text
Execution Context
        │
        ├────────► Builder Framework
        ├────────► Builder 012
        ├────────► Builder 013
        ├────────► Builder 014
        ├────────► Embedding Resolver
        ├────────► Governance Engine
        └────────► Platform Registry Evolution
```

Execution Context is platform infrastructure.

---

# Why Execution Context Exists

Without a shared Execution Context:

- builders invent execution identity independently
- replay becomes inconsistent
- execution provenance differs across components
- audit becomes fragmented

Execution Context centralizes execution identity.

---

# Ownership

Execution Context is owned by the Builder Framework.

Execution components consume Execution Context.

Execution components never construct their own execution context.

---

# Responsibilities

Execution Context is responsible for:

- identifying execution
- identifying execution mode
- identifying execution producer
- preserving replay-stable execution information
- providing execution provenance

Execution Context is not responsible for:

- business logic
- builder configuration
- artifact construction
- governance
- platform intelligence

---

# Required Fields

Every Execution Context contains:

- execution_id
- execution_mode
- producer
- generated_at

These fields define the canonical execution identity.

---

# Execution Mode

Execution Mode defines why execution is occurring.

Current modes:

- ORIGINAL_EXECUTION
- REPLAY

Future modes may be added through architecture governance.

Builders must not infer execution mode.

They consume it from Execution Context.

---

# Replay

Replay reproduces historical execution.

Replay consumes the original Execution Context.

Replay never constructs replay-specific execution identity for persisted artifacts.

Execution Mode remains REPLAY.

Execution identity remains historical.

---

# Builder Responsibilities

Builders consume Execution Context.

Builders may read:

- execution_id
- execution_mode
- producer
- generated_at

Builders must never modify Execution Context.

---

# Framework Responsibilities

The Builder Framework constructs Execution Context.

Replay reconstructs historical Execution Context.

Framework components propagate Execution Context consistently.

---

# Execution Records

Execution Records preserve execution provenance using Execution Context.

Execution Records never redefine execution identity.

---

# Platform Artifacts

Platform Artifacts preserve replay-stable execution metadata derived from Execution Context.

Platform Artifacts never construct independent execution identities.

---

# Governance

Governance components consume Execution Context for execution provenance.

Governance Decisions preserve execution lineage without redefining execution identity.

---

# Future Evolution

Execution Context may expand to include additional execution metadata.

Future additions must remain execution-scoped.

Business information must never be added.

---

# Design Principles

Execution Context must be:

- deterministic
- immutable
- replayable
- framework-owned
- execution-scoped

Execution Context must never:

- contain business intelligence
- contain governance decisions
- contain builder-specific configuration
- become mutable during execution

---

# Architecture Summary

Execution Context is the canonical execution identity of the platform.

By centralizing execution provenance within a framework-owned contract, the platform ensures consistent execution identity across builders, execution records, replay, governance, and future execution components while preserving deterministic replay and long-term architectural consistency.

