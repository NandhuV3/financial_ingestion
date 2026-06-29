# Engineering Standards

Status: LOCKED

---

# 1. Purpose

This document defines the engineering standards for the platform.

These standards exist to ensure the platform remains:

* maintainable
* modular
* testable
* observable
* reproducible
* auditable
* production-ready

The objective is not simply to make the code work.

The objective is to build software that remains understandable, reliable, and evolvable for many years.

These standards apply to every repository, module, Builder, service, script, and pull request.

---

# 2. Engineering Principles

Every implementation must follow these principles.

* Correctness over speed
* Clarity over cleverness
* Simplicity over unnecessary abstraction
* Modularity over monolithic code
* Reuse over duplication
* Explicitness over hidden behavior
* Automation over manual work
* Configuration over hardcoding
* Validation before execution
* Observability by default
* Testability by design
* Production readiness from day one

---

# 3. Zero Shortcut Policy

The platform does not allow temporary engineering shortcuts.

Never introduce:

* TODO implementations
* placeholder logic
* fake success paths
* manual production steps
* "fix later" comments
* hardcoded identifiers
* hardcoded company names
* hardcoded filing paths
* hardcoded prompt versions
* hardcoded schema versions
* hardcoded registry ids
* hardcoded environment-specific logic

If functionality cannot be implemented correctly,

stop,

raise the issue,

and solve the architectural problem.

---

# 4. Single Responsibility

Every module must have one responsibility.

Examples:

Good

```text
ThemeBuilder
```

Bad

```text
ThemeBuilderAndTopicAssignment
```

A file should become smaller as the platform grows, not larger.

---

# 5. Modular Design

Every feature should be built from small modules.

Avoid:

* giant services
* giant utility files
* giant helper folders
* shared "misc" modules

Modules should compose.

They should not accumulate unrelated responsibilities.

---

# 6. Layer Ownership

Code must follow Layer Ownership.

A Builder may consume only approved upstream artifacts.

No module may bypass the architecture.

Forbidden:

Structured Intelligence reading Business Signals.

Quarter Understanding reading raw filing HTML.

Investor Intelligence reading SEC HTML.

Layer boundaries are mandatory.

---

# 7. Dependency Direction

Dependencies always flow downward.

```text
Upstream

↓

Downstream
```

Never reverse dependencies.

Never introduce circular imports.

---

# 8. Configuration

Everything that may change belongs in configuration.

Examples:

* model ids
* prompt versions
* registry versions
* retry limits
* thresholds
* feature flags
* timeout values

Never hardcode configuration.

---

# 9. Validation First

Every public entry point validates inputs before execution.

Validation includes:

* schema
* ownership
* required fields
* enums
* versions

Fail fast.

Never continue with invalid inputs.

---

# 10. Strong Typing

Use explicit types.

Avoid:

* any
* unknown without narrowing
* loosely typed objects

Domain models should express the business clearly.

---

# 11. Error Handling

Errors are expected.

Every error must:

* be classified
* be logged
* contain context
* preserve stack trace
* be actionable

Never swallow exceptions.

Never log and continue silently.

---

# 12. Logging

Every significant operation must produce structured logs.

Logs must answer:

* What happened?
* When?
* Why?
* Which Builder?
* Which Company?
* Which Artifact?
* Which Version?

Logs are structured.

Never rely on console debugging.

---

# 13. Observability

Every Builder must expose:

* execution duration
* retry count
* failure count
* validation failures
* artifact creation count
* queue time
* LLM latency (if applicable)

If production cannot observe it,

it is not production-ready.

---

# 14. Metrics

Every important workflow produces metrics.

Examples:

* artifact generation time
* prompt execution time
* governance queue length
* retry rate
* validation failures
* parsing failures
* promotion rate
* rollback rate

Metrics are mandatory.

---

# 15. Testing

Every Builder requires:

* unit tests
* contract tests
* integration tests

LLM Builders additionally require:

* prompt regression tests
* output schema tests
* forbidden reasoning tests
* evaluation harness tests

Code without tests is incomplete.

---

# 16. Evaluation

LLM outputs must be evaluated.

Evaluation includes:

* schema correctness
* contract compliance
* evidence grounding
* ownership boundary compliance
* hallucination detection
* prompt regression

A successful execution is not sufficient.

Correctness must be measured.

---

# 17. Code Review Standards

Every change should answer:

* Is this the correct layer?
* Does this violate ownership?
* Is duplication introduced?
* Is observability included?
* Is validation complete?
* Are tests updated?
* Is documentation affected?

Approval requires architectural compliance, not just passing tests.

---

# 18. Documentation

Every public module requires documentation.

Documentation explains:

* purpose
* inputs
* outputs
* ownership
* assumptions
* failure modes

Code should never be the only documentation.

---

# 19. Versioning

Every change affecting artifacts must update:

* schema version (if required)
* contract version (if required)
* migration notes (if required)

Version changes must be explicit.

---

# 20. Security

Never trust external input.

Validate everything.

Sanitize where appropriate.

Never expose internal implementation details through public APIs.

Secrets never belong in source code.

---

# 21. Performance

Optimize after correctness.

Before optimizing:

* measure
* profile
* identify bottlenecks

Avoid premature optimization.

---

# 22. Reproducibility

The same inputs must produce the same outputs.

Deterministic Builders must always be reproducible.

LLM Builders must record:

* prompt version
* model version
* configuration

to maximize reproducibility.

---

# 23. Maintainability

Assume another engineer will maintain this code in five years.

Code should answer:

* Why does this exist?
* What problem does it solve?
* What assumptions does it make?

without requiring historical context.

---

# 24. Quality Gates

Implementation is complete only when:

✓ Layer Ownership respected

✓ Builder Contract followed

✓ Prompt Contract followed (LLM)

✓ Artifact Contract satisfied

✓ Validation implemented

✓ Observability implemented

✓ Metrics implemented

✓ Logging implemented

✓ Tests passing

✓ Documentation updated

✓ No shortcuts introduced

---

# 25. Engineering Checklist

Before merging any change:

□ Architecture respected

□ No hardcoding

□ No duplicated logic

□ Modular design maintained

□ Validation complete

□ Error handling complete

□ Structured logging added

□ Metrics added

□ Tests added

□ Documentation updated

□ Observability verified

□ Performance acceptable

□ Security reviewed

□ Contracts unchanged or versioned

□ Production ready

---

# 26. Definition of Done

A feature is considered complete only when:

* implementation is correct
* tests pass
* contracts are satisfied
* documentation is updated
* observability is implemented
* metrics are emitted
* failures are handled
* quality gates pass

A feature is **not** complete merely because it works.

---

# 27. Success Criteria

The engineering standards are successful when:

* no shortcuts enter the codebase
* architecture remains intact during implementation
* every Builder behaves consistently
* every artifact is reproducible
* production issues are diagnosable
* engineers can extend the platform without violating existing contracts

These standards define how engineering is performed across the platform.

Every implementation must conform to this document before being accepted into production.
