# 001-build-artifact-framework.md

Purpose:

Implement the Artifact Framework defined in:

* 012-artifact-framework-spec.md
* 070-repository-structure.md
* 071-database-schema.md

This is the first implementation task.

Artifact Framework is a platform dependency.

No builder implementation may begin until this task is complete.

---

# Objective

Implement a production-grade Artifact Framework that supports:

* Immutable artifacts
* Versioning
* Lineage
* Metadata
* Current artifact resolution
* Historical artifact retrieval
* Replay support

Do NOT implement:

* Dependency Index
* Invalidation
* Governance
* Evaluation
* Prompt Registry

Those are separate tasks.

---

# Deliverables

## Contracts

Create:

```text
contracts/artifacts/

artifact.ts
artifact-metadata.ts
artifact-lineage.ts
artifact-status.ts
```

---

## Package

Create:

```text
packages/artifact-framework/
```

Structure:

```text
packages/artifact-framework/

src/

artifact-service.ts
artifact-repository.ts
artifact-versioning.ts
artifact-validation.ts
artifact-types.ts

tests/
```

---

## Storage

Implement tables:

```sql
artifact_store

artifact_current_pointer
```

Based on:

071-database-schema.md

---

## APIs

Create internal APIs:

```typescript
createArtifact()

getArtifact()

getCurrentArtifact()

getArtifactHistory()
```

---

# Required Contract

Implement base artifact schema.

```typescript
type Artifact<T> = {
  artifact_id: string;

  artifact_type: string;

  company_id: string;

  period_id: string;

  version: number;

  metadata: ArtifactMetadata;

  lineage: ArtifactLineage;

  content: T;

  created_at: string;
};
```

---

# Metadata Contract

```typescript
type ArtifactMetadata = {
  builder_type: string;

  prompt_version?: string;

  artifact_version: number;

  confidence?: number;
};
```

---

# Lineage Contract

```typescript
type ArtifactLineage = {
  parent_artifacts: {
    artifact_id: string;
    artifact_type: string;
    version: number;
  }[];

  generation_timestamp: string;
};
```

---

# Repository Requirements

Create repository abstraction.

```typescript
interface ArtifactRepository {
  create(): Promise<void>;

  getById(): Promise<Artifact>;

  getCurrent(): Promise<Artifact>;

  getHistory(): Promise<Artifact[]>;
}
```

Repository must be storage-agnostic.

Business logic must not know database details.

---

# Versioning Rules

Artifacts are immutable.

Never update artifact content.

New versions create new rows.

Example:

```text
Themes v1

Themes v2

Themes v3
```

Each version is stored independently.

---

# Current Pointer Rules

Current state is resolved using:

```text
artifact_current_pointer
```

Never determine current version using:

MAX(version)

Current state must be explicit.

---

# Validation

Implement:

```typescript
validateArtifact()

validateMetadata()

validateLineage()
```

Validation failure blocks persistence.

No invalid artifacts may be stored.

---

# Testing Requirements

Create tests for:

## Artifact Creation

Verify:

* artifact persisted
* metadata persisted
* lineage persisted

---

## Versioning

Verify:

* version increments
* previous version retained
* history retrievable

---

## Current Resolution

Verify:

* current pointer updated
* latest artifact returned

---

## Immutability

Verify:

* stored artifact cannot be modified

---

# Files To Create

```text
contracts/artifacts/artifact.ts
contracts/artifacts/artifact-metadata.ts
contracts/artifacts/artifact-lineage.ts
contracts/artifacts/artifact-status.ts

packages/artifact-framework/src/artifact-service.ts
packages/artifact-framework/src/artifact-repository.ts
packages/artifact-framework/src/artifact-versioning.ts
packages/artifact-framework/src/artifact-validation.ts
packages/artifact-framework/src/artifact-types.ts

packages/artifact-framework/tests/*
```

---

# Files To Modify

None.

This task establishes the initial framework.

---

# Success Criteria

The following workflow executes successfully:

```text
Create Artifact
      ↓
Persist Artifact
      ↓
Create New Version
      ↓
Persist New Version
      ↓
Resolve Current Artifact
      ↓
Retrieve Artifact History
```

---

# Out Of Scope

Do NOT implement:

* Dependency Index
* Invalidation Engine
* Governance
* Evaluation
* Prompt Registry
* Builders

Only Artifact Framework.

---

# Deliverable Format

Return:

1. Design Summary
2. Files Created
3. Database Changes
4. Tests Added
5. Risks
6. Future Integration Points

Implementation must comply with:

* 012-artifact-framework-spec.md
* 070-repository-structure.md
* 071-database-schema.md
* 002-codex-operating-manual.md

LOCKED.
