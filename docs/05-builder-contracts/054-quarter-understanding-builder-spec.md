# 054-quarter-understanding-builder-spec.md

Version: 1.0
Status: LOCKED
Owner: Builder Layer

Depends On:

- 012-artifact-framework-spec.md
- 013-prompt-registry-spec.md
- 014-dependency-index-spec.md
- 015-invalidation-engine-spec.md
- 016-concept-registry-spec.md
- 029-trust-signals-spec.md
- 030-quarter-understanding-trust-extension-spec.md
- 043-quarter-understanding-prompt-contract.md

Consumes:

- Company Knowledge Artifact
- Business Signals Artifact
- Trust Signals Artifact
- Topic Evolution Artifact
- Concept Registry

Produces:

- Quarter Understanding Artifact
- Concept Proposals

---

# Purpose

This specification defines how the Quarter Understanding Builder constructs:

```text
Quarter Understanding
```

from:

```text
Company Knowledge

Business Signals

Trust Signals

Topic Evolution

Concept Registry
```

Quarter Understanding is the first:

```text
Interpretation Layer
```

in the platform.

---

# Architectural Position

```text
Company Knowledge
          ↓

Business Signals
          ↓

Trust Signals
          ↓

Topic Evolution
          ↓

Concept Registry
          ↓

Quarter Understanding Builder
          ↓

Quarter Understanding
          ↓

Investor Intelligence
```

---

# Core Responsibility

Transform:

```text
Deterministic Intelligence
```

into:

```text
Business Understanding
```

for a specific company-period.

---

# Architectural Principle

Quarter Understanding explains:

```text
Why observed signals matter.
```

It does NOT determine:

```text
What investors should do.
```

---

# Builder Ownership

Quarter Understanding Builder owns:

- dependency resolution
- concept registry loading
- prompt execution
- concept validation
- proposal extraction
- confidence computation
- persistence
- lineage generation
- dependency registration

Builder does NOT own:

- signal generation
- company memory
- concept governance
- investor reasoning

---

# Input Contract

```typescript
type QuarterUnderstandingBuilderInput = {
  company_id: string;

  period_id: string;
};
```

---

# Builder Flow

```text
1. Resolve Dependencies

2. Load Concept Registry

3. Resolve Prompt

4. Build Prompt Context

5. Execute Prompt

6. Validate Concepts

7. Extract Concept Proposals

8. Compute Confidence

9. Create Artifact

10. Persist Artifact

11. Register Dependencies

12. Execute Evaluation

13. Publish Artifact
```

---

# Step 1

Resolve Dependencies

---

# Source

```text
Dependency Index
```

---

# Required Artifacts

```text
Company Knowledge

Business Signals

Trust Signals

Topic Evolution
```

---

# Resolution Contract

```typescript
type UpstreamArtifacts = {
  company_knowledge:
    CompanyKnowledgeArtifact;

  business_signals:
    BusinessSignalArtifact[];

  trust_signals:
    TrustSignalArtifact[];

  topic_evolution:
    TopicEvolutionArtifact;
};
```

---

# Validation

All artifacts must be:

```text
Current

Approved

Not Stale
```

---

# Failure

```text
Build Failure
```

---

# Dependency Resolution Rule

Builder must never:

```text
Directly Query Stores
```

for intelligence artifacts.

---

# Step 2

Load Concept Registry

---

# Source

```text
Concept Registry
```

---

# Query

```typescript
getActiveConcepts();
```

---

# Output

```typescript
type ActiveConceptRegistry = {
  version: string;

  concepts:
    ConceptRegistryEntry[];
};
```

---

# Rule

Only:

```text
Active Concepts
```

may be used.

---

# Forbidden

```text
Deprecated Concepts

Merged Concepts

Rejected Concepts
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
    "quarter_understanding"
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
type QuarterUnderstandingContext = {
  company_knowledge:
    CompanyKnowledgeArtifact;

  business_signals:
    BusinessSignalArtifact[];

  trust_signals:
    TrustSignalArtifact[];

  topic_evolution:
    TopicEvolutionArtifact;

  active_concepts:
    ConceptRegistryEntry[];
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
Interpret Signals
```

---

# Step 5

Prompt Execution

---

# Purpose

Generate:

```text
Business Understanding
```

---

# Execution Requirements

```text
Temperature = 0

Model Version Pinned

Prompt Version Pinned
```

---

# Output Contract

Must conform to:

```text
043-quarter-understanding-prompt-contract.md
```

---

# Output Contains

```text
Understanding Entries

Concept References

Concept Proposals
```

---

# Step 6

Validate Concepts

---

# Purpose

Ensure:

```text
Concept Integrity
```

---

# Validation Rules

Every:

```typescript
concept_id
```

must exist in:

```text
Active Concept Registry
```

---

# Invalid Concept

```text
Build Failure
```

---

# Silent Acceptance

Forbidden.

---

# Validation Query

```typescript
validateConcept(
  concept_id
);
```

---

# Step 7

Extract Concept Proposals

---

# Purpose

Capture:

```text
Unregistered Concepts
```

identified by prompt.

---

# Output

```typescript
type ConceptProposal = {
  proposal_id: string;

  title: string;

  definition: string;

  topic_ref: string;

  rationale: string;

  source_artifact:
    string;
};
```

---

# Governance Rule

Quarter Understanding:

```text
Proposes Concepts
```

It does NOT:

```text
Create Concepts
```

---

# Proposal Handling

Submit to:

```text
Concept Registry Governance
```

---

# Proposal Registration

Separate workflow.

---

# Step 8

Confidence Calculation

---

# Ownership

Builder owns confidence.

---

# Schema

```typescript
type QuarterUnderstandingConfidence = {
  signal_coverage: number;

  concept_compliance: number;

  grounding_score: number;

  evidence_density: number;

  overall: number;
};
```

---

# Signal Coverage

Measures:

```text
Use Of Available Signals
```

---

# Concept Compliance

Measures:

```text
Registry Compliance
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
Evidence Per Understanding
```

---

# Step 9

Artifact Creation

---

# Output

```typescript
type QuarterUnderstandingArtifact = {
  artifact_id: string;

  artifact_type:
    "quarter_understanding";

  business_key: {
    company_id: string;

    period_id: string;
  };

  understandings:
    UnderstandingEntry[];

  confidence:
    QuarterUnderstandingConfidence;

  lineage:
    QuarterUnderstandingLineage;

  metadata:
    ArtifactMetadata;
};
```

---

# Step 10

Persistence

---

# Storage

```text
Artifact Store
```

---

# Persisted Objects

```text
Artifact

Concept Proposals

Lineage

Metadata
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

# Step 11

Dependency Registration

---

# Dependency Node

```typescript
type DependencyNode = {
  artifact_type:
    "quarter_understanding";

  upstream: [
    "company_knowledge",
    "business_signals",
    "trust_signals",
    "topic_evolution"
  ];

  downstream: [
    "investor_intelligence"
  ];
};
```

---

# Step 12

Evaluation Execution

---

# Purpose

Run:

```text
Quarter Understanding Evaluation
```

---

# Evaluation Categories

```text
Signal Utilization

Concept Compliance

Grounding

Interpretation Quality

Importance Calibration
```

---

# Evaluation Contract

```text
017-evaluation-architecture-spec.md
```

---

# Failure Handling

Evaluation failure:

```text
Flagged

Not Deleted
```

---

# Step 13

Publish Artifact

---

# Consumers

```text
Investor Intelligence Builder
```

---

# Publication Event

```typescript
type ArtifactPublishedEvent = {
  artifact_id: string;

  artifact_type:
    "quarter_understanding";

  timestamp: string;
};
```

---

# Concept Registry Integration

Critical.

---

# Registry Is

```text
Source Of Concept Truth
```

---

# Builder Cannot

```text
Create Concepts

Modify Concepts

Approve Concepts
```

---

# Builder Can

```text
Validate Concepts

Propose Concepts
```

---

# Trust Integration

---

# Required Inputs

```text
Trust Signals
```

mandatory.

---

# Reason

Trust Understanding is part of:

```text
Quarter Understanding
```

---

# Rule

Trust Signals may be:

```text
Interpreted
```

but not:

```text
Converted Into Trust Verdicts
```

---

# Trust Verdict Ownership

Belongs to:

```text
Investor Intelligence Q3
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
Company Knowledge Changed

Business Signals Changed

Trust Signals Changed

Concept Registry Changed

Prompt Changed
```

---

# Candidate Staleness

Determined via:

```text
Version Hash
```

---

# Propagation

Determined via:

```text
Content Hash
```

---

# Concept Registry Change Rule

Registry change creates:

```text
Candidate Staleness
```

---

# Propagation Rule

Only propagate if:

```text
Concept Usage Changes
```

or

```text
Interpretation Changes
```

---

# Replayability Requirements

Must record:

```text
Prompt Version

Model Version

Concept Registry Version

Input Hash

Output Hash
```

---

# Lineage Schema

```typescript
type QuarterUnderstandingLineage = {
  prompt_id: string;

  prompt_version: string;

  model_version: string;

  concept_registry_version: string;

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

Registry Load

Prompt Execution

Concept Validation

Persistence

Evaluation
```

---

# Monitoring Schema

```typescript
type BuilderMetrics = {
  dependency_resolution_ms: number;

  registry_load_ms: number;

  prompt_execution_ms: number;

  concept_validation_ms: number;

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
  | "CONCEPT_REGISTRY_LOAD_FAILURE"
  | "PROMPT_RESOLUTION_FAILURE"
  | "PROMPT_EXECUTION_FAILURE"
  | "INVALID_CONCEPT_REFERENCE"
  | "PERSISTENCE_FAILURE"
  | "DEPENDENCY_REGISTRATION_FAILURE";
```

---

# Recovery Strategy

Missing Dependency:

```text
Wait
```

Registry Failure:

```text
Retry
```

Invalid Concept:

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

- concept governance
- trust interpretation
- deterministic generation
- replayability
- auditability

---

# Architectural Invariants

LOCKED.

1. Quarter Understanding is an interpretation layer.
2. Company Knowledge is mandatory.
3. Business Signals are mandatory.
4. Trust Signals are mandatory.
5. Concept Registry is the source of concept truth.
6. Invalid concepts cause build failure.
7. Builder may propose concepts but never create them.
8. Trust can be interpreted but not judged.
9. Confidence is builder-generated.
10. Quarter Understanding is the final intelligence layer before Investor Intelligence.

End of Specification.