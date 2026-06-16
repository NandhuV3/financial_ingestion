# 056-partner-domain-builder-spec.md

Version: 1.0
Status: LOCKED
Owner: Partner Domain Layer

Depends On:

- 012-artifact-framework-spec.md
- 014-dependency-index-spec.md
- 015-invalidation-engine-spec.md
- 038-investor-intelligence-artifact-spec.md
- 039-partner-domain-spec.md

Consumes:

- Investor Intelligence Artifact

Produces:

- Partner Domain Artifact
- Presentation Views
- Partner Outputs

---

# Purpose

This specification defines how the Partner Domain Builder transforms:

```text
Investor Intelligence
```

into:

```text
Presentation Artifacts
```

for downstream consumers.

Partner Domain is:

```text
Presentation Layer
```

only.

---

# Architectural Position

```text
Investor Intelligence
           ↓

Partner Domain Builder
           ↓

Partner Domain Artifact
           ↓

UI

Reports

Exports

APIs

Partner Experiences
```

---

# Core Responsibility

Transform:

```text
Investor Intelligence
```

into:

```text
Consumable Outputs
```

without generating new intelligence.

---

# Architectural Principle

Partner Domain:

```text
Presents Intelligence
```

It does NOT:

```text
Create Intelligence
```

---

# Critical Rule

Partner Domain is forbidden from:

```text
Reasoning

Inference

Interpretation

Synthesis

Judgment
```

---

# Builder Ownership

Partner Domain Builder owns:

- artifact resolution
- formatting
- presentation mapping
- view generation
- export generation
- delivery packaging
- lineage recording

Builder does NOT own:

- intelligence generation
- investor reasoning
- trust assessment
- business assessment
- valuation assessment
- ownership thesis creation

---

# Input Contract

```typescript
type PartnerDomainBuilderInput = {
  company_id: string;

  period_id: string;

  presentation_type:
    PresentationType;
};
```

---

# Presentation Types

```typescript
type PresentationType =
  | "ui_view"
  | "executive_summary"
  | "partner_api"
  | "pdf_report"
  | "dashboard"
  | "research_export";
```

---

# Builder Flow

```text
1. Resolve Investor Intelligence

2. Validate Artifact

3. Build Presentation Context

4. Generate Presentation Views

5. Validate Fidelity

6. Create Partner Artifact

7. Persist

8. Register Dependencies

9. Publish
```

---

# Step 1

Resolve Investor Intelligence

---

# Source

```text
Dependency Index
```

---

# Required Artifact

```text
Investor Intelligence
```

---

# Resolution Schema

```typescript
type UpstreamArtifacts = {
  investor_intelligence:
    InvestorIntelligenceArtifact;
};
```

---

# Validation

Artifact must be:

```text
Current

Approved

Not Stale
```

---

# Failure

```text
Build Failure
```

---

# Step 2

Validate Artifact

---

# Purpose

Ensure:

```text
Investor Intelligence
```

is complete.

---

# Required Sections

```text
Q1

Q2

Q3

Q5
```

---

# Optional

```text
Q4
```

---

# Failure

Missing mandatory section:

```text
Build Failure
```

---

# Step 3

Build Presentation Context

---

# Purpose

Create:

```text
Presentation Model
```

---

# Context

```typescript
type PartnerPresentationContext = {
  investor_intelligence:
    InvestorIntelligenceArtifact;

  presentation_type:
    PresentationType;
};
```

---

# Critical Rule

Builder may:

```text
Reformat
```

information.

---

# Builder may NOT

```text
Interpret
```

information.

---

# Example

Allowed:

```text
Convert Q3 into card format.
```

---

Forbidden:

```text
Generate new trust summary.
```

---

# Step 4

Generate Presentation Views

---

# Purpose

Create:

```text
Consumer-Friendly Views
```

---

# Examples

UI View:

```text
Cards

Sections

Tables
```

---

# Dashboard:

```text
Widgets

Panels

Metrics
```

---

# Report:

```text
Narrative Layout
```

---

# Export:

```text
Structured JSON

CSV

API Payload
```

---

# Fidelity Rule

Every view must be:

```text
Lossless
```

relative to Investor Intelligence.

---

# Meaning

No intelligence may be:

```text
Added

Removed

Changed
```

---

# Step 5

Validate Fidelity

---

# Purpose

Ensure:

```text
Presentation == Source
```

---

# Validation Checks

```text
Field Mapping

Section Mapping

Evidence Mapping

Confidence Mapping
```

---

# Forbidden

```text
Generated Insights

Generated Conclusions

Generated Recommendations
```

---

# Fidelity Failure

```text
Artifact Rejected
```

---

# Step 6

Create Partner Artifact

---

# Output

```typescript
type PartnerDomainArtifact = {
  artifact_id: string;

  artifact_type:
    "partner_domain";

  business_key: {
    company_id: string;

    period_id: string;
  };

  presentation_type:
    PresentationType;

  views:
    PartnerView[];

  lineage:
    PartnerDomainLineage;

  metadata:
    ArtifactMetadata;
};
```

---

# Artifact Type

```text
partner_domain
```

---

# Step 7

Persistence

---

# Storage

```text
Partner Store
```

---

# Strategy

```text
Atomic
```

---

# Persisted Objects

```text
Partner Artifact

Lineage

Metadata
```

---

# Failure

```text
Rollback
```

---

# Step 8

Dependency Registration

---

# Dependency Node

```typescript
type DependencyNode = {
  artifact_type:
    "partner_domain";

  upstream: [
    "investor_intelligence"
  ];

  downstream: [];
};
```

---

# Rule

Partner Domain is:

```text
Terminal Layer
```

---

# No Downstream Intelligence

Allowed.

---

# Step 9

Publish

---

# Consumers

```text
UI

Reports

APIs

Partner Integrations
```

---

# Publication Event

```typescript
type ArtifactPublishedEvent = {
  artifact_id: string;

  artifact_type:
    "partner_domain";

  timestamp: string;
};
```

---

# Intelligence Preservation

Critical.

---

# Rule

Partner Domain must preserve:

```text
Q1

Q2

Q3

Q4

Q5
```

exactly.

---

# Example

Allowed:

```text
Display Q2 in growth card.
```

---

Forbidden:

```text
Rewrite Q2.
```

---

# Trust Architecture Rule

Partner Domain may display:

```text
Trust Verdict
```

from Q3.

---

# Partner Domain may NOT

```text
Generate Trust Verdicts
```

---

# Ownership Thesis Rule

Partner Domain may display:

```text
Q5 Ownership Thesis
```

---

# Partner Domain may NOT

```text
Strengthen

Weaken

Modify
```

the thesis.

---

# Recommendation Boundary

Critical.

---

# Partner Domain must never create:

```text
Buy

Sell

Hold

Price Target

Expected Return

Portfolio Advice
```

---

# Even if requested by UI.

---

# Rule

Presentation Layer cannot override:

```text
Investor Intelligence Governance
```

---

# Confidence Handling

Partner Domain displays:

```text
Existing Confidence
```

only.

---

# Partner Domain may NOT

```text
Compute Confidence
```

---

# Confidence Ownership

Belongs to:

```text
Investor Intelligence Builder
```

---

# Invalidation Integration

Uses:

```text
Hybrid Invalidation
```

---

# Trigger Events

```text
Investor Intelligence Changed
```

---

# Candidate Staleness

Uses:

```text
Version Hash
```

---

# Propagation

Uses:

```text
Content Hash
```

---

# Replayability Requirements

Must record:

```text
Investor Intelligence Version

Input Hash

Output Hash
```

---

# Lineage Schema

```typescript
type PartnerDomainLineage = {
  investor_intelligence_ref:
    string;

  investor_intelligence_version:
    string;

  input_hash: string;

  output_hash: string;
};
```

---

# Builder Metrics

Track:

```text
Resolution Time

View Generation

Validation

Persistence
```

---

# Monitoring Schema

```typescript
type BuilderMetrics = {
  artifact_resolution_ms: number;

  view_generation_ms: number;

  validation_ms: number;

  persistence_ms: number;
};
```

---

# Error Categories

```typescript
type BuilderError =
  | "INVESTOR_INTELLIGENCE_MISSING"
  | "FIDELITY_VALIDATION_FAILURE"
  | "PERSISTENCE_FAILURE";
```

---

# Recovery Strategy

Missing Artifact:

```text
Wait
```

Validation Failure:

```text
Reject Artifact
```

Persistence Failure:

```text
Rollback
```

---

# Scaling Requirements

Target:

```text
10,000+ companies
```

Must support:

- multi-channel presentation
- replayability
- auditability
- fidelity preservation
- governance compliance

---

# Architectural Invariants

LOCKED.

1. Partner Domain is a presentation layer.
2. Partner Domain is not an intelligence layer.
3. Partner Domain never creates intelligence.
4. Partner Domain never performs reasoning.
5. Partner Domain never modifies Q1-Q5 outputs.
6. Partner Domain never creates recommendations.
7. Partner Domain is the terminal layer of the platform.
8. Fidelity validation is mandatory.
9. Confidence is displayed, never computed.
10. Investor Intelligence is the sole source of presentation truth.

End of Specification.