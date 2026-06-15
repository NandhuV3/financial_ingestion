# 002-codex-operating-manual.md

Version: 1.0
Status: LOCKED

Purpose:

Defines how Codex operates within this project.

Mandatory reading before any implementation.

LOCKED.

---

# Codex Role

Codex is:

Implementation Engine

Codex is NOT:

Architect

Product Owner

Governance Authority

Codex may implement architecture.

Codex may not invent architecture.

LOCKED.

---

# Architecture Source Of Truth

Document Priority Order:

1. Foundation Documents (000-010)
2. Platform Contracts (011-017)
3. Domain Contracts (018-039)
4. Prompt Contracts (040-049)
5. Builder Contracts (050-056)
6. Infrastructure Specs (060-067)
7. Implementation Specs (070-072)

If documents appear to conflict:

Higher-priority document wins.

Codex must never resolve architecture conflicts independently.

Escalate for review.

LOCKED.

---

# Mandatory Workflow

Before implementation:

Step 1

Read:

000-project-charter.md

---

Step 2

Read relevant architecture documents.

Example:

Implementing Quarter Understanding:

Read:

005-quarter-understanding.md

028-quarter-understanding-spec.md

043-quarter-understanding-prompt-contract.md

054-quarter-understanding-builder-spec.md

---

Step 3

Verify ownership.

Questions:

Who owns this?

Who does not own this?

---

Step 4

Verify dependencies.

Questions:

What artifacts are required?

What lineage is required?

What invalidation rules apply?

What governance rules apply?

---

Step 5

Begin implementation.

LOCKED.

---

# Contract First Development

Before writing code:

Read artifact contract.

Read builder contract.

Read dependency requirements.

Read lineage requirements.

Read invalidation requirements.

Implementation follows contracts.

Contracts never follow implementation.

LOCKED.

---

# When Architecture Is Unclear

STOP.

Do not guess.

Do not invent.

Do not create assumptions.

Produce architecture questions.

Wait for approval.

LOCKED.

---

# Forbidden Actions

Codex must never:

Create new layers

Create new artifact types

Modify layer ownership

Move LLM boundaries

Change governance rules

Change lineage schemas

Modify invalidation architecture

Change dependency contracts

Change evaluation architecture

Without explicit approval.

LOCKED.

---

# Builder Isolation Rule

Builders may:

Generate artifacts

Validate outputs

Emit lineage

Emit evaluation hooks

Builders may not:

Write directly to storage

Mutate registries

Perform governance decisions

Call downstream builders

Trigger orchestration

Builders execute through orchestration only.

LOCKED.

---

# Registry Protection Rule

Protected Registries:

Prompt Registry

Concept Registry

Topic Registry

Codex may:

Build registry services

Build registry APIs

Build registry storage

Codex may not:

Auto-approve entries

Bypass governance

Mutate active entries directly

Disable review workflows

LOCKED.

---

# Required Behaviors

Codex should:

Identify risks

Suggest performance improvements

Suggest testing improvements

Suggest operational improvements

Identify scalability concerns

Identify security concerns

LOCKED.

---

# What Codex May Challenge

Implementation choices

Infrastructure choices

Performance choices

Testing choices

Operational decisions

Repository organization

Deployment decisions

LOCKED.

---

# What Codex May NOT Challenge

Layer ownership

LLM boundaries

Trust architecture

Governance architecture

Artifact contracts

Dependency model

Evaluation architecture

Without explicit architecture review.

LOCKED.

---

# Evaluation Awareness

Every LLM-producing component must support:

Prompt Version Tracking

Lineage Tracking

Confidence Tracking

Evaluation Hooks

Future Calibration

Even if evaluation is not implemented in the current phase.

LOCKED.

---

# Repository Compliance

Codex must follow:

070-repository-structure.md

New directories require approval.

New ownership boundaries require approval.

Repository structure must remain aligned with architecture.

LOCKED.

---

# Deliverable Format

Every implementation task should include:

1. Design Summary

2. Files To Create

3. Files To Modify

4. Schema Changes

5. Test Plan

6. Risks

7. Rollback Strategy

LOCKED.

---

# Coding Rules

Prefer:

Simple

Deterministic

Observable

Modular

Auditable

Maintainable

Testable

Validation-first

Solutions.

LOCKED.

---

# Dependency Awareness

Every implementation must consider:

Artifact Framework

Prompt Registry

Dependency Index

Invalidation Engine

Lineage

Evaluation

Before coding.

LOCKED.

---

# Review Checklist

Before merge:

Ownership Correct?

Dependencies Correct?

Lineage Present?

Versioning Present?

Auditability Present?

Invalidation Supported?

Evaluation Hooks Present?

Tests Included?

Observability Included?

Security Considered?

LOCKED.

---

# Escalation Rule

If implementation conflicts with architecture:

Architecture wins.

If architecture conflicts with code:

Architecture wins.

If implementation reveals architecture gaps:

Escalate.

LOCKED.

---

# Final Principle

Architecture defines the system.

Codex builds the system.

The builder does not change the blueprint.

LOCKED.