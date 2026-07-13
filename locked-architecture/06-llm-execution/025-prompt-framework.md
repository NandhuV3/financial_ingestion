# 025 - Prompt Framework

**Status:** LOCKED  
**Layer:** Platform Foundation  
**Owner:** Platform Foundation Architecture  
**Producer:** Prompt Framework  
**Consumer:** LLM-native Intelligence Layers  
**Last Updated:** 2026-07-07

---

# Purpose

The Prompt Framework defines how governed prompts are organized to produce a single intelligence artifact.

It standardizes prompt orchestration, prompt-unit execution, output assembly, and validation while separating prompt organization from LLM execution.

The Prompt Framework does not execute prompts.

It coordinates them.

---

# Why This Framework Exists

LLM-native intelligence layers often require multiple reasoning steps.

Without a shared Prompt Framework, every intelligence layer would independently implement:

- prompt orchestration
- prompt decomposition
- output assembly
- validation
- partial execution handling

This would duplicate platform responsibilities across business layers.

Instead, prompt organization is centralized as reusable platform infrastructure.

Business layers focus only on intelligence.

---

# Core Principle

Business layers own reasoning.

The Prompt Framework owns prompt organization.

```text
Intelligence Layer

↓

Prompt Framework

↓

LLM Execution Framework

↓

LLM Provider
```

Business layers never orchestrate prompts directly.

---

# Responsibilities

The Prompt Framework is responsible for:

- prompt orchestration
- prompt-unit planning
- prompt execution sequencing
- structured output assembly
- prompt-level validation
- execution coordination

The Prompt Framework is NOT responsible for:

- business reasoning
- prompt content
- provider invocation
- artifact persistence
- business validation
- governance

---

# Prompt Units

A Prompt Unit represents one governed reasoning task.

Examples include:

- Business Model
- Revenue Model
- Customer Segments
- Strategic Priorities
- Risks
- Operating Structure

Prompt Units are execution components.

They are not business artifacts.

---

# Prompt Plan

Each intelligence layer defines a Prompt Plan.

A Prompt Plan specifies:

- required Prompt Units
- execution order
- dependencies
- expected output schemas

The Prompt Framework executes the Prompt Plan.

---

# Execution Model

Every Prompt Plan follows:

```text
Prompt Plan

↓

Prompt Unit A

↓

Prompt Unit B

↓

Prompt Unit C

↓

Output Assembly

↓

Validation

↓

Structured Result
```

Prompt execution order must be deterministic.

---

# Prompt Assembly

Prompt Unit outputs are assembled into one structured intelligence result.

Assembly is deterministic.

Assembly must never introduce new business reasoning.

The framework combines outputs.

It does not reinterpret them.

---

# Validation

The Prompt Framework validates:

- required Prompt Units completed
- output schema compliance
- required fields present
- duplicate field detection
- assembly completeness

Business validation remains owned by the consuming intelligence layer.

---

# Failure Model

Prompt execution is atomic.

If a required Prompt Unit fails:

- the Prompt Plan fails
- no partial structured result is produced

Partial prompt outputs are never persisted as business artifacts.

---

# Replay

Replay follows the original Prompt Plan.

Replay consumes:

- Prompt Plan
- Prompt Registry versions
- Execution Records

Replay reproduces governed execution.

Replay does not regenerate prompt orchestration independently.

---

# Relationship with LLM Execution Framework

The Prompt Framework coordinates execution.

The LLM Execution Framework executes individual Prompt Units.

The Prompt Framework never communicates directly with LLM providers.

---

# Relationship with Prompt Registry

The Prompt Registry governs:

- Prompt Unit definitions
- prompt versions
- activation
- lifecycle

The Prompt Framework requests governed prompts from the Prompt Registry.

---

# Relationship with Artifact Framework

The Prompt Framework never creates artifacts.

The Artifact Framework owns:

- identity
- metadata
- lineage
- hashing
- persistence
- versioning

The Prompt Framework produces only structured business content.

---

# Relationship with Intelligence Layers

Intelligence layers define:

- business schemas
- required Prompt Plans
- business validation rules

The Prompt Framework performs execution only.

---

# Prompt Evolution

Prompt Plans may evolve over time.

Examples include:

- adding Prompt Units
- removing Prompt Units
- changing execution order
- refining decomposition

Prompt evolution is governed through the Prompt Registry.

Historical Prompt Plans remain replayable.

---

# Design Principles

The Prompt Framework must be:

- reusable
- provider-independent
- deterministic in orchestration
- replayable
- composable
- execution-focused

The Prompt Framework must never:

- perform business reasoning
- interpret business meaning
- own business artifacts
- invoke providers directly
- bypass the Prompt Registry
- bypass the Artifact Framework

---

# Architecture Summary

The Prompt Framework provides the canonical orchestration model for all LLM-native intelligence layers.

By separating prompt organization from LLM execution and business reasoning, the platform enables complex intelligence workflows to remain modular, replayable, observable, and scalable while preserving clean ownership boundaries.

Every intelligence layer focuses only on business understanding.

The Prompt Framework ensures that governed Prompt Units execute in a consistent, deterministic, and reusable manner across the platform.