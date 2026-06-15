# 053-company-knowledge-builder-spec.md

Version: 1.0
Status: LOCKED
Owner: Builder Layer

Depends On:

- 003-company-knowledge.md
- 009-company-knowledge-governance.md
- 012-artifact-framework-spec.md
- 014-dependency-index-spec.md
- 015-invalidation-engine-spec.md
- 023-company-knowledge-builder-spec.md
- 024-company-knowledge-governance-engine-spec.md
- 025-company-knowledge-spec.md

Consumes:

- Structured Intelligence Artifact
- Existing Company Knowledge Artifact
- Company Knowledge Archive

Produces:

- Company Knowledge Candidate
- Company Knowledge Artifact

---

# Purpose

This specification defines how the Company Knowledge Builder constructs:

```text
Company Knowledge
```

from:

```text
Structured Intelligence

+

Historical Company Knowledge
```

This is the first builder that creates:

```text
Persistent Intelligence
```

instead of:

```text
Period Intelligence
```

---

# Architectural Position

```text
Structured Intelligence
          ↓

Company Knowledge Builder
          ↓

Governance Engine
          ↓

Company Knowledge
          ↓

Business Signals

Quarter Understanding

Investor Intelligence
```

---

# Core Responsibility

Transform:

```text
Period Understanding
```

into:

```text
Durable Company Memory
```

under governance control.

---

# Architectural Principle

Company Knowledge Builder:

```text
Suggests
```

Knowledge changes.

Governance Engine:

```text
Approves
```

Knowledge changes.

---

# Critical Rule

Builder does NOT modify:

```text
Company Knowledge
```

directly.

---

# Builder Ownership

Company Knowledge Builder owns:

- structured intelligence ingestion
- historical knowledge retrieval
- candidate generation
- field classification
- evidence packaging
- promotion proposal generation
- lineage creation

Builder does NOT own:

- promotion decisions
- governance decisions
- merge decisions
- human review decisions

---

# Input Contract

```typescript
type CompanyKnowledgeBuilderInput = {
  company_id: string;

  period_id: string;

  filing_id: string;
};
```

---

# Required Upstream Resolution

Builder resolves:

```text
Structured Intelligence
```

through:

```text
Dependency Index
```

---

# Required Historical Resolution

Builder resolves:

```text
Current Company Knowledge

Company Knowledge Archive
```

---

# Resolution Sources

```text
Dependency Index

Knowledge Store

Knowledge Archive
```

---

# Builder Flow

```text
1. Resolve Structured Intelligence

2. Resolve Current Knowledge

3. Resolve Knowledge History

4. Build Candidate Knowledge

5. Classify Changes

6. Generate Promotion Proposals

7. Create Candidate Artifact

8. Submit To Governance Engine

9. Receive Governance Decision

10. Create New Knowledge Version

11. Persist

12. Publish
```

---

# Step 1

Resolve Structured Intelligence

---

# Source

```text
Dependency Index
```

---

# Required Artifact

```text
Structured Intelligence
```

---

# Validation

```text
Exists

Current

Not Stale
```

---

# Failure

```text
Build Failure
```

---

# Step 2

Resolve Current Knowledge

---

# Purpose

Load:

```text
Latest Approved Knowledge
```

---

# Query

```typescript
getCurrentKnowledge(
  company_id
);
```

---

# Output

```typescript
type CurrentKnowledge = {
  version: number;

  artifact:
    CompanyKnowledgeArtifact;
};
```

---

# Rule

Only:

```text
Approved Knowledge
```

may be loaded.

---

# Step 3

Resolve Knowledge History

---

# Purpose

Load:

```text
Historical Knowledge Versions
```

---

# Usage

Required for:

```text
Change Detection

Promotion Decisions

Merge Decisions
```

---

# Output

```typescript
type KnowledgeHistory = {
  versions:
    CompanyKnowledgeArtifact[];
};
```

---

# Step 4

Build Candidate Knowledge

---

# Purpose

Combine:

```text
Structured Intelligence

+

Current Knowledge
```

into:

```text
Candidate Knowledge
```

---

# Important Rule

Builder never overwrites.

---

# Builder Produces

```text
Candidate Changes
```

only.

---

# Output

```typescript
type CandidateKnowledge = {
  candidate_fields:
    CandidateField[];
};
```

---

# Step 5

Classify Changes

---

# Purpose

Determine:

```text
Field Stability Class
```

---

# Allowed Classes

```typescript
type StabilityClass =
  | "stable"
  | "semi_stable"
  | "dynamic";
```

---

# Stable Examples

```text
Business Model

Primary Customer

Core Products
```

---

# Semi-Stable Examples

```text
Growth Priorities

Strategic Focus
```

---

# Dynamic Examples

```text
Current Initiatives

Management Commentary
```

---

# Rule

Classification comes from:

```text
Company Knowledge Schema
```

---

# Builder Cannot Change

```text
Stability Classes
```

---

# Step 6

Generate Promotion Proposals

---

# Purpose

Create:

```text
Governance Requests
```

---

# Output

```typescript
type PromotionProposal = {
  field_name: string;

  previous_value: unknown;

  proposed_value: unknown;

  stability_class:
    StabilityClass;

  confidence: number;

  evidence_refs: string[];

  recommendation:
    PromotionRecommendation;
};
```

---

# Recommendation Types

```typescript
type PromotionRecommendation =
  | "promote"
  | "retain"
  | "merge"
  | "review";
```

---

# Rule

Builder only recommends.

---

# Governance Engine decides.

---

# Step 7

Create Candidate Artifact

---

# Output

```typescript
type CompanyKnowledgeCandidateArtifact = {
  artifact_id: string;

  company_id: string;

  period_id: string;

  proposals:
    PromotionProposal[];

  lineage:
    CandidateLineage;
};
```

---

# Purpose

Temporary artifact.

---

# Not Published

To downstream systems.

---

# Step 8

Submit To Governance Engine

---

# Target

```text
Company Knowledge Governance Engine
```

---

# Request

```typescript
submitGovernanceReview(
  candidate_artifact
);
```

---

# Builder Waits

For governance decision.

---

# Step 9

Receive Governance Decision

---

# Possible Results

```typescript
type GovernanceDecision =
  | "approve"
  | "reject"
  | "merge"
  | "retain"
  | "human_review";
```

---

# Rule

Builder may NOT override.

---

# Step 10

Create New Knowledge Version

---

# Only After

```text
Governance Approval
```

---

# Output

```typescript
type CompanyKnowledgeArtifact = {
  artifact_id: string;

  company_id: string;

  version: number;

  knowledge:
    CompanyKnowledge;

  governance_decisions:
    GovernanceDecision[];

  lineage:
    KnowledgeLineage;
};
```

---

# Versioning Rule

Every approved change creates:

```text
New Version
```

---

# Never Overwrite

Previous versions.

---

# Step 11

Persistence

---

# Stores

```text
Knowledge Artifact

Archive Entry

Governance Record
```

---

# Persistence Strategy

```text
Atomic
```

---

# Failure

```text
Rollback
```

---

# Step 12

Publish

---

# Consumers

```text
Business Signals

Quarter Understanding

Investor Intelligence
```

---

# Dependency Registration

---

# Dependency Node

```typescript
type DependencyNode = {
  artifact_type:
    "company_knowledge";

  upstream: [
    "structured_intelligence"
  ];

  downstream: [
    "business_signals",
    "quarter_understanding"
  ];
};
```

---

# Candidate Artifact Rule

Candidate artifacts:

```text
Not Registered
```

in dependency graph.

---

# Only Approved Knowledge

is registered.

---

# Knowledge Versioning

---

# Version Strategy

```text
Append Only
```

---

# Rule

Knowledge history is:

```text
Permanent
```

---

# No Deletes

Allowed.

---

# Governance Integration

Critical.

---

# Builder Owns

```text
Proposal Creation
```

---

# Governance Owns

```text
Promotion Decision
```

---

# Separation Rule

Must never be violated.

---

# Invalidation Integration

---

# Trigger Events

```text
Structured Intelligence Changed

Governance Decision Changed

Knowledge Version Created
```

---

# Candidate Staleness

Uses:

```text
Version Hash
```

---

# Propagation

Uses:

```text
Content Hash
```

---

# Special Rule

Knowledge versions are:

```text
Governed Artifacts
```

---

# Therefore

Invalidation cannot bypass governance.

---

# Replayability Requirements

Must record:

```text
Prompt Version

Model Version

Input Hash

Knowledge Version

Governance Version
```

---

# Lineage Schema

```typescript
type KnowledgeLineage = {
  structured_intelligence_ref:
    string;

  prior_knowledge_version:
    number;

  governance_decision_id:
    string;

  input_hash: string;

  output_hash: string;
};
```

---

# Evaluation Integration

---

# Evaluation Categories

```text
Promotion Accuracy

Knowledge Consistency

Longitudinal Stability

Information Preservation
```

---

# Evaluation Timing

After:

```text
Knowledge Approval
```

---

# Builder Metrics

Track:

```text
Knowledge Resolution

Archive Resolution

Proposal Generation

Governance Wait Time

Persistence Time
```

---

# Monitoring Schema

```typescript
type BuilderMetrics = {
  archive_load_ms: number;

  proposal_generation_ms: number;

  governance_wait_ms: number;

  persistence_ms: number;
};
```

---

# Error Categories

```typescript
type BuilderError =
  | "STRUCTURED_INTELLIGENCE_MISSING"
  | "KNOWLEDGE_LOAD_FAILURE"
  | "ARCHIVE_LOAD_FAILURE"
  | "GOVERNANCE_SUBMISSION_FAILURE"
  | "GOVERNANCE_TIMEOUT"
  | "PERSISTENCE_FAILURE";
```

---

# Recovery Strategy

Missing Artifact:

```text
Wait
```

Governance Failure:

```text
Retry
```

Timeout:

```text
Escalate
```

Persistence Failure:

```text
Rollback
```

---

# Scaling Requirements

Target:

```text
10,000+ companies
```

Must support:

- durable memory
- governance workflows
- auditability
- version history
- replayability

---

# Architectural Invariants

LOCKED.

1. Company Knowledge is persistent intelligence.
2. Builder proposes; governance decides.
3. Builder never directly modifies knowledge.
4. Knowledge is append-only.
5. Historical versions are permanent.
6. Dependency Index resolves upstream artifacts.
7. Governance cannot be bypassed.
8. Candidate artifacts are not downstream-visible.
9. Every approved change creates a new version.
10. Company Knowledge is the canonical memory layer of the platform.

End of Specification.