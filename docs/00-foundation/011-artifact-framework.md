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
* Commitment Tracking
* Narrative Consistency
* Accounting Stability
* Capital Allocation Tracking
* Trust Signals
* Quarter Understanding
* Investor Intelligence

The Artifact Framework ensures that every artifact follows the same standards for:

* Identity
* Versioning
* Lineage
* Auditability
* Replayability
* Storage
* Invalidation support
* Rollback mechanics

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
* Mandatory Artifact Framework lineage
* Replayability references required by its domain contract

LLM-assisted artifacts require:

* Prompt lineage
* Prompt version
* Model provider
* Model version
* Prompt snapshot reference

Deterministic artifacts require replayability references appropriate to their
domain contract, for example:

* Builder version
* Calibration version
* Rule version
* Pipeline version

The Artifact Framework does not require prompt or model references for
deterministic artifacts.

The platform must be capable of reconstructing how an artifact was produced.

---

## Principle 4 — Artifacts Are Auditable

Every artifact must answer:

* What produced me?
* When was I produced?
* Which inputs were used?
* Which domain replayability references apply?

LLM-assisted artifacts must answer which governed prompt and model generated
them.

Deterministic artifacts must answer which builder, calibration, rule, or
pipeline versions generated them, as required by their domain contract.

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

The platform uses defined artifact lifecycle states.

Lifecycle state ownership is separated by platform responsibility.

---

## Current

Latest valid artifact.

Served to downstream consumers.

Owned by the Artifact Framework through current pointer mechanics.

---

## Stale

Artifact inputs changed.

Artifact remains available but is no longer considered current.

Awaiting regeneration.

Stale dependency state is owned by the Dependency Index.

Staleness propagation is owned by the Invalidation Engine.

---

## Pending Review

Artifact requires human review before promotion.

Typical examples:

* Company Knowledge promotion review
* Governance review
* Trust review

Pending Review, approval states, and review workflow states are owned by
Governance.

The Artifact Framework does not own governance workflow states.

---

## Archived

Historical artifact version.

Retained permanently.

Used for:

* Audit
* Historical comparison
* Rollback
* Replayability

Archive/history persistence is owned by the Artifact Framework.

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

The Artifact Framework owns Current and Archived mechanics.

Dependency Index state and Governance workflow state remain owned by their
respective systems even when referenced by artifact metadata.

---

## Pipeline Metadata

```text
pipeline_version
```

Pipeline version is a domain replayability reference when required by the
artifact's domain contract.

---

## Hash Metadata

```text
framework_hashes
content_replayability_hashes
```

The Artifact Framework owns framework hashes.

Artifact-producing domains may own content-level input references, output
hashes, and replayability hashes required by their domain contracts.

Content-level replayability hashes are not Artifact Framework lineage or
framework hashes.

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

The Artifact Framework owns lineage mechanics and records the dependency
references used during generation.

Artifact-producing domains own replayability references, including:

LLM-assisted artifacts:

```text
prompt lineage
model lineage
```

Deterministic artifacts:

```text
builder version
calibration version
rule version
pipeline version
```

These domain replayability references are not Artifact Framework lineage.

The Artifact Framework does not:

* Register dependencies
* Own dependency graph state
* Determine staleness

The Dependency Index owns dependency graph state and dependency registration.

The Invalidation Engine owns staleness determination and propagation.

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

# Replayability Reference Requirements

LLM-assisted artifacts must contain prompt and model replayability references.

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

Deterministic artifacts do not require prompt lineage or model lineage.

They must contain the builder, calibration, rule, pipeline, or equivalent
replayability references required by their domain contract.

---

# Content Replayability Hash Requirements

Artifact-producing domains may store content-level input references and
replayability hashes as required by their domain contracts.

Purpose:

Reproduce and validate domain content generation.

Content replayability hashes may be derived from:

```text
Upstream dependency versions
```

not raw content.

Reason:

Version-based hashing is efficient and scalable.

---

# Framework Hash Requirements

The Artifact Framework stores framework hashes required to validate artifact
integrity and framework-managed persistence.

Purpose:

Validate framework-managed artifact state.

Content-level output hashes remain owned by the artifact-producing domain when
required by its domain contract.

Content-level output hashes support:

* Partial invalidation
* Content stability checks
* Regeneration optimization

---

# Storage Requirements

The platform uses a filesystem-first architecture.

The Artifact Framework owns:

* Storage mechanics
* Current pointer resolution
* Archive/history persistence
* Retrieval mechanics

Artifact-producing domains do not own:

* `current.json`
* Archive layouts
* Storage trees
* Persistence structures

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
Applicable Replayability References
Inputs Used
Output Version
```

Audit records are append-only.

Audit records are separate from artifacts.

The Artifact Framework supports auditability by exposing artifact identity,
version, lineage, persistence, and pointer transitions.

Operational Systems own audit storage, audit records, and audit workflow.

The Artifact Framework does not own audit storage, audit records, or audit
workflow.

---

# Rollback Requirements

Rollback is a first-class operation.

Rollback ownership:

1. Governance approves rollback.
2. Artifact Framework creates a new immutable version.
3. Artifact Framework updates the current pointer.
4. Operational Systems record rollback execution and audit events.
5. Invalidation Engine determines and propagates downstream staleness.

The Artifact Framework does not approve rollback, create audit records, or
make invalidation decisions.

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
Commitment Tracking
Narrative Consistency
Accounting Stability
Capital Allocation Tracking
Trust Signals
Quarter Understanding
Investor Intelligence
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
* Governance workflow states
* Dependency graph state
* Staleness propagation
* Audit storage and workflow

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

Artifact Framework Lifecycle Ownership:
Current
Archived

Dependency Index Lifecycle Ownership:
Stale dependency state

Governance Lifecycle Ownership:
Pending Review
Approval states
Review workflow states

Artifact Lineage:
Mandatory

Replayability References:
Domain Contract Specific

LLM Prompt And Model References:
Mandatory For LLM-Assisted Artifacts

Rollback:
First-Class Operation

History:
Never Deleted
