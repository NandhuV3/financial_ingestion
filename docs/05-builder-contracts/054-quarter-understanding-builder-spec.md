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
- Trust Signals Artifact (enrichment)
- Topic Evolution Artifact (enrichment)
- Concept Registry (enrichment)

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

Enrichment inputs when available
```

Quarter Understanding is the first:

```text
LLM-Assisted Interpretation Layer
```

in the platform.

Quarter Understanding Builder is the first interpretation builder in the
platform.

---

# Architectural Position

```text
Company Knowledge
          ↓

Business Signals
          ↓

Quarter Understanding Builder
          ↓

Quarter Understanding
          ↓

Investor Intelligence
```

Enrichment inputs:

```text
Trust Signals
Topic Evolution
Concept Registry
```

Quarter Understanding receives quarter-over-quarter observations exclusively through Business Signals movement signals and must not consume QuarterChangeArtifact directly.

Quarter Change remains solely an upstream dependency of Business Signals.

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

- orchestration
- dependency resolution
- dependency validation
- context assembly
- prompt execution
- LLM-assisted interpretation execution
- interpretation generation
- concept registry enrichment
- concept validation
- proposal extraction
- confidence computation
- replayability metadata
- evaluation hooks
- content assembly
- BuilderResult<QuarterUnderstandingArtifactContent>

Builder does NOT own:

- signal generation
- company memory
- concept governance
- investor reasoning
- artifact identity
- artifact versioning
- metadata
- Artifact Framework lineage
- persistence
- current pointer management
- archive/history
- dependency registration
- dependency graph state

Artifact Framework owns:

- artifact_id
- artifact_version
- metadata
- Artifact Framework lineage
- persistence
- current pointer
- archive/history
- framework hashes

Dependency Index owns:

- dependency registration
- dependency graph
- dependency state

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

2. Resolve Enrichment Inputs

3. Build Interpretation Context

4. Execute Quarter Understanding Prompt

5. Validate Concepts

6. Extract Concept Proposals

7. Compute Confidence

8. Assemble Artifact Content

9. Return BuilderResult<QuarterUnderstandingArtifactContent>

10. Artifact Framework Persists Artifact

11. Dependency Index Registers Dependencies

12. Evaluation Hook And Metadata Emission

13. Artifact Framework Updates Current Pointer
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
```

---

# Enrichment Artifacts

```text
Trust Signals

Topic Evolution

Concept Registry
```

---

# Resolution Contract

```typescript
type UpstreamArtifacts = {
  company_knowledge:
    CompanyKnowledgeArtifact;

  business_signals:
    BusinessSignalArtifact[];
};
```

---

# Enrichment Resolution Contract

```typescript
type QuarterUnderstandingEnrichmentArtifacts = {
  trust_signals?:
    TrustSignalsArtifactContent;

  topic_evolution?:
    TopicEvolutionArtifact;

  concept_registry?:
    ActiveConceptRegistry;
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

Required artifacts must pass validation.

Missing required artifacts cause build failure.

Missing enrichment artifacts do not cause build failure.

Missing enrichment artifacts must be recorded in enrichment status and depth indicators.

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

Resolve Enrichment Inputs

---

# Sources

```text
Concept Registry

Dependency Index
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

If Concept Registry enrichment is unavailable, Quarter Understanding may still generate a base artifact from required inputs.

The artifact must record:

```text
concept_registry.available = false
```

---

# Forbidden

```text
Deprecated Concepts

Merged Concepts

Rejected Concepts
```

---

# Step 3

Build Interpretation Context

---

# Source

```text
Company Knowledge
Business Signals
Enrichment Inputs
```

---

# Prompt Registry Integration

Quarter Understanding Builder resolves:

```text
043-quarter-understanding-prompt-contract.md
```

through:

```text
Prompt Registry
```

Resolution must return the governed prompt snapshot and pinned prompt version
used for execution.

Failure to resolve the governed prompt causes build failure.

The pinned model version is supplied by the governed Builder Framework job
execution configuration defined by 062-job-execution-spec.md.

The resolved model version must be recorded in prompt lineage. A missing model
version causes build failure.

---

# Step 4

Execute Quarter Understanding Prompt

---

# Execution Boundary

```text
Quarter Understanding is an LLM-assisted interpretation layer.

Quarter Understanding Builder executes governed prompt-based interpretation.
```

---

# Execution Requirements

```text
temperature = 0
prompt version = pinned
model version = pinned
```

Prompt lineage must be recorded.

Prompt execution must be replayable.

---

# Prompt Context

The prompt context contains:

```text
Company Knowledge
Business Signals
Available enrichment inputs
Active Concept Registry concepts when available
Depth indicators
Enrichment status
```

---

# Prompt Output Boundary

Prompt output must conform to:

```text
043-quarter-understanding-prompt-contract.md
074-quarter-understanding-spec.md
```

The prompt produces interpretation content only.

---

# Builder Rule

Builder may:

```text
Interpret approved observations
```

Builder may NOT:

```text
Generate observations
Generate recommendations
Generate valuation opinions
Generate investor conclusions
```

---

# Step 5

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

# Step 6

Extract Concept Proposals

---

# Purpose

Capture:

```text
Unregistered Concepts
```

identified by governed prompt-based interpretation.

---

# Output

```typescript
type ProposedConcept = {
  proposed_concept_id: string;

  title: string;

  description: string;

  evidence_refs: string[];

  rationale: string;
};
```

Prompt-emitted proposed concepts are copied directly into
`artifact.proposed_concepts`.

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

# Step 7

Confidence Calculation

---

# Ownership

Builder owns confidence.

The active confidence calculation source is:

```text
builders/quarter-understanding-builder/calibration-contract.ts
```

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

# Step 8

Artifact Content Assembly

---

# Pre-Assembly Metadata

Before artifact content assembly, the builder creates evaluation hooks,
evaluation metadata, and replayability metadata.

Step 12 emits the already-assembled hooks and metadata to Evaluation
Architecture; it does not create them after persistence.

---

# Output

```typescript
type QuarterUnderstandingArtifactContent = {
  company_id: string;

  period_id: string;

  understandings:
    UnderstandingEntry[];

  proposed_concepts:
    ProposedConcept[];

  enrichment_status:
    EnrichmentStatus;

  depth_indicator:
    DepthIndicator;

  confidence:
    QuarterUnderstandingConfidence;

  limitations:
    QuarterUnderstandingLimitations;

  evaluation_hooks:
    QuarterUnderstandingEvaluationHooks;

  replayability_metadata:
    QuarterUnderstandingReplayabilityMetadata;
};
```

---

# Step 9

Return BuilderResult

---

Builder returns:

```text
BuilderResult<QuarterUnderstandingArtifactContent>
```

Artifact Framework creates and persists the artifact wrapper, including artifact
identity, metadata, Artifact Framework lineage, versioning, hashes, current
pointer, and archive/history.

Dependency Index owns dependency registration and graph state.

---

# Enrichment Status

```typescript
type EnrichmentInputStatus = {
  available: boolean;
  artifact_ref: string | null;
  artifact_version: number | null;
  absent_reason: string | null;
};

type EnrichmentStatus = {
  trust_signals: EnrichmentInputStatus;

  topic_evolution: EnrichmentInputStatus;

  concept_registry: EnrichmentInputStatus;
};
```

---

# Depth Indicator

```typescript
type DepthIndicator = {
  overall: "base" | "standard" | "full";

  trust_dimension:
    | "present"
    | "absent";

  longitudinal_dimension:
    | "present"
    | "absent";
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

Lineage

Metadata
```

Concept proposals are persisted as `artifact.proposed_concepts`.

No separate concept-proposal write payload is produced.

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

  required_upstream: [
    "company_knowledge",
    "business_signals"
  ];

  enrichment_upstream: [
    "trust_signals",
    "topic_evolution",
    "concept_registry"
  ];

  downstream: [
    "investor_intelligence"
  ];
};
```

---

# Step 12

Evaluation Hook And Metadata Emission

---

# Builder May

- publish evaluation hooks
- publish evaluation metadata
- publish replayability references

---

# Builder May NOT

- execute evaluations
- compute evaluation scores
- run evaluation pipelines

Evaluation execution belongs exclusively to Evaluation Architecture.

---

# Step 13

Publish Artifact

---

# Consumers

```text
Investor Intelligence Builder
```

Investor Intelligence consumers must inspect depth indicators.

Investor Intelligence must propagate depth limitations.

Investor Intelligence must not generate trust conclusions when:

```text
trust_dimension = absent
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

# Enrichment Inputs

```text
Trust Signals
```

optional enrichment.

---

# Reason

Trust interpretation is part of full-depth:

```text
Quarter Understanding
```

Base Quarter Understanding remains valid without Trust Signals when Company Knowledge and Business Signals are available.

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

When Trust Signals are absent, the artifact must record:

```text
trust_signals.available = false
trust_dimension = absent
```

and must not generate trust conclusions.

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

Topic Evolution Changed

Concept Registry Changed

Prompt Changed

Model Changed

Deterministic Rules Changed

Calibration Contract Changed
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
Prompt Lineage

Prompt Version

Model Version

Concept Registry Version

Input Hash

Output Hash

Evaluation Hooks

Enrichment Status

Depth Indicators

Builder Version

Calibration Contract Version
```

---

# Replayability Metadata Schema

```typescript
type QuarterUnderstandingEvaluationMetadata =
  Record<string, unknown>;
```

```typescript
type QuarterUnderstandingReplayabilityMetadata = {
  prompt_lineage: PromptLineage;

  prompt_version: string;

  model_version: string;

  concept_registry_version: string | null;

  input_hash: string;

  output_hash: string;

  evaluation_hooks: QuarterUnderstandingEvaluationHooks;

  evaluation_metadata: QuarterUnderstandingEvaluationMetadata;

  enrichment_status: EnrichmentStatus;

  depth_indicators: DepthIndicator;

  builder_version: string;

  calibration_contract_version: string;
};
```

Builder and calibration versions support builder-owned validation and
confidence logic.

This is content-level replayability metadata when emitted. It is not Artifact
Framework lineage.

---

# Builder Metrics

Track:

```text
Dependency Resolution

Registry Load

Prompt Execution

Concept Validation

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

  evaluation_ms: number;
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

`PROMPT_RESOLUTION_FAILURE` and `PROMPT_EXECUTION_FAILURE` are valid governed
LLM execution failures.

---

# Recovery Strategy

Missing Dependency:

```text
Wait
```

Registry Failure:

```text
Record Concept Registry Enrichment Unavailable
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
- LLM-assisted interpretation generation
- replayability
- auditability

---

# Architectural Invariants

LOCKED.

1. Quarter Understanding is an LLM-assisted interpretation layer.
2. Company Knowledge is mandatory.
3. Business Signals are mandatory.
4. Trust Signals are enrichment inputs.
5. Concept Registry is the source of concept truth when concept enrichment is available.
6. Invalid emitted concepts cause build failure.
7. Builder may propose concepts but never create them.
8. Trust can be interpreted but not judged.
9. Confidence is builder-generated.
10. Quarter Understanding is the final intelligence layer before Investor Intelligence.
11. Quarter Understanding Builder executes governed prompt-based interpretation.
12. Temperature is zero and prompt/model versions are pinned.
13. This is a locked architecture decision.

End of Specification.
