# 003-engineering-standards.md

Version: 1.0

Status: LOCKED

Purpose:

Defines mandatory engineering standards for all implementations.

Applies to:

* Codex
* Engineers
* Contributors
* Future AI coding agents

These rules are in addition to:

* 000-implementation-rules.md
* 002-codex-operating-manual.md

LOCKED.

---

# Mission

Build a production-grade intelligence platform.

This project is NOT:

* a demo
* a prototype
* a proof of concept
* a hackathon project
* a benchmark application

Implementation quality must support:

* scale
* governance
* observability
* replayability
* auditability
* long-term maintenance

LOCKED.

---

# Architecture First

Implementation follows architecture.

Implementation does not define architecture.

Implementation may identify gaps.

Implementation may not silently extend architecture.

When architecture is unclear:

STOP.

Escalate.

Do not guess.

LOCKED.

---

# Forbidden Intelligence Patterns

Do NOT implement intelligence using:

* keyword matching
* regex classification
* string contains classification
* hardcoded business heuristics
* hardcoded trust heuristics
* hardcoded investment heuristics
* hardcoded narrative heuristics

Examples:

BAD:

```ts
if (text.includes("growth")) {
  score += 1;
}
```

BAD:

```ts
if (text.includes("strong demand")) {
  significance = "high";
}
```

BAD:

```ts
if (industry === "banking") {
  ...
}
```

These are not production intelligence systems.

LOCKED.

---

# No Hidden Intelligence

Business intelligence must not be embedded in code.

Intelligence belongs in:

* Prompt Contracts
* Governed Rules
* Approved Deterministic Engines

Not in:

* helper methods
* utility files
* validators
* controllers
* repositories

LOCKED.

---

# No Magic Numbers

Forbidden:

```ts
confidence = 0.8;

threshold = 0.72;

score += 17;
```

without explanation.

Every threshold must have:

* documentation
* ownership
* justification

LOCKED.

---

# Deterministic Logic Rules

Deterministic logic is allowed only when:

* architecture explicitly defines it
* behavior is reproducible
* behavior is testable
* behavior is auditable

Examples:

Allowed:

* Dependency Index
* Invalidation Engine
* Business Signals
* Trust Signal Detection
* Governance Decisions

Provided architecture defines them.

LOCKED.

---

# Prompt Ownership Rules

Prompts must come from:

Prompt Registry.

Builders must never:

* hardcode prompts
* inline prompts
* dynamically assemble hidden prompts

Forbidden:

```ts
const prompt = `
Analyze this company...
`;
```

LOCKED.

---

# LLM Usage Rules

Builders must use:

Approved LLM abstraction.

Builders must not:

* instantiate provider SDKs
* manage API keys
* call providers directly

Forbidden:

```ts
new OpenAI(...)
```

inside builders.

LOCKED.

---

# Layer Isolation Rules

Builders may access only approved dependencies.

Examples:

Themes:

* Filing

Allowed.

Themes:

* Company Knowledge

Forbidden.

Quarter Understanding:

* Investor Intelligence

Forbidden.

Structured Intelligence:

* Business Signals

Forbidden.

LOCKED.

---

# Explainability Rules

Every intelligence output must be explainable through:

* upstream artifacts
* prompt version
* model version
* lineage

No unexplained decisions.

No black-box scoring.

LOCKED.

---

# Replayability Rules

Every artifact generation must support replay.

Required:

* artifact lineage
* prompt version
* model version
* artifact version

Replayability is mandatory.

LOCKED.

---

# Observability Rules

New components must support:

* logging
* metrics
* tracing hooks

Do not hide failures.

Do not swallow exceptions.

Do not silently degrade behavior.

LOCKED.

---

# Validation Rules

Validation must be explicit.

Validation must be testable.

Validation must not be hidden inside prompts.

Builders must validate:

* inputs
* outputs
* required dependencies

LOCKED.

---

# Error Handling Rules

Use typed errors.

Forbidden:

```ts
throw new Error(...);
```

Use domain-specific errors.

Examples:

* BuilderValidationError
* BuilderExecutionError
* BuilderDependencyError

LOCKED.

---

# Testability Rules

Every feature must be testable.

Every framework component must include:

* unit tests

Critical components should include:

* integration tests

No implementation is complete without tests.

LOCKED.

---

# Reuse Before Rebuild

Before creating a new framework:

Check existing implementation.

Preferred order:

Reuse

↓

Extend

↓

Replace

Avoid unnecessary rewrites.

LOCKED.

---

# Modularity Rules

Implementation must be modular.

Architecture compliance alone is not sufficient.

Code must also be:

* maintainable
* reviewable
* reusable
* testable

LOCKED.

---

# Single Responsibility Principle

Files should have one primary responsibility.

Examples:

Good:

```text
builder.ts
comparison-engine.ts
validator.ts
evaluation.ts
```

Bad:

```text
builder.ts

- dependency resolution
- comparison logic
- validation logic
- recommendation logic
- scoring logic
- reporting logic
```

Builders should orchestrate.

Domain modules should implement domain logic.

LOCKED.

---

# File Responsibility Rules

Each file must have an explicit responsibility.

A file must not mix:

* domain decisions and persistence
* validation and decision logic
* orchestration and storage adapters
* audit construction and artifact mutation
* prompt construction and provider invocation
* production logic and test fixtures

When a file starts owning multiple responsibilities, split it before adding more behavior.

LOCKED.

---

# Separation Of Concerns Rules

Implementation boundaries must match architecture boundaries.

Builders propose.

Governance decides.

Artifact Framework persists and versions artifacts.

Dependency Index stores dependency state.

Invalidation Engine evaluates propagation.

Observability records execution behavior.

No module may bypass the owner of a responsibility for convenience.

LOCKED.

---

# Builder Structure Rules

Builders should primarily:

* resolve dependencies
* invoke domain modules
* assemble outputs
* return BuilderResult

Builders should avoid owning:

* comparison engines
* classification engines
* scoring engines
* recommendation engines
* validation engines

Extract reusable logic into dedicated modules.

LOCKED.

---

# File Size Guidance

Files should remain small enough to review and audit.

Guidance:

* prefer files under 250 lines for domain logic
* prefer files under 400 lines for orchestration
* split files earlier when responsibilities diverge

These are maintainability thresholds, not permission to create large files.

Exceeding them requires a clear architectural reason.

LOCKED.

---

# Function Design Rules

Functions should perform a single logical task.

Prefer:

* small composable functions
* explicit inputs
* explicit outputs

Avoid:

* deeply nested logic
* hidden side effects
* large multi-purpose functions

LOCKED.

---

# Reusability Rules

Before creating new logic:

1. Reuse existing implementation when appropriate.
2. Extend existing implementation when justified.
3. Create new implementation only when necessary.

Avoid duplicate business logic across builders.

LOCKED.

---

# Testability Rules

Major responsibilities should be independently testable.

Examples:

* comparison engine tests
* validator tests
* recommendation engine tests
* builder orchestration tests

Avoid designs where critical behavior can only be tested indirectly through large orchestration flows.

LOCKED.

---

## Test Structure Rules

Test files own behavior verification only.

Shared fixtures must live in:
- fixtures.ts
- builders.ts
- test-data.ts

Repository mocks must live in:
- test repositories
- test doubles
- harness modules

Avoid placing:
- fixtures
- repositories
- builders
- large mock objects

inside behavior test files.

---

# Production Readiness Principle

Prefer:

* maintainability
* modularity
* observability
* governance
* auditability

Over:

* speed
* shortcuts
* convenience

Passing tests is not sufficient.

Architecture compliance is required.

LOCKED.

---

# Final Principle

Temporary shortcuts become permanent systems.

Do not introduce shortcuts.

Build the production system directly.

LOCKED.
