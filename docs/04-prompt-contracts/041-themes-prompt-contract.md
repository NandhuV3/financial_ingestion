# 041-themes-prompt-contract.md

Version: 1.0
Status: LOCKED
Owner: Themes Layer

Inherits:
040-prompt-governance-spec.md

---

# Purpose

This contract governs the Themes Prompt.

The Themes Prompt is responsible for:

```text
Identifying
what management discussed
in a filing.
```

Themes are observations.

Themes are not interpretations.

Themes are not conclusions.

Themes are not intelligence.

---

# Architectural Position

```text
Filing
  ↓

Themes Prompt
  ↓

Themes Artifact
  ↓

Topic Assignment
```

---

# Core Question

The prompt answers:

```text
What topics
received meaningful discussion
in this filing?
```

---

# Ownership

Themes Prompt owns:

- topic discovery
- topic extraction
- topic evidence
- topic importance estimation

Themes Prompt does NOT own:

- topic classification
- topic evolution
- business interpretation
- concept generation
- investor conclusions

---

# Prompt Objective

Transform:

```text
Raw Filing
```

into:

```text
Observed Themes
```

without interpretation.

---

# Input Contract

Required Inputs:

```typescript
type ThemesPromptInput = {
  company: string;

  filing_period: string;

  filing_type: string;

  filing_content: string;
};
```

---

# Allowed Context

Prompt may see:

```text
Current Filing Only
```

---

# Forbidden Context

Prompt must NOT see:

```text
Topic Registry

Concept Registry

Business Signals

Quarter Understanding

Investor Intelligence

Prior Themes

Company Knowledge

Trust Artifacts
```

---

# Reason

Themes must remain:

```text
Independent

Unbiased

Observation Focused
```

---

# Output Contract

Prompt must produce:

```typescript
type ThemeOutput = {
  theme_id: string;

  title: string;

  description: string;

  importance:
    | "low"
    | "medium"
    | "high";

  evidence: EvidenceReference[];
};
```

---

# Theme Artifact

```typescript
type ThemesArtifact = {
  company: string;

  period: string;

  themes: ThemeOutput[];

  confidence: ThemesConfidence;

  metadata: Metadata;
};
```

---

# Theme Definition

A Theme represents:

```text
A meaningful subject
discussed by management.
```

---

# Examples

Valid Themes:

```text
Cloud Adoption

AI Investment

Margin Expansion

Supply Chain Efficiency

Customer Growth

Capital Allocation
```

---

# Invalid Themes

These are interpretations:

```text
Strong Competitive Moat

Excellent Execution

High Trust

Undervalued Business
```

Forbidden.

---

# Theme Granularity Rules

Themes should be:

```text
Specific

Observable

Reusable
```

---

# Too Broad

```text
Technology
```

Invalid.

---

# Too Narrow

```text
Azure AI Copilot Expansion
Inside Fortune 100 Accounts
```

Invalid.

---

# Preferred

```text
AI Adoption
```

---

# Theme Independence Rule

Themes must stand alone.

Do not require:

```text
Future Knowledge

Business Knowledge

Investor Context
```

to understand.

---

# Evidence Requirements

Every theme requires evidence.

---

# Evidence Schema

```typescript
type EvidenceReference = {
  source_excerpt: string;

  source_location: string;
};
```

---

# Evidence Rules

At least:

```text
1 evidence reference
```

required.

Preferred:

```text
2-5 references
```

per theme.

---

# Unsupported Theme Rule

No evidence:

```text
Theme Rejected
```

---

# Importance Classification

Prompt must classify:

```text
Low

Medium

High
```

importance.

---

# Importance Definition

Measures:

```text
Discussion Prominence
```

not business importance.

---

# Example

Management discussed AI:

```text
15 times
```

Result:

```text
High Importance Theme
```

even if AI is not yet material.

---

# Forbidden Interpretation

Prompt must NOT infer:

```text
Future Revenue

Trust

Competitive Position

Valuation

Business Quality
```

---

# Theme Naming Rules

Names must be:

```text
Short

Stable

Business-Oriented
```

---

# Naming Examples

Preferred:

```text
AI Adoption

Cloud Expansion

Customer Retention
```

Avoid:

```text
Management Focused Heavily
On AI Adoption This Quarter
```

---

# Theme Count Rules

Target:

```text
5-20 themes
```

per filing.

---

# Warning Threshold

More than:

```text
30 themes
```

suggests fragmentation.

---

# Minimum Threshold

Less than:

```text
3 themes
```

suggests under-extraction.

---

# Deduplication Rules

Prompt must avoid:

```text
Near-Duplicate Themes
```

---

# Example

Do NOT emit:

```text
Cloud Adoption

Cloud Growth

Cloud Expansion
```

as separate themes.

---

# Preferred

```text
Cloud Adoption
```

with richer evidence.

---

# Confidence Model

Prompt does NOT generate confidence.

---

# Builder Computes

```typescript
type ThemesConfidence = {
  evidence_density: number;

  coverage_score: number;

  duplication_score: number;

  extraction_quality: number;

  overall: number;
};
```

---

# Forbidden Output Fields

Prompt must NOT generate:

```text
Confidence

Topic IDs

Concept IDs

Business Conclusions

Recommendations
```

---

# Topic Registry Independence

Prompt must never reference:

```text
topic_id
```

---

# Example

Allowed:

```text
Cloud Adoption
```

Forbidden:

```text
TOPIC_017
```

---

# Concept Registry Independence

Prompt must never generate:

```text
concept_id
```

---

# Example

Forbidden:

```text
cloud_platform_growth
```

because that is a concept.

---

# Hallucination Prevention

Every theme must trace to:

```text
Input Filing
```

---

# Forbidden

Inventing:

```text
Products

Customers

Markets

Strategies
```

not present in filing.

---

# Evaluation Hooks

Prompt output supports:

```text
Theme Coverage

Theme Quality

Evidence Density

Deduplication Quality
```

evaluation.

---

# Evaluation Metrics

## Theme Coverage

Measures:

```text
How much filing content
is represented by themes.
```

---

## Evidence Density

Measures:

```text
Evidence per theme.
```

---

## Duplication Score

Measures:

```text
Theme overlap.
```

---

## Specificity Score

Measures:

```text
Theme quality.
```

---

# Governance Rules

Prompt must remain:

```text
Observational
```

---

# Prompt Failure Conditions

Prompt fails if it:

Generates concepts

Generates topic IDs

Generates trust conclusions

Generates investor conclusions

Generates valuation conclusions

Produces unsupported themes

Produces recommendation language

---

# Recommendation Boundary

Themes layer must never produce:

```text
Buy

Sell

Hold

Undervalued

Overvalued
```

---

# Lineage Requirements

Artifact must record:

```typescript
type ThemesPromptLineage = {
  prompt_id: string;

  prompt_version: string;

  model_version: string;
};
```

---

# Replayability Requirements

Production generation requires:

```text
Temperature = 0
```

---

# Scaling Requirements

Target:

```text
10,000+ companies
```

Must support:

- diverse filings
- multilingual filings
- repeatable extraction
- deterministic outputs

---

# Architectural Invariants

LOCKED.

1. Themes are observations, not interpretations.
2. Themes operate on a single filing.
3. Themes cannot access Topic Registry.
4. Themes cannot access Concept Registry.
5. Themes cannot generate intelligence.
6. Every theme requires evidence.
7. Confidence is builder-generated.
8. Theme importance reflects discussion prominence.
9. Themes must be deduplicated.
10. Themes are the sole input to Topic Assignment.

End of Specification.