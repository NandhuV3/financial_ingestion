# 011-Artifact Framework Architecture

Status: LOCKED
Owner: Architecture Team
Layer: Platform Foundation

---

# Purpose

The Artifact Framework defines the universal contract for every artifact produced by the Investment Intelligence Platform.

Every layer in the system produces artifacts.

Examples:

* Themes
* Topic Assignment
* Topic Evolution
* Quarter Change
* Structured Intelligence
* Company Knowledge
* Business Signals
* Quarter Understanding
* Investor Intelligence
* Commitment Tracking
* Narrative Consistency
* Accounting Stability

The Artifact Framework ensures that every artifact follows the same standards for:

* Identity
* Versioning
* Lineage
* Auditability
* Replayability
* Storage
* Invalidation
* Rollback

This framework is the foundation upon which all higher-level intelligence layers operate.

---

# Architectural Principles

## Principle 1 — Artifacts Are Immutable

Artifacts are never modified after creation.

A change produces a new artifact version.

Previous versions remain permanently available.

Allowed:

```text
CompanyKnowledge v5
→ CompanyKnowledge v6
```

Not Allowed:

```text
Edit CompanyKnowledge v5
```

---

## Principle 2 — Artifacts Are Versioned

Every artifact has a monotonically increasing integer version.

Example:

```text
v1
v2
v3
v4
```

Artifact versions are historical records.

Artifact versions are not software versions.

---

## Principle 3 — Artifacts Are Replayable

Any artifact must be reproducible from:

* Inputs
* Prompt lineage
* Model lineage
* Pipeline version

The platform must be capable of reconstructing how an artifact was produced.

---

## Principle 4 — Artifacts Are Auditable

Every artifact must answer:

* What produced me?
* When was I produced?
* Which inputs were used?
* Which prompt generated me?
* Which model generated me?
* Which pipeline version generated me?

---

## Principle 5 — Artifacts Are Lineage Aware

Every artifact must explicitly declare its dependencies.

Example:

```text
Quarter Understanding

depends on:
  Business Signals
  Company Knowledge
```

Dependencies are never implicit.

---

## Principle 6 — Artifacts Never Overwrite History

Current state and historical state are separate concerns.

Every historical version remains available.

The platform never deletes artifact history.

---

# Artifact Identity Model

Every artifact has three identities.

---

## 1. Artifact ID

Permanent identity.

Properties:

```text
Globally unique
Immutable
Never reused
```

Purpose:

Internal platform identity.

---

## 2. Business Identity

Represents what the artifact describes.

Example:

```text
Company:
MSFT

Period:
2025-Q1

Artifact Type:
Quarter Understanding
```

Business identity allows humans to reason about artifacts.

---

## 3. Storage Identity

Represents where the artifact is physically stored.

Example:

```text
warehouse/
  companies/
    MSFT/
      quarter-understanding/
```

Storage identity may change.

Artifact identity never changes.

---

# Artifact Lifecycle

Artifacts move through defined lifecycle states.

---

## Current

Latest valid artifact.

Served to downstream consumers.

---

## Stale

Artifact inputs changed.

Artifact remains available but is no longer considered current.

Awaiting regeneration.

---

## Pending Review

Artifact requires human review before promotion.

Typical examples:

* Company Knowledge promotion review
* Governance review
* Trust review

---

## Archived

Historical artifact version.

Retained permanently.

Used for:

* Audit
* Historical comparison
* Rollback
* Replayability

---

# Artifact Metadata Requirements

Every artifact must contain metadata.

Required categories:

---

## Identity Metadata

```text
artifact_id
artifact_type
version
```

---

## Lifecycle Metadata

```text
status
created_at
updated_at
```

---

## Pipeline Metadata

```text
pipeline_version
```

---

## Hash Metadata

```text
input_hash
output_hash
```

Used for:

* Invalidation
* Staleness detection
* Partial regeneration

---

# Artifact Lineage Requirements

Every artifact must declare lineage.

Lineage is mandatory.

Artifacts without lineage are invalid.

---

## Upstream Artifact References

Each artifact records:

```text
artifact_type
artifact_version
artifact_identity
```

for every dependency used during generation.

---

## Example

Quarter Understanding:

```text
Business Signals v12
Company Knowledge v8
```

Investor Intelligence:

```text
Quarter Understanding v4
Company Knowledge v8
Business Signals v12
```

---

# Prompt Lineage Requirements

LLM-generated artifacts must contain prompt lineage.

Required information:

```text
prompt_id
prompt_version
model_provider
model_version
prompt_snapshot_reference
```

Prompt lineage enables:

* Prompt rollback
* Prompt comparison
* Prompt evaluation
* Targeted regeneration

---

# Input Hash Requirements

Every artifact stores an input hash.

Purpose:

Determine whether upstream state changed.

Input hash is derived from:

```text
Upstream dependency versions
```

not raw content.

Reason:

Version-based hashing is efficient and scalable.

---

# Output Hash Requirements

Every artifact stores an output hash.

Purpose:

Detect whether regenerated output differs from prior output.

Supports:

* Partial invalidation
* Content stability checks
* Regeneration optimization

---

# Storage Requirements

The platform uses a filesystem-first architecture.

---

## Current Artifact

Stable pointer to latest version.

Example:

```text
current.json
```

---

## Archive

Historical versions.

Example:

```text
archive/
  1.json
  2.json
  3.json
```

---

## Retrieval Requirements

The platform must support:

```text
Get Current
Get Specific Version
Get Historical Timeline
```

---

# Audit Requirements

Every artifact generation event must be auditable.

Required audit information:

```text
Artifact Produced
Timestamp
Pipeline Version
Prompt Version
Model Version
Inputs Used
Output Version
```

Audit records are append-only.

Audit records are separate from artifacts.

---

# Rollback Requirements

Rollback is a first-class operation.

Rollback:

1. Restores a prior artifact version.
2. Creates a new current version.
3. Writes an audit record.
4. Triggers downstream invalidation.

Rollback never deletes history.

Rollback never mutates archived artifacts.

---

# Compatibility Requirements

All future artifact types must inherit this framework.

Examples:

```text
Themes
Topic Assignment
Structured Intelligence
Company Knowledge
Business Signals
Quarter Understanding
Investor Intelligence
Trust Artifacts
Future Artifacts
```

No artifact may bypass the framework.

---

# Non-Goals

The Artifact Framework does not define:

* Business logic
* LLM prompts
* UI rendering
* Presentation formatting
* Evaluation logic
* Scheduling logic

Those responsibilities belong to other platform components.

---

# Locked Decisions

Artifact Storage:
Filesystem First

Artifact Versioning:
Incremental Integer Version

Artifact Identity:
Hybrid Identity
(Artifact ID + Business Identity + Storage Identity)

Artifact Lifecycle:
Current
Stale
Pending Review
Archived

Artifact Lineage:
Mandatory

Prompt Lineage:
Mandatory

Rollback:
First-Class Operation

History:
Never Deleted
