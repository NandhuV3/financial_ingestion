# 036-concept-registry-integration-spec.md

Version: 1.0
Status: LOCKED
Owner: Platform Intelligence Layer

---

# Purpose

The Concept Registry Integration Layer governs how concepts are:

- created
- validated
- referenced
- versioned
- consumed

across the platform.

The Concept Registry itself is a governed ontology.

This specification defines how platform artifacts interact with that ontology.

---

# Architectural Position

The Concept Registry sits between:

```text
Topic Understanding
```

and

```text
Investor Intelligence
```

It provides a controlled vocabulary for business meaning.

---

# Why This Exists

Without a Concept Registry:

```text
Quarter Understanding
creates free-form concepts

Investor Intelligence
consumes inconsistent concepts

Cross-company analysis breaks

Ontology sprawl occurs
```

With a Concept Registry:

```text
All concepts have identity

All concepts are governed

All concepts are traceable

All concepts are reusable
```

---

# Ownership

Registry Owns:

- concept identity
- concept lifecycle
- concept governance
- concept relationships

Registry Does Not Own:

- topics
- business signals
- investor conclusions
- filings

---

# Core Principle

Topics describe:

```text
What management talked about.
```

Concepts describe:

```text
What it means.
```

Example:

Topic:

```text
AI Investment
```

Concept:

```text
ai_investment_dependency
```

Topic Assignment produces topics.

Quarter Understanding produces concepts.

---

# Registry Position In Pipeline

```text
Themes
 ↓

Topic Assignment
 ↓

Topic Evolution
 ↓

Quarter Change
 ↓

Business Signals
 ↓

Quarter Understanding
 ↓
 Concept Registry
 ↓

Investor Intelligence
 ↓

Partner Domain
```

---

# Registry Interaction Rules

Only these layers may directly interact with the registry:

```text
Quarter Understanding

Investor Intelligence

Evaluation System

Governance Workflows
```

Investor Intelligence consumes concept-normalized understanding only through approved inputs.

Investor Intelligence must not consume Quarter Change directly.

Investor Intelligence must not use Concept Registry access to bypass Quarter Understanding depth limitations.

---

# Forbidden Direct Consumers

The following layers must never depend directly on Concept Registry:

```text
Themes

Topic Assignment

Topic Evolution

Quarter Change

Structured Intelligence

Company Knowledge

Business Signals
```

Reason:

Keep deterministic layers independent.

---

# Concept Reference Standard

Artifacts never store concept names.

Artifacts store:

```typescript
type ConceptReference = {
  concept_id: string;

  concept_registry_version: number;
};
```

---

# Forbidden

Never store:

```text
display_name

localized_name

description
```

inside artifacts.

---

# Quarter Understanding Integration

Quarter Understanding is the primary producer.

---

# Allowed Output

```typescript
type UnderstandingEntry = {
  concept_id: string;
};
```

---

# Validation Rule

Before artifact write:

```text
Validate concept_id exists
```

If invalid:

```text
Artifact generation fails.
```

No silent acceptance.

---

# Proposal Workflow Integration

Quarter Understanding may emit:

```typescript
proposed_concepts[]
```

when no matching active concept exists.

---

# Example

```typescript
{
  concept_id:
    "cloud_platform_growth"
}
```

If unavailable:

```typescript
{
  proposed_concepts: [
    ...
  ]
}
```

---

# Proposal Submission

Quarter Understanding Builder:

1. Detect proposed concepts
2. Run similarity search
3. Create Concept Proposal
4. Submit Governance Queue

---

# Similarity Requirement

Before proposal creation:

Run deduplication.

```typescript
similarity_score > 0.85
```

Triggers merge suggestion.

---

# Investor Intelligence Integration

Investor Intelligence consumes concepts.

It does not create concepts.

---

# Usage Model

Q1–Q5 builders receive:

```text
Relevant Active Concepts
```

from registry.

---

# Concept Usage

Example:

Q2

Growth Driver:

```text
cloud_platform_growth
```

Q3

Trust Signal:

```text
commitment_execution_strength
```

Q5

Ownership Thesis:

```text
platform_ecosystem_advantage
```

---

# Evidence Package Integration

Investor Intelligence stores:

```typescript
type ConceptEvidence = {
  concept_id: string;

  concept_registry_version: number;

  source_understanding_id: string;
};
```

---

# Versioning Rules

Every concept reference records:

```text
Concept Version
```

used during generation.

---

# Example

```typescript
{
  concept_id:
    "cloud_platform_growth",

  concept_registry_version:
    18
}
```

---

# Registry Update Impact

Registry changes do NOT automatically invalidate artifacts.

Reason:

Concept meaning remains stable.

Registry metadata changed.

Artifact content unchanged.

---

# Exception

Invalidate only when:

```text
Concept merged

Concept deprecated

Concept definition materially changed
```

---

# Deprecation Handling

When concept becomes:

```text
deprecated
```

historical artifacts remain valid.

---

# Historical Artifact Rule

Never rewrite history.

---

# Example

Q5 generated in 2025:

```text
cloud_platform_growth
```

Registry 2026:

```text
deprecated
```

Artifact remains unchanged.

---

# Merge Handling

When:

```text
Concept A
merged into
Concept B
```

future generations use:

```text
Concept B
```

Historical artifacts retain:

```text
Concept A
```

with lineage annotation.

---

# Registry Lookup Service

Consumers access registry through:

```typescript
ConceptRegistryService
```

---

# Required APIs

```typescript
getConcept()

getActiveConcepts()

validateConcept()

proposeConcept()

getRelationships()

getConceptVersion()
```

---

# Localization Rules

Artifacts never store translated names.

Localization occurs:

```text
Render Time
```

only.

---

# Flow

Artifact

↓

concept_id

↓

Registry Lookup

↓

Localized Display

↓

UI

---

# Relationship Integration

Consumers may access:

```typescript
relationships[]
```

for reasoning.

---

# Example

```text
cloud_platform_growth

related_to

ai_workload_expansion
```

---

# Relationship Consumption

Allowed:

Quarter Understanding

Investor Intelligence

Evaluation

---

# Forbidden

Business Signals

Company Knowledge

Topic Assignment

---

# Concept Graph Migration

Registry must support future graph expansion.

---

# Current State

```text
Flat Registry
```

---

# Future State

```text
Concept Graph
```

---

# Migration Rule

Artifacts reference:

```text
concept_id
```

only.

Never graph nodes.

---

# Evaluation Integration

Evaluation System validates:

```text
Concept Existence

Concept Validity

Concept Version

Concept Usage
```

---

# Evaluation Metrics

## Registry Compliance

Measures:

```text
Valid concept references.
```

---

## Proposal Accuracy

Measures:

```text
Proposal acceptance rate.
```

---

## Concept Reuse

Measures:

```text
Reuse across companies.
```

---

## Ontology Growth

Measures:

```text
New concepts per quarter.
```

---

## Concept Density

Measures:

```text
Average concepts per artifact.
```

---

# Governance Integration

Governance owns:

```text
Approval

Merge

Deprecation

Relationship Creation
```

Pipeline owns:

```text
Proposal Submission
```

---

# Invalidation Rules

Registry Update:

```text
Candidate Invalidation
```

Only.

---

# Propagation Rules

Propagate when:

```text
Concept Meaning Changed
```

Do not propagate when:

```text
Display Name Changed

Localization Updated

Metadata Updated
```

---

# Dependency Index Integration

Registry participates in dependency tracking.

---

# Dependency Entry

```typescript
type ConceptDependency = {
  concept_id: string;

  concept_registry_version: number;
};
```

---

# Audit Requirements

All concept interactions are auditable.

Track:

```text
Who proposed

Who approved

Who merged

Who deprecated

Who consumed
```

---

# Scaling Requirements

Target:

```text
10,000+ companies
```

Must support:

- cross-company reuse
- multilingual display
- ontology governance
- future graph migration
- longitudinal concept tracking

---

# Architectural Invariants

LOCKED.

1. Concepts are governed.
2. Topics and concepts are different layers.
3. Quarter Understanding creates concept references.
4. Investor Intelligence consumes concept references.
5. Deterministic layers never depend on concepts.
6. Artifacts store concept IDs only.
7. Localization occurs at render time.
8. Historical artifacts are immutable.
9. Registry changes do not automatically invalidate artifacts.
10. Concept Registry is graph-ready but graph-independent.

End of Specification.
