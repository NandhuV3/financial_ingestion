# 060-storage-architecture-spec.md

Version: 1.0
Status: LOCKED
Owner: Platform Infrastructure

Depends On:

- 012-artifact-framework-spec.md
- 014-dependency-index-spec.md
- 015-invalidation-engine-spec.md
- 016-concept-registry-spec.md
- 017-evaluation-architecture-spec.md

Applies To:

- All Artifacts
- All Builders
- Prompt Registry
- Dependency Index
- Evaluation System
- Governance Systems

---

# Purpose

This specification defines the complete storage architecture for the platform.

The storage architecture must support:

```text
10,000+ Companies

Replayability

Auditability

Versioning

Governance

Incremental Processing

Hybrid Invalidation
```

---

# Architectural Principle

Storage exists to preserve:

```text
Truth

History

Lineage
```

not merely data.

---

# Core Design Goals

1. Replayability
2. Auditability
3. Incremental Processing
4. Governance
5. Cost Efficiency
6. Operational Simplicity
7. Scale

---

# Storage Philosophy

The platform stores:

```text
Artifacts
```

not raw prompts.

The platform stores:

```text
Decisions
```

not only outputs.

The platform stores:

```text
History
```

not only current state.

---

# Storage Domains

The storage architecture is divided into:

```text
Artifact Store

Registry Store

Dependency Store

Evaluation Store

Governance Store

Operational Store
```

---

# High-Level Architecture

```text
Artifact Store
        ↓

Dependency Index
        ↓

Invalidation Engine
        ↓

Evaluation Store

Governance Store

Operational Store
```

---

# Storage Categories

## Category 1

Artifact Storage

---

# Purpose

Stores:

```text
Business Intelligence Artifacts
```

---

# Examples

```text
Themes

Topic Assignment

Structured Intelligence

Company Knowledge

Business Signals

Trust Artifacts

Quarter Understanding

Investor Intelligence

Partner Domain
```

---

# Artifact Store Rules

Artifacts are:

```text
Immutable
```

---

# Never Updated

Allowed actions:

```text
Create

Read
```

---

# Forbidden

```text
Update

Delete
```

---

# Reason

Supports:

```text
Replayability

Auditability
```

---

# Artifact Storage Model

```typescript
type ArtifactRecord = {
  artifact_id: string;

  artifact_type: string;

  version: number;

  content: object;

  metadata: ArtifactMetadata;

  lineage: ArtifactLineage;

  created_at: string;
};
```

---

# Artifact Key

```typescript
{
  artifact_type,
  company_id,
  period_id,
  version
}
```

---

# Current Artifact Resolution

Current versions are NOT determined by:

```text
Latest Row
```

---

# Source Of Truth

```text
Dependency Index
```

---

# Reason

Supports rollback.

---

# Artifact Retention

```text
Permanent
```

---

# No TTL

Allowed.

---

# Category 2

Registry Storage

---

# Purpose

Stores governed registries.

---

# Registries

```text
Topic Registry

Concept Registry

Prompt Registry
```

---

# Registry Rules

Registries are:

```text
Versioned
```

---

# Never Overwritten

---

# Registry Version Model

```typescript
type RegistryVersion = {
  registry_id: string;

  version: string;

  payload: object;

  activated_at: string;
};
```

---

# Active Registry

Resolved through:

```text
Registry Pointer
```

---

# Reason

Allows:

```text
Rollback

Historical Replay
```

---

# Category 3

Dependency Store

---

# Purpose

Stores:

```text
Dependency Graph
```

---

# Source Of Truth

```text
Dependency Index
```

---

# Dependency Node

```typescript
type DependencyNode = {
  artifact_id: string;

  artifact_type: string;

  status:
    "current"
    | "candidate_stale"
    | "stale";

  upstream: string[];

  downstream: string[];
};
```

---

# Critical Rule

Dependency Store is:

```text
Operational Truth
```

---

# Not Artifact Store

---

# Category 4

Evaluation Store

---

# Purpose

Stores:

```text
Evaluation Results

Calibration Results

Ground Truth Corpus

Regression Results
```

---

# Retention

Permanent.

---

# Reason

Required for:

```text
Prompt Governance

Calibration

Auditability
```

---

# Evaluation Record

```typescript
type EvaluationRecord = {
  evaluation_id: string;

  artifact_id: string;

  scores: object;

  evaluator: string;

  created_at: string;
};
```

---

# Category 5

Governance Store

---

# Purpose

Stores:

```text
Governance Decisions
```

---

# Examples

```text
Knowledge Promotions

Concept Approvals

Prompt Activations

Registry Changes
```

---

# Governance Rules

Every decision is:

```text
Permanent
```

---

# Never Deleted

---

# Governance Record

```typescript
type GovernanceRecord = {
  decision_id: string;

  entity_type: string;

  decision: string;

  reviewer: string;

  timestamp: string;
};
```

---

# Category 6

Operational Store

---

# Purpose

Stores:

```text
Jobs

Queues

Metrics

Processing State
```

---

# Examples

```text
Build Jobs

Retry Jobs

Event Queue

Metrics
```

---

# Retention

Configurable.

---

# May Expire

Allowed.

---

# Storage Separation Principle

Critical.

---

# Intelligence Storage

Must NEVER share tables with:

```text
Operational Data
```

---

# Reason

Operational cleanup must never affect intelligence history.

---

# Storage Layers

## Layer 1

Hot Storage

---

# Purpose

Current artifacts.

---

# Characteristics

```text
Low Latency

Frequently Accessed
```

---

# Contents

```text
Current Artifacts

Current Registries

Current Dependency State
```

---

# Layer 2

Warm Storage

---

# Purpose

Historical access.

---

# Characteristics

```text
Moderate Latency
```

---

# Contents

```text
Artifact History

Registry History

Evaluation History
```

---

# Layer 3

Cold Storage

---

# Purpose

Long-term archive.

---

# Characteristics

```text
Low Cost

High Latency
```

---

# Contents

```text
Archived Artifacts

Archived Evaluations

Historical Snapshots
```

---

# Content Hash Storage

Mandatory.

---

# Stored On

Every Artifact.

---

# Schema

```typescript
output_content_hash: string;
```

---

# Purpose

Supports:

```text
Hybrid Invalidation
```

---

# Input Hash Storage

Mandatory.

---

# Schema

```typescript
input_hash: string;
```

---

# Purpose

Supports:

```text
Replayability
```

---

# Lineage Storage

Mandatory.

---

# Stored With

Every Artifact.

---

# Required Fields

```text
Prompt Version

Model Version

Input Hash

Output Hash

Evaluation Version
```

---

# Storage Optimization

Allowed:

```text
Compression

Partitioning

Archival Tiering
```

---

# Forbidden

```text
Artifact Mutation
```

---

# Multi-Tenancy

Future Requirement.

---

# Isolation Unit

```text
Company
```

---

# Rule

No company may access another company's artifacts.

---

# Auditability Requirements

Every write must produce:

```text
Audit Record
```

---

# Audit Record Schema

```typescript
type AuditEvent = {
  event_id: string;

  entity_id: string;

  action: string;

  actor: string;

  timestamp: string;
};
```

---

# Backup Strategy

Required.

---

# Backup Scope

```text
Artifact Store

Registry Store

Governance Store

Dependency Store
```

---

# Backup Frequency

```text
Daily
```

minimum.

---

# Recovery Objective

```text
RPO < 24 Hours

RTO < 4 Hours
```

---

# Disaster Recovery

Must support:

```text
Full Replay
```

from:

```text
Artifacts

Registries

Dependency Index
```

---

# Scalability Requirements

Target:

```text
10,000+ companies

100,000+ periods

Millions of artifacts
```

---

# Storage Must Support

```text
Horizontal Scaling

Partitioning

Incremental Reads

Incremental Writes
```

---

# Architectural Invariants

LOCKED.

1. Artifacts are immutable.
2. Artifact history is permanent.
3. Registries are versioned.
4. Governance decisions are permanent.
5. Dependency Index is operational truth.
6. Current state is resolved through pointers, not latest rows.
7. Every artifact stores lineage.
8. Every artifact stores content hashes.
9. Operational data is separated from intelligence data.
10. Replayability and auditability take priority over storage convenience.

End of Specification.