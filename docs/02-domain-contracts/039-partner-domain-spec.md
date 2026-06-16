# 039-partner-domain-spec.md

Version: 1.0
Status: LOCKED
Owner: Partner Domain Layer

---

# Purpose

Partner Domain is the presentation layer of the platform.

Its responsibility is:

```text
Transform Intelligence

↓

Audience-Specific Communication
```

Partner Domain exists to make intelligence consumable.

It does NOT create intelligence.

---

# Architectural Position

```text
Investor Intelligence
        ↓

Partner Domain
        ↓

End User
```

---

# Core Principle

Investor Intelligence decides:

```text
What is true.
```

Partner Domain decides:

```text
How it is shown.
```

---

# Ownership

Partner Domain owns:

- presentation
- formatting
- audience adaptation
- narrative packaging
- visualization preparation
- communication structure

Partner Domain does NOT own:

- business conclusions
- growth conclusions
- trust conclusions
- valuation conclusions
- ownership thesis conclusions

---

# Architectural Boundary

Investor Intelligence is:

```text
Source Of Truth
```

Partner Domain is:

```text
Presentation Layer
```

---

# Forbidden Responsibilities

Partner Domain must never:

Generate new intelligence

Create new signals

Create new concepts

Create new conclusions

Create new investment views

Create new trust assessments

Create new valuation assessments

Create new ownership theses

Override Investor Intelligence

---

# Allowed Responsibilities

Partner Domain may:

Summarize

Reorganize

Translate

Format

Visualize

Adapt language

Adapt tone

Adapt depth

Adapt audience level

---

# Input Sources

Required:

```text
Investor Intelligence
```

Optional:

```text
Company Knowledge
```

Only for reference.

Not for new reasoning.

---

# Forbidden Inputs

Partner Domain must never consume:

Raw Filings

Business Signals

Quarter Understanding

Structured Intelligence

Themes

Topic Assignment

Topic Evolution

Market Data

Valuation Data

---

# Why This Exists

Prevents:

```text
Presentation Layer Intelligence Drift
```

---

# Example Failure

Investor Intelligence:

```text
Trust = Moderate
```

Partner Domain:

```text
Trust = High
```

Forbidden.

---

# Example Failure

Investor Intelligence:

```text
Ownership Thesis = Conditional
```

Partner Domain:

```text
Ownership Thesis = Strong
```

Forbidden.

---

# Output Types

Partner Domain supports:

```typescript
type OutputMode =
  | "executive_summary"
  | "investment_memo"
  | "advisor_brief"
  | "portfolio_view"
  | "client_report"
  | "dashboard_view"
  | "presentation_view";
```

---

# Audience Profiles

Supported audiences:

```typescript
type AudienceType =
  | "retail_investor"
  | "wealth_advisor"
  | "institutional_analyst"
  | "portfolio_manager"
  | "executive";
```

---

# Audience Adaptation

Allowed changes:

```text
Depth

Vocabulary

Formatting

Length

Structure
```

---

# Forbidden Changes

Not allowed:

```text
Meaning

Verdicts

Confidence

Conclusions

Change Conditions
```

---

# Transformation Model

Partner Domain performs:

```text
Intelligence

↓

Presentation Mapping

↓

Audience Output
```

Never:

```text
Intelligence

↓

New Intelligence
```

---

# Output Schema

```typescript
type PartnerDomainArtifact = {
  artifact_id: string;

  company: string;

  period: string;

  audience_type: AudienceType;

  output_mode: OutputMode;

  content: PartnerContent;

  lineage: PartnerLineage;

  metadata: Metadata;
};
```

---

# Content Schema

```typescript
type PartnerContent = {
  executive_summary: string;

  key_takeaways: string[];

  supporting_sections:
    PartnerSection[];

  risk_disclosures: string[];

  confidence_summary:
    ConfidenceSummary;
};
```

---

# Partner Section

```typescript
type PartnerSection = {
  section_title: string;

  section_content: string;

  source_refs: string[];
};
```

---

# Source Reference Requirement

Every section must trace to:

```text
Investor Intelligence
```

No orphan content.

---

# Confidence Handling

Partner Domain cannot alter confidence.

---

# Allowed

```text
Display Confidence
```

---

# Forbidden

```text
Modify Confidence

Recalculate Confidence

Infer Confidence
```

---

# Confidence Schema

```typescript
type ConfidenceSummary = {
  overall_confidence: number;

  q1_confidence: number;

  q2_confidence: number;

  q3_confidence: number;

  q4_confidence: number | null;

  q5_confidence: number;
};
```

---

# Ownership Thesis Handling

Partner Domain may:

```text
Display Thesis

Explain Thesis

Summarize Thesis
```

---

# Forbidden

Partner Domain may not:

```text
Strengthen Thesis

Weaken Thesis

Replace Thesis
```

---

# Change Condition Handling

Partner Domain must display:

```text
All Change Conditions
```

---

# Forbidden

Cannot:

```text
Remove Conditions

Add Conditions

Rewrite Conditions
```

---

# Recommendation Boundary

Partner Domain is the highest risk layer.

Reason:

Presentation often drifts into advice.

---

# Hard Rule

Partner Domain must never generate:

```text
Buy

Sell

Hold

Outperform

Underperform

Price Target

Expected Return

Allocation Advice
```

---

# Recommendation Scan

Mandatory.

Run on:

```text
All Outputs
```

---

# Failure Rule

If detected:

```text
Artifact Rejected
```

---

# Visualization Support

Allowed:

```text
Charts

Tables

Trend Views

Confidence Views

Historical Comparisons
```

---

# Forbidden Visualizations

Anything implying:

```text
Investment Recommendation
```

Examples:

```text
Buy Meter

Sell Meter

Expected Return Gauge

Alpha Score
```

---

# Historical Comparison Support

Partner Domain may display:

```text
Q1 Evolution

Q2 Evolution

Q3 Evolution

Q4 Evolution

Q5 Evolution
```

---

# Required Source Attribution

Historical comparisons must cite:

```text
Investor Intelligence Versions
```

---

# Localization Support

Partner Domain owns localization.

---

# Localization Rule

Translate:

```text
Display Content
```

Never:

```text
Concept IDs

Artifact IDs

Lineage IDs
```

---

# Multi-Language Architecture

```text
Investor Intelligence

↓

Partner Domain Localization

↓

Rendered Language
```

---

# Lineage

```typescript
type PartnerLineage = {
  investor_intelligence_version: number;

  investor_intelligence_hash: string;

  audience_type: string;

  output_mode: string;

  prompt_version: string;

  input_hash: string;
};
```

---

# Dependency Rules

Partner Domain depends only on:

```text
Investor Intelligence
```

---

# Dependency Invariant

No direct dependency on:

```text
Business Signals

Quarter Understanding

Company Knowledge

Concept Registry
```

---

# Invalidation Rules

Regenerate when:

```text
Investor Intelligence changes
```

---

# No Regeneration Required

Do NOT regenerate for:

```text
Business Signals Changes

Quarter Understanding Changes

Topic Changes

Registry Changes
```

unless Investor Intelligence changed.

---

# Evaluation Metrics

---

## Fidelity Score

Measures:

```text
How accurately output reflects
Investor Intelligence.
```

---

## Audience Fit Score

Measures:

```text
Appropriate communication style.
```

---

## Recommendation Boundary Score

Measures:

```text
Absence of investment advice.
```

---

## Attribution Completeness

Measures:

```text
Source traceability.
```

---

# Governance Requirements

Before write:

Run:

```text
Fidelity Validation

Confidence Validation

Recommendation Scan

Lineage Validation
```

---

# Scaling Requirements

Target:

```text
10,000+ companies
```

Must support:

- multiple audiences
- multiple languages
- multiple presentation formats
- full auditability
- zero intelligence drift

---

# Architectural Invariants

LOCKED.

1. Partner Domain is presentation only.
2. Partner Domain never creates intelligence.
3. Investor Intelligence is the sole source of truth.
4. Confidence cannot be modified.
5. Conclusions cannot be modified.
6. Change conditions cannot be modified.
7. Recommendation language is forbidden.
8. Partner Domain depends only on Investor Intelligence.
9. Localization happens here.
10. Fidelity to Investor Intelligence is the primary success metric.

End of Specification.