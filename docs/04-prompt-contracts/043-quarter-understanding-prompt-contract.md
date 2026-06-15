# 043-quarter-understanding-prompt-contract.md

Version: 1.0
Status: LOCKED
Owner: Quarter Understanding Layer

Inherits:
040-prompt-governance-spec.md

Depends On:

- Company Knowledge
- Business Signals
- Concept Registry
- Trust Signals
- Topic Evolution

---

# Purpose

This contract governs the Quarter Understanding Prompt.

Quarter Understanding is the interpretation layer of the platform.

It transforms:

```text
Deterministic Intelligence
```

into:

```text
Business Understanding
```

for a specific company and period.

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

Quarter Understanding
        ↓

Investor Intelligence
```

---

# Core Question

The prompt answers:

```text
What do the observed signals
mean for this business
during this period?
```

---

# Architectural Role

Quarter Understanding is the bridge between:

```text
Deterministic Facts
```

and

```text
Investor Intelligence
```

---

# Ownership

Quarter Understanding owns:

- signal interpretation
- business context synthesis
- concept selection
- importance assessment
- directional understanding

Quarter Understanding does NOT own:

- durable company memory
- signal generation
- trust verdicts
- valuation conclusions
- investment conclusions

---

# Core Responsibility

Transform:

```text
Signals

+

Knowledge

+

Context
```

into:

```text
Business Understanding
```

---

# Architectural Principle

Quarter Understanding explains:

```text
Why something matters.
```

It does NOT determine:

```text
Whether investors should act.
```

---

# Input Contract

Required:

```typescript
type QuarterUnderstandingInput = {
  company_knowledge:
    CompanyKnowledgeArtifact;

  business_signals:
    BusinessSignalArtifact[];

  trust_signals:
    TrustSignalArtifact[];

  topic_evolution:
    TopicEvolutionArtifact;

  concept_registry:
    ActiveConceptRegistry;
};
```

---

# Allowed Inputs

Prompt may consume:

```text
Company Knowledge

Business Signals

Trust Signals

Topic Evolution

Concept Registry
```

---

# Forbidden Inputs

Prompt must NOT consume:

```text
Investor Intelligence

Q1

Q2

Q3

Q4

Q5

Partner Domain

Market Data

Valuation Data

Analyst Opinions
```

---

# Reason

Prevent:

```text
Future Leakage

Circular Reasoning

Recommendation Contamination
```

---

# Output Contract

Prompt must produce:

```typescript
type QuarterUnderstandingArtifact = {
  understandings:
    UnderstandingEntry[];

  proposed_concepts:
    ProposedConcept[];

  confidence:
    null;

  metadata: Metadata;
};
```

---

# Understanding Entry

```typescript
type UnderstandingEntry = {
  understanding_id: string;

  category:
    UnderstandingCategory;

  concept_id: string;

  title: string;

  explanation: string;

  importance:
    | "low"
    | "medium"
    | "high";

  direction:
    | "improving"
    | "stable"
    | "deteriorating"
    | "mixed";

  evidence_package:
    EvidencePackage;
};
```

---

# Understanding Categories

```typescript
type UnderstandingCategory =
  | "business"
  | "growth"
  | "operations"
  | "trust"
  | "capital_allocation"
  | "competition"
  | "customer";
```

---

# Purpose Of Understandings

Understandings explain:

```text
What happened

Why it matters

What it suggests
```

for the business.

---

# Example

Input Signal:

```text
REVENUE_ACCELERATION
```

Bad Output:

```text
Revenue grew.
```

Good Output:

```text
Revenue acceleration appears
to be driven by increasing
enterprise cloud adoption,
suggesting strengthening demand
within the company's core platform.
```

---

# Concept Registry Integration

Quarter Understanding must use:

```text
Active Concepts
```

from Concept Registry.

---

# Concept Requirement

Every understanding must reference:

```typescript
concept_id
```

---

# Validation Rule

All concept_ids must exist.

---

# Invalid Concept

```text
Build Failure
```

No silent acceptance.

---

# Concept Selection Rules

Use:

```text
Existing Active Concept
```

when available.

---

# Proposed Concepts

If no concept exists:

Prompt may emit:

```typescript
proposed_concepts[]
```

---

# Proposed Concept Schema

```typescript
type ProposedConcept = {
  title: string;

  proposed_definition: string;

  topic_reference: string;

  rationale: string;
};
```

---

# Governance Rule

Quarter Understanding does NOT create concepts.

It only proposes them.

---

# Signal Utilization Requirements

Prompt must consume:

```text
Business Signals
```

actively.

---

# Signal Ignoring Rule

Available signal ignored:

```text
Evaluation Failure
```

unless justification exists.

---

# Company Knowledge Usage

Prompt must ground interpretations in:

```text
Company Context
```

---

# Example

Signal:

```text
AI Investment Rising
```

Company A:

```text
Cloud Platform
```

Company B:

```text
Consumer Retail
```

Understandings should differ.

---

# Importance Assessment

Quarter Understanding assigns:

```text
Low

Medium

High
```

importance.

---

# Definition

Importance means:

```text
Business Materiality
```

not mention frequency.

---

# Direction Classification

Allowed:

```text
Improving

Stable

Deteriorating

Mixed
```

---

# Direction Meaning

Represents:

```text
Observed Business Direction
```

not future prediction.

---

# Trust Interpretation Rules

Quarter Understanding may interpret:

```text
Trust Signals
```

---

# Example

Allowed:

```text
Repeated commitment slippage
suggests weakening execution reliability.
```

Forbidden:

```text
Management cannot be trusted.
```

---

# Trust Boundary

Quarter Understanding may:

```text
Interpret
```

Trust Signals.

Quarter Understanding may NOT:

```text
Issue Trust Verdicts.
```

---

# Evidence Package

Required.

---

# Schema

```typescript
type EvidencePackage = {
  signal_refs: string[];

  trust_signal_refs: string[];

  company_knowledge_refs: string[];

  topic_refs: string[];
};
```

---

# Evidence Requirement

Every understanding must reference:

```text
At least one signal
```

and

```text
Relevant supporting evidence.
```

---

# Grounding Rules

All interpretations must trace to:

```text
Signals

Knowledge

Topics
```

---

# Hallucination Prevention

Prompt must not invent:

```text
Signals

Concepts

Strategies

Customers

Products
```

not supported by inputs.

---

# Confidence Rules

Prompt does NOT generate confidence.

---

# Builder Computes

```typescript
type QuarterUnderstandingConfidence = {
  signal_coverage: number;

  concept_validity: number;

  grounding_score: number;

  evidence_density: number;

  overall: number;
};
```

---

# Forbidden Output Fields

Prompt must NOT generate:

```text
Confidence

Trust Verdict

Valuation View

Investment Thesis

Recommendations
```

---

# Investor Boundary

Quarter Understanding must not answer:

```text
Should investors own this?

Will the stock rise?

Is valuation attractive?
```

---

# Evaluation Hooks

Supports:

```text
Signal Utilization

Grounding

Concept Usage

Interpretation Quality

Importance Calibration
```

---

# Evaluation Metrics

## Signal Coverage

Measures:

```text
Use of available signals.
```

---

## Concept Compliance

Measures:

```text
Valid concept references.
```

---

## Interpretation Quality

Measures:

```text
Business understanding quality.
```

---

## Grounding Score

Measures:

```text
Evidence support.
```

---

## Importance Calibration

Measures:

```text
Materiality assessment quality.
```

---

# Prompt Failure Conditions

Prompt fails if it:

Creates concepts directly

Uses invalid concepts

Creates trust verdicts

Creates valuation opinions

Creates investment opinions

Generates recommendations

Ignores major signals

Produces unsupported interpretations

---

# Recommendation Boundary

Forbidden:

```text
Buy

Sell

Hold

Outperform

Underperform

Expected Return

Price Target
```

---

# Trust Verdict Boundary

Forbidden:

```text
High Trust

Low Trust

Trusted Management

Untrustworthy Management
```

These belong to:

```text
Investor Intelligence Q3
```

---

# Lineage Requirements

Artifact records:

```typescript
type QuarterUnderstandingPromptLineage = {
  prompt_id: string;

  prompt_version: string;

  model_version: string;
};
```

---

# Replayability Requirements

Production execution:

```text
Temperature = 0
```

required.

---

# Scaling Requirements

Target:

```text
10,000+ companies
```

Must support:

- deterministic interpretation
- concept governance
- signal synthesis
- trust interpretation
- auditability

---

# Architectural Invariants

LOCKED.

1. Quarter Understanding is an interpretation layer.
2. Quarter Understanding consumes deterministic intelligence.
3. Quarter Understanding does not generate signals.
4. Quarter Understanding does not create concepts.
5. Quarter Understanding must use Concept Registry concepts.
6. Every understanding requires evidence.
7. Trust can be interpreted but not judged.
8. Confidence is builder-generated.
9. Quarter Understanding is the bridge to Investor Intelligence.
10. Quarter Understanding must remain recommendation-free.

End of Specification.