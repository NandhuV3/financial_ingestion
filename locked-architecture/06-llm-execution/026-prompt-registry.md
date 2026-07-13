# 026 - Prompt Registry

**Status:** LOCKED  
**Layer:** Platform Foundation  
**Owner:** Platform Foundation Architecture  
**Producer:** Prompt Registry  
**Consumer:** Prompt Framework  
**Last Updated:** 2026-07-07

---

# Purpose

The Prompt Registry is the authoritative registry for all governed Prompt Packages used by LLM-native intelligence layers.

It manages prompt lifecycle, versioning, activation, deprecation, and replay support.

The Prompt Registry does not execute prompts.

It governs them.

---

# Why This Registry Exists

Prompt wording evolves over time.

Business reasoning improves.

Prompt engineering changes.

Without a governed registry:

- prompt versions cannot be audited
- replay cannot identify which prompt was executed
- rollback becomes impossible
- prompt evolution becomes unmanaged

The Prompt Registry ensures every prompt used by the platform is versioned, governed, replayable, and auditable.

---

# Core Principle

Prompt Packages are governed assets.

Prompt execution always uses a governed Prompt Package.

```text
Prompt Framework

↓

Prompt Registry

↓

Governed Prompt Package

↓

LLM Execution Framework
```

No prompt may bypass the registry.

---

# Responsibilities

The Prompt Registry is responsible for:

- prompt registration
- prompt versioning
- prompt activation
- prompt deprecation
- prompt retirement
- prompt lookup
- replay support

The Prompt Registry is NOT responsible for:

- prompt execution
- provider invocation
- prompt orchestration
- business reasoning
- artifact persistence

---

# Prompt Package

The Prompt Registry manages Prompt Packages.

A Prompt Package represents a governed prompt definition for one reasoning task.

A Prompt Package includes:

- prompt identifier
- prompt version
- prompt template
- expected schema
- activation status
- lifecycle metadata

The Prompt Registry governs Prompt Packages.

It does not execute them.

---

# Identity

Every Prompt Package has a deterministic identity.

Identity must not depend upon:

- execution time
- provider
- operator
- request order

A Prompt Package is uniquely identified by:

- prompt_id
- prompt_version

---

# Lifecycle

Every Prompt Package follows the lifecycle:

```text
Draft

↓

Review

↓

Approved

↓

Active

↓

Deprecated

↓

Retired
```

Only Active Prompt Packages may be executed.

Historical Prompt Packages remain available for replay.

---

# Versioning

Prompt changes always create a new version.

Historical Prompt Packages are immutable.

Prompt versions are never overwritten.

Replay always references the original Prompt Package version.

---

# Activation

At any time, exactly one Prompt Package version is Active for a given prompt identifier.

Activation never modifies historical Prompt Packages.

Changing the active version does not affect historical executions.

---

# Replay

Replay resolves the original Prompt Package version.

Replay never substitutes a newer prompt version.

Historical executions always reference the exact Prompt Package used during execution.

---

# Lookup

The Prompt Framework requests Prompt Packages from the Prompt Registry.

Example:

```text
Structured Intelligence

↓

Prompt Framework

↓

Prompt Registry

↓

structured-intelligence

↓

v3
```

The Prompt Registry returns the governed Prompt Package.

---

# Independence

The Prompt Registry is independent of:

- Company Intelligence
- Platform Intelligence
- Artifact Framework
- Governance
- LLM Providers

It owns only Prompt Package governance.

---

# Relationship with Prompt Framework

The Prompt Framework requests Prompt Packages.

The Prompt Registry supplies governed Prompt Packages.

The Prompt Framework never embeds prompt definitions directly.

---

# Relationship with LLM Execution Framework

The LLM Execution Framework executes Prompt Packages.

The Prompt Registry never communicates with providers.

Execution remains outside registry ownership.

---

# Relationship with Replay

Replay resolves Prompt Packages through the Prompt Registry.

Replay guarantees the same Prompt Package version used during the original governed execution.

Replay never upgrades prompts automatically.

---

# Failure Model

If no Active Prompt Package exists:

```text
Prompt Resolution Failure
```

If a requested historical Prompt Package cannot be resolved:

```text
Replay Resolution Failure
```

Prompt execution must never continue without a governed Prompt Package.

---

# Future Evolution

Future versions of the Prompt Registry may support:

- Prompt Package dependencies
- Prompt Package composition
- Prompt Package compatibility rules
- Prompt migration guidance
- Multi-language Prompt Packages

These capabilities must preserve immutable versioning and replayability.

---

# Design Principles

The Prompt Registry must be:

- governed
- versioned
- immutable
- replayable
- auditable
- deterministic

The Prompt Registry must never:

- execute prompts
- invoke providers
- perform business reasoning
- modify historical Prompt Packages
- bypass version governance

---

# Architecture Summary

The Prompt Registry is the authoritative governance system for Prompt Packages.

By separating prompt governance from prompt execution, the platform ensures every LLM-native intelligence layer executes governed, versioned, replayable Prompt Packages while preserving complete auditability, deterministic replay, and long-term maintainability.