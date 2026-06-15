# 049-prompt-evaluation-contract.md

Version: 1.0
Status: LOCKED
Owner: Evaluation Architecture

Inherits:

- 040-prompt-governance-spec.md
- 017-evaluation-architecture-spec.md

Applies To:

- Themes
- Structured Intelligence
- Quarter Understanding
- Q1
- Q2
- Q3
- Q4
- Q5

---

# Purpose

This contract defines how prompts are:

- evaluated
- promoted
- activated
- monitored
- rolled back

across the platform.

---

# Architectural Position

```text
Prompt Contract
        ↓

Prompt Candidate
        ↓

Evaluation Pipeline
        ↓

Activation Decision
        ↓

Production
```

---

# Core Principle

A prompt is never promoted because:

```text
It looks better.
```

A prompt is promoted because:

```text
It performs better
under evaluation.
```

---

# Ownership

Prompt Evaluation owns:

- prompt quality validation
- regression testing
- activation gating
- calibration validation
- prompt rollback recommendations

Prompt Evaluation does NOT own:

- prompt creation
- prompt editing
- prompt deployment

---

# Evaluation Lifecycle

```text
Draft
  ↓

Candidate
  ↓

Evaluation
  ↓

Approved
  ↓

Active
```

---

# Candidate Definition

A candidate prompt is:

```text
Ready For Evaluation
```

but not yet production approved.

---

# Evaluation Inputs

Required:

```typescript
type PromptEvaluationInput = {
  prompt_id: string;

  prompt_version: string;

  baseline_version: string;

  evaluation_corpus:
    GroundTruthCorpus;

  holdout_corpus:
    HoldoutCorpus;
};
```

---

# Evaluation Outputs

```typescript
type PromptEvaluationResult = {
  prompt_id: string;

  version: string;

  overall_result:
    "pass" | "fail";

  gate_results:
    GateResult[];

  metrics:
    EvaluationMetrics;

  recommendation:
    EvaluationRecommendation;
};
```

---

# Evaluation Recommendation

```typescript
type EvaluationRecommendation =
  | "activate"
  | "reject"
  | "revise"
  | "rollback";
```

---

# Activation Pipeline

All prompts must pass:

```text
Gate 1
Schema Compliance

Gate 2
Automated Metrics

Gate 3
Regression Testing

Gate 4
Confidence Calibration

Gate 5
Human Review

Gate 6
Cross Company Consistency

Gate 7
Longitudinal Consistency
```

---

# Sequential Gate Rule

Gates execute:

```text
In Order
```

---

# Failure Rule

Any gate failure:

```text
Blocks Activation
```

---

# Gate 1

Schema Compliance

---

# Purpose

Verify:

```text
Prompt output
matches contract.
```

---

# Examples

Validate:

```text
Required Fields

Enums

Structure

Types
```

---

# Failure Examples

```text
Missing Field

Invalid Enum

Malformed Output
```

---

# Gate Result

```typescript
PASS
FAIL
```

Only.

---

# Gate 2

Automated Metrics

---

# Purpose

Measure quality.

---

# Metrics

Defined by:

```text
Evaluation Architecture
```

for each layer.

---

# Examples

Themes:

```text
Coverage

Specificity

Duplication
```

---

# Structured Intelligence

```text
Coverage

Grounding

Hallucination Risk
```

---

# Quarter Understanding

```text
Signal Utilization

Concept Compliance

Interpretation Quality
```

---

# Investor Intelligence

```text
Grounding

Coherence

Recommendation Compliance
```

---

# Regression Threshold

Default:

```text
No metric may regress
by more than 5%.
```

---

# Gate 3

Regression Testing

---

# Purpose

Compare:

```text
Candidate

vs

Current Production
```

---

# Test Corpus

Uses:

```text
Holdout Corpus
```

only.

---

# Reason

Prevent:

```text
Prompt Overfitting
```

---

# Regression Rules

Allowed:

```text
Improvement
```

---

# Forbidden

```text
Significant Quality Loss
```

---

# Regression Categories

```typescript
type RegressionCategory =
  | "grounding"
  | "coverage"
  | "specificity"
  | "coherence"
  | "calibration"
  | "compliance";
```

---

# Gate 4

Confidence Calibration

---

# Purpose

Validate:

```text
Confidence Accuracy
```

---

# Core Principle

Confidence must mean:

```text
What it claims to mean.
```

---

# Example

Confidence:

```text
0.80
```

should approximate:

```text
80% correctness.
```

---

# Metric

```typescript
Expected Calibration Error
(ECE)
```

---

# Threshold

```text
ECE <= 0.10
```

required.

---

# Failure Rule

Excessive calibration error:

```text
Activation Blocked
```

---

# Gate 5

Human Review

---

# Purpose

Evaluate:

```text
Investor Usefulness
```

---

# Review Sample

Minimum:

```text
10 Company Periods
```

---

# Reviewer Types

```text
Domain Expert

Investment Research Reviewer
```

---

# Review Categories

```text
Accuracy

Relevance

Completeness

Clarity

Usefulness
```

---

# Acceptance Threshold

Minimum:

```text
7 of 10
```

must pass.

---

# Failure Rule

Below threshold:

```text
Activation Blocked
```

---

# Gate 6

Cross Company Consistency

---

# Purpose

Detect:

```text
Sector Bias

Company Size Bias

Language Bias
```

---

# Evaluation Dimensions

```text
Sector

Market Cap

Geography

Language
```

---

# Example Failure

Prompt performs well for:

```text
Software
```

but poorly for:

```text
Industrials
```

---

# Gate Result

Must remain within:

```text
Accepted Variance Threshold
```

---

# Gate 7

Longitudinal Consistency

---

# Purpose

Detect:

```text
Prompt Instability
```

across periods.

---

# Example

Quarter Understanding:

```text
Improving

Stable

Deteriorating

Improving
```

with no underlying change.

---

# Failure

Prompt instability:

```text
Activation Blocked
```

---

# Recommendation Compliance

Special Evaluation.

Applies to:

```text
Q3

Q4

Q5

Partner Domain
```

---

# Purpose

Ensure:

```text
No Investment Advice
```

---

# Forbidden Language

```text
Buy

Sell

Outperform

Underperform

Strong Buy

Price Target

Expected Return
```

---

# Detection

Automated

+

Human Review

---

# Failure Rule

Any occurrence:

```text
Immediate Failure
```

---

# Grounding Evaluation

All prompts evaluated for:

```text
Evidence Traceability
```

---

# Grounding Score

Measures:

```text
Output Claims
```

supported by:

```text
Input Evidence
```

---

# Failure Threshold

Grounding score:

```text
< 90%
```

requires review.

---

# Hallucination Evaluation

Measures:

```text
Unsupported Claims
```

---

# Hallucination Threshold

```text
0 Critical Hallucinations
```

allowed.

---

# Critical Hallucination

Examples:

```text
Invented Product

Invented Customer

Invented Commitment

Invented Signal
```

---

# Failure Rule

Any critical hallucination:

```text
Activation Blocked
```

---

# Prompt Comparison

Every candidate compared against:

```text
Current Active Version
```

---

# Comparison Dimensions

```text
Accuracy

Grounding

Coverage

Consistency

Calibration
```

---

# Evaluation Audit Trail

Every evaluation recorded.

---

# Schema

```typescript
type PromptEvaluationAudit = {
  evaluation_id: string;

  prompt_id: string;

  version: string;

  timestamp: string;

  evaluator: string;

  result: string;

  notes: string;
};
```

---

# Production Monitoring

Evaluation continues after activation.

---

# Reason

Prompt quality may drift.

---

# Monitoring Schedule

```text
Nightly

Weekly

Quarterly
```

---

# Nightly

Run:

```text
Regression Suite
```

---

# Weekly

Run:

```text
Cross Company Evaluation
```

---

# Quarterly

Run:

```text
Calibration Review

Ground Truth Review
```

---

# Rollback Triggers

Examples:

```text
Calibration Failure

Regression Spike

Recommendation Violation

Hallucination Event

Prompt Incident
```

---

# Rollback Recommendation

Generated by:

```text
Evaluation Layer
```

---

# Human Approval

Required before:

```text
Rollback Activation
```

---

# Evaluation Versioning

Evaluation rules are versioned.

---

# Schema

```typescript
type EvaluationVersion = {
  version: string;

  activation_date: string;

  description: string;
};
```

---

# Purpose

Supports:

```text
Historical Reproducibility
```

---

# Dependency Index Integration

Prompt evaluation participates in:

```text
Hybrid Invalidation
```

---

# Trigger

Prompt activation:

```text
Creates Candidate Staleness
```

for downstream artifacts.

---

# Propagation Rule

Uses:

```text
Content Hash Evaluation
```

before regeneration.

---

# Scaling Requirements

Target:

```text
10,000+ companies
```

Must support:

- large-scale evaluation
- continuous monitoring
- calibration
- replayability
- auditability

---

# Architectural Invariants

LOCKED.

1. Every prompt must pass evaluation before activation.
2. Evaluation gates execute sequentially.
3. Any gate failure blocks activation.
4. Confidence calibration is mandatory.
5. Human review is mandatory.
6. Recommendation violations are immediate failures.
7. Critical hallucinations are immediate failures.
8. Evaluation continues after activation.
9. Evaluation rules are versioned.
10. Prompt quality is measured by investor usefulness, not schema compliance alone.

End of Specification.