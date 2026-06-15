# 000-implementation-rules.md

Version: 1.0

Status: LOCKED

Purpose:

Defines mandatory implementation rules for all engineering work.

Every Codex task must read this document before implementation begins.

This document applies to:

* Codex
* Engineers
* Contributors
* Future AI coding agents

LOCKED.

---

# Mission

Implement the architecture.

Do not redesign the architecture.

Do not reinterpret the architecture.

Do not replace the architecture.

Architecture already exists.

Implementation follows architecture.

LOCKED.

---

# Required Reading Order

Before implementing any feature:

Step 1

Read:

```text
000-project-charter.md
```

---

Step 2

Read:

```text
001-roadmap.md

002-codex-operating-manual.md
```

---

Step 3

Read all relevant architecture documents.

Example:

Implementing Structured Intelligence:

```text
022-structured-intelligence-spec.md

042-structured-intelligence-prompt-contract.md

052-structured-intelligence-builder-spec.md
```

---

Step 4

Verify ownership.

Questions:

```text
Who owns this?

Who consumes this?

Who must not own this?
```

---

Step 5

Verify dependencies.

Questions:

```text
What artifacts are required?

What lineage is required?

What contracts apply?

What invalidation rules apply?
```

---

Step 6

Begin implementation.

LOCKED.

---

# Architecture Is Source Of Truth

Priority Order:

```text
Foundation Documents

↓

Platform Contracts

↓

Domain Contracts

↓

Prompt Contracts

↓

Builder Contracts

↓

Infrastructure Specifications

↓

Implementation Specifications
```

If two documents appear inconsistent:

Higher-priority document wins.

Never invent a resolution.

Escalate.

LOCKED.

---

# Contract First Development

Implementation starts with contracts.

Never start with code.

Required sequence:

```text
Contract

↓

Types

↓

Validation

↓

Storage

↓

Runtime

↓

Tests
```

Implementation must conform to contracts.

Contracts must never conform to implementation.

LOCKED.

---

# Ownership Rules

Every implementation must respect ownership.

Example:

Themes owns:

```text
Theme Extraction
```

Themes does not own:

```text
Topic Assignment

Structured Intelligence

Quarter Understanding
```

Never cross ownership boundaries.

LOCKED.

---

# Builder Isolation Rules

Builders may:

```text
Generate Artifacts

Validate Outputs

Emit Lineage

Emit Evaluation Hooks
```

Builders may not:

```text
Write Directly To Storage

Mutate Registries

Perform Governance Decisions

Trigger Downstream Builders

Call Orchestrators
```

Builders execute through platform infrastructure.

LOCKED.

---

# Registry Protection Rules

Protected Assets:

```text
Prompt Registry

Concept Registry

Topic Registry
```

Implementation may:

```text
Create Services

Create APIs

Create Storage
```

Implementation may not:

```text
Auto Approve Entries

Bypass Governance

Mutate Active Versions

Disable Reviews
```

LOCKED.

---

# Governance Protection Rules

Protected Areas:

```text
Prompt Governance

Concept Governance

Knowledge Governance
```

Implementation may support governance.

Implementation may not replace governance.

LOCKED.

---

# Invalidation Protection Rules

Hybrid invalidation is locked.

Implementation may not:

```text
Replace Content Hash Logic

Replace Version Hash Logic

Remove Candidate Stale State

Modify Propagation Rules
```

Without architecture review.

LOCKED.

---

# Evaluation Awareness

Every LLM-producing component must support:

```text
Prompt Version Tracking

Lineage Tracking

Confidence Tracking

Evaluation Hooks
```

Even if evaluation is implemented later.

LOCKED.

---

# Repository Compliance

Repository structure is defined in:

```text
070-repository-structure.md
```

Implementation must follow:

```text
apps/

services/

packages/

builders/

contracts/

prompts/
```

Do not create alternative structures.

Do not introduce new architectural layers.

LOCKED.

---

# Database Compliance

Database structure is defined in:

```text
071-database-schema.md
```

Implementation may optimize queries.

Implementation may add indexes.

Implementation may not change:

```text
Artifact Model

Versioning Model

Lineage Model

Governance Model
```

Without approval.

LOCKED.

---

# Required Deliverables

Every implementation task must produce:

```text
1. Design Summary

2. Files Created

3. Files Modified

4. Database Changes

5. Test Plan

6. Risks

7. Rollback Strategy
```

LOCKED.

---

# Testing Requirements

Every feature must include:

```text
Unit Tests
```

Every framework component must include:

```text
Integration Tests
```

No implementation is complete without tests.

LOCKED.

---

# Observability Requirements

New services must support:

```text
Logging

Metrics

Tracing
```

New workflows must support:

```text
Auditability
```

Observability is not optional.

LOCKED.

---

# Security Requirements

New components must consider:

```text
Authentication

Authorization

Auditability

Least Privilege
```

Security must not be deferred.

LOCKED.

---

# Performance Rules

Prefer:

```text
Deterministic

Simple

Observable

Maintainable
```

Before:

```text
Clever

Complex

Highly Optimized
```

Optimization requires evidence.

LOCKED.

---

# Escalation Rules

Stop implementation and escalate if:

```text
Architecture Is Missing

Ownership Is Unclear

Contracts Conflict

Governance Is Ambiguous

Invalidation Is Affected

Lineage Is Affected
```

Do not guess.

LOCKED.

---

# Forbidden Actions

Never:

```text
Create New Layers

Create New Artifact Types

Move LLM Boundaries

Change Ownership Rules

Change Governance Rules

Change Contracts

Change Lineage Models

Change Dependency Models
```

Without explicit approval.

LOCKED.

---

# Review Checklist

Before merge:

```text
Ownership Correct?

Contracts Followed?

Validation Present?

Lineage Present?

Versioning Present?

Auditability Present?

Evaluation Hooks Present?

Tests Included?

Observability Included?

Security Considered?
```

All answers must be YES.

LOCKED.

---

# Final Principle

Architecture defines the system.

Implementation realizes the system.

The blueprint is not modified during construction.

LOCKED.
