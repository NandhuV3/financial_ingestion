# 022 - Builder Context

**Status:** LOCKED  
**Layer:** Platform Foundation  
**Owner:** Builder Framework  
**Consumers:** All Builders  
**Last Updated:** 2026-07-04

---

# Purpose

Builder Context defines the canonical runtime environment provided to every builder by the Builder Framework.

It encapsulates execution-scoped services, framework infrastructure, and execution metadata into a single immutable object.

Builder Context standardizes how builders interact with the platform while preventing builders from constructing or owning platform infrastructure.

---

# Core Principle

Builders implement business logic.

The Builder Framework provides execution infrastructure.

```text
Builder Framework
        │
        ▼
Builder Context
        │
        ├────────► Execution Context
        ├────────► Platform Services
        ├────────► Framework Services
        └────────► Runtime Configuration
                │
                ▼
             Builder
```

Builders consume Builder Context.

Builders never assemble Builder Context.

---

# Why Builder Context Exists

Without Builder Context:

- builders receive many unrelated constructor parameters
- framework dependencies leak into builder implementations
- different builders receive different runtime environments
- testing becomes inconsistent
- platform evolution requires changing every builder interface

Builder Context provides one consistent execution environment.

---

# Ownership

Builder Context is owned by the Builder Framework.

The Builder Framework constructs Builder Context.

Builders consume Builder Context.

Builders never modify Builder Context.

---

# Responsibilities

Builder Context is responsible for providing:

- execution identity
- framework services
- execution-scoped infrastructure
- deterministic runtime configuration
- platform service boundaries

Builder Context is not responsible for:

- business logic
- artifact construction
- governance
- platform intelligence
- execution orchestration

---

# Relationship with Execution Context

Execution Context is one component of Builder Context.

```text
Builder Context
        │
        ├────────► Execution Context
        └────────► Framework Services
```

Execution Context identifies execution.

Builder Context provides the complete execution environment.

---

# Builder Context Structure

Conceptually, Builder Context contains:

```text
Builder Context

├── Execution Context
├── Framework Services
├── Runtime Configuration
└── Platform Service Boundaries
```

The internal implementation may evolve.

The architectural responsibility remains constant.

---

# Execution Context

Builder Context always provides:

- execution_id
- execution_mode
- producer
- generated_at

Execution Context remains immutable throughout builder execution.

---

# Framework Services

Builder Context may expose framework-managed services including:

- Artifact Writer
- Logger
- Metrics
- Validation Services

Builders consume these services.

Builders never instantiate them.

---

# Platform Service Boundaries

Builder Context provides access to platform-owned service boundaries.

Examples include:

- Embedding Resolver
- Future Prompt Resolver
- Future Model Resolver
- Future Registry Resolver

Builders interact only through these boundaries.

Builders never communicate directly with external systems.

---

# Runtime Configuration

Builder Context provides deterministic runtime configuration.

Examples include:

- builder configuration
- replay configuration
- execution mode
- platform feature flags

Runtime configuration must remain deterministic.

---

# Dependency Injection

Builder Context is the Builder Framework's dependency injection mechanism.

Builders declare the platform capabilities they require.

The framework provides those capabilities through Builder Context.

Builders never construct framework services.

---

# Immutability

Builder Context is immutable.

Builders must never:

- replace services
- modify execution context
- mutate runtime configuration

Framework-owned objects remain read-only.

---

# Replay

Replay constructs Builder Context using historical execution state.

Builders execute against the reconstructed Builder Context without knowing whether dependencies originated from original execution or replay.

Replay changes Builder Context construction.

Replay does not change builder behavior.

---

# Builder Responsibilities

Builders are responsible only for:

- consuming Builder Context
- implementing deterministic business logic
- producing Builder Results

Builders are not responsible for:

- dependency construction
- execution identity
- service lifecycle
- framework infrastructure

---

# Framework Responsibilities

The Builder Framework is responsible for:

- constructing Builder Context
- validating Builder Context
- providing framework services
- propagating Execution Context
- managing service lifecycles

---

# Future Evolution

Builder Context may grow as new platform services are introduced.

Examples:

- Governance services
- Registry services
- Prompt services
- Model services
- Cache services

New services are added to Builder Context.

Builder interfaces remain stable.

---

# Design Principles

Builder Context must be:

- immutable
- framework-owned
- deterministic
- dependency-oriented
- replay-compatible
- implementation-independent

Builder Context must never:

- contain business intelligence
- expose external providers directly
- become mutable
- require builders to construct infrastructure

---

# Architecture Summary

Builder Context is the canonical execution environment for every builder.

By centralizing execution identity, framework services, runtime configuration, and platform service boundaries into a single immutable contract, the Builder Framework ensures consistent builder interfaces, deterministic execution, replay compatibility, and long-term platform maintainability while allowing framework capabilities to evolve without changing business logic.