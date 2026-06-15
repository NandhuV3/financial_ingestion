# 063-event-model-spec.md

Version: 1.0
Status: LOCKED
Owner: Platform Infrastructure

Depends On:

- 014-dependency-index-spec.md
- 015-invalidation-engine-spec.md
- 061-processing-orchestrator-spec.md
- 062-job-execution-spec.md

Consumes:

- Platform State Changes
- Artifact Lifecycle Events
- Governance Events
- Registry Events

Produces:

- Platform Events

---

# Purpose

This specification defines the complete Event Model for the platform.

The Event Model is:

```text
The Nervous System
```

of the platform.

Every meaningful state transition must be represented as an event.

---

# Architectural Principle

Events represent:

```text
Facts That Happened
```

not:

```text
Commands To Execute
```

---

# Examples

Valid Event:

```text
Artifact Published
```

Invalid Event:

```text
Generate Investor Intelligence
```

---

# Core Design Goals

1. Auditability
2. Replayability
3. Loose Coupling
4. Scalability
5. Observability
6. Event Sourcing Compatibility

---

# Event Architecture

```text
Producer
      ↓

Event Bus
      ↓

Consumers
```

---

# Producer Examples

```text
Builders

Governance

Registries

Invalidation Engine

Orchestrator
```

---

# Consumer Examples

```text
Orchestrator

Dependency Index

Evaluation Engine

Monitoring

Audit System
```

---

# Event Categories

The platform supports six event domains:

```text
Artifact Events

Governance Events

Registry Events

Invalidation Events

Execution Events

Replay Events
```

---

# Universal Event Schema

All events inherit:

```typescript
type BaseEvent = {
  event_id: string;

  event_type: string;

  event_version: string;

  producer: string;

  timestamp: string;

  correlation_id: string;

  causation_id: string | null;

  payload: object;
};
```

---

# Event Rules

Every event must be:

```text
Immutable
```

---

# Forbidden

```text
Event Updates

Event Deletion
```

---

# Reason

Supports:

```text
Auditability

Replayability
```

---

# Event Identity

---

# event_id

Unique event instance.

---

# correlation_id

Tracks:

```text
Business Workflow
```

across events.

---

# Example

```text
New Filing

↓

Themes Built

↓

Structured Intelligence Built

↓

Investor Intelligence Built
```

All share:

```text
Same Correlation ID
```

---

# causation_id

Tracks:

```text
Direct Parent Event
```

---

# Example

```text
ArtifactPublished
      ↓

JobCreated
```

JobCreated.causation_id = ArtifactPublished.event_id

---

# Event Category 1

Artifact Events

---

# Purpose

Represent artifact lifecycle changes.

---

# Event

Artifact Published

---

# Schema

```typescript
type ArtifactPublishedEvent = {
  artifact_id: string;

  artifact_type: string;

  company_id: string;

  period_id: string;

  version: number;

  output_hash: string;
};
```

---

# Trigger

Successful artifact persistence.

---

# Consumers

```text
Orchestrator

Dependency Index

Monitoring
```

---

# Event

Artifact Superseded

---

# Purpose

Current artifact pointer changed.

---

# Schema

```typescript
type ArtifactSupersededEvent = {
  artifact_type: string;

  company_id: string;

  period_id: string;

  previous_version: number;

  current_version: number;
};
```

---

# Event

Artifact Replay Completed

---

# Purpose

Replay successfully reproduced artifact.

---

# Event Category 2

Governance Events

---

# Purpose

Represent human or governed decisions.

---

# Event

Prompt Activated

---

# Schema

```typescript
type PromptActivatedEvent = {
  prompt_id: string;

  prompt_version: string;

  activated_by: string;
};
```

---

# Event

Concept Approved

---

# Schema

```typescript
type ConceptApprovedEvent = {
  concept_id: string;

  registry_version: string;

  approved_by: string;
};
```

---

# Event

Concept Deprecated

---

# Event

Concept Merged

---

# Event

Knowledge Promotion Approved

---

# Event

Knowledge Promotion Rejected

---

# Governance Rule

Governance events are:

```text
Authoritative
```

---

# They represent:

```text
Final Decisions
```

---

# Event Category 3

Registry Events

---

# Purpose

Represent registry lifecycle changes.

---

# Event Types

```text
Registry Version Created

Registry Activated

Registry Rolled Back

Registry Deprecated
```

---

# Example

```typescript
type RegistryActivatedEvent = {
  registry_type: string;

  version: string;

  activated_by: string;
};
```

---

# Registry Event Rule

Registry activation is:

```text
Separate
```

from registry creation.

---

# Reason

Supports approval workflows.

---

# Event Category 4

Invalidation Events

---

# Purpose

Represent staleness decisions.

---

# Event

Artifact Candidate Stale

---

# Schema

```typescript
type ArtifactCandidateStaleEvent = {
  artifact_id: string;

  reason: string;

  upstream_artifact_id: string;
};
```

---

# Trigger

Version hash change.

---

# Event

Propagation Stopped

---

# Schema

```typescript
type PropagationStoppedEvent = {
  artifact_id: string;

  reason:
    "content_hash_match";

  upstream_hash: string;
};
```

---

# Trigger

Content hash identical.

---

# Event

Propagation Continued

---

# Schema

```typescript
type PropagationContinuedEvent = {
  artifact_id: string;

  upstream_hash: string;

  downstream_hash: string;
};
```

---

# Trigger

Content hash changed.

---

# Architectural Importance

These events provide:

```text
Hybrid Invalidation Auditability
```

---

# Event Category 5

Execution Events

---

# Purpose

Represent runtime execution.

---

# Event

Job Created

---

# Schema

```typescript
type JobCreatedEvent = {
  job_id: string;

  builder_type: string;

  priority: string;
};
```

---

# Event

Job Started

---

# Event

Job Completed

---

# Event

Job Failed

---

# Example

```typescript
type JobFailedEvent = {
  job_id: string;

  builder_type: string;

  failure_reason: string;
};
```

---

# Event

Job Retried

---

# Event

Worker Timeout

---

# Execution Event Consumers

```text
Monitoring

Observability

Operations
```

---

# Event Category 6

Replay Events

---

# Purpose

Represent replay lifecycle.

---

# Event

Replay Requested

---

# Schema

```typescript
type ReplayRequestedEvent = {
  company_id: string;

  artifact_type: string;

  target_version: string;
};
```

---

# Event

Replay Started

---

# Event

Replay Completed

---

# Event

Replay Failed

---

# Replay Rule

Replay events are:

```text
First-Class Events
```

---

# Event Delivery Model

Platform uses:

```text
At-Least-Once Delivery
```

---

# Reason

Prefer:

```text
Duplicate Events
```

over:

```text
Lost Events
```

---

# Consumer Requirement

Consumers must be:

```text
Idempotent
```

---

# Example

Processing same event twice:

```text
Safe
```

---

# Event Ordering

Ordering guaranteed:

```text
Per Entity
```

---

# Example

For:

```text
MSFT
Investor Intelligence
```

ordering preserved.

---

# Global Ordering

Not guaranteed.

---

# Reason

Scalability.

---

# Event Versioning

Mandatory.

---

# Schema

```typescript
event_version: string;
```

---

# Rule

Events are:

```text
Additive
```

---

# Breaking Changes

Forbidden.

---

# New Fields

Allowed.

---

# Event Retention

Permanent.

---

# Reason

Supports:

```text
Audit

Replay

Investigation
```

---

# Event Store

Separate from:

```text
Artifact Store
```

---

# Reason

Artifacts are:

```text
State
```

Events are:

```text
History
```

---

# Event Replay

Supported.

---

# Purpose

Reconstruct:

```text
Operational History
```

---

# Not

Artifact Replay.

---

# Difference

Artifact Replay:

```text
Rebuild Intelligence
```

Event Replay:

```text
Rebuild Event Timeline
```

---

# Dead Letter Queue

Mandatory.

---

# Purpose

Capture:

```text
Unprocessable Events
```

---

# Schema

```typescript
type DeadLetterEvent = {
  original_event_id: string;

  failure_reason: string;
};
```

---

# Alerting

Required.

---

# Event Metrics

Track:

```text
Events Produced

Events Consumed

Consumer Lag

DLQ Count

Delivery Latency
```

---

# Monitoring Schema

```typescript
type EventMetrics = {
  events_per_second: number;

  consumer_lag_ms: number;

  dlq_count: number;

  delivery_latency_ms: number;
};
```

---

# Security Requirements

Events may contain:

```text
References
```

not:

```text
Sensitive Artifact Content
```

---

# Rule

Event payloads should remain:

```text
Lightweight
```

---

# Store IDs

Not full artifacts.

---

# Scalability Requirements

Target:

```text
Millions Of Events

Millions Of Artifacts

10,000+ Companies
```

---

# Event Infrastructure Must Support

```text
Partitioning

Horizontal Scaling

Idempotent Consumption

Long-Term Retention
```

---

# Architectural Invariants

LOCKED.

1. Events represent facts, not commands.
2. Events are immutable.
3. Events are permanent.
4. Every event has correlation and causation identifiers.
5. Delivery is at-least-once.
6. Consumers must be idempotent.
7. Event ordering is guaranteed per entity.
8. Event Store is separate from Artifact Store.
9. Hybrid invalidation decisions are represented as events.
10. Replay is a first-class event category.

End of Specification.