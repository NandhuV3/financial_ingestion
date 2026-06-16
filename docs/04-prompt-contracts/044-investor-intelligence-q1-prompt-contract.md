# 044-investor-intelligence-q1-prompt-contract.md

Version: 1.0
Status: LOCKED
Owner: Investor Intelligence Layer

Inherits:
040-prompt-governance-spec.md

Produces:
Q1 Answer

---

# Purpose

This contract governs the Q1 Prompt.

Q1 answers:

> What does this company actually sell?

Q1 is the Business Understanding prompt.

It explains:

- what the company does
- who it serves
- how it creates value
- why customers buy from it

Q1 establishes the foundation for all later investor intelligence.

---

# Architectural Position

```text
Company Knowledge
        ↓

Quarter Understanding
        ↓

Q1 Prompt
        ↓

Q1 Answer
        ↓

Q5 Ownership Thesis
```

---

# Core Question

Q1 answers:

```text
What business
does this company operate?
```

---

# Ownership

Q1 owns:

- business explanation
- value creation explanation
- customer explanation
- product explanation
- business model explanation

Q1 does NOT own:

- growth outlook
- trust assessment
- valuation assessment
- ownership thesis

---

# Core Responsibility

Transform:

```text
Company Knowledge

+

Quarter Understanding
```

into:

```text
Business Understanding
```

for an investor.

---

# Architectural Principle

Q1 explains:

```text
What exists today.
```

Q2 explains:

```text
Where growth comes from.
```

Q3 explains:

```text
Whether management can be trusted.
```

Q4 explains:

```text
Whether valuation appears demanding.
```

Q5 explains:

```text
Why ownership may make sense.
```

---

# Input Contract

Required:

```typescript
type Q1PromptInput = {
  company_knowledge:
    CompanyKnowledgeArtifact;

  quarter_understanding:
    QuarterUnderstandingArtifact;
};
```

---

# Allowed Inputs

Prompt may consume:

```text
Company Knowledge

Quarter Understanding
```

---

# Forbidden Inputs

Prompt must NOT consume:

```text
Q2

Q3

Q4

Q5

Market Data

Valuation Data

Partner Domain

Analyst Opinions

Trust Verdicts
```

---

# Reason

Prevent:

```text
Future Leakage

Circular Reasoning
```

---

# Output Contract

```typescript
type Q1Answer = {
  business_summary: string;

  products_services:
    ProductSummary[];

  customers:
    CustomerSummary[];

  business_model:
    BusinessModelSummary;

  competitive_context:
    CompetitiveContext;

  confidence: null;

  evidence_package:
    Q1EvidencePackage;
};
```

---

# Business Summary

Purpose:

Provide a concise explanation of:

```text
What the company does.
```

---

# Example

Good:

```text
The company provides cloud
infrastructure and productivity
software primarily to enterprises.
```

Bad:

```text
The company is a great business.
```

---

# Product Summary

```typescript
type ProductSummary = {
  name: string;

  description: string;

  importance:
    | "high"
    | "medium"
    | "low";
};
```

---

# Product Rules

Products must originate from:

```text
Company Knowledge
```

or

```text
Quarter Understanding
```

---

# Customer Summary

```typescript
type CustomerSummary = {
  customer_type: string;

  description: string;
};
```

---

# Customer Rules

Must explain:

```text
Who pays.
```

---

# Business Model Summary

Purpose:

Explain:

```text
How money is made.
```

---

# Examples

```text
Subscription

Transaction

Advertising

Licensing

Marketplace
```

---

# Competitive Context

Purpose:

Explain:

```text
How management positions
the business.
```

---

# Important Rule

Competitive Context is:

```text
Context

Not Judgment
```

---

# Allowed

```text
Management highlights
its ecosystem scale
as a competitive advantage.
```

---

# Forbidden

```text
The company has
the strongest moat.
```

unless directly supported.

---

# Evidence Package

Required.

---

# Schema

```typescript
type Q1EvidencePackage = {
  company_knowledge_refs:
    string[];

  understanding_refs:
    string[];
};
```

---

# Grounding Rules

Every statement must trace to:

```text
Company Knowledge

or

Quarter Understanding
```

---

# Hallucination Prevention

Prompt must not introduce:

```text
Products

Customers

Markets

Segments
```

not present in inputs.

---

# Business Explanation Rules

Q1 should explain:

```text
Business Reality
```

not:

```text
Business Hype
```

---

# Example

Allowed:

```text
The company generates
subscription revenue
from enterprise software.
```

Forbidden:

```text
The company will dominate
its industry.
```

---

# Simplicity Principle

Q1 should be understandable by:

```text
A non-expert investor.
```

---

# Jargon Rule

Avoid unnecessary:

```text
Technical

Industry

Accounting
```

jargon.

---

# Competitive Context Rules

Q1 may discuss:

```text
Positioning

Customers

Products

Capabilities
```

Q1 may NOT discuss:

```text
Future Growth

Trust

Valuation
```

---

# Confidence Rules

Prompt does NOT generate confidence.

---

# Builder Computes

```typescript
type Q1Confidence = {
  coverage_score: number;

  grounding_score: number;

  clarity_score: number;

  evidence_density: number;

  overall: number;
};
```

---

# Forbidden Output Fields

Prompt must NOT generate:

```text
Confidence

Growth Outlook

Trust Verdict

Valuation View

Ownership Thesis

Recommendations
```

---

# Growth Boundary

Forbidden:

```text
Future Revenue Drivers

Growth Forecasts
```

Those belong to:

```text
Q2
```

---

# Trust Boundary

Forbidden:

```text
Management Credibility

Trustworthiness
```

Those belong to:

```text
Q3
```

---

# Valuation Boundary

Forbidden:

```text
Cheap

Expensive

Undervalued

Overvalued
```

Those belong to:

```text
Q4
```

---

# Ownership Boundary

Forbidden:

```text
Why You Should Own It
```

Those belong to:

```text
Q5
```

---

# Evaluation Hooks

Supports:

```text
Business Understanding Quality

Grounding Quality

Clarity

Completeness
```

---

# Evaluation Metrics

## Business Clarity

Measures:

```text
How understandable
the business explanation is.
```

---

## Completeness

Measures:

```text
Coverage of products,
customers,
and business model.
```

---

## Grounding Score

Measures:

```text
Evidence support.
```

---

## Investor Comprehension

Measures:

```text
Would a new investor
understand the business?
```

---

# Prompt Failure Conditions

Prompt fails if it:

Generates growth forecasts

Generates trust assessments

Generates valuation opinions

Generates ownership theses

Creates unsupported claims

Introduces hallucinated products

Produces recommendation language

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

# Lineage Requirements

Artifact records:

```typescript
type Q1PromptLineage = {
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

- all sectors
- global companies
- consistent business explanations
- replayability
- auditability

---

# Architectural Invariants

LOCKED.

1. Q1 explains the business.
2. Q1 is grounded in Company Knowledge and Quarter Understanding.
3. Q1 does not discuss growth.
4. Q1 does not assess trust.
5. Q1 does not assess valuation.
6. Q1 does not create ownership theses.
7. Every statement requires grounding.
8. Confidence is builder-generated.
9. Q1 must be understandable by non-experts.
10. Q1 provides the business foundation for all subsequent Investor Intelligence questions.

End of Specification.