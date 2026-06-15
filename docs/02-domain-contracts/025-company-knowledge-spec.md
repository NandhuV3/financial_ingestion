# 025-company-knowledge-spec.md

Version: 1.0
Status: LOCKED
Owner: Company Knowledge Layer

---

# Purpose

Company Knowledge answers:

```text
What do we currently believe to be durably true
about this company?
```

It is the canonical memory layer of the platform.

---

# Architectural Position

```text
Structured Intelligence
        ↓
Company Knowledge Builder
        ↓
Company Knowledge Governance
        ↓
Company Knowledge
        ↓
Business Signals
        ↓
Quarter Understanding
        ↓
Investor Intelligence
```

---

# Core Responsibility

Store:

```text
Durable Business Understanding
```

accumulated across many filings.

Company Knowledge represents:

```text
Current Best Understanding
```

of the company.

---

# Design Principles

---

## Principle 1

Company Knowledge is durable.

Not filing-specific.

---

## Principle 2

Company Knowledge changes slowly.

Most filings should not significantly change it.

---

## Principle 3

Company Knowledge is governed.

Nothing enters Company Knowledge directly.

---

## Principle 4

Company Knowledge is canonical.

Downstream layers treat it as truth.

---

## Principle 5

Company Knowledge is auditable.

Every change must be explainable.

---

# What Company Knowledge Owns

Owns:

- business model
- products
- customers
- revenue structure
- revenue drivers
- competitive positioning
- strategic priorities
- management focus
- dependencies

---

# What Company Knowledge Does NOT Own

Does NOT own:

- quarter-specific events
- trust assessments
- business signals
- investor conclusions
- recommendations
- market data

Those belong elsewhere.

---

# Artifact Schema

```typescript
type CompanyKnowledgeArtifact = {
  artifact_type: "company_knowledge";

  company: string;

  company_knowledge_version: number;

  knowledge: CompanyKnowledge;

  confidence: CompanyKnowledgeConfidence;

  metadata: ArtifactMetadata;

  lineage: ArtifactLineage;
};
```

---

# Knowledge Structure

```typescript
type CompanyKnowledge = {
  business_model: BusinessModelKnowledge;

  products: ProductKnowledge[];

  customers: CustomerKnowledge[];

  revenue_structure: RevenueStructureKnowledge;

  revenue_drivers: RevenueDriverKnowledge[];

  competitive_positioning: CompetitivePositionKnowledge[];

  strategic_priorities: StrategicPriorityKnowledge[];

  management_focus: ManagementFocusKnowledge[];

  dependencies: DependencyKnowledge[];
};
```

---

# Business Model

Most important field.

---

```typescript
type BusinessModelKnowledge = {
  summary: string;

  value_creation: string;

  revenue_structure: string;

  confidence: number;

  supporting_periods: string[];

  last_updated_period: string;
};
```

---

# Example

```text
Microsoft creates value through:

Enterprise Software
Cloud Infrastructure
AI Services
```

---

# Products

```typescript
type ProductKnowledge = {
  product_name: string;

  description: string;

  importance: "high" | "medium" | "low";

  confidence: number;

  supporting_periods: string[];

  last_updated_period: string;
};
```

---

# Customers

```typescript
type CustomerKnowledge = {
  customer_segment: string;

  description: string;

  confidence: number;

  supporting_periods: string[];

  last_updated_period: string;
};
```

---

# Revenue Structure

```typescript
type RevenueStructureKnowledge = {
  summary: string;

  recurring_components: string[];

  transactional_components: string[];

  confidence: number;

  supporting_periods: string[];

  last_updated_period: string;
};
```

---

# Revenue Drivers

```typescript
type RevenueDriverKnowledge = {
  driver: string;

  description: string;

  confidence: number;

  supporting_periods: string[];

  last_updated_period: string;
};
```

---

# Competitive Positioning

```typescript
type CompetitivePositionKnowledge = {
  positioning: string;

  rationale: string;

  confidence: number;

  supporting_periods: string[];

  last_updated_period: string;
};
```

---

# Strategic Priorities

```typescript
type StrategicPriorityKnowledge = {
  priority: string;

  description: string;

  confidence: number;

  supporting_periods: string[];

  last_updated_period: string;
};
```

---

# Management Focus

```typescript
type ManagementFocusKnowledge = {
  focus_area: string;

  description: string;

  confidence: number;

  supporting_periods: string[];

  last_updated_period: string;
};
```

---

# Dependencies

```typescript
type DependencyKnowledge = {
  dependency: string;

  description: string;

  confidence: number;

  supporting_periods: string[];

  last_updated_period: string;
};
```

---

# Stability Classification

Critical.

Each field belongs to a stability class.

---

# Stable

```typescript
business_model

revenue_structure

products
```

---

# Characteristics

Changes rarely.

Require governance review.

---

# Semi-Stable

```typescript
revenue_drivers

customers

competitive_positioning
```

---

# Characteristics

Occasionally change.

Moderate promotion threshold.

---

# Dynamic

```typescript
strategic_priorities

management_focus

dependencies
```

---

# Characteristics

Expected to evolve.

Lower promotion threshold.

---

# Confidence Model

```typescript
type CompanyKnowledgeConfidence = {
  overall: number;

  evidence_depth: number;

  history_length: number;

  consistency_score: number;

  governance_confidence: number;
};
```

---

# Evidence Depth

Measures:

```text
How much evidence supports this knowledge?
```

---

# History Length

Measures:

```text
How many periods contributed?
```

---

# Consistency Score

Measures:

```text
How stable has this knowledge been?
```

---

# Governance Confidence

Measures:

```text
Confidence after governance review.
```

---

# Supporting Periods

Mandatory.

Every field stores:

```typescript
supporting_periods: string[]
```

---

# Example

```text
2023Q4
2024Q1
2024Q2
2024Q3
```

This allows:

- auditability
- evidence tracing
- confidence calculation

---

# Last Updated Period

Mandatory.

Tracks:

```text
Most Recent Promotion
```

for each field.

---

# Knowledge Version

```typescript
company_knowledge_version
```

increments whenever:

```text
ANY FIELD CHANGES
```

---

# Version Rules

Promotion:

```text
version++
```

Merge:

```text
version++
```

Manual Override:

```text
version++
```

Rollback:

```text
version++
```

Always.

---

# Governance Dependency

Company Knowledge cannot update itself.

Updates only occur through:

```text
Company Knowledge Governance
```

---

# Promotion Sources

Allowed:

```text
Governance Approved Candidate
```

Only.

---

# Forbidden Sources

Forbidden:

```text
Structured Intelligence

Builder

Quarter Understanding

Investor Intelligence
```

Direct writes prohibited.

---

# Archive Strategy

Required.

```text
current.json

archive/
```

---

# Archive Contents

Every version preserved.

Never deleted.

---

# Rollback Support

First-class feature.

---

# Rollback Rules

Rollback:

```text
Restores Historical State
```

but:

```text
Creates New Version
```

---

# Example

Current:

```text
Version 12
```

Rollback to:

```text
Version 8
```

Result:

```text
Version 13
```

with content of Version 8.

---

# Auditability

Every field change must answer:

```text
What changed?

Why?

Who approved it?

What evidence supported it?
```

---

# Audit Linkage

Each field references:

```typescript
source_promotions: string[];
```

---

# Example

```text
PROMOTION-112
PROMOTION-119
PROMOTION-143
```

---

# Relationship to Structured Intelligence

Structured Intelligence provides:

```text
Candidate Understanding
```

---

# Company Knowledge provides:

```text
Durable Understanding
```

---

# Relationship to Business Signals

Business Signals consume:

```text
Company Knowledge
```

as truth.

---

# Example

If Company Knowledge says:

```text
Cloud Platform
```

is a major revenue driver,

Business Signals may detect:

```text
Cloud Growth Acceleration
```

using that context.

---

# Relationship to Quarter Understanding

Quarter Understanding uses:

```text
Company Knowledge
```

to interpret signals.

---

# Example

Signal:

```text
Revenue Acceleration
```

Knowledge:

```text
Cloud is key driver
```

Understanding:

```text
Cloud business strengthening.
```

---

# Relationship to Investor Intelligence

Investor Intelligence consumes:

```text
Company Knowledge
```

for:

Q1

Q2

Q3 Context

Q5 Thesis

---

# Invalidation Rules

Company Knowledge becomes stale when:

```text
Governance Approved Change
```

occurs.

---

# Downstream Invalidation

When Company Knowledge changes:

Mark stale:

```text
Business Signals

Quarter Understanding

Investor Intelligence

Partner Domain
```

---

# Evaluation Metrics

---

## Knowledge Stability

Measures:

```text
How stable is knowledge?
```

---

## Promotion Accuracy

Measures:

```text
Good Promotions
/
Promotions
```

---

## Evidence Depth

Measures:

```text
Supporting Evidence
```

per field.

---

## Longitudinal Consistency

Measures:

```text
Knowledge Stability Across Time
```

---

## Rollback Frequency

Measures:

```text
Governance Quality
```

---

# Metadata

```typescript
type ArtifactMetadata = {
  schema_version: string;

  generated_at: string;

  artifact_version: number;
};
```

---

# Lineage

```typescript
type ArtifactLineage = {
  promotion_event_id: string;

  governance_version: string;

  source_candidate_version: number;

  input_hash: string;
};
```

---

# Scaling Requirements

Target:

```text
10,000+ companies
```

---

# Operational Requirements

Support:

```text
Versioning

Audit Logs

Review Queues

Rollback

Dependency Tracking
```

at scale.

---

# Architectural Invariants

LOCKED.

1. Company Knowledge is canonical truth.
2. Company Knowledge is durable memory.
3. Company Knowledge is company-scoped, not filing-scoped.
4. Governance is the only writer.
5. Every change is audited.
6. Every version is archived.
7. Rollback creates a new version.
8. Stable fields change rarely.
9. Supporting periods are mandatory.
10. Downstream layers treat Company Knowledge as truth.

End of Specification.