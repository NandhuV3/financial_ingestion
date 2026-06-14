# 017-evaluation-architecture-spec.md

# Evaluation Architecture Specification

Version: 1.0
Status: LOCKED
Owner: Architecture

---

# Purpose

The Evaluation Architecture measures:

```text
Is the platform producing useful investor intelligence?
```

NOT:

```text
Did the JSON validate?
```

Schema compliance is necessary.

It is not sufficient.

The evaluation system exists to ensure:

- accuracy
- consistency
- usefulness
- trustworthiness
- calibration
- longitudinal stability

across the entire platform.

---

# Core Objective

Measure:

```text
Investor Usefulness
```

not merely:

```text
Schema Correctness
```

---

# Architectural Principles

## Principle 1

Structural correctness is required.

But structural correctness is not quality.

---

## Principle 2

Confidence must be calibrated.

A confidence score only matters if:

```text
80% confidence ≈ 80% observed correctness
```

---

## Principle 3

Evaluation is continuous.

Not a one-time activation gate.

---

## Principle 4

Human review is mandatory.

Automation cannot fully evaluate intelligence.

---

# Evaluation Layers

The platform evaluates:

```text
Structured Intelligence

Company Knowledge

Business Signals

Quarter Understanding

Investor Intelligence

Q1

Q2

Q3

Q4

Q5
```

---

# Evaluation Types

Every layer supports:

```text
Structural Evaluation

Automated Evaluation

Human Evaluation

Outcome Evaluation
```

---

# Evaluation Hierarchy

```text
Schema Compliance
        ↓
Automated Metrics
        ↓
Human Review
        ↓
Outcome Validation
        ↓
Confidence Calibration
```

---

# Ground Truth Corpus

Ground Truth Corpus is mandatory.

---

# Purpose

Used for:

- calibration
- regression testing
- prompt activation
- accuracy measurement

---

# Ground Truth Schema

```typescript
type GroundTruthEntry = {
  company: string;

  period: string;

  sector: string;

  geography: string;

  filing_type: string;

  evaluations: EvaluationRecord[];

  outcomes: OutcomeRecord[];
};
```

---

# Initial Corpus Size

LOCKED

```text
200 company-periods
```

---

# Target Corpus Size

LOCKED

```text
500 company-periods
```

within first 12 months.

---

# Corpus Growth

Add:

```text
20 entries/month
```

minimum.

---

# Corpus Diversity Requirements

Must cover:

- sectors
- geographies
- filing quality
- company size
- history depth

---

# Evaluation Store

Evaluation results stored separately from artifacts.

---

# Storage

```text
evaluation/

ground_truth/

results/

calibration/

regression/
```

---

# Structured Intelligence Evaluation

## Structural Evaluation

Required:

- schema valid
- required fields populated
- enums valid
- no malformed artifacts

Failure blocks promotion.

---

## Automated Metrics

### Field Coverage

```typescript
coverage =
substantive_fields
/
total_fields
```

---

### Evidence Utilization

Measures:

```text
How much filing evidence
was actually used
```

---

### Theme Utilization

Measures:

```text
How many extracted themes
appear in output
```

---

### Specificity Score

Detects:

```text
Generic language
```

Examples:

```text
The company operates
in a competitive market
```

Penalty applied.

---

### Hallucination Risk

Measures:

```text
Output entities
not found in filing
```

---

# Human Review Metrics

Reviewers score:

```text
Accuracy

Completeness

Investor Relevance
```

---

# Regression Testing

Holdout Set:

```text
50 company-periods
```

LOCKED.

---

# Activation Rule

Any metric regression:

```text
> 5%
```

blocks prompt activation.

---

# Company Knowledge Evaluation

Two evaluation dimensions:

```text
Knowledge Quality

Promotion Quality
```

---

# Automated Metrics

## Information Preservation

Measures:

```text
What was retained
from Structured Intelligence
```

---

## Longitudinal Consistency

Measures:

```text
Knowledge Stability
Across Time
```

---

## Promotion Accuracy

Measures:

```text
Were promotion decisions correct?
```

---

## Coverage Completeness

Measures:

```text
Required fields populated
```

---

# Human Review

Reviewers assess:

```text
Canonical Accuracy

Promotion Appropriateness
```

---

# Longitudinal Review

Quarterly.

Review:

```text
Stable fields
changing excessively
```

---

# Business Signals Evaluation

Business Signals are deterministic.

---

# Evaluation Focus

Not intelligence quality.

Rule correctness.

---

# Automated Metrics

## Signal Coverage

Expected signals present.

---

## Signal Consistency

Signals consistent with source artifacts.

---

## False Positives

Signal emitted incorrectly.

---

## False Negatives

Signal missing.

---

# Rule Regression Testing

Required before activation.

---

# Quarter Understanding Evaluation

Quarter Understanding is first synthesis layer.

---

# Automated Metrics

## Signal Utilization

Measures:

```text
Signals Used
/
Signals Available
```

---

## Company Knowledge Grounding

Measures:

```text
Interpretation traceability
```

---

## Concept Registry Compliance

Must use:

```text
Valid Active Concepts
```

---

## Evidence Chain Completeness

Every interpretation must reference evidence.

---

## Internal Consistency

No contradictory understandings.

---

## Importance Distribution

Expected:

```text
20% High

50% Medium

30% Low
```

---

# Human Review

Reviewers score:

```text
Interpretation Accuracy

Significance Calibration

Synthesis Quality
```

---

# Recommendation Boundary Check

Quarter Understanding must never become recommendation.

---

# Longitudinal Evaluation

Measures:

```text
Direction Stability

Importance Stability
```

---

# Investor Intelligence Evaluation

Applies across:

```text
Q1

Q2

Q3

Q4

Q5
```

---

# Aggregate Metrics

## Internal Coherence

Questions must agree.

---

Examples:

Q3 Low Trust

↓

Q5 Strong Thesis

↓

FAIL

---

## Confidence Propagation

Rule:

```text
Q5 confidence
cannot exceed
weakest significant input
```

---

## Evidence Completeness

Every question must carry evidence package.

---

## Recommendation Language Scan

Forbidden globally.

---

# Q1 Evaluation

Question:

```text
What does this company sell?
```

---

# Automated Metrics

### Company Knowledge Grounding

Must trace to:

- products
- customers
- business model

---

### Specificity

Must mention:

```text
Actual Products

Actual Services
```

---

### Accuracy

Named entities validated.

---

# Human Review

Measures:

```text
Clarity

Completeness

Differentiation
```

---

# Q2 Evaluation

Question:

```text
Where does the next rupee come from?
```

---

# Automated Metrics

### Revenue Driver Grounding

Must reference:

- Company Knowledge
- Quarter Understanding

---

### Direction Consistency

Must agree with revenue signals.

---

### Temporal Specificity

Must be forward-looking.

---

# Human Review

Measures:

```text
Forward-Looking Quality

Evidence Basis

Materiality
```

---

# Q3 Evaluation

Question:

```text
Can the story be trusted?
```

---

# Automated Metrics

### Trust Signal Coverage

Must reference:

- commitment tracking
- narrative consistency
- accounting stability

when available.

---

### Longitudinal Validity

Longitudinal trust requires:

```text
Minimum 4 periods
```

LOCKED.

---

### Verdict Consistency

Trust verdict must align with signals.

---

# Human Review

Measures:

```text
Trust Calibration

Commitment Accuracy

Depth of Assessment
```

---

# Outcome Evaluation

Track:

```text
Future Commitment Resolution

Narrative Consistency

Restatements
```

---

# Evaluation Lag

LOCKED

```text
18 Months
```

---

# Q4 Evaluation

Question:

```text
Is the story already too expensive?
```

---

# Automated Metrics

### Market Data Freshness

Required.

---

### Valuation Consistency

Same methodology per sector.

---

### Insufficient Data Handling

Must explicitly identify absence.

---

### Confidence Floors

Limited data → lower confidence.

---

# Human Review

Measures:

```text
Valuation Reasoning

Relative Context Quality
```

---

# Q5 Evaluation

Question:

```text
Why would I hold it?

What would change that?
```

---

# Automated Metrics

## Thesis Grounding

Must trace to:

```text
Q1

Q2

Q3

Q4
```

where available.

---

## Change Condition Completeness

Must contain conditions from available inputs.

---

## Signal Linkage

Every condition must include:

```text
signal_to_watch
```

---

## Thesis Consistency

Rule:

```text
Low Trust
cannot produce
Strong Thesis
```

LOCKED.

---

## Recommendation Language

Critical blocking rule.

Forbidden:

```text
Buy

Sell

Price Target

Expected Return

Upside

Downside
```

---

# Human Review

Measures:

```text
Thesis Quality

Change Condition Quality

Boundary Compliance

Investor Usefulness
```

---

# Outcome Evaluation

Track:

```text
Condition Triggered?

Condition Relevant?

Condition Material?
```

---

# Evaluation Lag

LOCKED

```text
12 Months
```

---

# Confidence Calibration

Confidence must be validated.

---

# Calibration Schema

```typescript
type CalibrationResult = {
  layer: string;

  sample_size: number;

  reliability_curve: ReliabilityPoint[];

  expected_calibration_error: number;

  overconfidence_score: number;
};
```

---

# Calibration Frequency

LOCKED

```text
Quarterly
```

---

# Calibration Trigger

ECE > 0.10

↓

Review Required

---

# Prompt Activation Gates

Every prompt activation must pass:

---

## Gate 1

Schema Compliance

PASS REQUIRED

---

## Gate 2

Automated Metric Regression

Maximum:

```text
5% degradation
```

---

## Gate 3

Recommendation Language Scan

Zero tolerance.

---

## Gate 4

Confidence Calibration

ECE ≤ 0.10

---

## Gate 5

Human Review

Sample:

```text
10 company-periods
```

Minimum:

```text
7 / 10 approved
```

---

## Gate 6

Cross-Company Consistency

PASS REQUIRED

---

## Gate 7

Longitudinal Consistency

PASS REQUIRED

---

# Regression Testing

Runs continuously.

Not activation-only.

---

# Regression Types

```typescript
type RegressionTestType =
  | "metric_stability"
  | "ground_truth_accuracy"
  | "cross_version_consistency"
  | "longitudinal_direction"
  | "concept_validity"
  | "forbidden_language"
  | "confidence_calibration";
```

---

# Regression Frequency

LOCKED

```text
Nightly
```

---

# Longitudinal Evaluation

Separate scheduled system.

---

# Measures

```text
Direction Stability

Concept Persistence

Thesis Evolution

Confidence Growth
```

---

# Cross-Company Evaluation

Measures:

```text
Sector Consistency

Size-Tier Consistency

Geographic Consistency

Filing Quality Normalization
```

---

# Evaluation Dashboard

Four Views.

---

## Real-Time View

Current generation quality.

---

## Trend View

90-day metric trends.

---

## Ground Truth View

Corpus coverage and calibration.

---

## Operational View

Review queues and prompt status.

---

# Scaling Requirements

Target:

```text
10,000+ Companies
```

---

# Automated Path

Runs for every artifact.

---

# Human Review Path

Runs on stratified samples.

---

# Monthly Review Volume

LOCKED

```text
50-100 artifacts
```

---

# Architectural Invariants

The following are LOCKED:

1. Evaluation measures investor usefulness, not only schema compliance.
2. Ground Truth Corpus is mandatory.
3. Human review is mandatory.
4. Confidence must be calibrated.
5. Prompt activation requires passing all gates.
6. Recommendation language is a blocking failure.
7. Longitudinal evaluation is separate from generation.
8. Outcome evaluation exists for Q3 and Q5.
9. Evaluation data is stored separately from artifacts.
10. Evaluation architecture must scale to 10,000+ companies.

End of Specification.