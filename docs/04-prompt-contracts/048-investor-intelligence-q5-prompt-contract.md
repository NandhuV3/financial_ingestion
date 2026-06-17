# 048-investor-intelligence-q5-prompt-contract.md

Version: 1.0
Status: LOCKED
Owner: Investor Intelligence Layer

Inherits:
040-prompt-governance-spec.md

Produces:
Q5 Answer

Depends On:

- Q1 Answer
- Q2 Answer
- Q3 Answer
- Q4 Answer (Optional)

---

# Purpose

This contract governs the Q5 Prompt.

Q5 answers:

> Why would I hold it and what would change that?

Q5 is the Ownership Thesis prompt.

Q5 is the final synthesis layer of the platform.

It transforms:

```text
Business Understanding

Growth Understanding

Trust Understanding

Valuation Understanding
```

into:

```text
Ownership Understanding
```

without crossing into investment recommendation.

---

# Architectural Position

```text
Q1 Business
      ↓

Q2 Growth
      ↓

Q3 Trust
      ↓

Q4 Valuation
      ↓

Q5 Prompt
      ↓

Ownership Thesis
```

---

# Core Question

Q5 answers:

```text
What is the core reason
someone might continue
following or owning
this business,

and what developments
would challenge that reasoning?
```

---

# Architectural Principle

Q5 produces:

```text
Ownership Reasoning
```

Q5 does NOT produce:

```text
Investment Advice
```

---

# Ownership Definition

Ownership means:

```text
A structured explanation
of why the business may remain interesting
to follow or own.
```

Ownership does NOT mean:

```text
Buy Recommendation

Sell Recommendation

Portfolio Recommendation
```

---

# Ownership

Q5 owns:

- ownership thesis
- thesis strength
- change conditions
- thesis dependencies
- synthesis of Q1-Q4

Q5 does NOT own:

- business understanding
- growth understanding
- trust understanding
- valuation understanding

Q5 consumes them.

---

# Core Responsibility

Transform:

```text
Q1

+

Q2

+

Q3

+

Q4 (optional)
```

into:

```text
Ownership Thesis
```

---

# Input Contract

Required:

```typescript
type Q5PromptInput = {
  q1: Q1Answer;

  q2: Q2Answer;

  q3: Q3Answer;

  q4: Q4Answer | null;
};
```

---

# Allowed Inputs

Prompt may consume:

```text
Q1

Q2

Q3

Q4
```

---

# Forbidden Inputs

Prompt must NOT consume:

```text
Market Prices

Price Targets

Portfolio Data

User Holdings

Analyst Reports

Broker Recommendations

Partner Domain
```

---

# Reason

Prevent:

```text
Recommendation Contamination

Market Narrative Leakage
```

---

# Output Contract

```typescript
type Q5Answer = {
  ownership_thesis: string;

  thesis_strength:
    ThesisStrength;

  key_dependencies:
    ThesisDependency[];

  change_conditions:
    ChangeCondition[];

  input_confidence_summary:
    InputConfidenceSummary;

  confidence: null;

  evidence_package:
    Q5EvidencePackage;
};
```

---

# Ownership Thesis

Purpose:

Provide:

```text
Single Coherent Explanation
```

for ownership reasoning.

---

# Example

Allowed:

```text
The ownership thesis
rests on continued cloud platform adoption,
supported by durable customer demand
and a strong record of execution.
```

Forbidden:

```text
Investors should buy the stock.
```

---

# Thesis Strength

```typescript
type ThesisStrength =
  | "strong"
  | "moderate"
  | "conditional"
  | "weak";
```

---

# Meaning

Strong:

```text
Business

Growth

Trust

all align positively.
```

---

Moderate:

```text
Generally favorable
but with meaningful uncertainty.
```

---

Conditional:

```text
Depends on specific assumptions
remaining true.
```

---

Weak:

```text
Multiple critical concerns exist.
```

---

# Dependency Schema

```typescript
type ThesisDependency = {
  title: string;

  description: string;

  grounded_in:
    | "q1"
    | "q2"
    | "q3"
    | "q4";
};
```

---

# Dependency Purpose

Identify:

```text
What the thesis depends on.
```

---

# Examples

```text
Cloud Expansion

Execution Reliability

Customer Retention

Capital Discipline
```

---

# Change Condition Schema

```typescript
type ChangeCondition = {
  title: string;

  description: string;

  severity:
    | "thesis_weakening"
    | "thesis_breaking";

  grounded_in:
    | "q1"
    | "q2"
    | "q3"
    | "q4";

  signal_to_watch: string;
};
```

---

# Change Condition Purpose

Answer:

```text
What would need to change
for the thesis to weaken
or break?
```

---

# Examples

```text
Cloud Growth Deceleration

Repeated Commitment Failures

Customer Concentration Increase

Capital Allocation Deterioration
```

---

# Signal Requirement

Every change condition requires:

```text
Observable Signal
```

---

# Forbidden

```text
Vague Conditions
```

Example:

```text
If things get worse.
```

Invalid.

---

# Q4 Optionality

Critical.

Q5 must operate when:

```typescript
q4 == null
```

---

# Rule

Q4 absence must NOT prevent:

```text
Ownership Thesis Generation.
```

---

# Q4 Integration

When available:

Q4 may:

```text
Strengthen

Qualify

Challenge
```

the thesis.

---

# Trust Integration Rules

Q3 is mandatory.

---

# Critical Rule

If:

```typescript
q3.trust_assessment === null

or

q3.trust_depth_limitation !== null
```

Then:

```typescript
thesis_strength != "strong"
```

---

# Governance Rule

Enforced outside prompt.

---

# Growth Integration Rules

Q2 must influence:

```text
Thesis Strength

Dependencies

Change Conditions
```

---

# Business Integration Rules

Q1 must influence:

```text
Core Ownership Logic
```

---

# Example

Bad:

```text
Thesis based only on growth.
```

Good:

```text
Business

+

Growth

+

Trust
```

all reflected.

---

# Evidence Package

Required.

---

# Schema

```typescript
type Q5EvidencePackage = {
  q1_refs:
    string[];

  q2_refs:
    string[];

  q3_refs:
    string[];

  q4_refs:
    string[];
};
```

---

# Grounding Rules

Every thesis statement must trace to:

```text
Q1

Q2

Q3

Q4
```

---

# Hallucination Prevention

Prompt must not introduce:

```text
Drivers

Risks

Conditions

Advantages
```

not present in inputs.

---

# Recommendation Boundary

Most Important Rule.

Q5 must never become:

```text
Investment Advice.
```

---

# Forbidden Language

```text
Buy

Sell

Accumulate

Reduce

Outperform

Underperform

Strong Buy

Conviction Buy

Price Target

Expected Return

Upside

Downside
```

---

# Ownership vs Recommendation

Allowed:

```text
The ownership thesis
depends on continued
platform adoption.
```

Forbidden:

```text
Investors should own this stock.
```

---

# Confidence Rules

Prompt does NOT generate confidence.

---

# Builder Computes

```typescript
type Q5Confidence = {
  thesis_coherence: number;

  evidence_strength: number;

  input_quality_score: number;

  dependency_clarity: number;

  overall: number;
};
```

---

# Input Confidence Summary

Purpose:

Explain:

```text
Quality of Inputs
```

used by Q5.

---

# Schema

```typescript
type InputConfidenceSummary = {
  q1_confidence: number;

  q2_confidence: number;

  q3_confidence: number;

  q4_confidence: number | null;

  weakest_input:
    string;
};
```

---

# Forbidden Output Fields

Prompt must NOT generate:

```text
Confidence

Price Targets

Return Expectations

Recommendations
```

---

# Evaluation Hooks

Supports:

```text
Ownership Thesis Quality

Change Condition Quality

Dependency Quality

Recommendation Compliance
```

---

# Evaluation Metrics

## Thesis Authenticity

Measures:

```text
Whether thesis reflects
business reality.
```

---

## Change Condition Quality

Measures:

```text
Materiality and specificity.
```

---

## Dependency Quality

Measures:

```text
Clarity of thesis dependencies.
```

---

## Input Integration

Measures:

```text
Use of Q1-Q4.
```

---

## Recommendation Boundary

Measures:

```text
Absence of investment advice.
```

---

# Prompt Failure Conditions

Prompt fails if it:

Creates recommendations

Creates price targets

Creates return forecasts

Ignores Q3 trust assessment

Ignores Q2 growth understanding

Produces unsupported thesis logic

Creates vague change conditions

---

# Recommendation Boundary Enforcement

Any occurrence of:

```text
Buy

Sell

Hold

Outperform

Underperform

Expected Return

Price Target
```

results in:

```text
Prompt Failure
```

---

# Lineage Requirements

Artifact records:

```typescript
type Q5PromptLineage = {
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

- deterministic thesis generation
- recommendation-free outputs
- replayability
- auditability
- longitudinal comparison

---

# Architectural Invariants

LOCKED.

1. Q5 is the final synthesis layer.
2. Q5 owns the ownership thesis.
3. Q5 is not investment advice.
4. Q5 must operate without Q4.
5. Q3 trust constrains thesis strength.
6. Every change condition requires an observable signal.
7. Every thesis requires grounding.
8. Confidence is builder-generated.
9. Recommendation language is forbidden.
10. Q5 is the sole owner of ownership reasoning.

End of Specification.
