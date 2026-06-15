# 012-artifact-framework-spec.md

# Artifact Framework Specification

Version: 1.0
Status: LOCKED
Owner: Architecture

---

# Purpose

The Artifact Framework defines the canonical storage,
versioning, lineage, archive, auditability,
and lifecycle standards for every artifact in the platform.

All platform intelligence is represented as artifacts.

Artifacts are first-class assets.

Artifacts are not transient outputs.

---

# Objectives

The framework must provide:

1. Reproducibility
2. Auditability
3. Versioning
4. Historical comparison
5. Partial invalidation
6. Rollback support
7. Dependency tracking
8. Scalable storage
9. Governance enforcement
10. Cross-layer consistency

---

# Architectural Principle

Every layer produces artifacts.

Artifacts are the only mechanism by which
intelligence moves between layers.

Layers never read each other's internal logic.

Layers consume artifacts only.

---

# Artifact Categories

## Layer Artifacts

Produced by intelligence layers.

Examples:

- Themes
- Topic Assignment
- Topic Evolution
- Quarter Change
- Structured Intelligence
- Company Knowledge
- Business Signals
- Quarter Understanding
- Investor Intelligence
- Partner Domain

---

## Governance Artifacts

Produced by governance systems.

Examples:

- Prompt Registry Entries
- Concept Registry Entries
- Promotion Decisions
- Review Queue Entries
- Evaluation Reports

---

## Operational Artifacts

Produced by infrastructure.

Examples:

- Dependency Index
- Invalidation Events
- Regeneration Jobs
- Audit Logs

---

# Artifact Identity

Every artifact must have a globally unique identity.

```typescript
type ArtifactIdentity = {
  artifact_id: string;
  artifact_type: ArtifactType;
  company: string | null;
  period: string | null;
};
```

---

# Artifact Types

```typescript
type ArtifactType =
  | "themes"
  | "topic_assignment"
  | "topic_evolution"
  | "quarter_change"
  | "structured_intelligence"
  | "company_knowledge"
  | "business_signals"
  | "quarter_understanding"
  | "investor_intelligence"
  | "partner_domain"
  | "prompt_registry"
  | "concept_registry"
  | "evaluation_report"
  | "dependency_index";
```

---

# Canonical Artifact Structure

Every artifact must follow the same top-level structure.

```typescript
type BaseArtifact = {
  identity: ArtifactIdentity;

  metadata: ArtifactMetadata;

  lineage: ArtifactLineage;

  content: unknown;

  evaluation: ArtifactEvaluation;

  governance: ArtifactGovernance;
};
```

---

# Metadata Contract

Metadata describes how an artifact was created.

```typescript
type ArtifactMetadata = {
  version: number;

  schema_version: string;

  pipeline_version: string;

  generated_at: string;

  artifact_hash: string;

  input_hash: string;

  generation_duration_ms: number;

  status:
    | "current"
    | "archived"
    | "stale"
    | "candidate_stale"
    | "pending_review";
};
```

---

# Artifact Versioning

Every artifact maintains:

1. Current Version
2. Historical Archive

Artifacts are immutable once archived.

Only current.json changes.

---

# Version Rules

Version increments whenever:

- Content changes
- Lineage changes
- Governance decisions modify output
- Rollback occurs

Version does NOT increment when:

- File is copied
- Read operations occur
- Evaluation reruns occur without artifact changes

---

# Current State Storage

Canonical location:

```text
/company/{ticker}/current/{artifact}.json
```

Example:

```text
/company/MSFT/current/company_knowledge.json
```

Only one current artifact exists.

---

# Archive Storage

Historical versions stored separately.

```text
/company/{ticker}/archive/{artifact}/v{version}.json
```

Example:

```text
/company/MSFT/archive/company_knowledge/v17.json
```

Archives are immutable.

---

# Lineage Framework

Lineage records everything used to generate an artifact.

```typescript
type ArtifactLineage = {
  upstream_dependencies: DependencyReference[];

  prompt_reference?: PromptReference;

  model_reference?: ModelReference;

  generation_context: GenerationContext;
};
```

---

# Dependency Reference

```typescript
type DependencyReference = {
  artifact_path: string;

  artifact_type: ArtifactType;

  version: number;

  artifact_hash: string;

  input_hash: string;
};
```

---

# Prompt Reference

Applicable only to LLM layers.

```typescript
type PromptReference = {
  prompt_id: string;

  prompt_version: string;

  activation_id: string;
};
```

---

# Model Reference

```typescript
type ModelReference = {
  provider: string;

  model_name: string;

  model_version: string;

  temperature: number;
};
```

---

# Determinism Requirement

Production artifact generation must use:

```typescript
temperature = 0
```

Required for:

- Replayability
- Content hashing
- Hybrid invalidation

---

# Artifact Hashing

Every artifact stores:

```typescript
artifact_hash
```

Generated from:

```typescript
SHA256(content)
```

Purpose:

- Content comparison
- Replay validation
- Archive integrity verification

---

# Input Hashing

Every artifact stores:

```typescript
input_hash
```

Generated from:

```typescript
SHA256(
  upstream versions
  +
  upstream hashes
  +
  prompt version
)
```

Purpose:

- Staleness detection
- Partial invalidation

---

# Evaluation Contract

Every artifact carries evaluation metadata.

```typescript
type ArtifactEvaluation = {
  evaluation_version: string;

  structural_passed: boolean;

  confidence_score: number;

  warnings: string[];

  evaluation_timestamp: string;
};
```

Evaluation is attached to the artifact.

Evaluation reports live separately.

---

# Governance Contract

```typescript
type ArtifactGovernance = {
  review_required: boolean;

  review_status:
    | "not_required"
    | "pending"
    | "approved"
    | "rejected";

  governance_flags: string[];
};
```

---

# Archive Invariants

Archives are immutable.

Rules:

1. Never modify archived versions.
2. Never delete archived versions.
3. Never rewrite history.
4. Rollback creates new versions.

---

# Rollback Framework

Rollback restores prior content.

Rollback does not restore prior version numbers.

Example:

Current:

```text
v12
```

Rollback target:

```text
v9
```

Result:

```text
v13
```

Content of v13 equals content of v9.

History remains preserved.

---

# Rollback Record

```typescript
type RollbackRecord = {
  rollback_id: string;

  source_version: number;

  restored_version: number;

  reason: string;

  executed_at: string;

  executed_by: string;
};
```

---

# Artifact Promotion

Promotion occurs when:

Candidate output
→ passes evaluation
→ passes governance
→ becomes current artifact

Promotion is atomic.

Either:

- entire artifact promoted

or

- nothing promoted

No partial writes.

---

# Artifact States

```typescript
type ArtifactState =
  | "current"
  | "candidate"
  | "candidate_stale"
  | "stale"
  | "pending_review"
  | "archived";
```

---

# Artifact Lifecycle

```text
Generated
   ↓
Evaluated
   ↓
Governance Check
   ↓
Promoted
   ↓
Current
   ↓
Archived on next version
```

---

# Partial Invalidation Support

Investor Intelligence supports section-level invalidation.

Each question section maintains:

```typescript
question_version

input_hash

artifact_hash
```

Applicable to:

- Q1
- Q2
- Q3
- Q4
- Q5

---

# Coherence Hash

Investor Intelligence maintains:

```typescript
coherence_hash
```

Generated from:

```typescript
SHA256(
  q1.input_hash +
  q2.input_hash +
  q3.input_hash +
  q4.input_hash +
  q5.input_hash
)
```

Purpose:

Detect overall artifact consistency.

---

# Storage Scaling Requirements

Platform target:

```text
10,000+ companies
40+ periods
millions of archived artifacts
```

Framework must support:

- incremental writes
- archive reads
- historical comparisons
- dependency traversal

without full archive scanning.

---

# Security Requirements

Artifacts are immutable records.

Requirements:

- append-only archives
- checksum verification
- audit logging
- rollback logging

No silent modifications.

---

# Auditability Requirements

For every artifact, the platform must answer:

1. What generated this?
2. Which inputs were used?
3. Which prompt was used?
4. Which model was used?
5. Which version produced it?
6. What changed from prior version?

Failure to answer any of these is an architectural defect.

---

# Future Compatibility

The framework must support future additions:

- Concept Graph
- Multi-language intelligence
- New artifact types
- New evaluation layers
- New governance systems

without requiring artifact migration.

---

# Architectural Invariants

The following are LOCKED:

1. Artifacts are first-class assets.
2. Archives are immutable.
3. Rollbacks create new versions.
4. Every artifact has lineage.
5. Every artifact has hashes.
6. Every artifact has evaluation.
7. Every artifact has governance metadata.
8. LLM outputs must be reproducible.
9. Temperature = 0 in production.
10. Intelligence flows only through artifacts.

End of Specification.