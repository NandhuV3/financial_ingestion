# 024 - LLM Execution Framework

**Status:** LOCKED  
**Layer:** Platform Foundation  
**Owner:** Platform Foundation Architecture  
**Producer:** LLM Execution Framework  
**Consumer:** LLM-native Intelligence Layers  
**Last Updated:** 2026-07-07

---

# Purpose

The LLM Execution Framework provides the canonical execution model for every LLM-native intelligence layer.

It standardizes how governed prompts are executed, how execution is recorded, and how structured outputs are returned to the platform.

The framework separates LLM execution infrastructure from business intelligence logic.

Every LLM-native layer consumes this framework.

No intelligence layer owns LLM execution.

---

# Why This Framework Exists

Without a shared execution framework, every LLM-native layer would independently implement:

- prompt resolution
- provider invocation
- model selection
- execution recording
- replay handling
- execution metadata
- output assembly

This would duplicate platform responsibilities across business layers.

Instead, LLM execution is centralized as reusable platform infrastructure.

Business layers focus only on intelligence.

---

# Core Principle

Business layers own reasoning.

The LLM Execution Framework owns execution.

```text
Company Intelligence Layer

↓

LLM Execution Framework

↓

LLM Provider

↓

Structured Response

↓

Artifact Framework
```

Business intelligence never manages execution infrastructure.

---

# Responsibilities

The LLM Execution Framework is responsible for:

- resolving governed prompts
- invoking configured LLM providers
- supplying execution context
- capturing execution metadata
- recording prompt execution
- returning structured outputs
- supporting replay
- enforcing execution contracts

The framework is NOT responsible for:

- business reasoning
- prompt content
- business validation
- artifact persistence
- governance decisions
- investor interpretation

---

# Consumers

Every LLM-native intelligence layer consumes this framework.

Examples include:

- Structured Intelligence
- Company Knowledge Candidate
- Quarter Understanding
- Investor Intelligence

Future LLM-native layers must also consume this framework.

---

# Inputs

The framework consumes:

Required Inputs

- Prompt Package
- Execution Context
- Provider Configuration

The framework never consumes business artifacts directly.

Business artifacts remain owned by intelligence layers.

---

# Outputs

The framework produces:

- structured prompt execution result
- prompt execution record
- execution metadata

The framework does not produce business artifacts.

Artifact creation remains the responsibility of the Artifact Framework.

---

# Execution Model

Every execution follows the same lifecycle.

```text
Execution Request

↓

Resolve Prompt

↓

Load Execution Context

↓

Invoke Provider

↓

Validate Structured Output

↓

Record Execution

↓

Return Structured Result
```

No execution stage may be skipped.

---

# Execution Context

Execution Context is supplied by the Execution Context framework.

The LLM Execution Framework consumes the context.

It never constructs execution context independently.

---

# Prompt Resolution

Prompt selection is delegated to the Prompt Registry.

The framework never embeds prompt text.

The framework executes the active governed prompt.

---

# Provider Invocation

Provider communication is owned exclusively by the framework.

Business layers never invoke providers directly.

The framework abstracts provider-specific behavior behind a common execution contract.

---

# Structured Output

The framework returns validated structured output.

The framework does not interpret business meaning.

Business interpretation remains owned by the consuming intelligence layer.

---

# Execution Records

Every execution produces an immutable execution record.

Execution records support:

- replay
- audit
- debugging
- governance
- observability

Execution records are operational records.

They are not Company Intelligence artifacts.

---

# Replay

Replay consumes the original execution record.

Replay reproduces governed execution.

Replay does not require fresh LLM inference.

If regeneration is explicitly requested, it creates a new governed execution rather than replaying an existing one.

---

# Failure Model

Execution is atomic.

An execution produces either:

```text
Validated Structured Result
```

or

```text
Execution Failure
```

Partial execution results are never persisted.

---

# Independence

The framework is independent of:

- Company Intelligence
- Platform Intelligence
- Governance
- Builder Framework
- Artifact Framework

It owns only LLM execution.

---

# Relationship with Prompt Registry

The Prompt Registry governs:

- prompt versions
- prompt activation
- prompt lifecycle

The LLM Execution Framework executes the governed prompt selected by the Prompt Registry.

---

# Relationship with Artifact Framework

The LLM Execution Framework never persists business artifacts.

The Artifact Framework remains responsible for:

- artifact identity
- artifact metadata
- hashing
- lineage
- persistence
- versioning

The framework supplies only validated structured output.

---

# Relationship with Intelligence Layers

Intelligence layers own:

- business reasoning
- business schemas
- business validation
- business artifacts

The framework owns execution only.

---

# Determinism

LLM execution is not algorithmically deterministic.

Platform determinism is achieved through:

- governed prompt versions
- execution records
- replay policy
- artifact persistence

The framework guarantees reproducible platform behavior, not deterministic language generation.

---

# Design Principles

The LLM Execution Framework must be:

- reusable
- provider-independent
- replayable
- observable
- auditable
- execution-focused

The framework must never:

- perform business reasoning
- interpret business meaning
- evaluate companies
- own business artifacts
- bypass the Prompt Registry
- bypass the Artifact Framework

---

# Architecture Summary

The LLM Execution Framework is the canonical execution engine for all LLM-native intelligence layers.

By separating execution infrastructure from business reasoning, the platform enables every intelligence layer to reuse a consistent execution model while preserving clean ownership boundaries, governed prompt execution, replayability, and long-term architectural scalability.