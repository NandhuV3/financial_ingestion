# 062-job-execution-spec.md

Version: 1.0
Status: LOCKED
Owner: Platform Infrastructure

Depends On:

- 050-056 Builder Specifications
- 061-processing-orchestrator-spec.md
- 060-storage-architecture-spec.md
- 014-dependency-index-spec.md

Consumes:

- Processing Jobs
- Builder Specifications

Produces:

- Artifact Build Results
- Execution Events
- Failure Events
- Metrics

---

# Purpose

This specification defines how jobs are executed after being scheduled by the Processing Orchestrator.

The Job Execution Layer is:

```text
The Runtime Layer
```

of the platform.

---

# Architectural Position

```text
Processing Orchestrator
           ↓

Job Execution Layer
           ↓

Builder
           ↓

Artifact
```

---

# Core Responsibility

Execute:

```text
Builder Work
```

safely, consistently, and deterministically.

---

# Architectural Principle

The Orchestrator decides:

```text
What To Run
```

The Execution Layer decides:

```text
How To Run It
```

The Builder decides:

```text
What Intelligence To Produce
```

---

# Critical Rule

Execution Layer:

```text
Never Generates Intelligence
```

---

# Execution Ownership

Owns:

- worker lifecycle
- builder invocation
- execution isolation
- timeout management
- retries
- metrics
- logging
- result reporting

Does NOT own:

- scheduling
- governance
- intelligence
- dependency decisions

---

# Runtime Architecture

```text
Orchestrator
      ↓

Job Queue
      ↓

Worker
      ↓

Builder
      ↓

Artifact
```

---

# Execution Model

Every job executes inside:

```text
Execution Context
```

---

# Execution Context

```typescript
type ExecutionContext = {
  job_id: string;

  builder_type: string;

  company_id: string;

  period_id: string;

  execution_id: string;

  start_time: string;
};
```

---

# Execution Flow

```text
1. Receive Job

2. Acquire Lock

3. Load Builder

4. Create Context

5. Execute Builder

6. Validate Result

7. Persist Result

8. Publish Events

9. Release Lock

10. Report Status
```

---

# Step 1

Receive Job

---

# Source

```text
Processing Queue
```

---

# Input

```typescript
type ProcessingJob
```

---

# Validation

Required:

```text
Valid Job ID

Valid Builder

Valid Business Key
```

---

# Invalid Job

```text
Reject
```

---

# Step 2

Acquire Lock

---

# Purpose

Prevent:

```text
Duplicate Execution
```

---

# Lock Scope

```text
Company

Period

Builder
```

---

# Example

Allowed:

```text
MSFT Q1
Themes

and

MSFT Q1
Investor Intelligence
```

Only if dependencies satisfied.

---

# Forbidden

```text
Same Builder

Same Company

Same Period

Twice
```

---

# Lock Schema

```typescript
type ExecutionLock = {
  lock_id: string;

  company_id: string;

  period_id: string;

  builder_type: string;

  expires_at: string;
};
```

---

# Lock Failure

```text
Wait
```

---

# Not Error

---

# Step 3

Load Builder

---

# Builder Registry

Source of truth.

---

# Registry

```typescript
type BuilderRegistry = {
  builder_type: string;

  implementation: string;

  version: string;
};
```

---

# Rule

Builders are loaded through:

```text
Builder Registry
```

---

# Never Hardcoded

---

# Step 4

Create Execution Context

---

# Purpose

Provide:

```text
Runtime Metadata
```

---

# Context Available To Builder

```text
Job Metadata

Execution Metadata

Tracing Metadata
```

---

# Not Business Logic

---

# Step 5

Execute Builder

---

# Invocation

```typescript
builder.execute(
  execution_context
);
```

---

# Builder Contract

Every builder returns:

```typescript
type BuildResult = {
  status:
    "success"
    | "failure";

  artifact_id?: string;

  metrics?: object;

  error?: object;
};
```

---

# Determinism Requirement

Production execution must use:

```text
Pinned Prompt Version

Pinned Model Version

Temperature = 0
```

---

# Reason

Supports:

```text
Replayability

Hybrid Invalidation
```

---

# Step 6

Validate Result

---

# Validation Types

```text
Schema Validation

Artifact Validation

Lineage Validation
```

---

# Required

Artifact must contain:

```text
Metadata

Lineage

Hashes
```

---

# Missing Required Fields

```text
Failure
```

---

# Step 7

Persist Result

---

# Storage Target

```text
Artifact Store
```

---

# Strategy

```text
Atomic Write
```

---

# Persisted Data

```text
Artifact

Lineage

Metadata

Metrics
```

---

# Failure

```text
Rollback
```

---

# Step 8

Publish Events

---

# Event Types

```text
ArtifactPublished

ExecutionCompleted

ExecutionFailed
```

---

# Example

```text
Quarter Understanding Published
           ↓

Investor Intelligence Scheduled
```

---

# Event Schema

```typescript
type ExecutionCompletedEvent = {
  execution_id: string;

  job_id: string;

  artifact_id: string;

  completed_at: string;
};
```

---

# Step 9

Release Lock

---

# Required

Always.

---

# Includes

```text
Success

Failure

Timeout
```

---

# Failure To Release

```text
Operational Incident
```

---

# Step 10

Report Status

---

# Status Types

```typescript
type ExecutionStatus =
  | "success"
  | "failure"
  | "timeout"
  | "cancelled";
```

---

# Reporting Target

```text
Processing Orchestrator
```

---

# Timeout Management

Mandatory.

---

# Purpose

Prevent:

```text
Zombie Jobs
```

---

# Timeout Schema

```typescript
type TimeoutPolicy = {
  builder_type: string;

  timeout_ms: number;
};
```

---

# Example

```text
Themes

30 seconds
```

```text
Investor Intelligence

120 seconds
```

---

# Timeout Result

```text
Execution Failed
```

---

# Retry Ownership

Execution Layer owns:

```text
Retry Mechanics
```

---

# Orchestrator owns:

```text
Retry Policy
```

---

# Retry Conditions

Allowed:

```text
Infrastructure Failure

Timeout

Network Failure
```

---

# Not Allowed

```text
Schema Failure

Validation Failure

Governance Failure
```

---

# Worker Architecture

Workers are:

```text
Stateless
```

---

# Reason

Supports:

```text
Horizontal Scaling
```

---

# Worker Responsibilities

```text
Execute

Report

Exit
```

---

# Worker State

Never stored locally.

---

# Execution Isolation

Critical.

---

# Isolation Boundary

```text
One Job

One Context

One Execution
```

---

# No Shared State

Between executions.

---

# Failure Categories

```typescript
type ExecutionFailure =
  | "BUILDER_FAILURE"
  | "TIMEOUT"
  | "VALIDATION_FAILURE"
  | "PERSISTENCE_FAILURE"
  | "LOCK_FAILURE"
  | "INFRASTRUCTURE_FAILURE";
```

---

# Failure Handling

Builder Failure

```text
Report Failure
```

---

# Timeout

```text
Terminate Execution
```

---

# Persistence Failure

```text
Rollback
```

---

# Infrastructure Failure

```text
Retry
```

---

# Logging Requirements

Every execution must log:

```text
Execution Start

Execution End

Execution Failure

Duration

Artifact ID
```

---

# Execution Log Schema

```typescript
type ExecutionLog = {
  execution_id: string;

  job_id: string;

  builder_type: string;

  status: string;

  duration_ms: number;

  timestamp: string;
};
```

---

# Metrics Collection

Track:

```text
Execution Time

Success Rate

Failure Rate

Timeout Rate

Retry Rate
```

---

# Metrics Schema

```typescript
type ExecutionMetrics = {
  execution_duration_ms: number;

  retries: number;

  cpu_usage: number;

  memory_usage: number;
};
```

---

# Replay Integration

Replay jobs use:

```text
Same Execution Layer
```

---

# Difference

Replay resolves:

```text
Historical Inputs
```

instead of:

```text
Current Inputs
```

---

# Execution Layer

Must not know:

```text
Whether Job Is Replay
```

beyond provided context.

---

# Evaluation Integration

Evaluation jobs execute through:

```text
Same Runtime
```

---

# Rule

Evaluation is:

```text
Another Job Type
```

---

# Security Requirements

Workers may access only:

```text
Required Artifacts
```

for assigned execution.

---

# Forbidden

```text
Cross-Company Reads

Direct Registry Mutation

Direct Governance Mutation
```

---

# Scalability Requirements

Target:

```text
10,000+ companies

Thousands of concurrent jobs
```

---

# Requirements

```text
Stateless Workers

Distributed Execution

Queue Partitioning

Horizontal Scaling
```

---

# Disaster Recovery

Execution Layer must tolerate:

```text
Worker Crash

Node Failure

Queue Failure
```

---

# Recovery Strategy

```text
Requeue Job
```

---

# Architectural Invariants

LOCKED.

1. Execution Layer owns runtime execution.
2. Execution Layer never generates intelligence.
3. Workers are stateless.
4. Every execution has an isolated context.
5. Builder loading occurs through Builder Registry.
6. Locks prevent duplicate execution.
7. All artifact writes are atomic.
8. Every execution produces logs and metrics.
9. Replay uses the same runtime path as production.
10. Execution Layer is the runtime contract between Orchestrator and Builders.

End of Specification.