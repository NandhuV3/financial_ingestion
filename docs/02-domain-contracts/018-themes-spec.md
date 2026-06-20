# 018-themes-spec.md

# Themes Specification

Version: 1.0
Status: LOCKED
Owner: Filing Intelligence Layer

---

# Purpose

Themes is the first intelligence layer in the platform.

Its purpose is:

```text
Identify what management is talking about.
```

NOT:

```text
What it means

Whether it matters

Whether it is good or bad

Whether investors should care
```

Those belong to downstream layers.

Themes is extraction only.

---

# Architectural Position

```text
Filing
   ↓
Themes
   ↓
Topic Assignment
   ↓
Topic Evolution
```

Themes is the root artifact for all topic intelligence.

---

# Core Responsibility

Extract filing-specific observation clusters representing coherent business
narratives discussed by management:

- recurring business discussions
- management focus areas
- strategic initiatives
- business developments
- operational discussions
- competitive discussions
- trust-related discussions

from filing content.

---

# Themes Does NOT Do

Themes never:

- emit canonical topic labels
- classify into registry topics
- interpret meaning
- infer impact
- infer sentiment
- infer importance
- infer investor relevance
- compare periods
- generate evolution signals
- generate durable company knowledge

---

# Example

Filing says:

```text
AI demand increased significantly.

We expanded GPU infrastructure.

Enterprise AI adoption accelerated.
```

Themes Output:

```text
Title:
Cloud and AI infrastructure priorities

Summary:
Management discussed AI demand, infrastructure expansion,
and enterprise adoption.

Evidence:
Filing excerpts supporting the observation
```

NOT:

```text
AI Revenue Growth

Positive AI Outlook

Strong Competitive Position
```

Those are interpretations.

---

# Design Principles

---

## Principle 1

Themes are observations.

Not conclusions.

---

## Principle 2

Themes are filing-scoped.

Not company-scoped.

---

## Principle 3

Themes are period-specific.

---

## Principle 4

The Theme schema and extraction rules must be reusable across companies.

Individual Theme instances remain filing-specific and are never reused across
companies or periods.

---

## Principle 5

Themes must be deterministic.

Generation temperature:

```text
0
```

LOCKED.

---

# Artifact Schema

```typescript
type ThemesArtifact = {
  artifact_type: "themes";

  company: string;

  filing_id: string;

  filing_type: FilingType;

  period: string;

  themes: Theme[];

  confidence: ThemesConfidence;

  metadata: ArtifactMetadata;

  lineage: ArtifactLineage;
};
```

---

# Theme Schema

```typescript
type Theme = {
  theme_id: string;

  title: string;

  summary: string;

  category: ThemeCategory;

  evidence: SourceEvidence[];

  evidence_count: number;

  directional_framing?: string;

  confidence: number;
};
```

`directional_framing`, when present, must be copied from explicit filing
language. Themes must not infer direction.

`evidence_count` must equal `evidence.length`.

`summary` is the canonical Theme Summary.

Themes owns extraction of the Theme Summary from the current filing.

Topic Assignment must propagate the Theme Summary unchanged for Topic
Evolution. Downstream layers may not rewrite it as interpretation.

---

# Theme Categories

Categories exist only for organization.

NOT interpretation.

```typescript
type ThemeCategory =
  | "strategy"
  | "product"
  | "customer"
  | "competition"
  | "operations"
  | "financial"
  | "capital_allocation"
  | "management"
  | "trust"
  | "regulatory"
  | "technology"
  | "other";
```

---

# Source Evidence

Every theme must be traceable.

```typescript
type SourceEvidence = {
  section: string;

  excerpt_hash: string;

  page_number?: number;

  paragraph_reference?: string;
};
```

---

# Theme Identity

Themes are filing-local.

Theme IDs are not durable.

```typescript
theme_id =
SHA256(
 filing_id +
 normalized_title +
 normalized_summary
)
```

Themes are not reused across periods.

Topic Assignment creates canonical normalization.

Topic Evolution creates longitudinal continuity.

---

# Confidence

Confidence measures extraction quality.

NOT business importance.

```typescript
type ThemesConfidence = {
  overall: number;

  evidence_coverage: number;

  extraction_consistency: number;

  filing_coverage: number;
};
```

---

# Confidence Meaning

High confidence means:

```text
Observation cluster clearly exists
in filing
```

Low confidence means:

```text
Theme weakly supported
by filing
```

---

# Theme Normalization

Before writing:

```text
Lowercase

Trim whitespace

Remove punctuation noise

Normalize acronyms
```

Example:

```text
Artificial Intelligence

AI

A.I.
```

normalize to:

```text
AI
```

---

# Theme Deduplication

Required.

Example:

```text
AI Demand

Artificial Intelligence Demand

Enterprise AI Demand
```

may collapse into:

```text
AI Demand
```

when semantic similarity exceeds threshold.

---

# Deduplication Threshold

LOCKED

```text
0.90 similarity
```

---

# Filing Coverage Requirement

Themes must cover:

- MD&A
- Business Overview
- Risk Factors
- Strategy Discussion
- Capital Allocation Discussion

when available.

---

# Minimum Theme Count

No fixed minimum.

Depends on filing richness.

---

# Sparse Filing Behavior

Sparse filings may produce:

```text
5 themes
```

Rich filings may produce:

```text
50+ themes
```

This is acceptable.

---

# Theme Registry

Themes do NOT have a registry.

Themes are temporary observations.

Only Topics have governance.

---

# Inputs

Themes receives:

```typescript
type ThemesInputs = {
  filing_text: FilingText;
};
```

Nothing else.

---

# Outputs

Produces:

```typescript
ThemesArtifact
```

Only.

---

# Dependencies

Upstream:

```text
Raw Filing
```

Downstream:

```text
Topic Assignment
```

---

# Invalidation Rules

Themes becomes stale when:

- filing changes
- filing corrected
- themes prompt changes
- model version changes

---

# Regeneration Rules

Regenerate entire artifact.

No partial regeneration.

---

# Evaluation Metrics

---

## Schema Compliance

Required.

---

## Theme Coverage

Measures:

```text
Themes Found
vs
Relevant Discussions
```

---

## Evidence Coverage

Measures:

```text
Themes With Evidence
/
Total Themes
```

Target:

```text
100%
```

LOCKED.

---

## Hallucination Risk

Theme must trace to filing.

Untraceable theme:

```text
FAIL
```

---

## Deduplication Quality

Measures:

```text
Duplicate Themes
/
Total Themes
```

---

# Governance

Themes has no human review.

Themes is transient.

Governance exists at:

```text
Topic Registry

Concept Registry
```

not Themes.

---

# Archive Strategy

Archive every version.

Path:

```text
archive/

current.json
```

---

# Metadata

Required:

```typescript
type ArtifactMetadata = {
  schema_version: string;

  prompt_version: string;

  model_version: string;

  generated_at: string;

  artifact_version: number;
};
```

---

# Lineage

```typescript
type ArtifactLineage = {
  filing_id: string;

  filing_hash: string;

  prompt_version: string;

  model_version: string;

  input_hash: string;
};
```

---

# Scaling Requirements

Must support:

```text
10,000+ companies
```

---

# Performance Target

Theme generation should complete:

```text
< 30 seconds
```

per filing.

Target only.

Not a correctness requirement.

---

# Architectural Invariants

The following are LOCKED:

1. Themes performs extraction only.
2. Themes never performs interpretation.
3. Themes never references Topic Registry.
4. Themes never references Concept Registry.
5. Themes are filing-scoped.
6. Themes are non-durable.
7. Every theme must carry source evidence.
8. Temperature must be 0.
9. Deduplication is mandatory.
10. Topic Assignment owns classification, not Themes.
11. Themes are observation clusters, not topic labels.
12. Themes owns Theme Summary extraction.
13. Themes never performs cross-period comparison.

End of Specification.
