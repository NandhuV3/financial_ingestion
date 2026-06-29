# Builder Implementation Guide

Status: LOCKED

---

# 1. Purpose

This document defines the standard implementation pattern for every Builder in the platform.

Builders are responsible for transforming upstream Platform Objects into new Platform Objects while preserving:

* Layer Ownership
* Platform Object Model
* Builder Contract
* Prompt Contract (LLM Builders only)
* Artifact Contracts
* Lineage
* Versioning
* Auditability

Every Builder implementation must follow this guide.

Builders must never invent their own execution flow.

---

# 2. Builder Responsibilities

A Builder has one responsibility:

> Produce exactly one Platform Object owned by exactly one layer.

A Builder:

* reads upstream Platform Objects
* validates inputs
* performs deterministic or LLM processing
* validates outputs
* generates lineage
* persists a new Platform Object
* publishes the newest version

A Builder never performs work owned by another layer.

---

# 3. Standard Builder Pipeline

Every Builder follows the same execution lifecycle.

```text
Receive Request
        ↓
Resolve Inputs
        ↓
Validate Inputs
        ↓
Build Context
        ↓
Execute Logic
        ↓
Validate Output
        ↓
Generate Metadata
        ↓
Generate Lineage
        ↓
Persist Artifact
        ↓
Publish Current Version
        ↓
Complete
```

This sequence is mandatory.

---

# 4. Resolve Inputs

The Builder first resolves every required upstream object.

Examples:

Themes Builder

* Filing Artifact
* Evidence Identity
* Themes Quality

Structured Intelligence Builder

* Filing Artifact
* Themes

Quarter Understanding Builder

* Company Knowledge
* Business Signals
* Trust Signals (optional enrichment)

Builders must never request objects outside their Layer Ownership contract.

---

# 5. Validate Inputs

Before processing begins, every input must be validated.

Validation includes:

* schema validation
* version validation
* ownership validation
* required field validation
* lineage validation

If validation fails, execution stops.

No Platform Object is produced.

---

# 6. Build Execution Context

Builders assemble an execution context from validated inputs.

Execution Context contains:

* resolved inputs
* configuration
* schema version
* execution metadata

LLM Builders additionally include:

* Prompt Registry lookup
* Prompt Contract
* Model binding
* Prompt version

Execution Context is temporary runtime state.

It is never persisted.

---

# 7. Execute Logic

Execution depends on Builder type.

## Deterministic Builder

Examples:

* Topic Assignment
* Quarter Change
* Business Signals

Execution uses deterministic algorithms.

No LLM calls are permitted.

---

## LLM Builder

Examples:

* Themes
* Structured Intelligence
* Quarter Understanding
* Investor Intelligence

Execution must follow:

Prompt Registry

↓

Prompt Contract

↓

Model Binding

↓

LLM

↓

Structured Response

Builders must never embed prompts directly in source code.

All prompts come from the Prompt Registry.

---

# 8. Parse Output

LLM responses are parsed into strongly typed objects.

Parsing must validate:

* required fields
* schema
* enums
* identifiers
* references

Malformed outputs must never be persisted.

---

# 9. Validate Output

Before persistence every artifact must pass:

Schema validation

Contract validation

Ownership validation

Prompt Contract validation (LLM)

Artifact validation

Lineage validation

If validation fails:

the artifact is rejected.

---

# 10. Generate Metadata

Every artifact receives metadata.

Minimum metadata:

* artifact id
* artifact version
* schema version
* builder version
* creation timestamp

LLM Builders additionally record:

* prompt version
* prompt contract version
* model version

---

# 11. Generate Lineage

Every Builder produces lineage.

Minimum lineage:

* producing builder
* input artifact ids
* input versions
* execution timestamp

LLM Builders additionally include:

* prompt hash
* model identifier
* execution id

Lineage must be complete before persistence.

---

# 12. Persist Artifact

Persistence follows one sequence only.

```text
Validate
      ↓
Archive Previous Current
      ↓
Write New Version
      ↓
Update Current Pointer
      ↓
Verify Write
```

Builders must never overwrite an existing version.

New execution always creates a new version.

---

# 13. Publish

After successful persistence:

* newest version becomes Current
* downstream dependencies become available
* execution completes successfully

Publication occurs only after persistence succeeds.

---

# 14. Retry Policy

Builders retry only retryable failures.

Retryable:

* transient LLM failures
* network interruptions
* temporary service failures

Non-retryable:

* invalid inputs
* schema violations
* prompt contract violations
* parsing failures caused by invalid output structure

Retries follow the Builder Contract.

---

# 15. Failure Handling

Builders never leave partially written artifacts.

Failures produce:

* Builder Failure Record
* execution logs
* retry history
* failure classification

No Current pointer is updated after failure.

---

# 16. First-Period Handling

Builders must follow the First-Period Handling Contract.

Builders never invent first-period behavior.

When prior-period artifacts are unavailable:

* follow the shared contract
* emit standardized first-period metadata
* never fabricate historical comparisons

---

# 17. Layer Ownership Enforcement

Builders enforce Layer Ownership.

A Builder may consume only approved upstream artifacts.

A Builder may never:

* consume downstream artifacts
* bypass governance
* bypass the Prompt Registry
* bypass validation
* bypass lineage generation

---

# 18. Builder Types

The platform contains two Builder categories.

## Deterministic Builders

Characteristics:

* algorithmic
* reproducible
* no prompts
* no models

Examples:

* Topic Assignment
* Quarter Change
* Business Signals
* Trust Signals

---

## LLM Builders

Characteristics:

* Prompt Registry driven
* Prompt Contract enforced
* model bound
* structured outputs only

Examples:

* Themes
* Structured Intelligence
* Quarter Understanding
* Investor Intelligence

---

# 19. Builder Checklist

Before a Builder is considered complete, verify:

✓ Layer Ownership respected

✓ Inputs validated

✓ Prompt Registry used (LLM only)

✓ Prompt Contract enforced (LLM only)

✓ Output schema validated

✓ Artifact Contract satisfied

✓ Metadata generated

✓ Lineage generated

✓ New version persisted

✓ Current pointer updated

✓ Failure handling implemented

✓ Retry policy implemented

✓ First-Period Handling Contract followed

✓ Audit logs produced

---

# 20. Builder Lifecycle

Every Builder follows the same lifecycle.

```text
Resolve Inputs
        ↓
Validate
        ↓
Build Context
        ↓
Execute
        ↓
Parse
        ↓
Validate
        ↓
Generate Metadata
        ↓
Generate Lineage
        ↓
Persist
        ↓
Publish
        ↓
Complete
```

This lifecycle is mandatory for every Builder in the platform.

No Builder may implement an alternative execution flow.

---

# 21. Success Criteria

A Builder implementation is production-ready when:

* it produces exactly one Platform Object
* it follows Layer Ownership
* it follows the Builder Contract
* it follows the Platform Object Model
* it follows the Artifact Contract
* it follows the Prompt Contract (LLM Builders)
* it follows the First-Period Handling Contract
* it produces complete lineage
* it is reproducible
* it is fully auditable

Every Builder in the platform must conform to this guide before being approved for production.
