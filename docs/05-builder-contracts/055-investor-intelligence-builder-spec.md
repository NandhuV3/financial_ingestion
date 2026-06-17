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
- Trust Signals Artifact (conditional exception only)
- Commitment Tracking Artifact (Q3 longitudinal depth only)
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
The Final Intelligence Layer
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

- persistence
- artifact versioning
- current pointer management
- archival/history

Dependency Index owns:

- dependency registration
- dependency graph management
- invalidation state

Builder does NOT own:

- business memory
- signal generation
- trust signals
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

18. Evaluation Hook Emission
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

Business Signals (optional, Q2 only)

Topic Evolution (optional)
```

# Enrichment Artifacts

```text
Business Signals

Trust Signals

Commitment Tracking

Topic Evolution

Prior Investor Intelligence

Market Data
```

Business Signals is available to Q2 only.

Trust Signals may be consumed directly only when:

```text
quarter_understanding.depth_indicator.trust_dimension = "absent"
```

When:

```text
quarter_understanding.depth_indicator.trust_dimension = "present"
```

Trust Signals must not be consumed directly.

Quarter Understanding remains the sole trust interpretation source.

Commitment Tracking may be consumed only for Q3 longitudinal depth.

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
    BusinessSignalsArtifact | null;

  trust_signals:
    TrustSignalsArtifact | null;

  commitment_tracking:
    CommitmentTrackingArtifact | null;

  topic_evolution:
    TopicEvolutionArtifact | null;

  prior_investor_intelligence:
    InvestorIntelligenceArtifact | null;

  market_data:
    MarketDataArtifact | null;
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

Validation must fail if Trust Signals are supplied directly while:

```text
quarter_understanding.depth_indicator.trust_dimension = "present"
```

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
```

---

# Q3 Context

```text
Quarter Understanding

Trust Signals (optional, only when Quarter Understanding trust_dimension = absent)

Commitment Tracking (optional, longitudinal depth only)
```

---

# Q4 Context

```text
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

Determinism

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
    Q4Answer | null;

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
};
```

Artifact Framework provides artifact identity, artifact type, metadata,
Artifact Framework lineage, versioning, hashes, persistence, current pointer,
and archive/history.

Investor Intelligence Builder provides only artifact content and
builder-owned replayability metadata.

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

  q4_confidence: number | null;

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

Artifact lineage

Artifact versioning

Artifact-level hashes

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

# Step 16

Dependency Registration

---

# Dependency Node

```typescript
type DependencyNode = {
  artifact_type:
    "investor_intelligence";

  upstream: [
    "company_knowledge",
    "quarter_understanding",
    "commitment_tracking",
    "narrative_consistency",
    "accounting_stability"
  ];

  downstream: [
    "partner_domain"
  ];
};
```

---

# Step 17

Evaluation Execution

---

# Purpose

Run:

```text
Investor Intelligence Evaluation
```

---

# Categories

```text
Q1 Evaluation

Q2 Evaluation

Q3 Evaluation

Q4 Evaluation

Q5 Evaluation

Cross-Question Coherence
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

# Step 18

Evaluation Hook Emission

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

# Q4 Optionality

Critical.

---

# Rule

Q4 may be:

```text
Missing
```

---

# Builder must still generate:

```text
Q5
```

---

# Missing Q4 Handling

```typescript
q4 = null
```

---

# Q5 receives:

```text
Reduced Confidence
```

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
Quarter Understanding is the sole trust interpretation source
when trust_dimension = present.

Trust Signals may be consumed directly only
when trust_dimension = absent.

Commitment Tracking may be consumed only
for Q3 longitudinal depth.
```

---

# Q3 may synthesize.

---

# Other Questions may consume.

---

# Other Questions may NOT:

```text
Create Trust Signals

Consume Trust pillar artifacts
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
Quarter Understanding Changed

Company Knowledge Changed

Business Signals Changed

Trust Signals Changed

Commitment Tracking Changed

Topic Evolution Changed

Prompt Changed

Market Data Changed
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

# Replayability Requirements

Must record:

```text
Prompt Versions

Model Versions

Input Hashes

Output Hashes

Per-Question Input Hashes

Coherence Hash
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
type InvestorIntelligenceReplayabilityMetadata = {
  q1_prompt_version: string;

  q2_prompt_version: string;

  q3_prompt_version: string;

  q4_prompt_version: string | null;

  q5_prompt_version: string;

  input_hash: string;

  per_question_input_hashes: {
    q1: string;
    q2: string;
    q3: string;
    q4: string | null;
    q5: string;
  };

  coherence_hash: string;

  output_hash: string;

  evaluation_version: string;
};
```

This structure is builder-owned replayability metadata. It is distinct from
Artifact Framework lineage, which is supplied by the Artifact Framework.

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
Retry
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

- deterministic generation
- Q1-Q5 governance
- auditability
- replayability
- confidence calibration

---

# Architectural Invariants

LOCKED.

1. Investor Intelligence is the final intelligence layer.
2. Investor Intelligence owns Q1-Q5.
3. Q1-Q5 ownership boundaries are mandatory.
4. Q3 owns investor trust synthesis.
5. Q5 is the sole owner of ownership reasoning.
6. Investor Intelligence must never produce investment advice.
7. Q4 is optional.
8. Q5 must function without Q4.
9. Confidence is builder-generated.
10. Partner Domain consumes Investor Intelligence but never generates intelligence.

End of Specification.
