# 065-observability-spec.md

Version: 1.0
Status: LOCKED
Owner: Platform Infrastructure

Depends On:

- 060-storage-architecture-spec.md
- 061-processing-orchestrator-spec.md
- 062-job-execution-spec.md
- 063-event-model-spec.md
- 064-api-contracts-spec.md

Applies To:

- All Services
- All Builders
- All APIs
- All Jobs
- All Governance Workflows

---

# Purpose

This specification defines the complete observability architecture for the platform.

Observability answers:

```text
What Happened?

Why Did It Happen?

When Did It Happen?

What Is Broken?

What Will Break Soon?
```

---

# Architectural Principle

Observability exists to explain:

```text
System Behavior
```

not merely collect logs.

---

# Core Design Goals

1. Auditability
2. Debuggability
3. Replayability
4. Operational Visibility
5. Incident Response
6. Capacity Planning
7. Governance Transparency

---

# Observability Architecture

The platform consists of four observability pillars:

```text
Metrics

Logs

Tracing

Audit Trails
```

---

# Architecture

```text
Services
      ↓

Metrics
Logs
Traces
Audit Events
      ↓

Observability Platform
      ↓

Dashboards

Alerts

Reports

Incident Response
```

---

# Pillar 1

Metrics

---

# Purpose

Measure:

```text
System Health
```

---

# Metrics Categories

```text
Platform Metrics

Builder Metrics

Job Metrics

API Metrics

Evaluation Metrics

Governance Metrics
```

---

# Platform Metrics

Track:

```text
Artifacts Generated

Jobs Executed

Events Produced

Events Consumed

Replay Success Rate
```

---

# Example Schema

```typescript
type PlatformMetrics = {
  artifacts_generated: number;

  jobs_executed: number;

  events_processed: number;

  replay_success_rate: number;
};
```

---

# Builder Metrics

Every builder must emit:

```text
Execution Duration

Success Rate

Failure Rate

Token Usage
```

---

# Example

```typescript
type BuilderMetrics = {
  builder_type: string;

  execution_time_ms: number;

  success: boolean;

  token_usage: number;
};
```

---

# Job Metrics

Track:

```text
Queue Depth

Queue Age

Retry Rate

Timeout Rate

Failure Rate
```

---

# API Metrics

Track:

```text
Request Volume

Latency

Error Rate

Authentication Failures
```

---

# Required Percentiles

```text
P50

P95

P99
```

---

# Evaluation Metrics

Track:

```text
Calibration Error

Ground Truth Accuracy

Regression Failures

Prompt Activation Success
```

---

# Governance Metrics

Track:

```text
Review Queue Age

Review Throughput

Approval Rate

Merge Rate

Deprecation Rate
```

---

# Pillar 2

Logging

---

# Purpose

Capture:

```text
Execution Detail
```

---

# Logging Principle

Logs explain:

```text
What Happened
```

Metrics explain:

```text
How Often
```

---

# Log Categories

```text
Execution Logs

API Logs

Governance Logs

Security Logs

Replay Logs
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

# API Log Schema

```typescript
type ApiLog = {
  request_id: string;

  endpoint: string;

  status_code: number;

  duration_ms: number;

  timestamp: string;
};
```

---

# Log Levels

Supported:

```text
DEBUG

INFO

WARN

ERROR

CRITICAL
```

---

# Production Rule

Default:

```text
INFO
```

---

# Sensitive Data Rule

Forbidden In Logs:

```text
Raw Filings

Secrets

Credentials

Tokens

PII
```

---

# Pillar 3

Distributed Tracing

---

# Purpose

Trace:

```text
End-To-End Workflow
```

across services.

---

# Example

```text
Filing Submitted
      ↓

Themes
      ↓

Structured Intelligence
      ↓

Investor Intelligence
```

---

# Trace Schema

```typescript
type Trace = {
  trace_id: string;

  span_id: string;

  parent_span_id: string | null;

  operation: string;

  start_time: string;

  end_time: string;
};
```

---

# Required Trace Coverage

```text
API Requests

Builder Executions

Governance Workflows

Replay Workflows
```

---

# Correlation Principle

Every trace must connect to:

```text
Correlation ID
```

from Event Model.

---

# Trace Retention

Minimum:

```text
90 Days
```

---

# Pillar 4

Audit Trails

---

# Purpose

Capture:

```text
Business Decisions
```

---

# Difference

Logs:

```text
Operational History
```

Audit Trails:

```text
Decision History
```

---

# Audit Categories

```text
Governance

Registry Changes

Prompt Activations

Knowledge Promotions

Replay Requests

Security Events
```

---

# Audit Schema

```typescript
type AuditEvent = {
  audit_id: string;

  actor: string;

  action: string;

  entity_type: string;

  entity_id: string;

  timestamp: string;
};
```

---

# Audit Rule

Audit events are:

```text
Immutable

Permanent
```

---

# Never Deleted

---

# Service Level Objectives

SLOs

---

# API Availability

Target:

```text
99.9%
```

---

# Job Success Rate

Target:

```text
99.5%
```

---

# Replay Success Rate

Target:

```text
99%
```

---

# Event Delivery Success

Target:

```text
99.99%
```

---

# Governance Review SLA

Target:

```text
< 14 Days
```

---

# Observability Dashboards

Required.

---

# Dashboard 1

Platform Health

---

# Displays

```text
Artifact Throughput

Job Throughput

Error Rates

Availability
```

---

# Dashboard 2

Builder Health

---

# Displays

```text
Execution Times

Failures

Token Usage

Success Rates
```

---

# Dashboard 3

Governance Dashboard

---

# Displays

```text
Pending Reviews

Review SLA

Approval Trends
```

---

# Dashboard 4

Evaluation Dashboard

---

# Displays

```text
Calibration

Accuracy

Regression Status

Ground Truth Coverage
```

---

# Dashboard 5

Replay Dashboard

---

# Displays

```text
Replay Requests

Replay Success

Replay Failures
```

---

# Dashboard 6

Security Dashboard

---

# Displays

```text
Authentication Failures

Authorization Failures

Audit Events
```

---

# Alerting

Mandatory.

---

# Alert Severity

```text
INFO

WARNING

CRITICAL
```

---

# Critical Alerts

```text
Queue Backlog

Replay Failure

Worker Failure

Dependency Deadlock

Event Bus Failure

Artifact Persistence Failure
```

---

# Warning Alerts

```text
High Latency

Elevated Retry Rate

Governance SLA Risk

Evaluation Drift
```

---

# Incident Management

Required.

---

# Incident Levels

```text
P1

P2

P3

P4
```

---

# P1 Example

```text
Investor Intelligence Generation Stopped
```

---

# P2 Example

```text
Replay Service Unavailable
```

---

# Incident Schema

```typescript
type Incident = {
  incident_id: string;

  severity: string;

  summary: string;

  created_at: string;

  resolved_at: string | null;
};
```

---

# Capacity Planning

Track:

```text
Storage Growth

Artifact Growth

Event Growth

Token Consumption

Queue Growth
```

---

# Forecast Horizon

Minimum:

```text
12 Months
```

---

# Evaluation Monitoring

Special Requirement.

---

# Track

```text
Calibration Drift

Prompt Drift

Concept Growth

Ontology Growth

Trust Signal Distribution
```

---

# Purpose

Prevent:

```text
Silent Quality Degradation
```

---

# Governance Monitoring

Track:

```text
Proposal Backlog

Concept Approval Latency

Prompt Review Latency
```

---

# Hybrid Invalidation Monitoring

Track:

```text
Propagation Stopped

Propagation Continued

Regeneration Savings
```

---

# Example Metrics

```typescript
type InvalidationMetrics = {
  candidate_stale_count: number;

  propagation_stopped_count: number;

  propagation_continued_count: number;

  llm_calls_saved: number;
};
```

---

# Security Monitoring

Track:

```text
Unauthorized Access Attempts

Privilege Escalation Attempts

Audit Trail Violations
```

---

# Data Retention

Metrics:

```text
2 Years
```

---

# Logs:

```text
1 Year
```

---

# Traces:

```text
90 Days
```

---

# Audit Trails:

```text
Permanent
```

---

# Scalability Requirements

Target:

```text
10,000+ Companies

Millions Of Artifacts

Millions Of Events
```

---

# Observability Platform Must Support

```text
Horizontal Scaling

Long-Term Retention

Real-Time Dashboards

Distributed Tracing
```

---

# Architectural Invariants

LOCKED.

1. Observability consists of metrics, logs, traces, and audit trails.
2. Audit trails are permanent.
3. Sensitive data is forbidden in logs.
4. Every workflow must be traceable end-to-end.
5. Correlation IDs are mandatory.
6. Critical failures generate alerts.
7. Governance actions are auditable.
8. Replay operations are observable.
9. Hybrid invalidation effectiveness is measured.
10. Observability exists to explain system behavior, not merely collect telemetry.

End of Specification.