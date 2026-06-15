# 014-dependency-index-spec.md

# Dependency Index Specification

Version: 1.0
Status: LOCKED
Owner: Architecture

---

# Purpose

The Dependency Index is the operational brain of the platform.

Its purpose is to provide:

1. Dependency tracking
2. Staleness detection
3. Invalidation propagation
4. Regeneration scheduling
5. Impact analysis
6. Rollback support
7. Incremental processing

Without the Dependency Index, the platform becomes
a batch processor that reprocesses everything.

With the Dependency Index, the platform becomes
an incremental intelligence system.

---

# Architectural Principle

Dependencies are explicit.

Dependencies are machine-readable.

Dependencies are never inferred.

The Dependency Index is the source of truth for:

- staleness
- regeneration
- dependency traversal

Artifacts are not traversed directly.

---

# Core Responsibilities

The Dependency Index owns:

- dependency graph storage
- upstream tracking
- downstream tracking
- version tracking
- content hash tracking
- candidate stale tracking
- stale tracking
- regeneration readiness

The Dependency Index does NOT own:

- artifact generation
- prompt execution
- governance decisions

---

# Architectural Position

```text
Artifacts
     ↓
Dependency Index
     ↓
Invalidation Engine
     ↓
Scheduler
     ↓
Regeneration Jobs
```

The Dependency Index sits between artifacts
and the invalidation engine.

---

# Design Principles

## Principle 1

Dependency lookup must be O(1).

No archive traversal.

No graph reconstruction.

No artifact scanning.

---

## Principle 2

All dependencies are registered at write time.

Never derived at query time.

---

## Principle 3

Downstream impact must be queryable instantly.

---

## Principle 4

Version changes create candidate invalidation.

Content changes determine propagation.

(Hybrid invalidation architecture)

---

# Dependency Entry

Every artifact written to the platform
must create or update exactly one
Dependency Index entry.

```typescript
type DependencyIndexEntry = {
  artifact_path: string;

  artifact_type: ArtifactType;

  company: string | null;

  period: string | null;

  current_version: number;

  status: DependencyStatus;

  input_version_hash: string;

  output_content_hash: string;

  upstream_dependencies: DependencyReference[];

  downstream_dependents: DependencyDependent[];

  invalidation_metadata: InvalidationMetadata;

  timestamps: DependencyTimestamps;
};
```

---

# Dependency Status

```typescript
type DependencyStatus =
  | "current"
  | "candidate_stale"
  | "stale"
  | "pending_regeneration"
  | "pending_review";
```

---

# Status Definitions

Current

```text
Artifact matches current dependency state.
```

Candidate Stale

```text
Upstream version changed.

Needs content comparison.
```

Stale

```text
Content propagation required.

Regeneration needed.
```

Pending Regeneration

```text
Queued for regeneration.
```

Pending Review

```text
Human review blocking progression.
```

---

# Dependency Reference

Tracks upstream dependencies.

```typescript
type DependencyReference = {
  artifact_path: string;

  artifact_type: ArtifactType;

  version_at_generation: number;

  output_hash_at_generation: string;

  prompt_version?: string;
};
```

---

# Dependency Dependent

Tracks downstream artifacts.

```typescript
type DependencyDependent = {
  artifact_path: string;

  artifact_type: ArtifactType;
};
```

---

# Invalidation Metadata

```typescript
type InvalidationMetadata = {
  stale_reason: InvalidationReason | null;

  stale_detected_at: string | null;

  propagation_stopped: boolean;

  propagation_stop_reason:
    | "content_hash_match"
    | null;

  last_evaluated_at: string;
};
```

---

# Invalidation Reasons

```typescript
type InvalidationReason =
  | "new_filing"
  | "amended_filing"
  | "prompt_activation"
  | "prompt_rollback"
  | "company_knowledge_rollback"
  | "concept_registry_update"
  | "topic_registry_update"
  | "market_data_refresh"
  | "manual_correction"
  | "evaluation_failure";
```

---

# Timestamp Structure

```typescript
type DependencyTimestamps = {
  created_at: string;

  updated_at: string;

  last_evaluated_at: string;
};
```

---

# Dependency Graph

The graph is explicit.

Example:

```text
Themes
   ↓
Topic Assignment
   ↓
Topic Evolution
   ↓
Business Signals
   ↓
Quarter Understanding
   ↓
Investor Intelligence
   ↓
Partner Domain
```

Stored directly in the index.

Never reconstructed.

---

# Complete Dependency Graph

```text
Themes
  ↓
Topic Assignment
  ↓
Topic Evolution

Topic Assignment
  ↓
Quarter Change

Themes
  ↓
Structured Intelligence

Structured Intelligence
  ↓
Company Knowledge

Company Knowledge
  ↓
Business Signals

Quarter Change
  ↓
Business Signals

Topic Evolution
  ↓
Business Signals

Business Signals
  ↓
Quarter Understanding

Company Knowledge
  ↓
Quarter Understanding

Quarter Understanding
  ↓
Investor Intelligence

Company Knowledge
  ↓
Investor Intelligence

Business Signals
  ↓
Investor Intelligence

Topic Evolution
  ↓
Investor Intelligence

Investor Intelligence
  ↓
Partner Domain

Company Knowledge
  ↓
Partner Domain
```

---

# Input Version Hash

Purpose:

Detect candidate invalidation.

Generated from:

```typescript
SHA256(
  upstream_versions +
  prompt_versions
)
```

Example:

```typescript
SHA256(
  CK_v12 +
  BS_v14 +
  QU_v7
)
```

---

# Output Content Hash

Purpose:

Determine propagation.

Generated from:

```typescript
SHA256(artifact_content)
```

Stored directly in index.

Never recomputed during traversal.

---

# Hybrid Invalidation Architecture

LOCKED DECISION

Use:

```text
Version Hash
    ↓
Candidate Detection

Content Hash
    ↓
Propagation Decision
```

---

# Hybrid Flow

Step 1

Artifact regenerated.

```text
Structured Intelligence v13
```

---

Step 2

All downstream entries become:

```text
candidate_stale
```

---

Step 3

Compare:

```text
new_output_hash

vs

hash recorded in dependent lineage
```

---

Step 4

If identical:

```text
Propagation stopped
```

Artifact returns to:

```text
current
```

---

Step 5

If different:

```text
stale
```

Queued for regeneration.

---

# Why Hybrid Was Chosen

Benefits:

- preserves auditability
- preserves replayability
- reduces LLM cost
- reduces cascade amplification

Target savings:

```text
50%–80%
```

on large prompt activations.

---

# Determinism Requirement

Hybrid invalidation requires:

```typescript
temperature = 0
```

and

```typescript
model version pinned
```

Without deterministic generation:

```text
content hashes become unreliable
```

This is a non-negotiable invariant.

---

# Propagation Events

Every propagation decision is logged.

---

# Propagation Continued

```typescript
type PropagationContinuedEvent = {
  event_id: string;

  upstream_artifact: string;

  downstream_artifact: string;

  reason: "content_hash_changed";

  timestamp: string;
};
```

---

# Propagation Stopped

```typescript
type PropagationStoppedEvent = {
  event_id: string;

  upstream_artifact: string;

  downstream_artifact: string;

  reason: "content_hash_match";

  timestamp: string;
};
```

---

# Prompt Version Annotation

Special case:

Prompt version changes
without content change.

Propagation stops.

But annotation recorded.

```typescript
type LineageAnnotation = {
  upstream_prompt_version_changed: boolean;

  previous_prompt_version: string;

  current_prompt_version: string;

  content_hash_match: boolean;
};
```

Purpose:

Preserve auditability.

Avoid unnecessary regeneration.

---

# Write-Time Responsibilities

When an artifact is written:

1. Create or update index entry
2. Update current version
3. Update output hash
4. Update dependency references
5. Update dependent references
6. Trigger invalidation evaluation

All performed atomically.

---

# Read-Time Responsibilities

Dependency Index must support:

```typescript
getUpstreamDependencies()

getDownstreamDependents()

getArtifactStatus()

getStaleArtifacts()

getCandidateStaleArtifacts()

getImpactAnalysis()
```

All O(1) lookups.

---

# Impact Analysis

Critical capability.

Question:

```text
If this artifact changes,
what else changes?
```

Example:

```text
Company Knowledge v18
```

Impact Analysis:

```text
Business Signals
Quarter Understanding
Investor Intelligence
Partner Domain
```

Returned instantly.

---

# Rollback Support

Rollback treated as new write.

Example:

```text
v12 → rollback to v9
```

Produces:

```text
v13
```

Dependency Index sees:

```text
new version
```

Normal invalidation proceeds.

No rollback special cases.

---

# Scheduler Integration

Scheduler reads only:

```text
Dependency Index
```

Not artifacts.

Scheduler query:

```typescript
SELECT
  status = stale
ORDER BY
  dependency_depth,
  company_priority
```

---

# Dependency Depth

Used for regeneration ordering.

```text
Depth 0
  Themes
  Structured Intelligence

Depth 1
  Topic Assignment
  Company Knowledge

Depth 2
  Topic Evolution
  Quarter Change

Depth 3
  Business Signals

Depth 4
  Quarter Understanding

Depth 5
  Investor Intelligence

Depth 6
  Partner Domain
```

---

# Company Priority

Ordering:

1. Portfolio companies
2. Recently viewed companies
3. Companies with deep history
4. Remaining companies

Priority engine configurable.

Not hardcoded.

---

# Storage Model

Recommended:

```text
dependency_index
```

Database table.

Not JSON files.

Reason:

```text
10,000+ companies
millions of entries
```

Requires indexed lookups.

---

# Required Database Indexes

```text
artifact_path

artifact_type

company

period

status

current_version

stale_detected_at
```

Mandatory.

---

# Monitoring Requirements

Track:

- stale count
- candidate stale count
- propagation stopped count
- propagation continued count
- regeneration queue depth
- average dependency depth

---

# Operational Metrics

```typescript
type DependencyMetrics = {
  total_entries: number;

  stale_entries: number;

  candidate_stale_entries: number;

  propagation_stopped_count: number;

  propagation_continued_count: number;

  average_regeneration_depth: number;
};
```

---

# Auditability Requirements

Platform must answer:

1. Why is this artifact stale?
2. Which dependency caused it?
3. Why was propagation stopped?
4. Which artifacts depend on this?
5. Which version was used?
6. Which content hash was compared?

Failure to answer any of these
is an operational defect.

---

# Future Compatibility

Must support:

- Concept Graph
- Additional artifact types
- Multi-language pipelines
- New intelligence layers
- Real-time processing

without redesign.

---

# Architectural Invariants

The following are LOCKED:

1. Dependencies are explicit.
2. Dependency Index is source of truth.
3. Hybrid invalidation is mandatory.
4. Version hash determines candidacy.
5. Content hash determines propagation.
6. Propagation decisions are auditable.
7. Scheduler reads Dependency Index only.
8. Rollbacks are normal writes.
9. Deterministic generation required.
10. Dependency lookup must be O(1).

End of Specification.