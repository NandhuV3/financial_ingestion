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
