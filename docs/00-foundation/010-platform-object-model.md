# 010-platform-object-model.md

Version: 1.0
Status: LOCKED
Owner: Foundation Architecture

---

# Purpose

This document defines the canonical platform object model.

It is the source of truth for classifying platform objects as:

1. Intelligence Artifacts
2. Governance Artifacts
3. Operational Records

Other contracts must reference this taxonomy rather than redefining it.

LOCKED.

---

# Object Classes

## Intelligence Artifacts

Intelligence Artifacts are durable intelligence outputs consumed by downstream intelligence or presentation layers.

Examples:

- Company Knowledge
- Business Signals
- Quarter Understanding
- Investor Intelligence

Intelligence Artifacts represent platform knowledge, observations, interpretations, or investor-facing intelligence.

LOCKED.

---

## Governance Artifacts

Governance Artifacts are durable governance outputs used to control, approve, reject, review, or roll back changes to intelligence.

Examples:

- Company Knowledge Candidate
- Governance Decision
- Review Queue Entry
- Promotion Decision
- Human Review Decision
- Rollback Approval

Governance Artifacts are replayable and auditable.

Governance Artifacts may be persisted through the Artifact Framework when they require identity, versioning, lineage, and current/historical resolution.

Governance Artifacts do not become downstream intelligence unless a domain contract explicitly says so.

Governance Artifacts become intelligence dependencies only when an explicit
domain contract defines that behavior.

There is no implicit Governance Artifact participation in intelligence
dependencies.

LOCKED.

---

## Operational Records

Operational Records are durable control-plane, audit, observability, or execution records.

Examples:

- Audit Entry
- Rollback Execution Record
- Evaluation Result
- Metrics
- Logs

Operational Records support replayability, auditability, observability, and recovery.

Operational Records are not intelligence artifacts.

Operational Records are not downstream intelligence dependencies.

Operational Records may reference Intelligence Artifacts and Governance
Artifacts.

Operational Records never become intelligence inputs unless a platform
contract explicitly models them as such.

Operational Records may be stored in audit stores, event stores, metrics stores, log stores, or artifact-adjacent storage as specified by their owning platform contract.

LOCKED.

---

# Replayability Rules

All three object classes must support replay-safe operation.

## Intelligence Artifacts

Artifact Framework-owned mechanics for Intelligence Artifacts are:

- artifact identity
- artifact metadata
- framework lineage
- artifact versioning
- persistence
- current pointers
- archive/history
- framework hashes

Intelligence Artifacts may own content-level replayability metadata:

- prompt lineage
- prompt versions
- model versions
- input references
- output hashes
- replayability hashes
- evaluation metadata

LLM-assisted Intelligence Artifacts may own prompt lineage, prompt versions,
and model versions.

Deterministic Intelligence Artifacts may own builder version, calibration
version, and rule version.

These are replayability references. Content-level replayability metadata is
not Artifact Framework lineage.

## Governance Artifacts

Governance Artifacts must record:

- decision inputs
- decision outputs
- governing rule versions
- candidate references when applicable
- prior artifact references when applicable
- reviewer or automation context
- lineage sufficient to replay the decision

## Operational Records

Operational Records must record:

- event identity
- timestamp
- actor or system source
- related artifact references
- action performed
- before/after references when applicable
- reason or failure context

LOCKED.

---

# Dependency Index Participation Rules

## Intelligence Artifacts

Intelligence Artifacts participate in the Dependency Index when they are consumed by downstream artifacts.

## Governance Artifacts

Governance Artifacts participate in the Dependency Index only when a contract explicitly requires dependency traversal for that object.

Company Knowledge Candidate artifacts are not dependency-index registered.

Approved Company Knowledge is dependency-index registered.

## Operational Records

Operational Records do not participate in the Dependency Index unless a platform contract explicitly models them as dependency graph inputs.

LOCKED.

---

# Downstream Visibility Rules

## Intelligence Artifacts

Intelligence Artifacts may be visible to downstream builders and presentation layers according to domain dependency contracts.

## Governance Artifacts

Governance Artifacts are visible to governance workflows and audit/replay tooling.

Governance Artifacts are not visible to downstream intelligence builders unless a domain contract explicitly says so.

No implicit intelligence dependency or downstream visibility is created by
classifying an object as a Governance Artifact.

## Operational Records

Operational Records are visible to observability, audit, recovery, and control-plane tooling.

Operational Records are not downstream intelligence inputs.

References from Operational Records to Intelligence Artifacts or Governance
Artifacts do not make those records intelligence inputs.

LOCKED.

---

# Storage Ownership Summary

## Artifact Framework

The Artifact Framework owns artifact mechanics for objects persisted as artifacts:

- artifact identity
- artifact metadata
- framework lineage
- artifact versioning
- archive/history
- current pointers
- framework hashes
- immutable persistence

Content-level input references, output hashes, replayability hashes, prompt
lineage, prompt/model versions, deterministic builder/calibration/rule
versions, and evaluation metadata belong to the producing Intelligence
Artifact when required by its domain contract.

Content-level replayability metadata is not Artifact Framework lineage.

## Governance Systems

Governance systems own governance meaning:

- decisions
- approvals
- review escalation
- rollback approval
- governance rule versions
- governance audit requirements

## Operational Systems

Operational systems own operational records:

- audit stores
- event stores
- metrics stores
- log stores
- recovery records
- invalidation records

LOCKED.

---

# Builder / Governance / Artifact Framework Boundary

## Builders

Intelligence builders produce `BuilderResult` content.

Governance candidate builders produce candidates as `BuilderResult` content.

Builders may:

- consume approved input artifacts
- generate Intelligence Artifact content or governance candidate content
- validate builder outputs
- emit evaluation hooks

Builders may not:

- approve
- promote
- merge
- reject
- make governance decisions
- update approved intelligence
- write current pointers
- bypass Artifact Framework
- trigger downstream invalidation

## Governance

Governance decides.

Governance may:

- evaluate candidates
- approve, merge, retain, reject, or flag review
- create governance artifacts
- create audit requirements
- approve rollback
- authorize approved intelligence changes

Governance may not:

- generate candidate intelligence
- bypass Artifact Framework persistence
- bypass audit requirements
- bypass invalidation semantics

## Artifact Framework

Artifact Framework persists and versions.

Artifact Framework owns:

- artifact identity
- artifact versioning
- artifact metadata
- artifact lineage mechanics
- archive immutability
- current pointer updates

Artifact Framework does not own:

- business decisions
- governance decisions
- intelligence generation
- invalidation propagation decisions

LOCKED.

---

# Invariants

1. Intelligence moves between layers through artifacts.
2. Governance controls changes to governed intelligence.
3. Operational records support audit, recovery, observability, and replay.
4. Governance artifacts are not automatically downstream intelligence dependencies.
5. Operational records are not intelligence artifacts.
6. Artifact persistence mechanics and governance meaning must remain separate.

LOCKED.
