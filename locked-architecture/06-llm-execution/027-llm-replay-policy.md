# 027 - LLM Replay Policy

**Status:** LOCKED  
**Layer:** Platform Foundation  
**Owner:** Platform Foundation Architecture  
**Producer:** Platform Foundation  
**Consumer:** All LLM-native Intelligence Layers  
**Last Updated:** 2026-07-07

---

# Purpose

This document defines the platform-wide replay policy for every LLM-native intelligence layer.

It answers:

- What is replay?
- What is regeneration?
- When should replay be used?
- When should regeneration be used?
- What metadata is required?
- What guarantees does replay provide?

Every LLM-native layer must follow this policy.

No intelligence layer may define its own replay behavior.

---

# Why This Policy Exists

LLMs are not algorithmically deterministic.

The same prompt, model, and input may produce different outputs across executions.

Traditional deterministic replay is therefore impossible.

The platform instead guarantees deterministic artifact replay through governed execution recording.

This policy standardizes that behavior.

---

# Core Principle

Replay reproduces governed execution.

Replay does not regenerate intelligence.

```text
Original Execution

↓

Execution Record

↓

Replay

↓

Original Intelligence Artifact
```

Replay never attempts to create a new intelligence result.

---

# Definitions

## Replay

Replay reproduces a previously governed execution.

Replay returns the original intelligence artifact together with its original execution context.

Replay never performs fresh business reasoning.

---

## Regeneration

Regeneration performs a new governed execution.

Regeneration invokes the active Prompt Package and configured model.

Regeneration always produces a new execution record.

If business content changes, regeneration produces a new artifact version.

---

# Replay vs Regeneration

Replay answers:

> "Show me exactly what happened."

Regeneration answers:

> "Run the intelligence layer again using governed execution."

These are fundamentally different operations.

Replay never becomes regeneration.

Regeneration never becomes replay.

---

# Replay Inputs

Replay requires:

- original intelligence artifact
- original execution record
- original Prompt Package version
- original execution context
- original model information

Replay never consumes current Prompt Packages.

Replay never consumes current execution settings.

---

# Replay Outputs

Replay returns:

- original intelligence artifact
- original execution metadata
- original execution record reference

Replay never creates:

- new artifact versions
- new execution records
- new business reasoning

---

# Regeneration Inputs

Regeneration consumes:

- governed Prompt Package
- current execution context
- provider configuration
- business inputs

Regeneration performs a new governed execution.

---

# Regeneration Outputs

Regeneration produces:

- new execution record
- new execution metadata
- new intelligence artifact (if content changes)

Regeneration never overwrites historical executions.

---

# Required Metadata

Every governed LLM execution must preserve enough metadata to support replay.

Required metadata includes:

- execution identifier
- prompt identifier
- prompt version
- model identifier
- model version
- provider identifier
- execution timestamp
- execution context identifier

Business artifacts do not own this metadata.

Execution metadata remains owned by the Execution Framework.

---

# Replay Guarantees

Replay guarantees:

- identical business artifact
- identical execution metadata
- identical prompt version
- identical model version
- identical execution context
- identical execution record

Replay does not guarantee identical LLM generation.

Replay reproduces governed execution, not provider behavior.

---

# What Replay Never Does

Replay must never:

- invoke an LLM provider
- regenerate prompts
- upgrade prompt versions
- substitute newer models
- reinterpret business reasoning
- create new artifacts
- modify historical executions

Replay is read-only.

---

# Execution Record Ownership

Execution Records own:

- prompt metadata
- model metadata
- provider metadata
- execution metadata
- replay metadata

Business artifacts never own execution metadata.

---

# Relationship with Prompt Registry

Replay resolves the original Prompt Package through the Prompt Registry.

Replay never upgrades to a newer Prompt Package version.

Historical executions always reference the Prompt Package used during original execution.

---

# Relationship with LLM Execution Framework

The LLM Execution Framework records governed execution.

Replay consumes those execution records.

The LLM Execution Framework remains responsible for execution recording.

---

# Relationship with Artifact Framework

The Artifact Framework owns:

- artifact identity
- artifact metadata
- artifact hashing
- lineage
- persistence

Replay never modifies artifact ownership.

---

# Failure Model

Replay fails if:

- the execution record cannot be found
- the referenced Prompt Package cannot be resolved
- the referenced artifact cannot be resolved

Replay failure never triggers regeneration automatically.

Replay and regeneration are independent operations.

---

# Determinism

LLM-native layers are not algorithmically deterministic.

Platform determinism is achieved through:

- immutable execution records
- immutable Prompt Package versions
- immutable artifacts
- immutable lineage

The platform guarantees deterministic replay of governed executions.

It does not guarantee deterministic language generation.

---

# Design Principles

Replay must be:

- deterministic
- immutable
- auditable
- reproducible
- read-only

Replay must never:

- regenerate intelligence
- invoke providers
- modify artifacts
- overwrite execution history
- substitute newer prompts or models

---

# Architecture Summary

The LLM Replay Policy defines the canonical replay behavior for all LLM-native intelligence layers.

By separating replay from regeneration, the platform preserves auditability, reproducibility, and governance while acknowledging the non-deterministic nature of LLM inference.

Replay reproduces governed execution.

Regeneration creates new governed execution.

These responsibilities remain permanently distinct throughout the platform.