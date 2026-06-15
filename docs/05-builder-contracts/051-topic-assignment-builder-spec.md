# 051-topic-assignment-builder-spec.md

Version: 1.0
Status: LOCKED
Owner: Builder Layer

Depends On:

- 012-artifact-framework-spec.md
- 013-prompt-registry-spec.md
- 014-dependency-index-spec.md
- 015-invalidation-engine-spec.md
- 019-topic-assignment-spec.md
- 041-themes-prompt-contract.md

Consumes:

- Themes Artifact

Produces:

- Topic Assignment Artifact

---

# Purpose

This specification defines how the Topic Assignment Builder constructs:

```text
Topic Assignment Artifact
```

from Themes Artifacts.

The builder owns:

```text
Artifact Resolution

Prompt Execution

Validation

Lineage

Persistence

Dependency Registration
```

The builder does NOT own:

```text
Topic Classification Logic
```

That belongs to:

```text
Topic Assignment Prompt
```

and

```text
Topic Registry
```

---

# Architectural Position

```text
Themes Artifact
        ↓

Topic Assignment Builder
        ↓

Topic Assignment Artifact
        ↓

Topic Evolution Builder

Structured Intelligence Builder
```

---

# Core Responsibility

Transform:

```text
Themes
```

into:

```text
Governed Topic Assignments
```

using the Topic Registry.

---

# Builder Ownership

Topic Assignment Builder owns:

- upstream artifact resolution
- topic registry loading
- prompt resolution
- prompt execution
- validation
- confidence calculation
- persistence
- lineage
- dependency registration

Topic Assignment Builder does NOT own:

- theme extraction
- topic creation
- topic governance

---

# Input Contract

```typescript
type TopicAssignmentBuilderInput = {
  company_id: string;

  period_id: string;

  filing_id: string;
};
```

---

# Input Resolution

Builder does NOT receive:

```text
Themes Directly
```

---

# Builder Must Resolve

```text
Themes Artifact
```

through:

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

# Upstream Resolution

```typescript
resolveUpstreamArtifacts({
  artifact_type:
    "topic_assignment",

  company_id,

  period_id,

  filing_id
});
```

---

# Expected Result

```typescript
type UpstreamArtifacts = {
  themes:
    ThemesArtifact;
};
```

---

# Failure Action

Missing Themes Artifact:

```text
Build Failure
```

---

# Builder Flow

```text
1. Resolve Upstream Artifacts

2. Load Topic Registry

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

Resolve Upstream Artifacts

---

# Required Artifacts

```text
Themes
```

---

# Validation

Verify:

```text
Artifact Exists

Artifact Current

Artifact Not Stale
```

---

# Failure Action

```text
Build Failure
```

---

# Step 2

Load Topic Registry

---

# Purpose

Load:

```text
Active Topics
```

---

# Source

```text
Topic Registry
```

---

# Returned Data

```typescript
type ActiveTopicRegistry = {
  topics:
    TopicRegistryEntry[];
};
```

---

# Registry Rule

Only:

```text
Active Topics
```

may be assigned.

---

# Forbidden

```text
Deprecated Topics

Retired Topics
```

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
    "topic_assignment"
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

# Failure Action

```text
Build Failure
```

---

# Step 4

Prompt Context Construction

---

# Context

```typescript
type TopicAssignmentPromptContext = {
  themes:
    Theme[];

  active_topics:
    TopicRegistryEntry[];
};
```

---

# Builder Rule

Builder may:

```text
Provide Context
```

Builder may NOT:

```text
Assign Topics
```

---

# Step 5

Prompt Execution

---

# Purpose

Map:

```text
Themes
```

to:

```text
Topics
```

---

# Execution Requirements

```text
Temperature = 0

Model Version Pinned

Prompt Version Pinned
```

---

# Reason

Supports:

```text
Replayability

Content Hash Stability
```

---

# Output Contract

Must conform to:

```text
019-topic-assignment-spec.md
```

---

# Step 6

Output Validation

---

# Purpose

Verify:

```text
Assignment Quality
```

---

# Validation Rules

Check:

```text
Valid Topic IDs

No Missing Topics

Confidence Bounds

Schema Compliance
```

---

# Topic Validation

Every topic_id must exist in:

```text
Active Topic Registry
```

---

# Invalid Topic

```text
Artifact Rejected
```

---

# Duplicate Validation

Duplicate assignments:

```text
Rejected
```

unless explicitly allowed.

---

# Registry Compliance Rule

Assignment to:

```text
Unknown Topic
```

results in:

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
type TopicAssignmentConfidence = {
  classification_score: number;

  registry_alignment_score: number;

  coverage_score: number;

  consistency_score: number;

  overall: number;
};
```

---

# Classification Score

Measures:

```text
Theme → Topic Match Strength
```

---

# Registry Alignment

Measures:

```text
Alignment With Topic Definitions
```

---

# Coverage Score

Measures:

```text
Theme Coverage
```

---

# Consistency Score

Measures:

```text
Cross-Assignment Stability
```

---

# Step 8

Artifact Creation

---

# Output

```typescript
type TopicAssignmentArtifact = {
  artifact_id: string;

  artifact_type:
    "topic_assignment";

  business_key: {
    company_id: string;

    period_id: string;

    filing_id: string;
  };

  assignments:
    TopicAssignment[];

  confidence:
    TopicAssignmentConfidence;

  lineage:
    TopicAssignmentLineage;

  metadata:
    ArtifactMetadata;
};
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

# Failure Action

```text
Rollback
```

---

# Step 10

Dependency Registration

---

# Purpose

Register artifact.

---

# Dependency Node

```typescript
type DependencyNode = {
  artifact_id: string;

  artifact_type:
    "topic_assignment";

  upstream: [
    "themes"
  ];

  downstream: [
    "topic_evolution",
    "structured_intelligence"
  ];
};
```

---

# Rule

Dependency registration is mandatory.

---

# Step 11

Evaluation Execution

---

# Purpose

Run:

```text
Topic Assignment Evaluation
```

---

# Evaluation Categories

```text
Coverage

Classification Accuracy

Registry Compliance

Assignment Consistency
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
Topic Evolution Builder

Structured Intelligence Builder
```

---

# Publication Event

```typescript
type ArtifactPublishedEvent = {
  artifact_id: string;

  artifact_type:
    "topic_assignment";

  timestamp: string;
};
```

---

# Topic Registry Integration

Critical.

---

# Rule

Topic Assignment may only reference:

```text
Active Registry Topics
```

---

# Topic Creation Rule

Builder may NOT:

```text
Create Topics
```

---

# Topic Governance Rule

Builder may NOT:

```text
Modify Topics
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
Themes Changed

Topic Registry Changed

Prompt Changed
```

---

# Candidate Staleness

Created through:

```text
Version Hash
```

---

# Propagation Decision

Determined through:

```text
Content Hash
```

---

# Content Hash Storage

```typescript
output_content_hash
```

required.

---

# Replayability Requirements

Artifact must record:

```text
Prompt Version

Model Version

Input Hash

Registry Version

Output Hash
```

---

# Lineage Schema

```typescript
type TopicAssignmentLineage = {
  prompt_id: string;

  prompt_version: string;

  model_version: string;

  topic_registry_version: string;

  input_hash: string;

  output_hash: string;

  evaluation_version: string;
};
```

---

# Builder Metrics

Track:

```text
Resolution Time

Registry Load Time

Prompt Time

Validation Time

Persistence Time
```

---

# Monitoring Schema

```typescript
type BuilderMetrics = {
  artifact_resolution_ms: number;

  registry_load_ms: number;

  prompt_execution_ms: number;

  validation_ms: number;

  persistence_ms: number;

  token_usage: number;
};
```

---

# Error Categories

```typescript
type BuilderError =
  | "UPSTREAM_ARTIFACT_MISSING"
  | "TOPIC_REGISTRY_LOAD_FAILURE"
  | "PROMPT_RESOLUTION_FAILURE"
  | "PROMPT_EXECUTION_FAILURE"
  | "OUTPUT_VALIDATION_FAILURE"
  | "PERSISTENCE_FAILURE"
  | "DEPENDENCY_REGISTRATION_FAILURE";
```

---

# Recovery Strategy

Missing Upstream:

```text
Wait For Dependency
```

Registry Failure:

```text
Retry
```

Prompt Failure:

```text
Retry Policy
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

- deterministic classification
- governed topic assignment
- replayability
- auditability
- content-hash invalidation

---

# Architectural Invariants

LOCKED.

1. Topic Assignment consumes Themes.
2. Dependency Index is the source of artifact resolution.
3. Topic Registry is the source of topic truth.
4. Only active topics may be assigned.
5. Builders never create topics.
6. Temperature must be zero.
7. Builder computes confidence.
8. Every artifact requires lineage.
9. Every artifact registers dependencies.
10. Topic Assignment is the gateway between Themes and all downstream intelligence layers.

End of Specification.