# 037-investor-intelligence-builder-spec.md

Version: 1.0
Status: LOCKED
Owner: Investor Intelligence Layer

---

# Purpose

The Investor Intelligence Builder is the orchestration layer responsible for constructing the complete Investor Intelligence artifact.

It does not generate intelligence itself.

It coordinates:

- context assembly
- dependency validation
- Q1 generation
- Q2 generation
- Q3 generation
- Q4 generation (optional)
- Q5 synthesis
- confidence propagation
- replayability metadata construction
- artifact content assembly

---

# Architectural Position

```text
Quarter Understanding
        ↓

Company Knowledge
        ↓

Investor Intelligence Builder
        ↓

Q1
Q2
Q3
Q4(optional)
Q5
        ↓

Investor Intelligence Artifact
        ↓

Partner Domain
```

---

# Ownership

Builder owns:

- orchestration
- dependency validation
- execution ordering
- confidence propagation
- artifact content assembly
- prompt/replayability lineage generation
- invalidation metadata emission

Builder does NOT own:

- business reasoning
- growth reasoning
- trust reasoning
- valuation reasoning
- ownership thesis reasoning

Those belong to prompts.

---

# Core Responsibilities

The Builder must:

```text
Validate Inputs

Build Context

Execute Questions

Assemble Artifact Content

Calculate Confidence

Generate Replayability Metadata

Return BuilderResult<InvestorIntelligenceArtifactContent>

Artifact Framework Persistence/Versioning
```

Replayability requires:

```text
per-question input hashes

coherence hash

prompt lineage and replayability references for required inputs and used enrichment inputs

deterministic context assembly
```

---

# Artifact Content Produced

```typescript
type InvestorIntelligenceArtifactContent = {
  company: string;

  period: string;

  q1: Q1Answer;

  q2: Q2Answer;

  q3: Q3Answer;

  q4: Q4Answer | null;

  q5: Q5Answer;

  artifact_confidence: InvestorConfidence;

  prompt_lineage: InvestorPromptLineage;

  per_question_input_hashes: PerQuestionInputHashes;

  coherence_hash: string;

  output_hash: string;

  evaluation_hooks: InvestorIntelligenceEvaluationHooks;
};
```

Artifact Framework provides artifact identity, metadata, Artifact Framework
lineage, versioning, hashes, persistence, current pointer, and archive/history.

---

# Builder Inputs

Required:

```text
Company Knowledge

Quarter Understanding
```

Optional:

```text
Business Signals (Q2 only)

Trust Signals (conditional exception only)

Commitment Tracking (Q3 longitudinal depth only)

Topic Evolution

Prior Investor Intelligence

Market Data

Historical Investor Intelligence
```

---

# Dependency Validation

Before execution:

Builder validates:

```typescript
type DependencyValidation = {
  company_knowledge: boolean;

  quarter_understanding: boolean;

  business_signals: boolean;

  trust_signals: boolean;

  commitment_tracking: boolean;

  topic_evolution: boolean;
};
```

---

# Validation Failure Rules

Missing:

```text
Company Knowledge
```

Result:

```text
Build Failure
```

Missing:

```text
Quarter Understanding
```

Result:

```text
Build Failure
```

Missing:

```text
Business Signals
```

Result:

```text
Q2 Reduced Coverage
```

Missing:

```text
Trust Signals
```

Result:

```text
Q3 uses Quarter Understanding trust interpretation when available.

Q3 records trust limitation when Quarter Understanding trust_dimension is absent.
```

Missing:

```text
Commitment Tracking
```

Result:

```text
Q3 Longitudinal Depth Reduced
```

Missing:

```text
Topic Evolution
```

Result:

```text
Longitudinal Depth Reduced
```

---

# Execution Order

Execution order is fixed.

---

# Phase 1

Build Q1

```text
Business Understanding
```

---

# Phase 2

Build Q2

```text
Growth Understanding
```

---

# Phase 3

Build Q3

```text
Trust Understanding
```

---

# Phase 4

Build Q4

if valuation inputs available.

---

# Phase 5

Build Q5

Consumes:

```text
Q1

Q2

Q3

Q4(optional)
```

---

# Why Fixed Ordering Exists

Q5 depends on:

```text
Q1–Q4
```

Q5 must never execute first.

---

# Context Builder Architecture

Each question receives:

```typescript
type QuestionContext = {
  company: string;

  period: string;

  inputs: object;

  confidence_inputs: object;

  lineage_inputs: object;
};
```

---

# Context Isolation Rule

Q1 Context

cannot see:

```text
Q2

Q3

Q4

Q5
```

---

# Q2 Context

cannot see:

```text
Q3

Q4

Q5
```

---

# Q3 Context

cannot see:

```text
Q4

Q5
```

---

# Q5 Context

may see:

```text
Q1

Q2

Q3

Q4
```

---

# Q4 Optional Execution

---

# Rule

If:

```typescript
marketDataAvailable === false
```

then:

```typescript
q4 = null
```

and:

```typescript
Q4.status =
  "insufficient_data"

Q4.absent_reason =
  "market_data_unavailable"
```

---

# Build Continues

Q5 still executes.

No build failure.

---

# Partial Operation Contract

Investor Intelligence must function when:

```text
Q4 unavailable
```

---

# Q5 Partial Contract

When Q4 absent:

```typescript
Q5.status =
  "partial";
```

and:

```typescript
Q5.partial_reason =
  "q4_unavailable";
```

---

# Confidence Propagation

Builder computes:

```text
Question Confidence

↓

Artifact Confidence
```

---

# Artifact Confidence

```typescript
type InvestorConfidence = {
  overall: number;

  q1_confidence: number;

  q2_confidence: number;

  q3_confidence: number;

  q4_confidence: number | null;

  q5_confidence: number;
};
```

---

# Confidence Rules

Overall confidence cannot exceed:

```typescript
min(
  q1,
  q2,
  q3,
  q5
)
```

Q4 excluded when unavailable.

---

# Weakest Input Rule

Builder records:

```typescript
weakest_input:
  "q1"
  | "q2"
  | "q3"
  | "q4";
```

---

# Replayability Lineage Generation

Builder generates prompt lineage and replayability metadata.

Artifact Framework generates Artifact Framework lineage.

---

# Prompt/Replayability Lineage

```typescript
type InvestorPromptLineage = {
  company_knowledge_version: number;

  quarter_understanding_version: number;

  business_signals_version: number;

  topic_evolution_version: number;

  commitment_tracking_version: number;

  narrative_consistency_version: number;

  accounting_stability_version: number;

  q1_version: number;

  q2_version: number;

  q3_version: number;

  q4_version: number | null;

  q5_version: number;

  prompt_versions: {
    q1: string;

    q2: string;

    q3: string;

    q4: string | null;

    q5: string;
  };

  input_hash: string;
};
```

---

# Versioning Model

Investor Intelligence uses:

```text
Single Artifact

Internal Question Versioning
```

---

# Question Versioning

Each question carries:

```typescript
question_version
```

independently.

---

# Artifact Version

```typescript
artifact_version
```

is owned by Artifact Framework and increments according to Artifact Framework
versioning rules.

---

# Coherence Hash

Builder computes:

```typescript
coherence_hash
```

---

# Definition

Hash of:

```text
Q1 Input Hash

Q2 Input Hash

Q3 Input Hash

Q4 Input Hash

Q5 Input Hash
```

---

# Purpose

Detect artifact-level changes.

Support partial invalidation.

---

# Partial Invalidation

Investor Intelligence supports:

```text
Question-Level Invalidation
```

---

# Example

Only:

```text
Market Data Changed
```

---

# Result

Invalidate:

```text
Q4

Q5
```

Keep:

```text
Q1

Q2

Q3
```

---

# Regeneration Logic

Question executes only when:

```typescript
new_input_hash
!=
stored_input_hash
```

---

# Carry Forward Rule

When hashes match:

```text
Copy Prior Question
```

No regeneration.

---

# Historical Archive

Every artifact version archived.

---

# Archive Structure

```text
current.json

archive/
    v1.json
    v2.json
    v3.json
```

---

# Historical Comparison Support

Builder must support:

```text
Question-Level Diffs

Artifact-Level Diffs

Confidence Diffs
```

---

# Governance Integration

Before artifact write:

Run:

```text
Schema Validation

Confidence Validation

Forbidden Language Scan

Replayability Metadata Validation
```

---

# Build Failure Conditions

---

# Fail Build

Missing:

```text
Company Knowledge

Quarter Understanding
```

---

# Fail Build

Invalid Schema

---

# Fail Build

Missing Replayability Metadata

---

# Fail Build

Recommendation Language Detected

---

# Recommendation Language Scan

Scan:

```text
Q1

Q2

Q3

Q4

Q5
```

---

# Forbidden Examples

```text
Buy

Sell

Strong Buy

Outperform

Price Target

Expected Return
```

---

# Evaluation Integration

Builder publishes:

```typescript
BuilderEvaluationPackage
```

for evaluation pipeline.

---

# Package Includes

```typescript
{
  confidence,
  prompt_versions,
  prompt_lineage,
  per_question_input_hashes,
  coherence_hash,
  output_hash,
  question_statuses
}
```

---

# Dependency Index Integration

Dependency Index registers:

```text
Investor Intelligence
```

as dependent on:

```text
Company Knowledge

Quarter Understanding

Business Signals

Topic Evolution

Trust Signals (conditional exception only)

Commitment Tracking (Q3 longitudinal depth only)

Prior Investor Intelligence

Market Data
```

---

# Hybrid Invalidation Integration

Builder participates in:

```text
Version Hash
+
Content Hash
```

architecture.

---

# Candidate Invalidation

Triggered by:

```text
Upstream Version Change
```

---

# Propagation Decision

Triggered by:

```text
Content Hash Difference
```

---

# Scaling Requirements

Target:

```text
10,000+ companies
```

Must support:

- partial regeneration
- historical tracking
- confidence propagation
- auditability
- replayability

---

# Operational Requirements

Builder must be:

```text
Deterministic
```

for identical inputs.

Production generation:

```text
Temperature = 0
```

required.

---

# Architectural Invariants

LOCKED.

1. Builder orchestrates, not reasons.
2. Execution order is fixed (Q1→Q5).
3. Q4 is optional.
4. Q5 must operate without Q4.
5. Investor Intelligence is a single artifact.
6. Questions maintain independent versions.
7. Partial invalidation is mandatory.
8. Confidence propagates upward.
9. Replayability metadata is mandatory.
10. Builder must be fully replayable and auditable.

End of Specification.
