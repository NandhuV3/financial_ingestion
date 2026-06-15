# 064-api-contracts-spec.md

Version: 1.0
Status: LOCKED
Owner: Platform Infrastructure

Depends On:

- 012-artifact-framework-spec.md
- 014-dependency-index-spec.md
- 016-concept-registry-spec.md
- 017-evaluation-architecture-spec.md
- 060-storage-architecture-spec.md
- 061-processing-orchestrator-spec.md
- 063-event-model-spec.md

Applies To:

- Internal APIs
- External APIs
- Partner APIs
- Administrative APIs

---

# Purpose

This specification defines all platform API contracts.

The API Layer is:

```text
The Boundary Layer
```

between the platform and external consumers.

---

# Architectural Principle

APIs expose:

```text
Capabilities
```

not:

```text
Implementation Details
```

---

# Core Design Goals

1. Stability
2. Auditability
3. Versioning
4. Security
5. Replayability
6. Partner Integration
7. Operational Safety

---

# API Categories

The platform exposes:

```text
Artifact APIs

Build APIs

Replay APIs

Governance APIs

Registry APIs

Evaluation APIs

Operational APIs
```

---

# API Architecture

```text
Clients
      ↓

API Gateway
      ↓

Platform APIs
      ↓

Services
```

---

# Critical Rule

Clients never access:

```text
Artifact Store

Dependency Store

Registry Store
```

directly.

---

# All Access

Must occur through:

```text
API Contracts
```

---

# API Versioning

Mandatory.

---

# Format

```text
/v1/
```

---

# Example

```http
GET /v1/artifacts/{artifact_id}
```

---

# Breaking Changes

Forbidden.

---

# New Fields

Allowed.

---

# Authentication

Required.

---

# Supported Modes

```text
Service Authentication

Partner Authentication

Operator Authentication
```

---

# Anonymous Access

Forbidden.

---

# Authorization Model

Role Based Access Control (RBAC)

---

# Roles

```text
Reader

Operator

Governance Reviewer

Administrator

Partner
```

---

# Principle

Least Privilege.

---

# Category 1

Artifact APIs

---

# Purpose

Retrieve platform artifacts.

---

# Endpoint

Get Artifact

```http
GET /v1/artifacts/{artifact_id}
```

---

# Response

```typescript
type ArtifactResponse = {
  artifact_id: string;

  artifact_type: string;

  version: number;

  metadata: object;

  lineage: object;

  content: object;
};
```

---

# Endpoint

Get Current Artifact

```http
GET /v1/companies/{company_id}/periods/{period_id}/artifacts/{artifact_type}
```

---

# Resolution Rule

Current version resolved through:

```text
Dependency Index
```

---

# Not

Latest Stored Version.

---

# Endpoint

Artifact History

```http
GET /v1/artifacts/{artifact_id}/history
```

---

# Purpose

Retrieve prior versions.

---

# Category 2

Build APIs

---

# Purpose

Trigger platform processing.

---

# Endpoint

Submit Filing

```http
POST /v1/filings
```

---

# Request

```typescript
type FilingSubmissionRequest = {
  company_id: string;

  filing_type: string;

  filing_date: string;

  filing_content: string;
};
```

---

# Response

```typescript
type FilingSubmissionResponse = {
  filing_id: string;

  processing_status: string;
};
```

---

# Trigger

Creates:

```text
FilingReceivedEvent
```

---

# Endpoint

Manual Rebuild

```http
POST /v1/rebuild
```

---

# Request

```typescript
type RebuildRequest = {
  company_id: string;

  period_id: string;

  artifact_type: string;
};
```

---

# Rule

Operator Role Required.

---

# Endpoint

Build Status

```http
GET /v1/jobs/{job_id}
```

---

# Category 3

Replay APIs

---

# Purpose

Historical reconstruction.

---

# Endpoint

Replay Artifact

```http
POST /v1/replay
```

---

# Request

```typescript
type ReplayRequest = {
  company_id: string;

  period_id: string;

  artifact_type: string;

  target_version: string;
};
```

---

# Response

```typescript
type ReplayResponse = {
  replay_id: string;

  status: string;
};
```

---

# Replay Rule

Replay never modifies:

```text
Current State
```

---

# Replay Output

Stored separately.

---

# Endpoint

Replay Status

```http
GET /v1/replays/{replay_id}
```

---

# Category 4

Governance APIs

---

# Purpose

Governed platform decisions.

---

# Endpoint

Review Concept Proposal

```http
POST /v1/governance/concepts/{proposal_id}/review
```

---

# Request

```typescript
type ConceptReviewRequest = {
  decision:
    "approve"
    | "reject"
    | "merge";

  notes: string;
};
```

---

# Endpoint

Review Knowledge Promotion

```http
POST /v1/governance/knowledge/{proposal_id}/review
```

---

# Endpoint

Prompt Activation

```http
POST /v1/governance/prompts/{prompt_version}/activate
```

---

# Governance Rule

All governance actions produce:

```text
Governance Events
```

---

# Category 5

Registry APIs

---

# Purpose

Manage registries.

---

# Supported Registries

```text
Prompt Registry

Concept Registry

Topic Registry
```

---

# Endpoint

Get Registry Version

```http
GET /v1/registries/{registry_type}/{version}
```

---

# Endpoint

Get Active Registry

```http
GET /v1/registries/{registry_type}/active
```

---

# Endpoint

Create Registry Version

```http
POST /v1/registries/{registry_type}
```

---

# Rule

Creation ≠ Activation.

---

# Endpoint

Activate Registry Version

```http
POST /v1/registries/{registry_type}/{version}/activate
```

---

# Category 6

Evaluation APIs

---

# Purpose

Access evaluation data.

---

# Endpoint

Get Evaluation

```http
GET /v1/evaluations/{artifact_id}
```

---

# Response

```typescript
type EvaluationResponse = {
  artifact_id: string;

  scores: object;

  evaluator: string;

  evaluation_version: string;
};
```

---

# Endpoint

Ground Truth Corpus

```http
GET /v1/evaluation/corpus
```

---

# Endpoint

Calibration Results

```http
GET /v1/evaluation/calibration
```

---

# Endpoint

Regression Results

```http
GET /v1/evaluation/regression
```

---

# Category 7

Operational APIs

---

# Purpose

Platform operations.

---

# Endpoint

Queue Status

```http
GET /v1/operations/queues
```

---

# Endpoint

Dependency Status

```http
GET /v1/operations/dependencies/{artifact_id}
```

---

# Endpoint

Invalidation Status

```http
GET /v1/operations/invalidation/{artifact_id}
```

---

# Endpoint

System Health

```http
GET /v1/operations/health
```

---

# Endpoint

Metrics

```http
GET /v1/operations/metrics
```

---

# Search APIs

---

# Endpoint

Artifact Search

```http
POST /v1/search/artifacts
```

---

# Request

```typescript
type ArtifactSearchRequest = {
  company_id?: string;

  artifact_type?: string;

  period_id?: string;

  version?: number;
};
```

---

# Search Rule

Searches metadata.

---

# Not full artifact content.

---

# Pagination

Mandatory.

---

# Response Schema

```typescript
type Pagination = {
  page: number;

  page_size: number;

  total_results: number;
};
```

---

# Maximum Page Size

```text
100
```

---

# Rate Limiting

Mandatory.

---

# Purpose

Protect platform stability.

---

# Example

```text
100 requests/minute
```

per client.

---

# Idempotency

Required for:

```text
POST

PUT

PATCH
```

operations.

---

# Header

```http
Idempotency-Key
```

---

# Reason

Supports retries.

---

# Error Model

Standardized.

---

# Error Schema

```typescript
type ApiError = {
  error_code: string;

  message: string;

  correlation_id: string;
};
```

---

# Example Error Codes

```text
ARTIFACT_NOT_FOUND

ACCESS_DENIED

INVALID_REQUEST

GOVERNANCE_REQUIRED

REPLAY_FAILED
```

---

# Correlation IDs

Mandatory.

---

# Purpose

Trace requests across:

```text
APIs

Events

Jobs

Artifacts
```

---

# Audit Requirements

All write operations generate:

```text
Audit Events
```

---

# Examples

```text
Replay Requested

Prompt Activated

Concept Approved
```

---

# Security Requirements

Sensitive fields must be:

```text
Masked

Encrypted

Access Controlled
```

---

# Partner APIs

Partners receive:

```text
Presentation Artifacts
```

only.

---

# Forbidden

Partner access to:

```text
Dependency Index

Governance Records

Internal Metrics
```

---

# API Response Principle

APIs return:

```text
Artifacts

Status

Metadata
```

---

# APIs never return:

```text
Database Structures
```

---

# Scalability Requirements

Target:

```text
10,000+ Companies

Millions Of Artifacts

Thousands Of Concurrent Requests
```

---

# Infrastructure Requirements

```text
Load Balancing

Horizontal Scaling

Caching

Rate Limiting
```

---

# Architectural Invariants

LOCKED.

1. APIs are the only external access path.
2. Direct database access is forbidden.
3. APIs are versioned.
4. Authentication is mandatory.
5. Authorization uses RBAC.
6. Replay never mutates production state.
7. Governance actions produce governance events.
8. Registry creation and activation are separate operations.
9. All write operations are auditable.
10. APIs expose capabilities, not implementation details.

End of Specification.