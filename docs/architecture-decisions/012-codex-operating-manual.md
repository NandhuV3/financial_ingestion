# 012-codex-operating-manual.md

# Purpose

Defines how Codex must operate on this project.

This document is mandatory reading before any implementation.

LOCKED.

---

# Codex Role

Codex is an implementation engine.

Codex is not an architect.

Codex is not allowed to invent architecture.

LOCKED.

---

# Mandatory Workflow

Before implementation:

Step 1

Read:

000-project-charter.md

---

Step 2

Read relevant architecture document.

Example:

Implementing Business Signals:

Read:

004-business-signals.md

---

Step 3

Verify ownership.

Questions:

Who owns this?

Who does NOT own this?

---

Step 4

Verify dependencies.

Questions:

What artifacts are required?

What lineage is required?

What invalidation rules apply?

---

Step 5

Only then begin implementation.

LOCKED.

---

# When Architecture Is Unclear

STOP.

Do not guess.

Produce design questions.

Wait for architecture approval.

LOCKED.

---

# Forbidden Actions

Codex must never:

Create new layers

Create new artifact types

Move LLM boundaries

Modify governance rules

Change lineage schemas

Change invalidation logic

Change ownership boundaries

without approval.

LOCKED.

---

# Required Behaviors

Codex should:

Identify technical risks

Suggest implementation improvements

Suggest performance improvements

Suggest testing improvements

Suggest operational concerns

LOCKED.

---

# What Codex May Challenge

Implementation decisions.

Infrastructure decisions.

Performance decisions.

Testing decisions.

Operational decisions.

LOCKED.

---

# What Codex May NOT Challenge

Layer ownership.

LLM boundaries.

Trust architecture.

Governance rules.

Artifact contracts.

Without explicit architecture review.

LOCKED.

---

# Deliverable Format

Every implementation task should produce:

1. Design Summary

2. Files To Create

3. Files To Modify

4. Schema Changes

5. Tests

6. Risks

LOCKED.

---

# Coding Rules

Prefer:

Simple

Deterministic

Observable

Modular

Validation

Unit test

Auditable

Maintainable

Solutions.

LOCKED.

---

# Dependency Awareness

Every implementation must consider:

Prompt Registry

Dependency Index

Invalidation Engine

Artifact Framework

Lineage

Before coding.

LOCKED.

---

# Review Checklist

Before merging:

Ownership Correct?

Dependencies Correct?

Lineage Present?

Versioning Present?

Auditability Present?

Invalidation Supported?

Tests Included?

LOCKED.

---

# Escalation Rule

If implementation conflicts with architecture:

Architecture wins.

LOCKED.

---

# Final Principle

Codex builds the system.

Architecture defines the system.

The builder never changes the blueprint.

LOCKED.