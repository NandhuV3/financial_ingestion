# Operational Monitoring

Status: LOCKED

---

# 1. Purpose

This document defines how the production platform is monitored.

Operational Monitoring answers one question:

> **Is the platform healthy, and if not, where is the problem?**

Unlike Observability, which records what happened, Operational Monitoring continuously evaluates platform health and surfaces conditions requiring attention.

Operational Monitoring does not perform recovery.

Recovery belongs to the Incident Response Contract.

---

# 2. Monitoring Principles

The platform follows five monitoring principles.

## Monitor Outcomes, Not Just Infrastructure

CPU and memory are important, but the primary concern is whether the intelligence pipeline is producing correct artifacts successfully.

---

## Every Critical Component Has Health Signals

Every production component must expose measurable health indicators.

No critical service operates without monitoring.

---

## Problems Must Be Detectable Early

Failures should be detected before they become customer-visible.

The platform should identify degrading conditions, not only complete failures.

---

## Monitoring Must Be Actionable

Every alert must identify

* what failed
* where it failed
* why it failed (when known)
* who or what should respond

---

## Dashboards Reflect Business Flow

Dashboards follow the architecture.

Engineers should be able to trace health from SEC Filing ingestion to Partner Domain output.

---

# 3. Monitoring Layers

Operational monitoring exists at multiple levels.

```text
Infrastructure

↓

Platform

↓

Pipeline

↓

Builders

↓

Artifacts

↓

Governance

↓

LLM

↓

Partner Domain
```

Each level exposes independent health indicators.

---

# 4. Platform Health Dashboard

The primary dashboard provides a high-level platform view.

Minimum widgets

* Platform Status
* Active Pipelines
* Queue Depth
* Current Processing Rate
* Success Rate
* Failure Rate
* Average End-to-End Duration
* Active Alerts
* Governance Queue Status
* LLM Usage
* Estimated Cost

This dashboard answers:

> Is the platform healthy right now?

---

# 5. Pipeline Dashboard

Displays execution health across the architecture.

Minimum metrics

* Filings Started
* Filings Completed
* Pipeline Success %
* Average Pipeline Duration
* Failed Pipelines
* Blocked Pipelines
* Retry Count
* First-Period Processing Count

Pipeline health follows the execution order defined in `002-platform-execution.md`.

---

# 6. Builder Dashboard

Every Builder exposes operational metrics.

Minimum metrics

* Execution Count
* Success Rate
* Failure Rate
* Average Duration
* P95 Duration
* Retry Count
* Validation Failures
* Parsing Failures
* Current Queue Length

Builders are monitored independently.

A healthy platform may still contain one unhealthy Builder.

---

# 7. Artifact Dashboard

Tracks artifact production.

Minimum metrics

* Artifacts Produced
* Schema Validation Failures
* Missing Lineage
* Invalid References
* Current Artifact Version
* Average Build Time

Artifacts should always validate successfully.

---

# 8. Governance Dashboard

Governance operations require dedicated monitoring.

Minimum metrics

* Promotion Requests
* Approved Promotions
* Rejected Promotions
* Manual Review Queue
* Average Review Time
* Oldest Pending Review
* Governance Throughput

A growing review queue is an operational issue.

---

# 9. Topic Registry Dashboard

Monitor the health of the Topic Registry.

Metrics include

* Active Topics
* Deprecated Topics
* Alias Count
* Pending Topic Proposals
* Registry Version
* Assignment Coverage
* Unclassified Theme Rate

Unexpected increases in unclassified Themes indicate registry drift.

---

# 10. Prompt Dashboard

Every LLM layer exposes prompt metrics.

Minimum metrics

* Prompt Version
* Prompt Activation Date
* Execution Count
* Prompt Failures
* Parsing Failures
* Average Tokens
* Average Latency
* Retry Rate

Prompt monitoring complements Prompt Registry governance.

---

# 11. LLM Dashboard

Tracks model execution health.

Metrics

* Requests
* Success Rate
* Timeout Rate
* Retry Rate
* Average Latency
* Token Usage
* Estimated Cost
* Validation Failure Rate

Model quality is evaluated separately.

This dashboard monitors operational health only.

---

# 12. Queue Monitoring

Every processing queue must be monitored.

Examples

* Filing Queue
* Builder Queue
* Governance Queue
* Retry Queue
* Dead Letter Queue

Required metrics

* Queue Size
* Oldest Item Age
* Processing Rate
* Failure Rate
* Average Wait Time

Growing queues indicate downstream bottlenecks.

---

# 13. Latency Monitoring

Latency is measured at multiple levels.

Platform

* End-to-End Processing Time

Builder

* Execution Duration

LLM

* Request Duration

Governance

* Review Time

Queue

* Wait Time

Latency trends are monitored continuously.

---

# 14. Cost Monitoring

Operational monitoring includes cost visibility.

Metrics

* Daily LLM Cost
* Cost per Filing
* Cost per Builder
* Cost per Company
* Monthly Projection
* Token Consumption

Unexpected cost growth should generate alerts.

---

# 15. Service Level Objectives (SLOs)

Each critical component defines target service levels.

Examples

* Filing Success Rate
* Builder Success Rate
* Pipeline Availability
* Prompt Validation Success
* Governance Processing Time

Specific thresholds are implementation-dependent but must be measurable.

---

# 16. Service Level Indicators (SLIs)

Examples

Pipeline SLI

* Successful pipeline executions / total executions

Builder SLI

* Successful Builder executions / total Builder executions

Prompt SLI

* Valid prompt executions / total prompt executions

Governance SLI

* Approved or completed governance decisions / submitted decisions

---

# 17. Alert Categories

Alerts are grouped by severity.

## Critical

Immediate platform failure.

Examples

* Pipeline unavailable
* Database unavailable
* Artifact corruption
* Prompt Registry unavailable

---

## High

Major functionality degraded.

Examples

* Builder repeatedly failing
* Governance queue stalled
* LLM timeout rate exceeding threshold

---

## Medium

Platform operational but degrading.

Examples

* Rising latency
* Increasing retry rate
* Queue growth

---

## Low

Informational.

Examples

* Registry updated
* Prompt activated
* New Builder deployed

Alert routing is defined in the Incident Response document.

---

# 18. Health States

Every monitored component reports one of four states.

```text
Healthy

↓

Degraded

↓

Unhealthy

↓

Unavailable
```

Health states are standardized across the platform.

---

# 19. Capacity Monitoring

Monitor long-term growth.

Metrics

* Companies Processed
* Filings Stored
* Artifact Growth
* Registry Growth
* Storage Consumption
* Database Size

Capacity trends support infrastructure planning.

---

# 20. Trend Monitoring

Monitoring is not limited to current status.

Historical trends are retained for

* latency
* throughput
* failures
* retries
* costs
* governance workload
* prompt usage

Long-term trends identify gradual degradation.

---

# 21. Operational Dashboards

Minimum production dashboards

1. Executive Platform Dashboard
2. Pipeline Dashboard
3. Builder Dashboard
4. Governance Dashboard
5. Prompt Dashboard
6. LLM Dashboard
7. Queue Dashboard
8. Cost Dashboard
9. Capacity Dashboard

Each dashboard serves a distinct operational purpose.

---

# 22. Success Criteria

Operational Monitoring is considered complete when:

* Every critical component has measurable health indicators.
* Every queue is monitored.
* Every Builder exposes operational metrics.
* Every pipeline execution contributes health data.
* Governance workload is visible.
* LLM latency and cost are continuously tracked.
* Platform health can be understood without inspecting logs.

Operational Monitoring answers one question:

> **Can operators confidently determine whether the platform is healthy and identify the source of problems before users are affected?**
