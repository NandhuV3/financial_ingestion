# 038-investor-intelligence-artifact-spec.md

Version: 1.0
Status: LOCKED
Owner: Investor Intelligence Layer

---

# Purpose

The Investor Intelligence Artifact is the canonical investment intelligence output produced by the platform.

It is the highest-value intelligence artifact.

It represents the final synthesis of:

- business understanding
- growth understanding
- trust understanding
- valuation understanding
- ownership thesis understanding

for a specific company and period.

---

# Architectural Position

```text
Company Knowledge
        ↓

Business Signals
        ↓

Quarter Understanding
        ↓

Investor Intelligence Builder
        ↓

Investor Intelligence Artifact
        ↓

Partner Domain
```

---

# Purpose Statement

Investor Intelligence answers:

```text
Q1:
What does this company actually sell?

Q2:
Where does the next rupee come from?

Q3:
Can the story be trusted?

Q4:
Is the story already too expensive?

Q5:
Why would I hold it and what would change that?
```

---

# Ownership

Artifact owns:

- Q1
- Q2
- Q3
- Q4
- Q5

Artifact owns:

- confidence
- lineage
- auditability
- historical comparison

Artifact does NOT own:

- presentation
- formatting
- UI concerns

Those belong to Partner Domain.

---

# Artifact Identity

```typescript
type InvestorIntelligenceKey = {
  company: string;

  period: string;
};
```

---

# Artifact Uniqueness

Exactly one:

```text
Investor Intelligence Artifact
```

per:

```text
company + period
```

---

# Artifact Schema

```typescript
type InvestorIntelligenceArtifact = {
  artifact_id: string;

  business_key: InvestorIntelligenceKey;

  q1: Q1Answer;

  q2: Q2Answer;

  q3: Q3Answer;

  q4: Q4Answer | null;

  q5: Q5Answer;

  confidence: InvestorConfidence;

  longitudinal_summary:
    LongitudinalSummary;

  lineage: InvestorLineage;

  metadata: Metadata;
};
```

---

# Question Sections

---

# Q1 Section

Purpose:

```text
Business Understanding
```

Owner:

Q1 Layer

---

# Q2 Section

Purpose:

```text
Growth Understanding
```

Owner:

Q2 Layer

---

# Q3 Section

Purpose:

```text
Trust Understanding
```

Owner:

Q3 Layer

---

# Q4 Section

Purpose:

```text
Valuation Understanding
```

Owner:

Q4 Layer

Optional.

---

# Q5 Section

Purpose:

```text
Ownership Thesis
```

Owner:

Q5 Layer

---

# Longitudinal Summary

Purpose:

Provide historical context.

---

# Schema

```typescript
type LongitudinalSummary = {
  prior_periods_analyzed: number;

  major_changes: LongitudinalChange[];

  thesis_evolution:
    ThesisEvolution;

  confidence_trend:
    ConfidenceTrend;
};
```

---

# Major Changes

```typescript
type LongitudinalChange = {
  category:
    | "business"
    | "growth"
    | "trust"
    | "valuation"
    | "ownership";

  description: string;

  significance:
    | "low"
    | "medium"
    | "high";
};
```

---

# Thesis Evolution

```typescript
type ThesisEvolution = {
  previous_strength:
    | "strong"
    | "moderate"
    | "conditional"
    | "weak"
    | null;

  current_strength:
    | "strong"
    | "moderate"
    | "conditional"
    | "weak";

  direction:
    | "improving"
    | "stable"
    | "deteriorating";
};
```

---

# Confidence Trend

```typescript
type ConfidenceTrend = {
  previous_confidence: number | null;

  current_confidence: number;

  direction:
    | "higher"
    | "stable"
    | "lower";
};
```

---

# Confidence Model

Artifact confidence is separate from question confidence.

---

# Schema

```typescript
type InvestorConfidence = {
  overall: number;

  q1_confidence: number;

  q2_confidence: number;

  q3_confidence: number;

  q4_confidence: number | null;

  q5_confidence: number;

  weakest_input:
    | "q1"
    | "q2"
    | "q3"
    | "q4"
    | "none";
};
```

---

# Confidence Rules

Overall confidence cannot exceed:

```typescript
min(
  q1_confidence,
  q2_confidence,
  q3_confidence,
  q5_confidence
)
```

---

# Q4 Rule

If:

```typescript
q4 == null
```

then:

```typescript
q4_confidence = null
```

No penalty.

---

# Status Determination

Artifact status derived from question status.

---

# Schema

```typescript
type ArtifactStatus =
  | "complete"
  | "partial"
  | "insufficient_inputs";
```

---

# Rules

Complete:

```text
Q1–Q5 available
```

---

Partial:

```text
Q4 unavailable
```

or

one non-critical section partial.

---

Insufficient Inputs:

```text
Q1 unavailable

or

Q2 unavailable

or

Q3 unavailable
```

---

# Lineage

Lineage is mandatory.

---

# Schema

```typescript
type InvestorLineage = {
  company_knowledge_version: number;

  quarter_understanding_version: number;

  business_signals_version: number;

  topic_evolution_version: number;

  commitment_tracking_version: number;

  narrative_consistency_version: number;

  accounting_stability_version: number;

  prompt_versions: {
    q1: string;

    q2: string;

    q3: string;

    q4: string | null;

    q5: string;
  };

  model_versions: {
    q1: string;

    q2: string;

    q3: string;

    q4: string | null;

    q5: string;
  };

  input_hash: string;

  artifact_hash: string;
};
```

---

# Artifact Hash

Purpose:

Support:

```text
Hybrid Invalidation
```

and

```text
Replayability
```

---

# Hash Inputs

Hash includes:

```text
Q1

Q2

Q3

Q4

Q5
```

content.

---

# Historical Archive

Every version archived.

---

# Archive Structure

```text
investor-intelligence/

current.json

archive/
    v1.json
    v2.json
    v3.json
```

---

# Immutability

Archived versions:

```text
Never Modified
Never Deleted
```

---

# Historical Diff Support

Artifact supports:

```text
Version Diff

Question Diff

Confidence Diff

Thesis Diff

Condition Diff
```

---

# Change Tracking

Track:

```typescript
type ChangeTracking = {
  q1_changed: boolean;

  q2_changed: boolean;

  q3_changed: boolean;

  q4_changed: boolean;

  q5_changed: boolean;
};
```

---

# Evaluation Integration

Artifact publishes:

```typescript
InvestorEvaluationPackage
```

---

# Package Includes

```typescript
{
  company,
  period,

  q1,
  q2,
  q3,
  q4,
  q5,

  confidence,

  lineage,

  artifact_hash
}
```

---

# Governance Requirements

Before write:

Run:

```text
Schema Validation

Confidence Validation

Lineage Validation

Recommendation Scan
```

---

# Recommendation Governance

Artifact must never contain:

```text
Buy

Sell

Strong Buy

Outperform

Underperform

Price Target

Expected Return

Portfolio Allocation
```

---

# Failure Rule

Detection:

```text
Artifact Rejected
```

---

# Cross-Question Consistency

Artifact must satisfy:

---

# Q2 ↔ Q5

Revenue outlook must align with thesis.

---

# Q3 ↔ Q5

Low trust cannot support strong thesis.

---

# Q4 ↔ Q5

Valuation concerns must appear in change conditions.

When Q4 exists.

---

# Q1 ↔ Q2

Growth drivers must align with business model.

---

# Consistency Failures

Fail:

```text
Evaluation Gate
```

before artifact write.

---

# Dependency Index Integration

Depends on:

```text
Company Knowledge

Quarter Understanding

Business Signals

Topic Evolution

Commitment Tracking

Narrative Consistency

Accounting Stability
```

---

# Invalidation Rules

Candidate invalidation:

```text
Any upstream version change
```

---

# Propagation:

```text
Hybrid Invalidation
```

---

# Partial Invalidation Support

Supported.

---

# Example

Market Data Update

Invalidate:

```text
Q4

Q5
```

Only.

---

# Replayability

Artifact must be reproducible.

Requirements:

```text
Temperature = 0

Prompt Version Stored

Model Version Stored

Input Hash Stored
```

---

# Scaling Requirements

Target:

```text
10,000+ companies
```

Must support:

- historical tracking
- replayability
- auditability
- partial invalidation
- portfolio analysis

---

# Metadata

```typescript
type Metadata = {
  artifact_version: number;

  schema_version: string;

  generated_at: string;

  generation_duration_ms: number;
};
```

---

# Architectural Invariants

LOCKED.

1. Investor Intelligence is a single canonical artifact.
2. One artifact per company-period.
3. Q1–Q5 are first-class sections.
4. Q4 is optional.
5. Q5 remains valid without Q4.
6. Lineage is mandatory.
7. Historical versions are immutable.
8. Recommendation language is forbidden.
9. Cross-question consistency is enforced.
10. Artifact must be replayable and auditable.

End of Specification.