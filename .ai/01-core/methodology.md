# Implementation Methodology

**Status:** LOCKED

---

# 1. Purpose

This document defines the implementation methodology for this project.

It governs **how implementation work is executed** after the architecture has been approved.

This document is intended for implementation agents (e.g. Codex) and engineers contributing to the project.

It does **not** define architecture.

It defines **how approved architecture is implemented.**

---

# 2. Core Principle

Architecture is the source of truth.

Implementation exists only to realize the approved architecture.

Implementation must never redefine architecture.

---

# 3. Engineering Workflow

Every subsystem follows the same lifecycle.

```text
Architecture
        ↓
Architecture Review
        ↓
Architecture Approval
        ↓
Implementation Roadmap
        ↓
Roadmap Review
        ↓
Roadmap Lock
        ↓
Implementation Packages
        ↓
Implementation Review
        ↓
Acceptance Certification
```

Only the **Implementation Package** phase is governed by this document.

---

# 4. Architectural Boundaries

During implementation:

- Architecture is considered LOCKED.
- Roadmap is considered LOCKED.
- Ownership boundaries are considered LOCKED.
- Contracts are considered LOCKED unless an Architecture Reopen Gate condition occurs.

Implementation must not redesign architecture.

---

# 5. Implementation Unit

The smallest implementation unit is an **Implementation Package (IP).**

An Implementation Package groups one or more architecturally approved Work Orders into a single reviewable implementation increment.

Implementation Packages exist to improve engineering efficiency.

They do **not** change architectural ownership.

---

# 6. Implementation Package Principles

Every Implementation Package must:

- Implement only approved Work Orders.
- Preserve architectural ownership.
- Preserve framework boundaries.
- Preserve dependency direction.
- Preserve replay behavior.
- Preserve governance boundaries.
- Preserve contract integrity.
- Remain independently reviewable.
- Remain independently testable.

Implementation Packages must never merge unrelated architectural responsibilities.

---

# 7. Implementation Responsibilities

Implementation is responsible for:

- writing production code
- following approved contracts
- integrating existing Platform Foundation components
- preserving architectural boundaries
- implementing only the approved scope
- producing clean, maintainable code
- validating the implementation

Implementation is **not** responsible for:

- architecture design
- ownership decisions
- governance decisions
- business reasoning changes
- subsystem redesign

---

# 8. Architecture Reopen Gate

Architecture may only be reopened if implementation discovers one or more of the following:

- Ownership conflict
- Contract conflict
- Dependency direction violation
- Replay model violation
- Governance model violation
- Framework responsibility conflict
- Lineage or versioning conflict

If any of these occur:

```text
Pause Implementation
        ↓
Report Issue
        ↓
Architecture Review
        ↓
Architecture Decision
        ↓
Resume Implementation
```

Implementation must never modify architecture on its own.

---

# 9. Scope Discipline

Every Implementation Package has a defined scope.

Implementation must:

- implement everything inside the scope
- implement nothing outside the scope

If additional work appears necessary:

- stop
- report the issue
- wait for architectural review

Do not expand scope.

---

# 10. Engineering Standards

All implementation must:

- follow project coding standards
- use strong typing
- produce maintainable code
- avoid unnecessary complexity
- preserve deterministic behavior where applicable
- preserve framework reuse
- minimize coupling
- maximize clarity

---

# 11. Validation

Before an Implementation Package is considered complete:

Required validation includes:

- project typecheck
- relevant automated tests
- architecture compliance
- scope compliance
- ownership compliance

Additional validation may be required by the specific package.

---

# 12. Required Output

Every completed Implementation Package must report exactly:

## Files Created

List all newly created files.

## Files Modified

List all modified files.

## Implementation Summary

Summarize the implemented responsibilities.

## Validation Results

Include:

- typecheck
- tests
- other validation performed

## Architecture Issues

Report:

- discovered architectural conflicts

If none exist:

```
Architecture Issues

None.
```

---

# 13. Definition of Done

An Implementation Package is complete only when:

- all included Work Orders are implemented
- implementation stays within approved scope
- validation passes
- no ownership violations exist
- implementation review can be approved
- package is ready for Acceptance Certification

---

# 14. Decision Rules

When making implementation decisions:

Priority order:

1. Preserve architecture
2. Preserve ownership
3. Preserve contracts
4. Preserve framework boundaries
5. Preserve replay compatibility
6. Preserve maintainability
7. Optimize implementation

Implementation convenience must never override architectural correctness.

---

# 15. Things Never To Do

Never:

- redesign architecture
- introduce new ownership
- modify approved contracts
- introduce business intelligence into Platform Foundation
- bypass framework boundaries
- expand package scope
- perform undocumented architectural changes

If implementation appears to require one of these:

Stop.

Report the issue.

Wait for architectural review.

---

## Review Proportionality

Reviews should be proportional to the findings.

- If no architectural or implementation issues exist, keep the review concise.
- Do not create observations merely to make the review longer.
- Focus on meaningful deviations, ownership conflicts, scope creep, or opportunities that materially improve the subsystem.
- A short review with no issues is a sign of a mature implementation, not an incomplete review.

---

# 16. Final Principle

Implementation realizes architecture.

It does not redefine architecture.

A successful implementation is not the one that writes the most code.

It is the one that faithfully realizes the approved architecture while preserving ownership, contracts, replay behavior, governance, and long-term maintainability.