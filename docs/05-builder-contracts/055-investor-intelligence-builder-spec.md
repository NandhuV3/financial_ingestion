# 055-investor-intelligence-builder-spec.md

Version: 1.0
Status: LOCKED
Owner: Builder Layer

Depends On:

- 012-artifact-framework-spec.md
- 013-prompt-registry-spec.md
- 014-dependency-index-spec.md
- 015-invalidation-engine-spec.md
- 031-investor-intelligence-q3-trust-spec.md
- 032-investor-intelligence-q1-spec.md
- 033-investor-intelligence-q2-spec.md
- 034-investor-intelligence-q4-spec.md
- 035-investor-intelligence-q5-spec.md
- 037-investor-intelligence-builder-spec.md
- 038-investor-intelligence-artifact-spec.md

Consumes:

- Company Knowledge Artifact
- Quarter Understanding Artifact
- Business Signals Artifact (Q2 enrichment only)
- Topic Evolution Artifact
- Prior Investor Intelligence Artifact
- Market Data Artifact (Q4 enrichment only)

Produces:

- Investor Intelligence Artifact

---

# Purpose

This specification defines how the Investor Intelligence Builder constructs:

```text
Investor Intelligence
```

through the governed execution of:

```text
Q1

Q2

Q3

Q4

Q5
```

Investor Intelligence is:

```text
The Final LLM-Assisted Synthesis Layer

An Investor-Facing Reasoning Layer
```

of the platform.

---

# Architectural Position

```text
Company Knowledge
            ↓

Quarter Understanding
            ↓

Investor Intelligence Builder
            ↓

Q1
Q2
Q3
Q4
Q5
            ↓

Investor Intelligence Artifact
            ↓

Partner Domain
```

---

# Core Responsibility

Transform:

```text
Business Understanding
```

into:

```text
Investor Understanding
```

without producing:

```text
Investment Advice
```

---

# Architectural Principle

Investor Intelligence owns:

```text
Q1-Q5 Answers
```

and nothing else.

---

# Ownership Boundaries

Q1 owns:

```text
Business Understanding
```

---

# Q2 owns

```text
Growth Understanding
```

---

# Q3 owns

```text
Trust Understanding
```

---

# Q4 owns

```text
Valuation Understanding
```

---

# Q5 owns

```text
Ownership Understanding
```

---

# Critical Rule

No question may:

```text
Overwrite

Duplicate

Override
```

another question's responsibility.

---

# Builder Ownership

Investor Intelligence Builder owns:

- orchestration
- dependency validation
- context assembly
- prompt execution
- response parsing
- confidence computation
- artifact assembly
- artifact content assembly
- replayability metadata emission
- validation

Artifact Framework owns:

- artifact identity
- artifact metadata
- framework lineage
- framework hashes
- persistence
- artifact versioning
- current pointer management
- archival/history

Dependency Index owns:

- dependency registration
- dependency graph management
- dependency graph state

Builder does NOT own:

- business memory
- signal generation
- trust signals
- Trust Pillar artifacts
- raw trust evidence reinterpretation
- company knowledge
- partner presentation
- Quarter Change processing
- valuation methodology
- buy/sell/hold recommendations
- price targets

---

# Input Contract

```typescript
type InvestorIntelligenceBuilderInput = {
  company_id: string;

  period_id: string;
};
```

---

# Builder Flow

```text
1. Resolve Dependencies

2. Resolve Q1 Prompt

3. Generate Q1

4. Resolve Q2 Prompt

5. Generate Q2

6. Resolve Q3 Prompt

7. Generate Q3

8. Resolve Q4 Prompt

9. Generate Q4

10. Resolve Q5 Prompt

11. Generate Q5

12. Validate Boundaries

13. Assemble Artifact Content

14. Compute Confidence

15. Return BuilderResult<InvestorIntelligenceArtifactContent>

16. Artifact Framework Persistence/Versioning

17. Dependency Index Registration

18. Evaluation Hook And Metadata Emission
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

Quarter Understanding
```

# Enrichment Artifacts

```text
Business Signals (Q2 only)
Topic Evolution
Prior Investor Intelligence
Market Data (Q4 only)
```

Business Signals is available to Q2 only.

Investor Intelligence Q3 consumes Quarter Understanding trust interpretation
only.

```text
Trust Pillars
        ↓
Trust Signals
        ↓
Quarter Understanding
        ↓
Investor Intelligence Q3
```

Investor Intelligence never consumes directly:

```text
Trust Signals
Commitment Tracking
Narrative Consistency
Accounting Stability
Capital Allocation Tracking
```

Quarter Understanding remains the sole trust interpretation source.

Longitudinal trust context arrives through Quarter Understanding.

Topic Evolution is longitudinal enrichment.

Prior Investor Intelligence supports continuity.

Market Data is Q4 enrichment only.

Sprint 11 Q4 behavior:

```text
Q4.status = "insufficient_data"

Q4.absent_reason = "market_data_unavailable"
```

Market data integration is deferred.

Valuation methodology is future work and is not implemented in Sprint 11.

---

# Resolution Schema

```typescript
type UpstreamArtifacts = {
  company_knowledge:
    CompanyKnowledgeArtifact;

  quarter_understanding:
    QuarterUnderstandingArtifact;

  business_signals:
    BusinessSignalsArtifactContent | null;

  topic_evolution:
    TopicEvolutionArtifact | null;

  prior_investor_intelligence:
    InvestorIntelligenceArtifactContent | null;

  market_data:
    unknown | null;
};
```

---

# Validation

All mandatory artifacts must be:

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

Enrichment artifacts must not be treated as mandatory.

Validation must fail if Trust Signals or any Trust Pillar artifact is supplied
directly to Investor Intelligence Builder.

---

# Step 2-11

Question Execution

---

# Execution Model

Questions execute:

```text
Sequentially
```

---

# Order

```text
Q1

Q2

Q3

Q4

Q5
```

---

# Reason

Q5 consumes:

```text
Q1

Q2

Q3

Q4
```

---

# Q1 Context

```text
Company Knowledge

Quarter Understanding
```

---

# Q2 Context

```text
Company Knowledge

Quarter Understanding

Business Signals, when available

Topic Evolution, when available
```

---

# Q3 Context

```text
Quarter Understanding trust interpretation

Prior Investor Intelligence, when available, for historical comparison,
trend tracking, longitudinal context, and prior Q3 comparison only
```

Q3 may not consume:

```text
Trust Signals
Trust Pillars
Commitment Tracking
Raw trust evidence
```

Quarter Understanding is the sole trust interpretation source.

Prior Investor Intelligence must not independently ground or alter trust
interpretation.

---

# Q4 Context

```text
Company Knowledge

Q1

Q2

Q3

Market Data (deferred in Sprint 11)
```

Sprint 11 sets:

```text
Q4.status = "insufficient_data"

Q4.absent_reason = "market_data_unavailable"
```

---

# Q5 Context

```text
Q1

Q2

Q3

Q4
```

When:

```text
Q4.status = "insufficient_data"
```

Q5 must:

- propagate valuation limitations
- not fabricate valuation conclusions
- not emit `valuation_threshold` conditions

Violation of any rule is a builder failure.

Q5 prompt execution consumes Q1-Q4 only.

After prompt parsing, the builder determines Q5 status:

```text
partial
```

only when Historical Investor Intelligence or Topic Evolution enrichment is
unavailable. Q4 insufficient-data status alone does not produce partial status.

---

# Prompt Resolution

Every question resolves prompt from:

```text
Prompt Registry
```

---

# Query

```typescript
resolvePrompt(
  artifactType
);
```

---

# Example

```typescript
resolvePrompt("investor_q1");
```

---

# Model Resolution

The pinned model version is supplied by the governed Builder Framework job
execution configuration defined by 062-job-execution-spec.md.

The same resolved model version is recorded in each question's prompt lineage.
A missing model version causes build failure.

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

Deterministic orchestration

Content Hash Stability
```

---

# Boundary Enforcement

Critical.

---

# Purpose

Ensure:

```text
Question Ownership
```

is preserved.

---

# Validation Rules

Q1 may NOT produce:

```text
Trust Verdicts

Valuation Assessments

Ownership Thesis
```

---

# Q2 may NOT produce

```text
Trust Verdicts

Valuation Assessments

Ownership Thesis
```

---

# Q3 may NOT produce

```text
Business Understanding

Revenue Drivers

Ownership Thesis
```

---

# Q4 may NOT produce

```text
Trust Verdicts

Ownership Thesis
```

---

# Q5 may NOT produce

```text
Investment Recommendations
```

---

# Boundary Violation

```text
Artifact Rejected
```

---

# Recommendation Enforcement

Critical.

---

# Applies To

```text
Q3

Q4

Q5
```

---

# Forbidden Language

```text
Buy

Sell

Outperform

Underperform

Strong Buy

Strong Sell

Price Target

Expected Return
```

---

# Detection

```text
Automated

+

Human Review
```

---

# Violation Result

```text
Build Failure
```

---

# Step 12

Validate Q1-Q5 Assembly

---

# Purpose

Ensure:

```text
Internal Consistency
```

---

# Checks

```text
Q2 aligns with Q5

Q3 aligns with Q5

Q4 aligns with Q5

Evidence Completeness

Confidence Consistency
```

---

# Example

Forbidden:

```text
Q3 = Low Trust

Q5 = Strong Thesis
```

---

# Validation Failure

```text
Artifact Rejected
```

---

# Step 13

Assemble Artifact Content

---

# Pre-Assembly Metadata

Before artifact content assembly, the builder creates evaluation hooks,
evaluation metadata, and replayability metadata.

Step 18 emits the already-assembled hooks and metadata to Evaluation
Architecture; it does not create them after persistence.

---

# Output

```typescript
type InvestorIntelligenceArtifactContent = {
  company_id:
    string;

  period_id:
    string;

  business_key?: {
    company_id: string;

    period_id: string;
  };

  q1:
    Q1Answer;

  q2:
    Q2Answer;

  q3:
    Q3Answer;

  q4:
    Q4Answer;

  q5:
    Q5Answer;

  confidence:
    InvestorConfidence;

  enrichment_status:
    EnrichmentStatus;

  depth_indicator:
    DepthIndicator;

  per_question_input_hashes:
    PerQuestionInputHashes;

  coherence_hash:
    string;

  output_hash:
    string;

  prompt_lineage:
    InvestorPromptLineage;

  evaluation_hooks:
    InvestorIntelligenceEvaluationHooks;

  replayability_metadata:
    InvestorIntelligenceReplayabilityMetadata;
};
```

Artifact Framework provides artifact identity, artifact type, artifact metadata,
framework lineage, artifact versioning, framework hashes, persistence, current
pointers, and archive/history.

Investor Intelligence Builder provides only artifact content and
content-level replayability metadata.

---

# Single Artifact Rule

Investor Intelligence is:

```text
One Artifact
```

with:

```text
Five Sections
```

---

# Not

```text
Five Independent Artifacts
```

---

# Step 14

Compute Confidence

---

# Ownership

Builder owns confidence.

The active confidence calculation source is:

```text
builders/investor-intelligence-builder/confidence-contract.ts
```

---

# Question Confidence

Stored per question.

---

# Schema

```typescript
type InvestorConfidence = {
  q1_confidence: number;

  q2_confidence: number;

  q3_confidence: number;

  q4_confidence: number;

  q5_confidence: number;

  overall_confidence: number;
};
```

---

# Overall Rule

Q5 confidence may NOT exceed:

```text
Weakest Critical Input
```

---

# Confidence Calibration

Must conform to:

```text
Evaluation Architecture
```

---

# Step 15

Return BuilderResult<InvestorIntelligenceArtifactContent>

---

# Step 16

```text
Artifact Framework Persistence/Versioning
```

---

# Artifact Framework Owns

```text
Artifact identity

Artifact metadata

Framework lineage

Artifact versioning

Framework hashes

Persistence

Current pointer

Archive/history
```

---

# Strategy

```text
Atomic
```

---

# Failure

```text
Rollback
```

---

# Step 17

Dependency Registration

---

# Dependency Node

```typescript
type DependencyNode = {
  artifact_type:
    "investor_intelligence";

  required_upstream: [
    "company_knowledge",
    "quarter_understanding"
  ];

  enrichment_upstream: [
    "business_signals",
    "topic_evolution",
    "prior_investor_intelligence",
    "market_data"
  ];

  downstream: [
    "partner_domain"
  ];
};
```

---

# Step 18

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

# Consumer Availability

```text
Partner Domain
```

Investor Intelligence Builder does not publish artifacts directly.

Artifact Framework persistence and current-pointer updates make the resulting
artifact available to downstream consumers.

---

# Artifact Publication Event

```typescript
type ArtifactPublishedEvent = {
  artifact_id: string;

  artifact_type:
    "investor_intelligence";

  timestamp: string;
};
```

Artifact publication events are emitted by platform ownership boundaries, not
by Investor Intelligence Builder.

---

# Q4 Sprint 11 Presence

Critical.

---

Sprint 11 behavior:

```text
Q4.status = "insufficient_data"

Q4.absent_reason = "market_data_unavailable"
```

Q4 remains present.

Q4 is not omitted.

Q5 consumes Q4 output even when Q4 has insufficient-data status.

When:

```text
Q4.status = "insufficient_data"
```

Q5 must:

- propagate valuation limitations
- not fabricate valuation conclusions
- not emit `valuation_threshold` conditions

Violation of any rule is a builder failure.

---

# Trust Architecture Integration

Q3 owns investor trust synthesis.

Q3 is not the owner of:

```text
Trust Signal generation

Trust pillar artifact processing

Raw trust evidence reinterpretation
```

---

# Trust Inputs

```text
Quarter Understanding trust interpretation
```

Quarter Understanding is the sole trust interpretation source.

Q3 may not consume Trust Signals, Trust Pillars, Commitment Tracking, or raw
trust evidence.

---

# Q3 may synthesize.

---

# Other Questions may NOT:

```text
Create Trust Signals

Consume Trust pillar artifacts
```

---

# Invalidation Integration

# Trigger Events

```text
Quarter Understanding Changed

Company Knowledge Changed

Business Signals Changed

Topic Evolution Changed

Prior Investor Intelligence Changed

Prompt Changed

Market Data Changed
```

---

# Ownership

```text
Builder publishes immutable artifact content.

Artifact Framework persists immutable artifact versions.

Dependency Index records dependency relationships.

Invalidation Engine determines and propagates staleness.
```

Investor Intelligence Builder does not determine invalidation decisions.

---

# Replayability Requirements

Must record:

```text
Prompt Lineage

Prompt Versions

Model Versions

Per-Question Input Hashes

Section Output Hashes

Coherence Hash

Evaluation Metadata

Enrichment Status

Depth Indicators
```

for:

```text
Q1

Q2

Q3

Q4

Q5
```

---

# Replayability Metadata Schema

```typescript
type ModelVersions = {
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  q5: string;
};

type InvestorIntelligenceEvaluationMetadata =
  Record<string, unknown>;
```

```typescript
type InvestorIntelligenceReplayabilityMetadata = {
  prompt_lineage: InvestorPromptLineage;

  q1_prompt_version: string;

  q2_prompt_version: string;

  q3_prompt_version: string;

  q4_prompt_version: string;

  q5_prompt_version: string;

  per_question_input_hashes: {
    q1: string;
    q2: string;
    q3: string;
    q4: string;
    q5: string;
  };

  section_output_hashes: {
    q1: string;
    q2: string;
    q3: string;
    q4: string;
    q5: string;
  };

  coherence_hash: string;

  model_versions: ModelVersions;

  evaluation_metadata: InvestorIntelligenceEvaluationMetadata;

  enrichment_status: EnrichmentStatus;

  depth_indicators: DepthIndicator;
};
```

This structure is content-level replayability metadata owned by Investor
Intelligence Builder.

`replayability_metadata` is the source of truth for replayability values.

For compatibility, duplicated top-level fields must equal their corresponding
replayability values:

```text
prompt_lineage = replayability_metadata.prompt_lineage

per_question_input_hashes =
  replayability_metadata.per_question_input_hashes

coherence_hash = replayability_metadata.coherence_hash

enrichment_status = replayability_metadata.enrichment_status

depth_indicator = replayability_metadata.depth_indicators
```

Any mismatch causes artifact validation failure.

It is not Artifact Framework lineage.

Artifact Framework continues to own framework lineage, artifact identity,
artifact versioning, persistence, and storage mechanics.

---

# Builder Metrics

Track:

```text
Question Execution

Boundary Validation

Content Assembly

Artifact Framework Handoff

Evaluation
```

---

# Monitoring Schema

```typescript
type BuilderMetrics = {
  q1_execution_ms: number;

  q2_execution_ms: number;

  q3_execution_ms: number;

  q4_execution_ms: number;

  q5_execution_ms: number;

  validation_ms: number;

  artifact_framework_handoff_ms: number;

  evaluation_ms: number;

  token_usage: number;
};
```

---

# Error Categories

```typescript
type BuilderError =
  | "DEPENDENCY_MISSING"
  | "PROMPT_RESOLUTION_FAILURE"
  | "QUESTION_EXECUTION_FAILURE"
  | "BOUNDARY_VIOLATION"
  | "RECOMMENDATION_VIOLATION"
  | "ASSEMBLY_FAILURE"
  | "PERSISTENCE_FAILURE";
```

---

# Recovery Strategy

Dependency Missing:

```text
Wait
```

Prompt Failure:

```text
Maximum attempts = 3

Retryable:
Transient Failure
Infrastructure Failure
Timeout

Not retryable:
Schema Failure
Validation Failure
Governance Failure

After attempts are exhausted:
Return QUESTION_EXECUTION_FAILURE
Do not assemble or persist artifact content
```

Boundary Violation:

```text
Reject Artifact
```

Recommendation Violation:

```text
Reject Artifact
```

Artifact Framework Handoff Failure:

```text
Return failure to Builder Framework
```

---

# Scaling Requirements

Target:

```text
10,000+ companies
```

Must support:

- deterministic orchestration
- LLM-assisted synthesis
- Q1-Q5 governance
- auditability
- replayability
- confidence calibration

---

# Architectural Invariants

LOCKED.

1. Investor Intelligence is the final LLM-assisted synthesis layer and investor-facing reasoning layer.
2. Investor Intelligence owns Q1-Q5.
3. Q1-Q5 ownership boundaries are mandatory.
4. Q3 owns investor trust synthesis.
5. Q5 is the sole owner of ownership reasoning.
6. Investor Intelligence must never produce investment advice.
7. Q4 remains present with Sprint 11 insufficient-data status.
8. Q5 consumes Q4 output even when Q4 has insufficient-data status.
9. Confidence is builder-generated.
10. Partner Domain consumes Investor Intelligence but never generates intelligence.
11. Investor Intelligence Q3 consumes Quarter Understanding trust interpretation only.
12. Investor Intelligence Builder does not consume Trust Signals or Trust Pillars directly.
13. Investor Intelligence synthesis is LLM-assisted; builder orchestration may be deterministic.

End of Specification.
