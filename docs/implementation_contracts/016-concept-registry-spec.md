# 016-concept-registry-spec.md

# Concept Registry Specification

Version: 1.0
Status: LOCKED
Owner: Architecture

---

# Purpose

The Concept Registry is the governed ontology layer of the platform.

Its purpose is to provide:

1. Stable concept identities
2. Cross-company comparability
3. Cross-period consistency
4. Concept governance
5. Ontology control
6. Localization support
7. Future graph readiness

Without the Concept Registry:

```text
Quarter Understanding
creates free-text concepts
```

which become impossible to:

- compare
- aggregate
- track
- govern

at scale.

The Concept Registry prevents ontology sprawl.

---

# Architectural Principle

Topics describe:

```text
What management discussed
```

Concepts describe:

```text
What it means
```

Topic Registry and Concept Registry are separate systems.

They solve different problems.

---

# Ownership

The Concept Registry owns:

- concept definitions
- concept identity
- concept governance
- concept lifecycle
- concept relationships
- localization

The Concept Registry does NOT own:

- topic extraction
- signal generation
- business interpretation
- investor reasoning

---

# Core Design Principles

## Principle 1

Every concept has a stable identity.

---

## Principle 2

Concepts are governed.

No free-form production concepts.

---

## Principle 3

Concepts are reusable across companies.

---

## Principle 4

Concepts are reusable across time.

---

## Principle 5

Concept lifecycle is explicit.

---

# Concept Identity

Concept identity never changes.

```typescript
type ConceptIdentity = {
  concept_id: string;

  concept_uuid: string;
};
```

---

# Example

```text
cloud_platform_growth

ai_compute_dependency

pricing_power_expansion

commitment_abandonment_risk
```

---

# Identity Invariant

Once created:

```text
concept_id
```

never reused.

Even if deprecated.

---

# Registry Entry

```typescript
type ConceptRegistryEntry = {
  identity: ConceptIdentity;

  classification: ConceptClassification;

  definition: ConceptDefinition;

  display: ConceptDisplay;

  lifecycle: ConceptLifecycle;

  relationships: ConceptRelationship[];

  metadata: ConceptMetadata;
};
```

---

# Classification

```typescript
type ConceptClassification = {
  topic_ref: string;

  direction: ConceptDirection;

  relevance: ConceptRelevance;

  temporal_scope: ConceptTemporalScope;
};
```

---

# Direction

```typescript
type ConceptDirection =
  | "positive"
  | "negative"
  | "neutral"
  | "emerging"
  | "declining"
  | "volatile";
```

---

# Relevance

```typescript
type ConceptRelevance =
  | "revenue_driver"
  | "cost_driver"
  | "risk"
  | "competitive_signal"
  | "operational_signal"
  | "trust_signal"
  | "capital_allocation"
  | "strategic_priority";
```

---

# Temporal Scope

```typescript
type ConceptTemporalScope =
  | "durable"
  | "cyclical"
  | "emergent"
  | "transitional";
```

---

# Concept Definition

```typescript
type ConceptDefinition = {
  canonical_definition: string;

  distinguishing_criteria: string;

  exclusion_criteria: string;
};
```

---

# Design Rule

Canonical definition is:

```text
English
Human Authored
Authoritative
```

Translations are display only.

---

# Display Layer

```typescript
type ConceptDisplay = {
  [language_code: string]: {
    name: string;

    short_description: string;

    examples: string[];
  };
};
```

---

# Localization Principle

Concept identity:

```text
Language Agnostic
```

Display:

```text
Language Specific
```

---

# Example

```text
cloud_platform_growth
```

May display as:

```text
English

Japanese

Hindi

Tamil
```

Same identity.

---

# Lifecycle

```typescript
type ConceptLifecycle = {
  status: ConceptStatus;

  proposed_at: string;

  approved_at: string | null;

  deprecated_at: string | null;

  proposed_by: string;

  approved_by: string | null;

  deprecated_by: string | null;

  superseded_by: string | null;

  merged_into: string | null;
};
```

---

# Lifecycle Status

```typescript
type ConceptStatus =
  | "proposed"
  | "active"
  | "deprecated"
  | "merged"
  | "rejected";
```

---

# Lifecycle Flow

```text
Proposed
   ↓
Active
   ↓
Deprecated

or

Merged

or

Rejected
```

---

# Lifecycle Invariants

No concept deleted.

Ever.

Historical references remain valid.

---

# Proposal Architecture

Concept proposals originate from:

```text
Pipeline

Human Reviewer
```

---

# Proposal Schema

```typescript
type ConceptProposal = {
  proposal_id: string;

  source:
    | "pipeline"
    | "human";

  proposed_concept_id: string;

  proposed_definition: string;

  topic_ref: string;

  evidence_refs: string[];

  similarity_candidates: SimilarityCandidate[];

  status: ProposalStatus;
};
```

---

# Proposal Status

```typescript
type ProposalStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "rejected"
  | "merged";
```

---

# Proposal Workflow

```text
Proposal
    ↓
Similarity Check
    ↓
Review Queue
    ↓
Approve
Reject
Merge
```

---

# De-Duplication

Mandatory.

Before entering review.

---

# Similarity Candidate

```typescript
type SimilarityCandidate = {
  concept_id: string;

  similarity_score: number;
};
```

---

# Similarity Threshold

```text
0.85+
```

Triggers:

```text
Merge Suggestion
```

Not auto-merge.

Human review required.

---

# Human Review

No automatic concept activation.

Ever.

---

# Review Actions

```text
Approve

Reject

Merge

Defer
```

---

# Review Requirements

Reviewer must validate:

- definition
- topic mapping
- uniqueness
- business usefulness

---

# Review SLA

Concept proposals reviewed within:

```text
2 filing cycles
```

---

# Unresolved Proposals

Remain pending.

Quarter Understanding uses:

```text
closest active concept
```

until review completes.

---

# Merge Architecture

Merge is first-class.

---

# Merge Event

```typescript
type MergeEvent = {
  source_concept: string;

  target_concept: string;

  reviewer: string;

  reason: string;

  timestamp: string;
};
```

---

# Merge Rule

Source becomes:

```text
merged
```

Target remains:

```text
active
```

---

# Merge Strategy

LOCKED

Use:

```text
Lazy Migration
```

---

# Why

Avoid:

```text
Mass Regeneration
```

across thousands of companies.

---

# Historical References

Remain unchanged.

Example:

```text
cloud_growth_v1
```

merged into:

```text
cloud_platform_growth
```

Historical artifacts remain valid.

---

# Deprecation Architecture

Deprecation does not remove concepts.

---

# Deprecation Triggers

1. Superseded concept
2. Merge
3. Inactivity
4. Governance decision

---

# Inactivity Rule

No references across:

```text
4 filing cycles
```

Triggers:

```text
Deprecation Review
```

---

# Concept Relationships

Registry supports relationships.

---

# Relationship Schema

```typescript
type ConceptRelationship = {
  relationship_type: RelationshipType;

  target_concept_id: string;

  confidence: number;
};
```

---

# Relationship Types

```typescript
type RelationshipType =
  | "broader_than"
  | "narrower_than"
  | "related_to"
  | "often_co_occurs"
  | "contradicts";
```

---

# Why Relationships Exist

Future Concept Graph readiness.

No graph infrastructure yet.

---

# Topic Registry Relationship

Every concept:

```text
Must have exactly one topic_ref
```

---

# Constraint

```text
One Topic
Many Concepts
```

---

# Never

```text
One Concept
Many Topics
```

---

# Quarter Understanding Integration

Quarter Understanding is:

```text
Largest Producer
```

of concept references.

---

# Quarter Understanding Rules

May:

```text
Reference Active Concepts
```

May:

```text
Propose New Concepts
```

May NOT:

```text
Invent Free Text Concepts
```

---

# Validation

Artifact build fails if:

```text
concept_id
not active
```

---

# Investor Intelligence Integration

Investor Intelligence consumes concepts.

Never creates concepts.

---

# Usage

Concepts become:

```text
Evidence References
```

inside Q1-Q5.

---

# Business Signals Relationship

Business Signals never reference concepts.

Business Signals remain:

```text
Deterministic
```

and operate at:

```text
Topic Level
```

---

# Concept Registry Versioning

Registry changes create:

```typescript
registry_version
```

---

# Artifacts Store

```typescript
concept_registry_version
```

at generation time.

---

# Purpose

Historical reconstruction.

---

# Storage Structure

```text
concept_registry/

active.json

archive/
```

---

# Archive Rule

Immutable.

No deletion.

---

# Governance Requirements

Platform must answer:

1. Who created this concept?
2. Why?
3. Who approved it?
4. Why was it approved?
5. Was it merged?
6. Was it deprecated?
7. Which artifacts reference it?

---

# Audit Trail

```typescript
type ConceptAuditEvent = {
  event_id: string;

  event_type:
    | "proposal"
    | "approval"
    | "rejection"
    | "merge"
    | "deprecation";

  concept_id: string;

  actor: string;

  timestamp: string;

  notes: string;
};
```

---

# Concept Graph Migration Path

Phase 1

```text
Registry Only
```

---

Phase 2

```text
Relationship Mining
```

---

Phase 3

```text
Graph Query Layer
```

---

Phase 4

```text
Graph Database
```

---

# Migration Invariant

Artifacts reference:

```text
concept_id
```

Only.

Never relationship data.

---

# Scaling Requirements

Target:

```text
10,000+ companies
```

---

Registry must support:

- proposal queue
- governance
- localization
- merge history
- relationship growth

without redesign.

---

# Architectural Invariants

The following are LOCKED:

1. Concepts have stable identity.
2. Concepts are governed.
3. No automatic activation.
4. No free-text production concepts.
5. One concept belongs to one topic.
6. Concepts are never deleted.
7. Lazy migration is default.
8. Quarter Understanding proposes concepts.
9. Investor Intelligence consumes concepts.
10. Concept Graph migration must be additive.

End of Specification.