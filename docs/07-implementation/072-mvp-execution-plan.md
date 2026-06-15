# 072-mvp-execution-plan.md

Version: 1.0
Status: LOCKED

Purpose:

Define the implementation sequence for the Investment Intelligence Platform.

This document determines:

- Build order
- Phase boundaries
- MVP scope
- Success criteria
- Codex execution plan

---

# Architectural Principle

Build:

```text
Thin End-To-End

Before

Deep Subsystems
```

Never build:

```text
Perfect Components

Without End-To-End Flow
```

---

# MVP Goal

The first MVP must prove:

```text
A filing can enter the platform

↓

Artifacts are generated

↓

Investor Intelligence is produced

↓

Artifacts are stored

↓

Artifacts are replayable
```

Nothing else matters initially.

---

# Phase Overview

```text
Phase 0
Repository Setup

Phase 1
Skeleton Pipeline

Phase 2
Storage + Artifact Framework

Phase 3
Builders

Phase 4
Investor Intelligence

Phase 5
Dependency Index

Phase 6
Invalidation

Phase 7
Governance

Phase 8
Evaluation

Phase 9
Production Hardening
```

---

# Phase 0

Repository Setup

Duration:

```text
1-2 Days
```

---

# Deliverables

Repository structure:

```text
apps/
services/
builders/
contracts/
packages/
prompts/
```

---

# Deliverables

Build system:

```text
TypeScript

Linting

Testing

CI
```

---

# Success Criteria

```text
Monorepo compiles

CI passes
```

---

# Phase 1

Skeleton Pipeline

Duration:

```text
3-5 Days
```

---

# Goal

Prove architecture works.

---

# Build

Only:

```text
Themes

Structured Intelligence

Quarter Understanding

Investor Intelligence
```

---

# Skip

```text
Topic Evolution

Company Knowledge

Trust

Evaluation

Governance
```

temporarily.

---

# Use

```text
Mock Storage

Mock Registry

Mock Dependency Graph
```

---

# Flow

```text
Filing
 ↓

Themes
 ↓

Structured Intelligence
 ↓

Quarter Understanding
 ↓

Investor Intelligence
```

---

# Success Criteria

Single filing produces:

```text
Investor Intelligence Artifact
```

---

# Phase 2

Artifact Framework

Duration:

```text
3-4 Days
```

---

# Build

```text
Artifact Contract

Artifact Metadata

Artifact Lineage

Artifact Storage
```

---

# Deliverables

artifact_store

artifact_current_pointer

artifact APIs

---

# Success Criteria

Artifacts persisted.

Artifacts versioned.

Artifacts retrievable.

---

# Phase 3

Builder Framework

Duration:

```text
4-7 Days
```

---

# Build

Generic builder runtime.

---

# Deliverables

```text
Builder Registry

Builder Contract

Execution Context

Validation Framework
```

---

# Success Criteria

Any builder can run through:

```text
Single Runtime
```

---

# Phase 4

Core Intelligence Layer

Duration:

```text
1-2 Weeks
```

---

# Build

```text
Themes

Topic Assignment

Structured Intelligence

Quarter Understanding

Investor Intelligence
```

fully.

---

# Deliverables

Real prompts.

Real artifacts.

Real lineage.

---

# Success Criteria

Generate:

```text
Q1

Q2

Q3

Q4

Q5
```

from filing inputs.

---

# Phase 5

Dependency Index

Duration:

```text
3-5 Days
```

---

# Build

dependency_nodes

dependency_edges

---

# Build

Dependency service.

---

# Success Criteria

Artifact dependency graph exists.

Builders execute via dependencies.

---

# Phase 6

Hybrid Invalidation

Duration:

```text
1 Week
```

---

# Build

```text
Candidate Stale

Content Hash Comparison

Propagation Stop

Propagation Continue
```

---

# Deliverables

Invalidation Engine.

---

# Success Criteria

Prompt update only regenerates:

```text
Affected Artifacts
```

---

# Phase 7

Knowledge + Trust

Duration:

```text
2 Weeks
```

---

# Build

```text
Company Knowledge

Commitment Tracking

Narrative Consistency

Accounting Stability

Trust Signals
```

---

# Success Criteria

Q3 Trust runs using:

```text
Real Trust Artifacts
```

---

# Phase 8

Governance

Duration:

```text
1 Week
```

---

# Build

```text
Prompt Governance

Concept Governance

Knowledge Governance
```

---

# Deliverables

Review workflows.

Approval workflows.

Registry activation.

---

# Success Criteria

Human approval gates exist.

---

# Phase 9

Evaluation Architecture

Duration:

```text
1 Week
```

---

# Build

```text
Ground Truth Corpus

Regression Tests

Calibration

Prompt Evaluation
```

---

# Success Criteria

Prompt activation gates operational.

---

# Phase 10

Production Hardening

Duration:

```text
2-4 Weeks
```

---

# Build

```text
Observability

Security

Replay

Disaster Recovery

Scaling
```

---

# Deliverables

Production readiness.

---

# Success Criteria

10,000 company architecture validated.

---

# First Codex Sprint

Build ONLY:

```text
artifact framework

builder framework

themes

structured intelligence

quarter understanding

investor intelligence
```

---

# Explicitly Do NOT Build Yet

```text
Concept Registry

Governance

Evaluation

Trust

Partner Domain

Invalidation
```

---

# Why

Because none of those matter until:

```text
Investor Intelligence
```

exists.

---

# MVP Definition

MVP is complete when:

```text
Input Filing
     ↓

Themes
     ↓

Structured Intelligence
     ↓

Quarter Understanding
     ↓

Investor Intelligence
```

works end-to-end.

---

# MVP Non-Goals

Do NOT optimize:

```text
Scale

Governance

Evaluation

Partner Features

Multi-region
```

---

# Architectural Invariants

LOCKED.

1. End-to-end flow before subsystem perfection.
2. Investor Intelligence is the first business milestone.
3. Artifact Framework is built before advanced governance.
4. Dependency Index precedes invalidation.
5. Trust architecture follows core pipeline.
6. Governance follows trust architecture.
7. Evaluation follows governance.
8. Production hardening is last.
9. Every phase must produce a working system.
10. Architecture is complete; implementation now begins.

End of Specification.