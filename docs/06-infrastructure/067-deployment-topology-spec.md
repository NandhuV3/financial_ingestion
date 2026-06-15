# 067-deployment-topology-spec.md

Version: 1.0
Status: LOCKED
Owner: Platform Infrastructure

Depends On:

- 060-storage-architecture-spec.md
- 061-processing-orchestrator-spec.md
- 062-job-execution-spec.md
- 063-event-model-spec.md
- 064-api-contracts-spec.md
- 065-observability-spec.md
- 066-security-governance-spec.md

Applies To:

- All Platform Services
- All Builders
- All Storage Systems
- All Infrastructure Components

---

# Purpose

This specification defines the complete deployment topology of the platform.

The deployment topology determines:

```text
Where Components Run

How Components Communicate

How Components Scale

How Components Fail

How Components Recover
```

---

# Architectural Principle

Deployment topology exists to support:

```text
Scalability

Reliability

Isolation

Operational Simplicity
```

---

# Core Design Goals

1. Horizontal Scalability
2. High Availability
3. Fault Isolation
4. Operational Simplicity
5. Replayability
6. Cost Efficiency
7. Disaster Recovery

---

# High-Level Topology

```text
Users / Partners
          ↓

API Gateway
          ↓

Platform Services
          ↓

Event Bus
          ↓

Workers
          ↓

Storage Systems
```

---

# Platform Layers

The deployment architecture consists of:

```text
Presentation Layer

API Layer

Control Plane

Execution Plane

Storage Plane

Observability Plane
```

---

# Layer 1

Presentation Layer

---

# Purpose

Human and external interaction.

---

# Components

```text
Admin UI

Governance UI

Partner UI

Operator UI
```

---

# Responsibilities

```text
Visualization

Review Workflows

Operational Management
```

---

# Rule

Presentation Layer never accesses:

```text
Storage Directly
```

---

# Layer 2

API Layer

---

# Purpose

External platform boundary.

---

# Components

```text
API Gateway

Authentication Service

Authorization Service

API Services
```

---

# Responsibilities

```text
Authentication

Authorization

Request Routing

Rate Limiting
```

---

# Rule

All external access flows through:

```text
API Gateway
```

---

# Layer 3

Control Plane

---

# Purpose

Coordinate platform execution.

---

# Components

```text
Processing Orchestrator

Dependency Index Service

Invalidation Engine

Governance Engine

Registry Services
```

---

# Responsibilities

```text
Scheduling

Dependency Resolution

Governance

State Coordination
```

---

# Architectural Rule

Control Plane:

```text
Coordinates Work
```

---

# Does Not Execute Work

---

# Layer 4

Execution Plane

---

# Purpose

Artifact generation.

---

# Components

```text
Themes Workers

Structured Intelligence Workers

Quarter Understanding Workers

Investor Intelligence Workers

Evaluation Workers
```

---

# Responsibilities

```text
Builder Execution

Artifact Production

Evaluation
```

---

# Architectural Rule

Workers are:

```text
Stateless
```

---

# Required

For horizontal scaling.

---

# Layer 5

Storage Plane

---

# Purpose

Persistent platform state.

---

# Components

```text
Artifact Store

Registry Store

Governance Store

Event Store

Evaluation Store

Dependency Store
```

---

# Responsibilities

```text
Persistence

Versioning

Auditability
```

---

# Architectural Rule

Storage Plane is:

```text
Source Of Truth
```

---

# Layer 6

Observability Plane

---

# Purpose

Operational visibility.

---

# Components

```text
Metrics

Logging

Tracing

Audit Systems
```

---

# Responsibilities

```text
Monitoring

Alerting

Investigation
```

---

# Deployment Units

The platform deploys using:

```text
Independent Services
```

---

# Not

```text
Monolith
```

---

# Reason

Supports:

```text
Independent Scaling

Fault Isolation
```

---

# Core Services

Required Services:

```text
API Service

Orchestrator Service

Dependency Service

Invalidation Service

Registry Service

Governance Service

Replay Service

Evaluation Service
```

---

# Worker Pools

Builders deploy as:

```text
Worker Pools
```

---

# Example

```text
Themes Worker Pool

Structured Intelligence Worker Pool

Quarter Understanding Worker Pool

Investor Intelligence Worker Pool
```

---

# Scaling Rule

Worker pools scale independently.

---

# Event Bus

Critical.

---

# Purpose

Connect services.

---

# Responsibilities

```text
Event Distribution

Decoupling

Asynchronous Processing
```

---

# Event Delivery

```text
At Least Once
```

---

# Event Retention

Minimum:

```text
30 Days
```

---

# Queue Architecture

Required Queues:

```text
Build Queue

Regeneration Queue

Replay Queue

Evaluation Queue
```

---

# Queue Isolation

Each queue scales independently.

---

# Reason

Prevents:

```text
Backlog Contagion
```

---

# Example

Replay backlog must not block:

```text
New Filing Processing
```

---

# Service Communication

Preferred:

```text
Asynchronous Events
```

---

# Allowed

```text
Synchronous APIs
```

for:

```text
Reads

Governance Actions

Registry Queries
```

---

# Forbidden

Deep synchronous chains.

---

# Example

Forbidden:

```text
API
 ↓
Service A
 ↓
Service B
 ↓
Service C
 ↓
Service D
```

---

# Reason

Failure amplification.

---

# Deployment Environments

Required.

---

# Environment Types

```text
Development

Testing

Staging

Production
```

---

# Rule

Production data must never be used:

```text
Directly
```

in:

```text
Development
```

---

# Environment Isolation

Mandatory.

---

# Scaling Model

Target:

```text
10,000+ Companies
```

---

# Scaling Strategy

```text
Horizontal
```

---

# Scale Units

```text
API Instances

Worker Instances

Queue Consumers
```

---

# Not

Vertical-first scaling.

---

# Availability Targets

API Layer

```text
99.9%
```

---

# Event Bus

```text
99.99%
```

---

# Storage Plane

```text
99.99%
```

---

# Control Plane

```text
99.9%
```

---

# Fault Isolation

Critical.

---

# Failure Domain

```text
Service
```

---

# Example

Investor Intelligence failure must not stop:

```text
Themes

Structured Intelligence

Company Knowledge
```

---

# Cascading Failures

Must be minimized.

---

# Disaster Recovery

Required.

---

# Recovery Objectives

```text
RPO < 24 Hours

RTO < 4 Hours
```

---

# Backup Scope

```text
Artifact Store

Registry Store

Governance Store

Event Store
```

---

# Replay Recovery

Supported.

---

# Requirement

Platform must support:

```text
Rebuilding Derived Artifacts
```

from:

```text
Stored Inputs
```

---

# Multi-Region Strategy

Future Requirement.

---

# Phase 1

Single Region.

---

# Phase 2

Active-Passive.

---

# Phase 3

Multi-Region Active-Active.
```

---

# Deployment Security

Required.

---

# Controls

```text
Network Segmentation

Service Authentication

Encrypted Communication

Secret Management
```

---

# Rule

Services trust:

```text
Identity
```

not:

```text
Network Location
```

---

# Infrastructure Security

Required.

---

# Access Types

```text
Operator Access

Service Access

Emergency Access
```

---

# Emergency Access

Must be:

```text
Audited
```

---

# Cost Management

Track:

```text
Compute Cost

Storage Cost

LLM Cost

Replay Cost
```

---

# Capacity Planning

Forecast:

```text
12 Months
```

minimum.

---

# Observability Integration

Mandatory.

---

# Every Service Must Emit

```text
Metrics

Logs

Traces

Audit Events
```

---

# Health Checks

Required.

---

# Service Types

```text
API Services

Control Plane Services

Workers
```

---

# Health Status

```typescript
type HealthStatus =
  | "healthy"
  | "degraded"
  | "unhealthy";
```

---

# Auto-Recovery

Supported.

---

# Example

```text
Worker Crash
      ↓
Automatic Restart
```

---

# Deployment Pipeline

Required.

---

# Deployment Stages

```text
Build

Test

Validate

Deploy

Observe
```

---

# Governance Requirement

Production deployment requires:

```text
Approval
```

for:

```text
Prompt Changes

Registry Activations

Governance Engine Changes
```

---

# Blue-Green Deployment

Preferred.

---

# Reason

Supports:

```text
Safe Rollback
```

---

# Rollback Capability

Mandatory.

---

# Rollback Targets

```text
Services

Prompts

Registries
```

---

# Architectural Invariants

LOCKED.

1. Platform is service-oriented, not monolithic.
2. Control Plane coordinates work but does not execute builders.
3. Execution Plane is stateless.
4. Event Bus is the primary integration mechanism.
5. Worker pools scale independently.
6. Storage Plane is the source of truth.
7. Fault isolation is a first-class requirement.
8. Horizontal scaling is the default scaling strategy.
9. Replayability is a deployment requirement.
10. Every service must be observable and recoverable.

End of Specification.