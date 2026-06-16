# 050-themes-builder-spec.md

Version: 1.0
Status: LOCKED
Owner: Builder Layer

Depends On:

- 012-artifact-framework-spec.md
- 013-prompt-registry-spec.md
- 014-dependency-index-spec.md
- 015-invalidation-engine-spec.md
- 018-themes-spec.md
- 041-themes-prompt-contract.md

Produces:

- Themes Artifact

---

# Purpose

This specification defines how the Themes Builder constructs:

```text
Themes Artifact
```

from filing inputs.

The builder owns:

```text
Prompt Execution

Validation

Lineage

Persistence

Evaluation

Dependency Registration
```

The builder does NOT own:

```text
Theme Extraction Logic
```

That belongs to:

```text
Themes Prompt
```

---

# Architectural Position

```text
Raw Filing
      ↓

Themes Builder
      ↓

Themes Artifact
      ↓

Topic Assignment Builder
```

---

# Core Responsibility

Transform:

```text
Raw Filing
```

into:

```text
Themes Artifact
```

using governed prompt execution.

---

# Builder Ownership

Themes Builder owns:

- input preparation
- prompt selection
- prompt execution
- output validation
- artifact creation
- lineage recording
- evaluation execution
- dependency registration

Themes Builder does NOT own:

- prompt content
- theme ontology
- topic assignment

---

# Input Contract

```typescript
type ThemesBuilderInput = {
  company_id: string;

  filing_id: string;

  filing_type:
    | "10-K"
    | "10-Q"
    | "Transcript";

  filing_content: string;

  filing_hash: string;

  period_id: string;
};
```

---

# Input Validation

Required:

```text
Company ID

Period ID

Filing ID

Filing Content

Filing Hash
```

---

# Validation Failure

Missing required fields:

```text
Build Failure
```

---

# Builder Flow

```text
1. Validate Input

2. Resolve Prompt

3. Build Prompt Context

4. Execute Prompt

5. Validate Output

6. Compute Confidence

7. Create Artifact

8. Persist Artifact

9. Register Dependencies

10. Execute Evaluation

11. Publish Artifact
```

---

# Step 1

Input Validation

---

# Purpose

Verify:

```text
Input Completeness
```

---

# Checks

```text
Required Fields

Content Exists

Hash Exists

Period Exists
```

---

# Failure Action

```text
Stop Build
```

---

# Step 2

Prompt Resolution

---

# Purpose

Determine:

```text
Active Prompt Version
```

---

# Source

```text
Prompt Registry
```

---

# Resolution Query

```typescript
resolvePrompt(
  artifactType = "themes"
)
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

No active prompt:

```text
Build Failure
```

---

# Step 3

Prompt Context Construction

---

# Purpose

Build:

```text
Prompt Input Payload
```

---

# Context

```typescript
type ThemesPromptContext = {
  filing_content: string;

  filing_type: string;

  company_id: string;

  period_id: string;
};
```

---

# Rule

Builder may:

```text
Prepare Context
```

Builder may NOT:

```text
Interpret Filing
```

---

# Step 4

Prompt Execution

---

# Purpose

Generate:

```text
Theme Candidates
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

Required for:

```text
Replayability

Content Hash Stability
```

---

# Output

Must conform to:

```text
041-themes-prompt-contract.md
```

---

# Failure Action

Invalid output:

```text
Build Failure
```

---

# Step 5

Output Validation

---

# Purpose

Verify:

```text
Schema Compliance
```

---

# Validation Rules

Check:

```text
Required Fields

Valid Theme Schema

Duplicate Themes

Empty Themes
```

---

# Duplicate Rule

Themes with:

```text
Semantic Similarity > Threshold
```

flagged.

---

# Validation Failure

```text
Artifact Rejected
```

---

# Step 6

Confidence Calculation

---

# Ownership

Builder owns confidence.

Prompt does not.

---

# Schema

```typescript
type ThemesConfidence = {
  coverage_score: number;

  specificity_score: number;

  diversity_score: number;

  grounding_score: number;

  overall: number;
};
```

---

# Coverage Score

Measures:

```text
Coverage of Filing Content
```

---

# Specificity Score

Measures:

```text
Theme Precision
```

---

# Diversity Score

Measures:

```text
Theme Variety
```

---

# Grounding Score

Measures:

```text
Evidence Support
```

---

# Step 7

Artifact Creation

---

# Output

```typescript
type ThemesArtifact = {
  artifact_id: string;

  artifact_type: "themes";

  business_key: {
    company_id: string;

    period_id: string;

    filing_id: string;
  };

  themes: Theme[];

  confidence: ThemesConfidence;

  lineage: ThemesLineage;

  metadata: ArtifactMetadata;
};
```

---

# Artifact Type

```text
themes
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

# Step 8

Persistence

---

# Purpose

Write artifact.

---

# Storage

```text
Artifact Store
```

---

# Persisted Objects

```text
Artifact

Lineage

Metadata
```

---

# Write Strategy

```text
Atomic
```

---

# Failure Action

Rollback write.

---

# Step 9

Dependency Registration

---

# Purpose

Register artifact.

---

# Dependency Index Entry

```typescript
type DependencyNode = {
  artifact_id: string;

  artifact_type: "themes";

  upstream: [];

  downstream: [
    "topic_assignment"
  ];
};
```

---

# Rule

Themes has:

```text
No Upstream Artifacts
```

---

# Step 10

Evaluation Execution

---

# Purpose

Run:

```text
Themes Evaluation
```

---

# Evaluation Contract

```text
017-evaluation-architecture-spec.md
```

---

# Evaluation Categories

```text
Coverage

Specificity

Duplication

Grounding
```

---

# Failure Handling

Evaluation failure:

```text
Artifact Written

Flagged For Review
```

---

# Reason

Evaluation is:

```text
Monitoring Layer
```

not persistence layer.

---

# Step 11

Publish Artifact

---

# Purpose

Expose artifact.

---

# Consumers

```text
Topic Assignment Builder
```

---

# Publication Event

```typescript
type ArtifactPublishedEvent = {
  artifact_id: string;

  artifact_type: "themes";

  timestamp: string;
};
```

---

# Invalidation Integration

Themes participates in:

```text
Hybrid Invalidation
```

---

# Trigger

New filing:

```text
Themes Rebuild
```

---

# Propagation

```text
Version Hash
    ↓
Candidate Stale

Content Hash
    ↓
Propagation Decision
```

---

# Content Hash Rules

Artifact stores:

```typescript
output_content_hash
```

---

# Purpose

Determine:

```text
Actual Change
```

---

# Replayability Requirements

Mandatory:

```text
Prompt Version

Model Version

Input Hash

Artifact Version
```

recorded.

---

# Lineage Schema

```typescript
type ThemesLineage = {
  prompt_id: string;

  prompt_version: string;

  model_version: string;

  input_hash: string;

  output_hash: string;

  evaluation_version: string;
};
```

---

# Builder Metrics

Builder records:

```text
Execution Time

Token Usage

Validation Time

Persistence Time
```

---

# Monitoring

Metrics emitted:

```typescript
type BuilderMetrics = {
  build_duration_ms: number;

  prompt_duration_ms: number;

  validation_duration_ms: number;

  persistence_duration_ms: number;

  token_usage: number;
};
```

---

# Error Categories

```typescript
type BuilderError =
  | "INPUT_VALIDATION_FAILURE"
  | "PROMPT_RESOLUTION_FAILURE"
  | "PROMPT_EXECUTION_FAILURE"
  | "OUTPUT_VALIDATION_FAILURE"
  | "PERSISTENCE_FAILURE"
  | "DEPENDENCY_REGISTRATION_FAILURE";
```

---

# Recovery Strategy

Input Failure:

```text
Stop
```

Prompt Failure:

```text
Retry Policy
```

Persistence Failure:

```text
Rollback
```

Dependency Failure:

```text
Queue Recovery Task
```

---

# Scaling Requirements

Target:

```text
10,000+ companies
```

Must support:

- deterministic generation
- replayability
- auditability
- content-hash invalidation
- prompt governance

---

# Architectural Invariants

LOCKED.

1. Themes Builder owns orchestration, not intelligence.
2. Prompt Registry is the source of prompt truth.
3. Temperature must be zero.
4. Model version must be pinned.
5. Builder computes confidence.
6. Every artifact requires lineage.
7. Every artifact registers dependencies.
8. Evaluation runs after persistence.
9. Themes has no upstream artifact dependencies.
10. Themes Builder is the root builder of the intelligence pipeline.

End of Specification.