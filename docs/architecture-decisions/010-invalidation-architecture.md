# 010-invalidation-architecture.md

# Purpose

Invalidation Architecture ensures that only stale artifacts are regenerated.

The system must support:

- Incremental Processing
- Targeted Regeneration
- Replayability
- Auditability
- Scalability to 10,000+ companies

Without invalidation, the platform becomes:

```text
Reprocess Everything
OR
Serve Stale Data
```

Neither is acceptable.

LOCKED.

---

# Core Principle

Artifacts are regenerated only when their inputs change.

Everything else remains untouched.

LOCKED.

---

# Design Goals

The architecture must provide:

1. Dependency Awareness
2. Staleness Detection
3. Regeneration Scheduling
4. Dependency Propagation
5. Rollback Support
6. Prompt Change Support
7. Partial Invalidation

LOCKED.

---

# High-Level Flow

```text
Input Changes
        ↓
Dependency Index Updated
        ↓
Staleness Detection
        ↓
Artifacts Marked Stale
        ↓
Regeneration Queue
        ↓
Dependency Ordered Execution
        ↓
Artifacts Regenerated
        ↓
Index Updated
```

LOCKED.

---

# Artifact Dependency Graph

Every artifact explicitly declares dependencies.

Dependencies are machine-readable.

Not documentation.

LOCKED.

---

# Layer Dependency Map

```text
Themes
  ← Filing

Topic Assignment
  ← Themes
  ← Topic Registry

Topic Evolution
  ← Topic Assignment (Historical)

Quarter Change
  ← Topic Assignment (Current)
  ← Topic Assignment (Prior)

Structured Intelligence
  ← Filing
  ← Themes

Company Knowledge
  ← Structured Intelligence
  ← Prior Company Knowledge

Business Signals
  ← Company Knowledge
  ← Topic Evolution
  ← Quarter Change

Quarter Understanding
  ← Business Signals
  ← Company Knowledge

Investor Intelligence
  ← Quarter Understanding
  ← Company Knowledge
  ← Business Signals
  ← Topic Evolution
  ← Trust Artifacts

Partner Domain
  ← Investor Intelligence
  ← Company Knowledge
```

LOCKED.

---

# Dependency Index

Dependency Index is the operational brain of the platform.

It tracks:

- Dependencies
- Versions
- Status
- Staleness

LOCKED.

---

# Dependency Index Schema

```typescript
type DependencyIndex = {
  artifact_path: string;

  artifact_type: string;

  company: string;

  period: string | null;

  current_version: number;

  current_hash: string;

  status:
    | "current"
    | "stale"
    | "pending_regeneration"
    | "pending_review";

  upstream_dependencies: {
    artifact_path: string;

    artifact_type: string;

    version_at_generation: number;

    hash_at_generation: string;
  }[];

  downstream_dependents: {
    artifact_path: string;

    artifact_type: string;
  }[];

  stale_reason: InvalidationReason | null;

  stale_detected_at: string | null;

  last_evaluated_at: string;
}
```

LOCKED.

---

# Artifact Status Model

```text
CURRENT

STALE

PENDING_REGENERATION

PENDING_REVIEW
```

No additional statuses allowed.

LOCKED.

---

# Invalidation Reasons

```typescript
type InvalidationReason =
  | "new_filing"
  | "filing_amendment"
  | "topic_registry_change"
  | "prompt_change"
  | "company_knowledge_change"
  | "company_knowledge_rollback"
  | "trust_artifact_change"
  | "market_data_refresh"
  | "manual_correction"
  | "dependency_changed";
```

LOCKED.

---

# Staleness Detection

Artifacts store:

```text
Input Hash
Output Hash
Version
```

LOCKED.

---

# Input Hash

Represents upstream dependency state.

Example:

```typescript
input_hash =
SHA256(
  company_knowledge_version +
  business_signals_version +
  quarter_understanding_version
)
```

LOCKED.

---

# Output Hash

Represents actual artifact content.

Used to prevent unnecessary cascades.

LOCKED.

---

# Staleness Algorithm

```text
FOR EACH Artifact

Read Stored Input Hash

Compute Current Input Hash

IF Hashes Differ

    Mark Artifact STALE

    Record Reason

    Queue Regeneration

ENDIF
```

LOCKED.

---

# Staleness Monitor

Runs continuously.

Responsibilities:

- Recompute hashes
- Detect stale artifacts
- Update Dependency Index
- Trigger downstream propagation

LOCKED.

---

# Dependency Propagation

When an artifact changes:

All downstream artifacts become stale.

LOCKED.

---

# Example

```text
Company Knowledge Updated
        ↓
Business Signals STALE
        ↓
Quarter Understanding STALE
        ↓
Investor Intelligence STALE
        ↓
Partner Domain STALE
```

LOCKED.

---

# Filing Arrival Invalidation

Trigger:

```text
New Filing
```

Direct Invalidations:

```text
Themes

Structured Intelligence
```

Cascade:

```text
Topic Assignment

Topic Evolution

Quarter Change

Company Knowledge

Business Signals

Quarter Understanding

Investor Intelligence

Partner Domain
```

LOCKED.

---

# Filing Amendment Invalidation

Trigger:

```text
Amended Filing
```

Treatment:

Same as new filing.

Entire dependency chain invalidated.

LOCKED.

---

# Topic Registry Change

Trigger:

```text
Topic Registry Updated
```

Direct Invalidations:

```text
Topic Assignment
```

Cascade:

```text
Topic Evolution

Quarter Change

Business Signals

Quarter Understanding

Investor Intelligence

Partner Domain
```

Potentially global.

Must be rate limited.

LOCKED.

---

# Prompt Activation Invalidation

Trigger:

```text
Prompt Version Activated
```

Affected Layer:

All artifacts generated by that prompt.

Example:

```text
Structured Intelligence Prompt
Version 5 Activated
```

Invalidate:

```text
Structured Intelligence

Company Knowledge

Business Signals

Quarter Understanding

Investor Intelligence

Partner Domain
```

LOCKED.

---

# Company Knowledge Change

Trigger:

```text
Promotion

Manual Override

Rollback
```

Invalidate:

```text
Business Signals

Quarter Understanding

Investor Intelligence

Partner Domain
```

LOCKED.

---

# Trust Artifact Change

Trigger:

```text
Commitment Tracking

Narrative Consistency

Accounting Stability
```

Invalidate:

```text
Business Signals

Quarter Understanding

Investor Intelligence

Partner Domain
```

LOCKED.

---

# Market Data Refresh

Trigger:

```text
Q4 Inputs Updated
```

Invalidate ONLY:

```text
Investor Intelligence Q4

Investor Intelligence Q5

Partner Domain
```

Do NOT invalidate:

```text
Q1

Q2

Q3
```

LOCKED.

---

# Partial Invalidation

Supported only where required.

Current Scope:

```text
Investor Intelligence
```

LOCKED.

---

# Investor Intelligence Granularity

Each question stores:

```text
Question Version

Input Hash

Prompt Version

Confidence

Lineage
```

LOCKED.

---

# Question-Level Invalidation

```text
Q1 ← Independent

Q2 ← Independent

Q3 ← Independent

Q4 ← Independent

Q5 ← Depends on:
      Q1
      Q2
      Q3
      Q4
```

LOCKED.

---

# Example

Q4 Refresh:

```text
Q4 STALE

Q5 STALE

Q1 CURRENT

Q2 CURRENT

Q3 CURRENT
```

LOCKED.

---

# Regeneration Ordering

Artifacts regenerate by dependency depth.

LOCKED.

---

# Depth Model

```text
Depth 0
--------
Themes
Structured Intelligence

Depth 1
--------
Topic Assignment
Company Knowledge

Depth 2
--------
Topic Evolution
Quarter Change

Depth 3
--------
Business Signals

Depth 4
--------
Quarter Understanding

Depth 5
--------
Investor Intelligence

Depth 6
--------
Partner Domain
```

LOCKED.

---

# Scheduler Rules

Artifacts at same depth:

```text
Parallel
```

Artifacts at higher depth:

```text
Wait for dependencies
```

LOCKED.

---

# Company Priority System

When queue grows:

Process by priority.

Priority factors:

```text
User Portfolio

Recently Viewed

Recently Updated

History Depth
```

LOCKED.

---

# Rollback Handling

Rollback is treated as:

```text
New Write Event
```

Invalidation engine does not care whether:

```text
Version 4 → 5

OR

Version 5 → 4
```

Both trigger propagation.

LOCKED.

---

# Rollback Flow

```text
Rollback Executed
        ↓
Dependency Index Updated
        ↓
Downstream Artifacts Marked STALE
        ↓
Regeneration Scheduled
```

LOCKED.

---

# Dependency Index Update Rules

Whenever an artifact is written:

1. Update Version
2. Update Output Hash
3. Update Timestamp
4. Recompute Dependency State
5. Mark Dependents STALE

Must be atomic.

LOCKED.

---

# Atomicity Requirement

Artifact Write

AND

Dependency Index Update

Must succeed together.

Never separately.

LOCKED.

---

# Failure Recovery

If regeneration fails:

```text
Artifact remains STALE
```

Current version continues serving.

Status:

```text
CURRENT + STALE_WARNING
```

Platform remains available.

LOCKED.

---

# Observability Requirements

Track:

```text
Stale Artifact Count

Regeneration Queue Size

Average Regeneration Time

Invalidation Events

Dependency Failures

Prompt Activation Cascades
```

LOCKED.

---

# Auditability Requirements

Every invalidation event recorded.

Schema:

```typescript
type InvalidationEvent = {
  event_id: string;

  timestamp: string;

  reason: InvalidationReason;

  source_artifact: string;

  affected_artifacts: string[];

  propagation_depth: number;

  processed: boolean;
}
```

LOCKED.

---

# Future Enhancements

Planned:

- Distributed Queue
- Priority Scheduler
- Event Streaming
- Multi-Region Processing
- Cross-Company Dependency Analysis

Not required initially.

---

# Governance Rules

## Rule 1

All dependencies explicit.

LOCKED.

---

## Rule 2

No hidden dependencies.

LOCKED.

---

## Rule 3

All artifacts versioned.

LOCKED.

---

## Rule 4

All artifacts hash tracked.

LOCKED.

---

## Rule 5

All invalidations audited.

LOCKED.

---

## Rule 6

Rollback must propagate automatically.

LOCKED.

---

## Rule 7

Partial invalidation only where justified.

LOCKED.

---

# Final Principle

The platform must behave like a knowledge operating system.

When something changes:

Only affected artifacts regenerate.

Everything else remains stable.

This guarantees:

Scalability.
Replayability.
Auditability.
Cost Control.
Production Reliability.

LOCKED.