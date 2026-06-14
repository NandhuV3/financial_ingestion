# 013-artifact-framework-spec.md

# Purpose

Artifact Framework is the foundational storage and lifecycle system for the platform.

Every layer produces artifacts.

Every artifact must follow the same contract.

LOCKED.

---

# Core Principle

Nothing exists in the platform unless it is an artifact.

Artifacts are the source of truth.

Not prompts.

Not databases.

Not LLM outputs.

Not caches.

Artifacts.

LOCKED.

---

# Artifact Requirements

Every artifact must support:

- Versioning
- Lineage
- Auditability
- Replayability
- Invalidation
- Confidence
- Metadata

LOCKED.

---

# Artifact Structure

Every artifact follows:

```typescript
type Artifact<T> = {
  artifact_id: string;

  artifact_type: string;

  company: string;

  period?: string;

  version: number;

  status:
    | "current"
    | "archived"
    | "stale"
    | "pending_review";

  content: T;

  confidence: Confidence;

  metadata: ArtifactMetadata;

  lineage: ArtifactLineage;
}
```

LOCKED.

---

# Artifact Metadata

```typescript
type ArtifactMetadata = {
  created_at: string;

  updated_at: string;

  pipeline_version: string;

  schema_version: string;

  producer_layer: string;

  generation_time_ms: number;
}
```

LOCKED.

---

# Artifact Lineage

```typescript
type ArtifactLineage = {
  input_hash: string;

  output_hash: string;

  upstream_artifacts: UpstreamReference[];

  prompt_lineage?: PromptLineage;
}
```

LOCKED.

---

# Upstream Reference

```typescript
type UpstreamReference = {
  artifact_type: string;

  artifact_path: string;

  version: number;

  hash: string;
}
```

LOCKED.

---

# Artifact Status Lifecycle

```text
PENDING
   ↓

CURRENT
   ↓

STALE
   ↓

REGENERATED
   ↓

ARCHIVED
```

LOCKED.

---

# Versioning Rules

Every write:

version += 1

No overwrite.

Ever.

LOCKED.

---

# Archive Rules

Historical versions remain forever.

Never delete.

Never mutate.

LOCKED.

---

# Current Pointer

Every artifact type has:

current.json

which points to latest valid artifact.

Example:

warehouse/
  MSFT/
    company-knowledge/
      current.json
      archive/
        1.json
        2.json
        3.json

LOCKED.

---

# Artifact Categories

Core Categories:

1. Filing Artifacts
2. Intelligence Artifacts
3. Governance Artifacts
4. Registry Artifacts
5. Evaluation Artifacts

LOCKED.

---

# Filing Artifacts

Examples:

- Filing
- Parsed Filing

LOCKED.

---

# Intelligence Artifacts

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

LOCKED.

---

# Governance Artifacts

Examples:

- Review Queue
- Audit Logs
- Promotion Decisions

LOCKED.

---

# Registry Artifacts

Examples:

- Prompt Registry
- Topic Registry
- Concept Registry

LOCKED.

---

# Evaluation Artifacts

Examples:

- Harness Results
- Regression Reports
- Calibration Reports

LOCKED.

---

# Storage Layout

warehouse/

  companies/
      {ticker}/

  registries/

  governance/

  evaluations/

LOCKED.

---

# Design Rule

If a component cannot explain:

- what artifact it produces
- where it is stored
- who owns it

then the design is incomplete.

LOCKED.

---

# Final Principle

Artifacts are the operating system of the platform.

Everything else exists to create,
govern,
evaluate,
or consume artifacts.

LOCKED.