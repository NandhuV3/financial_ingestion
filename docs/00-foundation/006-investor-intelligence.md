# 006-investor-intelligence.md

# Purpose

Investor Intelligence is the LLM-assisted synthesis layer and investor-facing
reasoning layer of the platform.

It answers:

"What should an owner understand about this business?"

Investor Intelligence is not a filing interpretation layer.

Investor Intelligence is not a presentation layer.

Investor Intelligence owns Q1-Q5 synthesis.

Investor Intelligence synthesis is LLM-assisted. It is not deterministic
synthesis.

---

# Architectural Position

Company Knowledge
        ↓

Quarter Understanding
        ↓

Investor Intelligence
        ↓

Partner Domain

Investor Intelligence sits above Quarter Understanding and synthesizes information across time.

Required inputs:

- Company Knowledge
- Quarter Understanding

Optional enrichment:

- Business Signals (Q2 only)
- Topic Evolution
- Prior Investor Intelligence
- Market Data

Trust input for Q3:

- Quarter Understanding trust interpretation

Trust follows the strict governed flow:

```text
Trust Pillars
        ↓
Trust Signals
        ↓
Quarter Understanding
        ↓
Investor Intelligence Q3
```

Investor Intelligence consumes trust interpretation, not trust observations.

---

# Core Business Question

Investor Intelligence answers:

What does this company sell?

Where does future growth come from?

Can management be trusted?

Is valuation justified?

Why would an owner continue holding the business?

---

# Ownership

Investor Intelligence owns:

- Q1 Business Understanding
- Q2 Growth Understanding
- Q3 Trust Understanding
- Q4 Valuation Understanding
- Q5 Ownership Thesis

Investor Intelligence owns investor-facing Q1-Q5 synthesis.

---

# Does Not Own

Investor Intelligence never owns:

- Signal generation
- Filing interpretation
- Company memory
- Presentation
- Portfolio construction
- Buy recommendations
- Sell recommendations
- Price targets

Those belong elsewhere.

---

# Five Question Framework

Investor Intelligence is structured around five questions.

---

# Q1

## What does this company actually sell?

Primary Inputs:

- Company Knowledge

Purpose:

Create a durable understanding of:

- Business Model
- Revenue Structure
- Products
- Customers

Q1 is mostly company-scoped.

Not quarter-scoped.

---

# Q2

## Where does the next rupee come from?

Primary Inputs:

- Company Knowledge
- Quarter Understanding

Enrichment Inputs:

- Business Signals (Q2 only)
- Topic Evolution

Business Signals are optional enrichment for Q2. They are not required inputs.

Business Signals are not consumed by Q1, Q3, Q4, or Q5.

Purpose:

Identify:

- Revenue Drivers
- Growth Engines
- Expansion Opportunities

Requires synthesis.

---

# Q3

## Can the story be trusted?

Primary Inputs:

- Quarter Understanding trust interpretation

Purpose:

Evaluate:

- Management Consistency
- Commitment Follow-Through
- Reporting Stability

Trust is:

Management credibility versus observable reality.

Trust is NOT risk.

Investor Intelligence does not consume trust observations or trust pillar
artifacts directly.

Q3 must not consume:

- Trust Signals
- Generic Trust Artifacts
- Commitment Tracking
- Narrative Consistency
- Accounting Stability
- Capital Allocation Tracking

Quarter Understanding is the sole trust interpretation source for Q3.

LOCKED.

---

# Q4

## Is the story already too expensive?

Primary Inputs:

- Company Knowledge
- Quarter Understanding

Enrichment Inputs:

- Market Data

Purpose:

Frame:

- Market expectation context when available
- Limitations when market data is unavailable

Q4 may return:

```text
insufficient_data
```

until valuation infrastructure exists.

Sprint 11 behavior:

```text
status = "insufficient_data"
absent_reason = "market_data_unavailable"
```

Market data integration is deferred.

Valuation methodology is future work and is not implemented in Sprint 11.

Q4 may not transition to `answered` status until a valuation methodology is
formally defined and locked.

LOCKED.

---

# Q5

## Why would an owner continue holding this business?

Primary Inputs:

- Q1
- Q2
- Q3
- Q4

Purpose:

Create ownership thesis.

Identify thesis-breaking conditions.

Q5 is the highest synthesis layer.

---

# Architectural Principle

Q5 never reads raw artifacts.

Q5 only reads:

- Q1
- Q2
- Q3
- Q4

Q5 must not consume upstream artifacts directly, including:

- Company Knowledge
- Quarter Understanding
- Trust Signals
- Business Signals

This ensures:

- Traceability
- Auditability
- Replayability

LOCKED.

---

# Ownership Boundary

Investor Intelligence synthesizes.

Investor Intelligence does not:

- generate signals
- reinterpret raw trust evidence
- consume Trust Signals directly
- consume trust pillar artifacts
- consume Quarter Change directly
- produce buy/sell/hold recommendations
- produce price targets

---

# Replayability Metadata

Investor Intelligence owns generation of content-level replayability metadata:

- `prompt_version`
- `model_version`
- prompt lineage
- input hashes, including section input hashes
- output hashes
- coherence hash
- evaluation metadata

Prompt lineage and input hashes must reference required inputs and every
optional enrichment input actually used.

Context assembly rules must be deterministic and replayable. These fields are
replayability fields; they are not Artifact Framework identity, lineage,
versioning, or lifecycle metadata.

---

# Artifact Structure

Investor Intelligence is a single artifact.

Each Q1-Q5 section carries section replayability metadata to support partial
invalidation and replay.

---

## Artifact Content Schema

```typescript
type InvestorIntelligenceArtifactContent = {
  company_id: string;

  period_id: string;

  questions: {
    q1: Q1Answer;
    q2: Q2Answer;
    q3: Q3Answer;
    q4: Q4Answer;
    q5: Q5Answer;
  };

  replayability_metadata: {
    prompt_lineage: InvestorPromptLineage;
    prompt_versions: PromptVersions;
    model_versions: ModelVersions;
    section_input_hashes: SectionInputHashes;
    section_output_hashes: SectionOutputHashes;
    coherence_hash: string;
    output_hash: string;
    evaluation_metadata: InvestorIntelligenceEvaluationMetadata;
  };
}
```

This is Investor Intelligence content and content-level replayability metadata.

The Artifact Framework owns artifact identity, artifact metadata, framework
lineage, artifact versioning, persistence, current pointers, archive/history,
and framework hashes.

---

# Why Single Artifact

Chosen Architecture:

Single Artifact

Section Replayability Metadata

Reason:

Provides:

- Partial Invalidation
- Easier Governance
- Easier Historical Comparison
- Easier Auditability

Without:

- Distributed Artifact Complexity
- Manifest Management
- Orchestration Overhead

LOCKED.

---

# Section Replayability Metadata

Each question records the replayability fields required to reproduce and
validate that section.

```typescript
type QuestionSection = {
  answer: string;

  input_hash: string;

  output_hash: string;

  prompt_version: string;

  model_version: string;

  prompt_lineage: PromptLineage;

  evaluation_metadata: SectionEvaluationMetadata;

  confidence: StructuredConfidence;
}
```

These are section replayability metadata fields. They are not artifact
versioning or Artifact Framework metadata.

---

# Partial Invalidation

Supported.

Examples:

Q2 changes

↓

Only Q2 regenerates.

Q1, Q3, Q4 remain unchanged.

---

Q4 changes

↓

Q4 regenerates.

Q5 regenerates.

Q1-Q3 remain unchanged.

---

# Q5 Ownership Thesis

Q5 produces:

- Ownership Thesis
- Change Conditions
- Holding Rationale

Not recommendations.

---

## Ownership Thesis Structure

```typescript
type OwnershipThesis = {
  summary: string;

  thesis_strength:
    | "strong"
    | "moderate"
    | "conditional"
    | "weak";

  rationale: string;
}
```

---

# Change Conditions

Most important Q5 structure.

These define:

"What would change the thesis?"

---

## Change Condition Schema

```typescript
type ChangeCondition = {
  condition_id: string;

  condition_type:
    | "revenue_model_change"
    | "trust_deterioration"
    | "competitive_displacement"
    | "valuation_threshold"
    | "management_change"
    | "regulatory_change"
    | "capital_allocation_shift"
    | "strategic_priority_abandonment";

  description: string;

  signal_to_watch: string;

  severity:
    | "monitoring"
    | "thesis_weakening"
    | "thesis_breaking";

  current_status:
    | "not_triggered"
    | "early_warning"
    | "triggered";
}
```

---

# Q4 Dependency

Q5 always consumes the Q4 output.

When Q4 has Sprint 11 insufficient-data status:

```text
Status = PARTIAL
```

Q5 remains valid.

Valuation-related conditions are omitted.

Confidence penalty applied.

LOCKED.

---

# Confidence Model

Confidence is inherited from inputs.

Q5 cannot be more confident than its weakest major input.

Example:

Q3 = Low Confidence

↓

Q5 cannot produce Strong Thesis.

This constraint is deterministic.

LOCKED.

---

# LLM Usage

Investor Intelligence is an LLM-assisted synthesis layer and investor-facing
reasoning layer.

Reason:

Cross-period synthesis.

Ownership reasoning.

Trust synthesis.

Growth synthesis.

No deterministic system can perform this reliably.

---

# Prompt Governance

The Prompt Registry owns Investor Intelligence prompts and prompt versions.

Every Q1-Q5 execution resolves its governed prompt through the Prompt Registry.

Execution requirements:

```text
temperature = 0
model version = pinned
prompt version = pinned
```

Prompt lineage and the pinned prompt/model versions must be recorded in
replayability metadata.

LOCKED.

---

# Governance Rules

Investor Intelligence must never:

- Recommend buying
- Recommend selling
- Predict price targets
- Predict future returns

Forbidden Language:

- Buy
- Sell
- Target Price
- Expected Return
- Upside
- Downside

Investor Intelligence explains.

It does not advise.

LOCKED.

---

# Evaluation Requirements

Investor Intelligence evaluated on:

---

## Completeness

Did Q1-Q5 answer the question?

---

## Grounding

Can every answer trace to evidence?

---

## Consistency

Do Q1-Q5 tell the same story?

---

## Confidence Calibration

Does confidence match evidence?

---

## Ownership Thesis Quality

Are thesis-breaking conditions explicit?

---

# Artifact Framework Ownership

Investor Intelligence provides:

- Q1-Q5 answers
- Evidence packages
- Confidence
- Enrichment and depth information
- Content-level replayability metadata

The Artifact Framework exclusively owns storage mechanics and artifact
lifecycle concerns, including:

- Artifact identity
- Artifact metadata
- Framework lineage
- Artifact versioning
- Persistence
- Current pointers
- Archive and history
- Framework hashes

Investor Intelligence does not define storage trees, archive layouts,
`current.json` layouts, or persistence structures.

---

# Final Principle

Quarter Understanding answers:

"What happened?"

Investor Intelligence answers:

"What should an owner understand?"

Partner Domain answers:

"How should that understanding be presented?"

These responsibilities must never overlap.

LOCKED.
