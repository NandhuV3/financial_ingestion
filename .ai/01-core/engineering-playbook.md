# Engineering Playbook

**Status:** LOCKED

---

# 1. Purpose

This document defines the engineering methodology used throughout the project.

It describes:

- how architecture is developed
- how implementation is performed
- how engineering work is reviewed
- how architectural changes are governed
- how completed work is accepted

This document is the highest-level engineering guide for the project.

It complements:

- implementation-methodology.md
- engineering-standards.md
- architecture specifications
- subsystem roadmaps

---

# 2. Engineering Philosophy

The project follows an **Architecture-First Engineering** methodology.

Architecture is the permanent source of truth.

Implementation exists only to realize the approved architecture.

Engineering prioritizes:

1. Architectural Correctness
2. Implementation Correctness
3. Engineering Efficiency

Implementation convenience must never override architectural correctness.

---

# 3. Engineering Lifecycle

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
        ↓
Subsystem Acceptance
```

No implementation begins before the roadmap is locked.

---

# 4. Engineering Phases

Engineering is divided into two major phases.

## Phase 1 — Architecture

Purpose:

> Is the architecture correct?

Focus areas:

- Ownership
- Contracts
- Framework responsibilities
- Dependency direction
- Replay
- Governance
- Lineage
- Versioning

Outputs:

- Architecture documents
- Specifications
- Contracts
- Roadmaps

---

## Phase 2 — Implementation

Purpose:

> Does the implementation faithfully realize the approved architecture?

Focus areas:

- Architecture compliance
- Scope compliance
- Code quality
- Validation
- Acceptance

Outputs:

- Production implementation
- Tests
- Validation
- Acceptance records

---

# 5. Engineering Principles

Every engineering decision follows these principles.

## Principle 1

Architecture is approved before implementation.

---

## Principle 2

Ownership is defined before contracts.

---

## Principle 3

Contracts are defined before implementation.

---

## Principle 4

Roadmaps are locked before coding begins.

---

## Principle 5

Implementation never redesigns architecture.

---

## Principle 6

Engineering Packages optimize delivery.

They never change ownership.

---

## Principle 7

Acceptance records become part of the permanent engineering history.

---

# 6. Review Types

The project uses four review types.

---

## Architecture Review

Purpose:

Validate architectural correctness.

Questions answered:

- Is ownership correct?
- Are contracts correct?
- Are framework boundaries correct?
- Is replay correct?
- Is governance correct?

Architecture Reviews never discuss implementation quality.

---

## Roadmap Review

Purpose:

Validate implementation planning.

Questions answered:

- Is decomposition correct?
- Are dependencies correct?
- Is implementation sequencing correct?
- Is package grouping appropriate?

Roadmap Reviews never redesign architecture.

---

## Implementation Review

Purpose:

Validate implementation correctness.

Questions answered:

- Does the implementation follow the architecture?
- Does it remain within scope?
- Are ownership boundaries preserved?
- Are acceptance criteria satisfied?

Implementation Reviews never redesign architecture unless an Architecture Reopen Gate is triggered.

---

## Acceptance Review

Purpose:

Officially certify completed engineering work.

Acceptance confirms:

- implementation complete
- validation passed
- architecture preserved
- ready for downstream dependencies

---

# 7. Architecture Reopen Gate

Architecture may only be reopened when implementation discovers one or more of:

- Ownership conflict
- Contract conflict
- Dependency direction violation
- Replay model violation
- Governance model violation
- Framework responsibility conflict
- Lineage/versioning conflict

If triggered:

```text
Pause Implementation
        ↓
Architecture Review
        ↓
Architecture Decision
        ↓
Roadmap Update (if required)
        ↓
Resume Implementation
```

Implementation must never redesign architecture independently.

---

# 8. Engineering Packages

Implementation is organized into **Implementation Packages (IP)**.

An Implementation Package groups multiple architecturally approved Work Orders into one reviewable implementation increment.

Implementation Packages exist to improve engineering efficiency.

They do not alter:

- ownership
- contracts
- architecture
- framework boundaries

---

## Engineering Package Rules

Every package must:

- preserve architectural correctness
- preserve ownership
- remain independently reviewable
- remain independently testable
- remain within approved scope

Packages must never merge unrelated architectural responsibilities.

---

# 9. Acceptance Levels

Engineering work is accepted at three levels.

---

## Level 1

Work Order

Confirms completion of an individual architectural responsibility.

---

## Level 2

Implementation Package

Confirms completion of a reviewable engineering increment.

---

## Level 3

Subsystem

Confirms an entire reusable subsystem is complete and production-ready.

---

# 10. Engineering Records

Every completed Implementation Package produces permanent engineering records.

Required records:

- Implementation Review
- Acceptance Certification
- Validation Results

Every completed subsystem additionally produces:

- Subsystem Acceptance Certification

These records provide long-term engineering traceability.

---

# 11. Decision Hierarchy

When making engineering decisions, use this priority order:

1. Architecture
2. Ownership
3. Contracts
4. Framework Responsibilities
5. Replay
6. Governance
7. Lineage
8. Versioning
9. Maintainability
10. Performance

Performance optimizations must never violate architectural correctness.

---

# 12. Relationship to Other Documents

This playbook defines the engineering methodology.

Other documents define specialized concerns.

| Document | Responsibility |
|----------|----------------|
| Engineering Playbook | Overall engineering process |
| Implementation Methodology | Rules for implementation |
| Engineering Standards | Coding standards |
| Architecture Specifications | System design |
| Roadmaps | Implementation sequencing |
| Work Orders | Architectural decomposition |
| Implementation Packages | Execution planning |
| Acceptance Records | Engineering history |

---

# 13. Things Never To Do

Never:

- implement before architecture approval
- redesign architecture during implementation
- bypass ownership boundaries
- bypass framework boundaries
- expand implementation scope without review
- skip validation
- skip acceptance certification
- merge unrelated responsibilities into one package

If any of these become necessary, stop and initiate an Architecture Review.

---

# 14. Final Principle

The objective of engineering is not simply to produce working software.

The objective is to produce software whose architecture remains understandable, governable, replayable, maintainable, and evolvable for many years.

Architecture defines **what** the system should become.

Engineering defines **how** that architecture is realized.

Both are equally important.

Engineering succeeds only when implementation faithfully realizes the approved architecture without compromising ownership, governance, replayability, or long-term maintainability.