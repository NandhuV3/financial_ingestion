# 032-investor-intelligence-q1-spec.md

Version: 1.0
Status: LOCKED
Owner: Investor Intelligence Layer

---

# Purpose

Q1 answers:

> "What does this company actually sell?"

Q1 establishes the foundation for all subsequent investor reasoning.

Before evaluating:

- growth
- trust
- valuation
- ownership thesis

the platform must first understand:

```text
What business exists?
Who pays for it?
Why do they pay?
How does value flow through the business?
```

Q1 is the business understanding layer.

---

# Core Responsibility

Transform:

```text
Company Knowledge
+
Quarter Understanding
+
Business Context
```

into:

```text
Business Understanding
```

for investors.

---

# Ownership

Q1 owns:

- business explanation
- value creation explanation
- customer explanation
- revenue model explanation
- business simplification

Q1 does NOT own:

- growth outlook
- trust assessment
- valuation assessment
- ownership thesis
- investment recommendation

---

# Core Question

Q1 must answer:

```text
What does this company actually sell,
who buys it,
and why does the business exist?
```

---

# Inputs

## Required

Company Knowledge

Quarter Understanding

Topic Evolution

---

# Optional Inputs

Historical Investor Intelligence

---

# Forbidden Inputs

Q1 MUST NOT consume:

Market Data

Valuation Data

Trust Verdicts

Q3 Outputs

Q4 Outputs

Q5 Outputs

Analyst Ratings

Price Targets

News

Social Media

Partner Domain

---

# Primary Source

Company Knowledge is the authoritative source.

Quarter Understanding provides:

- recent developments
- contextual clarification

but does not redefine the business.

---

# Output Schema

```typescript
type Q1Answer = {
  business_summary: string;

  business_model: BusinessModelSummary;

  customer_summary: CustomerSummary;

  value_creation_summary: ValueCreationSummary;

  competitive_position_summary: string;

  confidence: Q1Confidence;

  status:
    | "answered"
    | "partial"
    | "insufficient_inputs";

  evidence_package: Q1EvidencePackage;

  lineage: Q1Lineage;

  metadata: Metadata;
};
```

---

# Business Model Summary

Purpose:

Explain how money flows through the business.

```typescript
type BusinessModelSummary = {
  revenue_model: string;

  primary_products: string[];

  primary_services: string[];

  monetization_mechanism: string;

  business_type:
    | "software"
    | "platform"
    | "services"
    | "manufacturing"
    | "retail"
    | "financial"
    | "hybrid";
};
```

---

# Customer Summary

Purpose:

Explain who pays.

```typescript
type CustomerSummary = {
  primary_customers: string[];

  customer_type:
    | "consumer"
    | "enterprise"
    | "government"
    | "mixed";

  geographic_exposure: string[];
};
```

---

# Value Creation Summary

Purpose:

Explain why customers pay.

```typescript
type ValueCreationSummary = {
  customer_problem: string;

  solution_provided: string;

  value_driver: string;

  key_differentiators: string[];
};
```

---

# Competitive Position Summary

Purpose:

Explain positioning.

Examples:

```text
Cost Leader

Premium Provider

Market Leader

Niche Specialist

Infrastructure Provider

Platform Ecosystem
```

This is descriptive only.

Not evaluative.

---

# Evidence Package

Every Q1 answer must be grounded.

```typescript
type Q1EvidencePackage = {
  company_knowledge_refs: string[];

  understanding_refs: string[];

  concept_refs: string[];

  supporting_artifacts: string[];
};
```

---

# Grounding Rules

Every major claim must trace to:

- Company Knowledge
- Quarter Understanding

No unsupported claims allowed.

---

# Confidence Model

Q1 confidence is derived.

Never self-assessed.

```typescript
type Q1Confidence = {
  overall: number;

  company_knowledge_quality: number;

  customer_clarity_score: number;

  revenue_model_clarity_score: number;

  evidence_density_score: number;

  historical_stability_score: number;
};
```

---

# Confidence Interpretation

High Confidence

```text
Business model is clear,
stable,
and well-supported.
```

Moderate Confidence

```text
Business understanding exists,
but some ambiguity remains.
```

Low Confidence

```text
Business model is incomplete
or poorly evidenced.
```

---

# Status Rules

## Answered

Required business understanding available.

Confidence above minimum threshold.

---

## Partial

Some business understanding exists.

Important fields missing.

---

## Insufficient Inputs

Business cannot be described reliably.

Company Knowledge missing.

Evidence insufficient.

---

# Historical Stability

Q1 is expected to be highly stable.

Large changes are unusual.

---

# Expected Stability

Stable Fields:

```text
Business Model

Revenue Structure

Products

Customer Categories
```

These should rarely change.

---

# Change Detection

If Q1 changes materially:

Flag:

```text
business_model_change
```

for downstream systems.

---

# Evaluation Metrics

---

## Grounding Score

Measures:

```text
How much of Q1
is supported by evidence.
```

---

## Business Clarity

Measures:

```text
Can a reader understand
what the company does?
```

---

## Customer Clarity

Measures:

```text
Can a reader understand
who pays?
```

---

## Revenue Clarity

Measures:

```text
Can a reader understand
how money is earned?
```

---

## Stability Score

Measures:

```text
Consistency across periods.
```

---

# Governance Rules

Q1 must remain descriptive.

Q1 must never become:

```text
Bullish

Bearish

Investment Thesis

Recommendation
```

---

# Forbidden Language

Examples:

```text
Great business

Excellent company

Strong investment

Attractive stock

Undervalued

Overvalued
```

Q1 explains.

Q1 does not judge.

---

# Invalidation Rules

Regenerate when:

```text
Company Knowledge changes

Quarter Understanding changes

Topic Evolution changes
```

---

# No Regeneration Required

Do NOT regenerate for:

```text
Market Data Updates

Q4 Updates

Q5 Updates

Partner Domain Changes
```

---

# Historical Comparison

Track:

```typescript
type Q1HistoricalComparison = {
  business_model_changed: boolean;

  customer_base_changed: boolean;

  revenue_structure_changed: boolean;

  differentiation_changed: boolean;
};
```

---

# Longitudinal Requirements

Q1 should identify:

```text
Stable Business Elements
```

versus

```text
Evolving Business Elements
```

This supports future Company Knowledge governance.

---

# Lineage

```typescript
type Q1Lineage = {
  company_knowledge_version: number;

  quarter_understanding_version: number;

  topic_evolution_version: number;

  prompt_version: string;

  model_version: string;

  input_hash: string;
};
```

---

# Metadata

```typescript
type Metadata = {
  artifact_version: number;

  generated_at: string;

  schema_version: string;
};
```

---

# Scaling Requirements

Target:

```text
10,000+ companies
```

Must support:

- longitudinal comparison
- business model change detection
- portfolio-level business classification
- Q5 ownership thesis generation

---

# Architectural Invariants

LOCKED.

1. Q1 answers what the business is.
2. Q1 does not discuss valuation.
3. Q1 does not discuss trust.
4. Q1 does not discuss stock performance.
5. Q1 is grounded primarily in Company Knowledge.
6. Q1 must remain stable across periods.
7. All claims require evidence.
8. Q1 is descriptive, never evaluative.
9. Q1 serves as foundation for Q2–Q5.
10. Q1 output must be understandable by a non-expert investor.

End of Specification.