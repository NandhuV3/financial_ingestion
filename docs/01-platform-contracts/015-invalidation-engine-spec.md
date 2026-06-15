# 015-invalidation-engine-spec.md

# Invalidation Engine Specification

Version: 1.0
Status: LOCKED
Owner: Architecture

---

# Purpose

The Invalidation Engine is responsible for determining:

1. What became stale
2. Why it became stale
3. Whether propagation should continue
4. Which artifacts must regenerate
5. In what order regeneration occurs

The Invalidation Engine converts dependency changes into regeneration decisions.

Without the Invalidation Engine:

```text
Every change
→ full reprocessing
```

With the Invalidation Engine:

```text
Only affected artifacts
→ regenerate
```

---

# Architectural Principle

The Dependency Index stores state.

The Invalidation Engine evaluates state.

The Scheduler executes state.

Responsibilities must never be mixed.

---

# Ownership

The Invalidation Engine owns:

- staleness detection
- propagation decisions
- invalidation events
- regeneration eligibility
- dependency traversal
- impact analysis

The Invalidation Engine does NOT own:

- artifact generation
- prompt execution
- governance review
- scheduler execution

---

# Core Design Principles

## Principle 1

Invalidation is event-driven.

Not batch-driven.

---

## Principle 2

Version changes create candidates.

Content changes create propagation.

(Hybrid Architecture)

---

## Principle 3

Propagation is deterministic.

No LLMs involved.

---

## Principle 4

Every propagation decision is auditable.

---

## Principle 5

Stopping propagation is a decision.

It must be logged.

---

# Architectural Flow

```text
Artifact Change
      ↓
Dependency Index Update
      ↓
Candidate Invalidation
      ↓
Content Hash Evaluation
      ↓
Propagation Decision
      ↓
Regeneration Queue
      ↓
Scheduler
      ↓
Artifact Regeneration
```

---

# Engine Inputs

The engine consumes:

```typescript
type InvalidationInput = {
  dependency_index_entry: DependencyIndexEntry;

  upstream_changes: UpstreamChange[];

  invalidation_event: InvalidationEvent;
};
```

---

# Engine Outputs

```typescript
type InvalidationResult = {
  status:
    | "propagation_stopped"
    | "stale"
    | "pending_regeneration";

  affected_artifacts: string[];

  reason: InvalidationReason;

  audit_event_id: string;
};
```

---

# Invalidation Events

Everything begins with an event.

```typescript
type InvalidationEvent = {
  event_id: string;

  event_type: InvalidationEventType;

  company: string | null;

  period: string | null;

  source_artifact: string;

  timestamp: string;
};
```

---

# Event Types

```typescript
type InvalidationEventType =
  | "filing_arrived"
  | "filing_amended"
  | "artifact_updated"
  | "prompt_activated"
  | "prompt_rolled_back"
  | "company_knowledge_rollback"
  | "concept_registry_updated"
  | "topic_registry_updated"
  | "market_data_refreshed"
  | "manual_correction";
```

---

# Candidate Invalidation

Candidate invalidation is Phase 1.

No content evaluation occurs.

Only dependency version changes.

---

# Candidate Detection

Algorithm:

```text
Artifact A changes

↓

Find all downstream dependents

↓

Mark each as:

candidate_stale
```

No regeneration yet.

---

# Why Candidate State Exists

Without candidate state:

```text
Every version change
→ regeneration
```

This becomes Option A.

Candidate state enables:

```text
Version Hash
→ candidate

Content Hash
→ propagation
```

---

# Candidate State Rules

A candidate artifact:

```text
May become stale

or

May return to current
```

Candidate state is temporary.

---

# Hybrid Invalidation Protocol

LOCKED ARCHITECTURE

Phase 1

```text
Version Hash
```

Determines:

```text
Candidate Stale
```

---

Phase 2

```text
Content Hash
```

Determines:

```text
Propagate
or
Stop
```

---

# Propagation Evaluation

Compare:

```text
Current upstream content hash

vs

Hash recorded in lineage
```

---

# Case 1

Content identical

```text
Propagation stopped
```

---

Action:

```text
candidate_stale
→ current
```

---

Audit:

```text
PROPAGATION_STOPPED
```

---

# Case 2

Content changed

```text
Propagation continues
```

---

Action:

```text
candidate_stale
→ stale
```

---

Audit:

```text
PROPAGATION_CONTINUED
```

---

# Propagation Stop Record

```typescript
type PropagationStopped = {
  event_id: string;

  artifact_path: string;

  upstream_artifact: string;

  reason: "content_hash_match";

  timestamp: string;
};
```

---

# Propagation Continue Record

```typescript
type PropagationContinued = {
  event_id: string;

  artifact_path: string;

  upstream_artifact: string;

  reason: "content_hash_changed";

  timestamp: string;
};
```

---

# Stale Artifact Lifecycle

```text
Current
   ↓
Candidate Stale
   ↓
Stale
   ↓
Pending Regeneration
   ↓
Current
```

---

# Regeneration Eligibility

An artifact may regenerate only when:

```text
All upstream dependencies are current
```

---

# Example

Investor Intelligence

depends on:

```text
Quarter Understanding

Business Signals

Company Knowledge
```

If Business Signals is stale:

```text
Investor Intelligence
cannot regenerate
```

---

# Dependency Readiness Check

```typescript
type RegenerationReadiness = {
  artifact_path: string;

  ready: boolean;

  blocking_dependencies: string[];
};
```

---

# Scheduler Contract

Scheduler receives only:

```text
Ready-to-regenerate artifacts
```

Engine determines readiness.

Scheduler executes jobs.

---

# Dependency Depth Ordering

Artifacts regenerate by depth.

---

Depth 0

```text
Themes
Structured Intelligence
```

---

Depth 1

```text
Topic Assignment
Company Knowledge
```

---

Depth 2

```text
Topic Evolution
Quarter Change
```

---

Depth 3

```text
Business Signals
```

---

Depth 4

```text
Quarter Understanding
```

---

Depth 5

```text
Investor Intelligence
```

---

Depth 6

```text
Partner Domain
```

---

# Regeneration Priority

Within each depth:

Priority ordering:

```text
1 Portfolio Companies

2 Recently Viewed

3 Deep History Companies

4 Everything Else
```

---

# Filing Arrival Flow

Event:

```text
filing_arrived
```

---

Invalidation:

```text
Themes
Structured Intelligence
```

---

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

---

Propagation controlled by hybrid invalidation.

---

# Filing Amendment Flow

Event:

```text
filing_amended
```

Same flow as filing arrival.

---

Difference:

```text
stale_reason
=
amended_filing
```

---

# Prompt Activation Flow

Event:

```text
prompt_activated
```

---

Direct invalidation:

```text
All artifacts generated by that prompt
```

---

Result:

```text
candidate_stale
```

---

Hybrid evaluation decides propagation.

---

# Prompt Rollback Flow

Event:

```text
prompt_rolled_back
```

---

Behavior:

Same as prompt activation.

---

Reason:

```text
prompt_rollback
```

---

# Topic Registry Update Flow

Event:

```text
topic_registry_updated
```

---

Direct impact:

```text
Topic Assignment
```

---

Cascade:

```text
Topic Evolution

Quarter Change

Business Signals

Quarter Understanding

Investor Intelligence

Partner Domain
```

---

Highest-cost invalidation event.

---

# Concept Registry Update Flow

Event:

```text
concept_registry_updated
```

---

Direct impact:

```text
Quarter Understanding
```

---

Cascade:

```text
Investor Intelligence

Partner Domain
```

---

Business Signals unaffected.

Company Knowledge unaffected.

---

# Company Knowledge Rollback Flow

Event:

```text
company_knowledge_rollback
```

---

Direct impact:

```text
Business Signals

Quarter Understanding

Investor Intelligence

Partner Domain
```

---

Hybrid evaluation applies.

---

# Market Data Refresh Flow

Event:

```text
market_data_refreshed
```

---

Direct impact:

```text
Investor Intelligence Q4
```

---

Cascade:

```text
Investor Intelligence Q5

Partner Domain
```

---

Q1

Q2

Q3

Unaffected.

---

# Partial Invalidation Support

Supported only for:

```text
Investor Intelligence
```

---

Per-question hashes:

```text
Q1

Q2

Q3

Q4

Q5
```

---

Q4 update:

```text
Invalidate Q4

Invalidate Q5
```

---

Q1-Q3 remain current.

---

# Staleness Monitor

Background service.

Responsibilities:

```text
Evaluate candidates

Detect stale artifacts

Trigger propagation

Queue regeneration
```

---

# Monitor Cycle

```text
Read Dependency Index

Evaluate Candidate Artifacts

Apply Hybrid Protocol

Update Status

Emit Audit Events

Queue Regeneration
```

---

Runs continuously.

---

# Audit Requirements

Every decision recorded.

Platform must answer:

```text
Why did regeneration happen?
```

and

```text
Why did regeneration NOT happen?
```

Both equally important.

---

# Audit Event Schema

```typescript
type InvalidationAuditEvent = {
  event_id: string;

  artifact_path: string;

  event_type:
    | "candidate_created"
    | "propagation_stopped"
    | "propagation_continued"
    | "queued"
    | "regenerated";

  reason: string;

  timestamp: string;
};
```

---

# Impact Analysis

Required capability.

Question:

```text
If I change this artifact,
what breaks?
```

---

Response:

```typescript
type ImpactAnalysis = {
  source_artifact: string;

  downstream_artifacts: string[];

  regeneration_cost_estimate: number;

  affected_layers: string[];
};
```

---

# Regeneration Cost Estimation

Estimate:

```text
Artifacts affected

+

Expected LLM Calls

+

Expected Processing Time
```

Used before:

```text
Prompt Activation

Registry Updates

Rollbacks
```

---

# Failure Handling

If regeneration fails:

```text
Status:
pending_regeneration
```

---

Retry queue receives job.

---

No silent failures.

---

# Rollback Handling

Rollback treated as:

```text
New Write
```

---

No special logic.

---

Normal invalidation applies.

---

# Operational Metrics

Track:

```text
candidate_stale_count

stale_count

regeneration_count

propagation_stopped_count

propagation_continued_count

average_regeneration_time

queue_depth
```

---

# Scaling Requirements

Target:

```text
10,000+ companies

40+ periods

millions of artifacts
```

---

Engine must:

```text
Invalidate incrementally

Avoid full scans

Support parallel regeneration

Support hybrid propagation
```

---

# Future Compatibility

Must support:

```text
Concept Graph

Real-Time Processing

Additional Layers

Multi-Language Pipelines

New Artifact Types
```

Without redesign.

---

# Architectural Invariants

The following are LOCKED:

1. Invalidation is event-driven.
2. Candidate state is mandatory.
3. Hybrid invalidation is mandatory.
4. Version hash determines candidacy.
5. Content hash determines propagation.
6. Scheduler never determines staleness.
7. Engine never generates artifacts.
8. Regeneration requires current dependencies.
9. Every propagation decision is audited.
10. Rollback is treated as a normal write.

End of Specification.