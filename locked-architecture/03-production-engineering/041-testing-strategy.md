# Testing Strategy

Status: LOCKED

---

# 1. Purpose

This document defines the testing strategy for the platform.

The goal of testing is **not simply to find bugs**.

The goal is to ensure that every implementation continues to satisfy the locked architecture.

Testing verifies:

* Architectural correctness
* Ownership boundaries
* Artifact validity
* Prompt behavior
* Builder behavior
* Governance correctness
* Long-term regression stability

Every layer is independently testable.

Every artifact is independently verifiable.

---

# 2. Testing Philosophy

The platform is tested from the bottom upward.

```
Schema

↓

Validation

↓

Builder

↓

Artifact

↓

Layer

↓

Pipeline

↓

End-to-End
```

A downstream layer is never considered correct if its upstream dependencies are incorrect.

---

# 3. Testing Pyramid

```
                 End-to-End Tests
                      ▲
              Integration Tests
                      ▲
             Builder Regression Tests
                      ▲
            Prompt Regression Tests
                      ▲
               Artifact Tests
                      ▲
                Validation Tests
                      ▲
                 Unit Tests
```

Every level of the pyramid is required.

---

# 4. Testing Categories

## Unit Tests

Purpose

Verify individual deterministic functions.

Examples

* Topic matching
* Delta calculation
* Confidence calculation
* Validation helpers

Must never require LLM execution.

---

## Schema Tests

Purpose

Verify every artifact matches its schema.

Examples

* Required fields
* Optional fields
* Version fields
* Lineage
* Metadata
* Evidence references

Every artifact produced by every Builder must pass schema validation.

---

## Builder Tests

Purpose

Verify Builders satisfy the Builder Contract.

Checks include

* Input validation
* Output validation
* Retry behavior
* Failure handling
* Lineage generation
* Version assignment

---

## Prompt Tests

Purpose

Verify Prompt rendering.

Checks include

* Required sections present
* Variables rendered correctly
* Stable formatting
* Prompt version recorded

Prompt rendering tests do **not** evaluate model quality.

---

## Prompt Regression Tests

Purpose

Prevent prompt drift.

Every prompt change must be evaluated against a golden dataset.

Checks include

* Ownership boundaries
* Forbidden reasoning
* Output consistency
* Output completeness
* Evidence usage
* Prompt contract compliance

Prompt changes must never silently change platform behavior.

---

## Artifact Tests

Purpose

Validate produced artifacts.

Checks include

* Schema
* Metadata
* Evidence lineage
* Versioning
* Confidence fields
* Enrichment status
* Depth indicators

---

## Integration Tests

Purpose

Verify adjacent layers work together.

Examples

Themes

↓

Topic Assignment

↓

Topic Evolution

or

Structured Intelligence

↓

Company Knowledge Candidate

↓

Governance Promotion

No integration test should skip architectural layers.

---

## End-to-End Tests

Purpose

Verify the complete pipeline.

Execution

```
SEC Filing

↓

Investor Intelligence
```

Validation includes

* Every artifact produced
* Every dependency satisfied
* Every lineage recorded
* Every ownership boundary respected

---

# 5. Golden Dataset

Every LLM layer must maintain a Golden Dataset.

Purpose

Prevent prompt regressions.

A Golden Dataset contains

* representative filings
* expected outputs
* expected ownership boundaries
* expected evidence references

Golden Datasets are versioned.

Prompt updates must execute against the same dataset before activation.

---

# 6. Layer-Specific Testing

## Themes

Validate

* filing-scoped narratives
* evidence selection
* no structured business fields
* no investor reasoning

---

## Structured Intelligence

Validate

* structured business fields
* filing-scoped understanding
* no durable claims
* no trust reasoning
* no ownership reasoning

---

## Quarter Understanding

Validate

* business interpretation
* signal synthesis
* no ownership answers
* no investment recommendations

---

## Investor Intelligence

Validate

* Q1–Q5 correctness
* evidence traceability
* confidence generation
* ownership reasoning
* no raw filing extraction

---

# 7. Deterministic Layer Testing

Deterministic layers are verified through

* rule correctness
* repeatability
* edge cases
* boundary conditions

Running the same inputs twice must produce identical outputs.

---

# 8. Governance Testing

Governance testing verifies

* promotion rules
* rejection handling
* rollback
* audit logging
* version history
* immutable lineage

Governance decisions must always be reproducible.

---

# 9. First-Period Testing

Every layer with prior-period dependencies must include first-period tests.

Examples

* Quarter Change
* Topic Evolution
* Trust Pillars
* Investor Intelligence

The First-Period Handling Contract is the source of truth.

---

# 10. Regression Policy

Regression testing is mandatory for

* Prompt updates
* Builder changes
* Schema changes
* Registry updates
* Governance rule updates

No change may be merged without regression testing.

---

# 11. Quality Gates

Every Pull Request must pass

✓ Unit Tests

✓ Schema Tests

✓ Builder Tests

✓ Integration Tests

✓ Regression Tests

✓ Lint

✓ Typecheck

A failed gate blocks merging.

---

# 12. Success Criteria

A release is considered production-ready only if

* Every specification has corresponding tests.
* Every Builder passes its contract tests.
* Every Prompt passes regression testing.
* Every artifact validates successfully.
* Every ownership boundary remains intact.
* Every end-to-end pipeline completes successfully.
* All results remain reproducible.

Testing protects the architecture.

The objective is not merely correct code—it is preserving architectural integrity over the lifetime of the platform.
