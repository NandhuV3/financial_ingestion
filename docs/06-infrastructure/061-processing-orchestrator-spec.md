# 061-processing-orchestrator-spec.md

Version: 1.0
Status: LOCKED
Owner: Platform Infrastructure

Depends On:

- 014-dependency-index-spec.md
- 015-invalidation-engine-spec.md
- 050-056 Builder Specifications
- 060-storage-architecture-spec.md

Consumes:

- Build Requests
- Dependency Events
- Invalidation Events
- Replay Requests

Produces:

- Builder Executions
- Artifact Generation Jobs
- Regeneration Jobs
- Replay Jobs

---

# Purpose

This specification defines the Processing Orchestrator.

The Processing Orchestrator is:

```text
The Execution Brain
```

of the platform.

It determines:

```text
What Runs

When It Runs

Why It Runs

In What Order It Runs
```

---

# Architectural Position

```text
Storage Layer
        ↓

Dependency Index
        ↓

Invalidation Engine
        ↓

Processing Orchestrator
        ↓

Builders
        ↓

Artifacts
```

---

# Core Responsibility

Coordinate:

```text
Artifact Generation

Artifact Regeneration

Invalidation Processing

Replay Execution
```

across the platform.

---

# Architectural Principle

Builders perform work.

The Orchestrator decides:

```text
When Work Happens.
```

---

# Critical Rule

The Orchestrator:

```text
Never Generates Intelligence.
```

---

# Orchestrator Ownership

Owns:

- job scheduling
- dependency ordering
- retry policies
- replay execution
- invalidation execution
- workflow coordination
- concurrency control

Does NOT own:

- prompt execution
- artifact generation
- governance decisions
- intelligence generation

---

# Execution Model

The platform is:

```text
Event Driven
```

---

# Reason

Supports:

```text
Incremental Processing

Scalability

Replayability
```

---

# Event Sources

```text
New Filing

Registry Change

Prompt Activation

Governance Decision

Replay Request

Manual Rebuild Request
```

---

# Orchestrator Inputs

```typescript
type ProcessingEvent =
  | FilingReceivedEvent
  | ArtifactPublishedEvent
  | InvalidationEvent
  | ReplayRequestEvent
  | GovernanceDecisionEvent
  | PromptActivatedEvent;
```

---

# Orchestrator Outputs

```typescript
type JobExecutionRequest = {
  job_id: string;

  builder_type: string;

  business_key: object;

  priority: JobPriority;
};
```

---

# Architectural Pipeline

```text
New Filing
      ↓

Themes

Topic Assignment

Topic Evolution

Quarter Change

Structured Intelligence

Company Knowledge

Business Signals

Trust Artifacts

Quarter Understanding

Investor Intelligence

Partner Domain
```

---

# Dependency Principle

Execution order is determined by:

```text
Dependency Index
```

---

# Never

```text
Hardcoded Workflow Logic
```

---

# Reason

Supports:

```text
Replay

Rollback

Future Evolution
```

---

# Processing Modes

## Mode 1

Initial Build

---

# Trigger

```text
New Filing
```

---

# Goal

Generate all required artifacts.

---

# Flow

```text
Root Artifact
      ↓

Downstream Expansion
      ↓

Terminal Artifact
```

---

# Mode 2

Incremental Regeneration

---

# Trigger

```text
Invalidation Event
```

---

# Goal

Regenerate only:

```text
Affected Artifacts
```

---

# Uses

```text
Hybrid Invalidation
```

---

# Mode 3

Replay

---

# Trigger

```text
Replay Request
```

---

# Goal

Reconstruct historical state.

---

# Replay Principle

Replay must produce:

```text
Identical Results
```

for identical inputs.

---

# Mode 4

Manual Rebuild

---

# Trigger

```text
Operator Request
```

---

# Purpose

Operational recovery.

---

# Job Types

```typescript
type JobType =
  | "build"
  | "regenerate"
  | "replay"
  | "validation"
  | "evaluation";
```

---

# Job Priority

```typescript
type JobPriority =
  | "critical"
  | "high"
  | "normal"
  | "low";
```

---

# Priority Rules

Critical:

```text
Governance

Replay Recovery
```

---

# High

```text
New Filings
```

---

# Normal

```text
Regeneration
```

---

# Low

```text
Backfill Jobs
```

---

# Job Lifecycle

```text
Queued
   ↓

Running
   ↓

Succeeded

or

Failed

or

Cancelled
```

---

# Job Schema

```typescript
type ProcessingJob = {
  job_id: string;

  job_type: JobType;

  status: JobStatus;

  builder_type: string;

  attempts: number;

  created_at: string;
};
```

---

# Job Status

```typescript
type JobStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled";
```

---

# Builder Scheduling

Builders are scheduled only when:

```text
Dependencies Satisfied
```

---

# Example

Quarter Understanding may run only when:

```text
Company Knowledge

Business Signals

Trust Signals
```

are current.

---

# Dependency Check

Source:

```text
Dependency Index
```

---

# Unsatisfied Dependency

Result:

```text
Wait
```

---

# Not Failure

---

# Concurrency Model

Processing is:

```text
Company Isolated
```

---

# Meaning

Different companies:

```text
May Run Concurrently
```

---

# Same Company

Must obey:

```text
Dependency Ordering
```

---

# Example

Allowed:

```text
MSFT

AAPL

NVDA
```

simultaneously.

---

# Forbidden

```text
Investor Intelligence

before

Quarter Understanding
```

for same company-period.

---

# Job Queue Architecture

Queues:

```text
Build Queue

Regeneration Queue

Replay Queue

Evaluation Queue
```

---

# Queue Ownership

Orchestrator owns queue assignment.

---

# Retry Strategy

Supported.

---

# Retry Categories

```text
Transient Failure

Infrastructure Failure

Timeout
```

---

# Not Retryable

```text
Schema Failure

Validation Failure

Governance Failure
```

---

# Retry Policy

```typescript
max_retries = 3
```

---

# Backoff

```text
Exponential
```

---

# Failure Escalation

After retries exhausted:

```text
Operator Alert
```

---

# Event Processing

Every artifact publication generates:

```text
ArtifactPublishedEvent
```

---

# Purpose

Drive downstream execution.

---

# Example

```text
Structured Intelligence Published
            ↓

Company Knowledge Job Created
```

---

# Event Schema

```typescript
type ArtifactPublishedEvent = {
  artifact_id: string;

  artifact_type: string;

  business_key: object;

  timestamp: string;
};
```

---

# Invalidation Integration

Critical.

---

# Trigger

```text
Invalidation Engine
```

---

# Input

```typescript
type InvalidationEvent = {
  artifact_id: string;

  reason: string;

  impact_scope: string[];
};
```

---

# Orchestrator Responsibility

Convert:

```text
Invalidation Events
```

into:

```text
Regeneration Jobs
```

---

# Candidate Stale Handling

For:

```text
candidate_stale
```

artifacts:

```text
Evaluate Content Hash
```

before regeneration.

---

# Propagation Stop

If:

```text
Content Hash Match
```

then:

```text
No Regeneration
```

---

# Replay Architecture

Replay is:

```text
First-Class
```

---

# Replay Inputs

```typescript
type ReplayRequest = {
  company_id: string;

  period_id: string;

  artifact_type: string;

  target_version: string;
};
```

---

# Replay Requirements

Use:

```text
Historical Registry Versions

Historical Prompt Versions

Historical Inputs
```

---

# Replay Output

Must match:

```text
Original Artifact
```

---

# Replay Failure

Creates:

```text
Replay Incident
```

---

# Governance Integration

Governance decisions may trigger:

```text
Regeneration
```

---

# Examples

```text
Knowledge Approval

Concept Merge

Prompt Activation
```

---

# Rule

Orchestrator executes.

Governance decides.

---

# Evaluation Integration

Evaluation jobs are:

```text
Independent
```

---

# Rule

Evaluation failure does NOT block:

```text
Artifact Persistence
```

unless explicitly configured.

---

# Scheduling Strategy

Default:

```text
Breadth First
```

---

# Reason

Prevents:

```text
Deep Queue Starvation
```

---

# Example

Preferred:

```text
100 Companies
Themes

before

1 Company
Full Pipeline
```

when backlog exists.

---

# Throughput Targets

Target:

```text
10,000+ companies
```

---

# Requirements

```text
Horizontal Scaling

Distributed Workers

Queue Partitioning
```

---

# Orchestrator Metrics

Track:

```text
Queue Depth

Execution Time

Failure Rate

Retry Rate

Replay Success Rate
```

---

# Monitoring Schema

```typescript
type OrchestratorMetrics = {
  queue_depth: number;

  jobs_running: number;

  jobs_failed: number;

  avg_execution_time_ms: number;

  replay_success_rate: number;
};
```

---

# Operational Alerts

Alert Conditions:

```text
Queue Backlog

Replay Failure

Dependency Deadlock

Retry Storm

Worker Failure
```

---

# Deadlock Prevention

Critical.

---

# Rule

Dependency graph must be:

```text
Acyclic
```

---

# Validation

Performed during:

```text
Dependency Registration
```

---

# Circular Dependency

Results in:

```text
Registration Failure
```

---

# Scaling Requirements

Must support:

```text
Millions Of Artifacts

Hundreds Of Thousands Of Jobs

Thousands Of Concurrent Builds
```

---

# Architectural Invariants

LOCKED.

1. Orchestrator owns execution, not intelligence.
2. Dependency Index determines execution order.
3. Processing is event-driven.
4. Builders execute only when dependencies are satisfied.
5. Replay is a first-class capability.
6. Hybrid invalidation drives regeneration.
7. Company processing is isolated.
8. Dependency graph must remain acyclic.
9. Evaluation is independent of execution.
10. Orchestrator is the execution brain of the platform.

End of Specification.