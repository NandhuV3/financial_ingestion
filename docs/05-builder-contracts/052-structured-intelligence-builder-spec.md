# 052-structured-intelligence-builder-spec.md

Version: 1.0
Status: LOCKED
Owner: Builder Layer

Depends On:

- 012-artifact-framework-spec.md
- 013-prompt-registry-spec.md
- 014-dependency-index-spec.md
- 015-invalidation-engine-spec.md
- 022-structured-intelligence-spec.md
- 042-structured-intelligence-prompt-contract.md

Consumes:

- Filing
- Themes Artifact
- Topic Assignment Artifact

Produces:

- Structured Intelligence Artifact

---

# Purpose

This specification defines how the Structured Intelligence Builder constructs:

```text
Structured Intelligence Artifact
```

from:

```text
Filing

Themes

Topic Assignments
```

The builder owns:

```text
Artifact Resolution

Prompt Execution

Validation

Confidence Calculation

Persistence

Lineage

Dependency Registration
```

The builder does NOT own:

```text
Business Intelligence Logic
```

That belongs to:

```text
Structured Intelligence Prompt
```

---

# Architectural Position

```text
Raw Filing
       ↓

Themes
       ↓

Topic Assignment
       ↓

Structured Intelligence Builder
       ↓

Structured Intelligence
       ↓

Company Knowledge Builder
```

---

# Core Responsibility

Transform:

```text
Filing Context
```

into:

```text
Structured Business Understanding
```

for a single company-period.

---

# Builder Ownership

Structured Intelligence Builder owns:

- upstream artifact resolution
- filing resolution
- prompt resolution
- prompt execution
- output validation
- confidence computation
- artifact persistence
- lineage generation
- dependency registration
- evaluation execution

Structured Intelligence Builder does NOT own:

- filing interpretation
- company memory
- trust analysis
- investor conclusions

---

# Input Contract

```typescript
type StructuredIntelligenceBuilderInput = {
  company_id: string;

  period_id: string;

  filing_id: string;
};
```

---

# Artifact Resolution Rule

Builder must resolve dependencies through:

```text
Dependency Index
```

---

# Reason

Dependency Index is:

```text
System Source Of Truth
```

---

# Required Inputs

Builder must resolve:

```text
Filing

Themes Artifact

Topic Assignment Artifact
```

---

# Upstream Resolution

```typescript
type UpstreamArtifacts = {
  filing:
    FilingArtifact;

  themes:
    ThemesArtifact;

  topic_assignments:
    TopicAssignmentArtifact;
};
```

---

# Failure Action

Missing dependency:

```text
Build Failure
```

---

# Builder Flow

```text
1. Resolve Dependencies

2. Resolve Filing

3. Resolve Prompt

4. Build Prompt Context

5. Execute Prompt

6. Validate Output

7. Compute Confidence

8. Create Artifact

9. Persist Artifact

10. Register Dependencies

11. Execute Evaluation

12. Publish Artifact
```

---

# Step 1

Resolve Dependencies

---

# Required

```text
Themes

Topic Assignments
```

---

# Validation

Verify:

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

Resolve Filing

---

# Purpose

Load:

```text
Original Filing
```

---

# Source

```text
Filing Store
```

---

# Required Data

```typescript
type FilingArtifact = {
  filing_id: string;

  filing_type: string;

  filing_content: string;

  filing_hash: string;
};
```

---

# Rule

Structured Intelligence is:

```text
Filing-Centric
```

---

# Therefore

Current filing is mandatory.

---

# Step 3

Prompt Resolution

---

# Source

```text
Prompt Registry
```

---

# Query

```typescript
resolvePrompt(
  artifactType =
    "structured_intelligence"
);
```

---

# Output

```typescript
type PromptResolution = {
  prompt_id: string;

  prompt_version: string;

  template: string;
};
```

---

# Failure

```text
Build Failure
```

---

# Step 4

Prompt Context Construction

---

# Context

```typescript
type StructuredPromptContext = {
  filing_content: string;

  filing_type: string;

  themes:
    Theme[];

  topic_assignments:
    TopicAssignment[];
};
```

---

# Allowed Context

```text
Current Filing

Themes

Topic Assignments
```

---

# Forbidden Context

```text
Company Knowledge

Business Signals

Quarter Understanding

Investor Intelligence

Trust Artifacts
```

---

# Reason

Enforce:

```text
LLM Boundary
```

---

# Step 5

Prompt Execution

---

# Purpose

Generate:

```text
Structured Business Understanding
```

---

# Execution Requirements

```text
Temperature = 0

Model Version Pinned

Prompt Version Pinned
```

---

# Required For

```text
Replayability

Content Hash Stability
```

---

# Output Contract

Must conform to:

```text
042-structured-intelligence-prompt-contract.md
```

---

# Step 6

Output Validation

---

# Purpose

Verify:

```text
Business Understanding Integrity
```

---

# Validation Rules

Check:

```text
Schema Compliance

Required Sections

Evidence Presence

No Empty Sections
```

---

# Required Sections

```text
Business Model

Products & Services

Customers & Markets

Competitive Positioning

Growth Initiatives

Operating Priorities

Capital Allocation

Management Commentary

Risk Observations
```

---

# Evidence Validation

Every major section requires:

```text
Evidence References
```

---

# Hallucination Checks

Validate:

```text
Named Products

Customers

Competitors

Markets
```

against filing.

---

# Critical Hallucination

Detected:

```text
Build Failure
```

---

# Step 7

Confidence Calculation

---

# Ownership

Builder owns confidence.

---

# Schema

```typescript
type StructuredConfidence = {
  coverage_score: number;

  specificity_score: number;

  grounding_score: number;

  evidence_density: number;

  overall: number;
};
```

---

# Coverage Score

Measures:

```text
Filing Coverage
```

---

# Specificity Score

Measures:

```text
Generic vs Specific Content
```

---

# Grounding Score

Measures:

```text
Evidence Support
```

---

# Evidence Density

Measures:

```text
Evidence References Per Insight
```

---

# Step 8

Artifact Creation

---

# Output

```typescript
type StructuredIntelligenceArtifact = {
  artifact_id: string;

  artifact_type:
    "structured_intelligence";

  business_key: {
    company_id: string;

    period_id: string;

    filing_id: string;
  };

  intelligence:
    StructuredBusinessUnderstanding;

  confidence:
    StructuredConfidence;

  lineage:
    StructuredLineage;

  metadata:
    ArtifactMetadata;
};
```

---

# Artifact Type

```text
structured_intelligence
```

---

# Business Key

Uniqueness:

```text
Company

Period

Filing
```

---

# Step 9

Persistence

---

# Storage

```text
Artifact Store
```

---

# Persistence Strategy

```text
Atomic
```

---

# Persisted Objects

```text
Artifact

Lineage

Metadata
```

---

# Failure

```text
Rollback
```

---

# Step 10

Dependency Registration

---

# Dependency Node

```typescript
type DependencyNode = {
  artifact_id: string;

  artifact_type:
    "structured_intelligence";

  upstream: [
    "themes",
    "topic_assignment"
  ];

  downstream: [
    "company_knowledge_builder"
  ];
};
```

---

# Registration Required

Always.

---

# Step 11

Evaluation Execution

---

# Purpose

Run:

```text
Structured Intelligence Evaluation
```

---

# Evaluation Categories

```text
Coverage

Grounding

Specificity

Hallucination Risk

Investor Relevance
```

---

# Evaluation Contract

```text
017-evaluation-architecture-spec.md
```

---

# Failure Handling

Evaluation failures:

```text
Flagged

Not Deleted
```

---

# Reason

Evaluation is:

```text
Monitoring Layer
```

---

# Step 12

Publish Artifact

---

# Consumers

```text
Company Knowledge Builder
```

---

# Publication Event

```typescript
type ArtifactPublishedEvent = {
  artifact_id: string;

  artifact_type:
    "structured_intelligence";

  timestamp: string;
};
```

---

# Dependency Resolution Principle

Critical.

Builders must resolve:

```text
Artifacts
```

through:

```text
Dependency Index
```

NOT:

```text
Direct Database Queries
```

---

# Reason

Supports:

```text
Governance

Invalidation

Replayability
```

---

# Invalidation Integration

Uses:

```text
Hybrid Invalidation
```

---

# Trigger Events

```text
Filing Changed

Themes Changed

Topic Assignment Changed

Prompt Changed
```

---

# Candidate Staleness

Created via:

```text
Version Hash
```

---

# Propagation Decision

Uses:

```text
Content Hash
```

---

# Content Hash Storage

Required:

```typescript
output_content_hash
```

---

# Replayability Requirements

Artifact must record:

```text
Prompt Version

Model Version

Input Hash

Output Hash

Evaluation Version
```

---

# Lineage Schema

```typescript
type StructuredLineage = {
  prompt_id: string;

  prompt_version: string;

  model_version: string;

  filing_hash: string;

  input_hash: string;

  output_hash: string;

  evaluation_version: string;
};
```

---

# Builder Metrics

Track:

```text
Dependency Resolution

Prompt Execution

Validation

Persistence

Evaluation
```

---

# Monitoring Schema

```typescript
type BuilderMetrics = {
  dependency_resolution_ms: number;

  prompt_execution_ms: number;

  validation_ms: number;

  persistence_ms: number;

  evaluation_ms: number;

  token_usage: number;
};
```

---

# Error Categories

```typescript
type BuilderError =
  | "DEPENDENCY_MISSING"
  | "FILING_NOT_FOUND"
  | "PROMPT_RESOLUTION_FAILURE"
  | "PROMPT_EXECUTION_FAILURE"
  | "OUTPUT_VALIDATION_FAILURE"
  | "HALLUCINATION_DETECTED"
  | "PERSISTENCE_FAILURE"
  | "DEPENDENCY_REGISTRATION_FAILURE";
```

---

# Recovery Strategy

Dependency Missing:

```text
Wait
```

Prompt Failure:

```text
Retry Policy
```

Validation Failure:

```text
Reject Artifact
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

- deterministic generation
- filing-scale processing
- auditability
- replayability
- content-hash invalidation

---

# Architectural Invariants

LOCKED.

1. Structured Intelligence is filing-centric.
2. Current filing is mandatory.
3. Builders never interpret filings.
4. Prompt owns intelligence generation.
5. Builder owns confidence.
6. Dependency Index is the source of artifact resolution.
7. Temperature must be zero.
8. Critical hallucinations block persistence.
9. Every artifact requires lineage.
10. Structured Intelligence is the primary intelligence source for Company Knowledge.

End of Specification.