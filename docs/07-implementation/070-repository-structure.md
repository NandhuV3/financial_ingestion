# 070-repository-structure.md

Version: 1.0
Status: LOCKED
Owner: Platform Engineering

Depends On:

- 011-067 Architecture Specifications

Purpose:

Define the monorepo structure for implementation.

This specification determines:

- Service boundaries
- Package ownership
- Builder ownership
- Contract ownership
- Deployment units

---

# Architectural Principle

Repository structure should mirror architecture.

Not:

Business logic mixed with infrastructure.

Not:

Builders mixed with APIs.

Not:

Prompts mixed with runtime code.

---

# Monorepo Layout

```text
platform/

├── apps/
├── services/
├── packages/
├── builders/
├── prompts/
├── contracts/
├── infrastructure/
├── scripts/
├── tests/
└── docs/
```

---

# apps/

Purpose:

User-facing applications.

```text
apps/

├── admin-ui/
├── governance-ui/
├── operator-ui/
└── partner-ui/
```

---

# admin-ui

Owns:

```text
Artifact exploration

Company exploration

Evaluation visibility
```

---

# governance-ui

Owns:

```text
Prompt review

Concept review

Knowledge review
```

---

# operator-ui

Owns:

```text
Replay

Rebuild

Operational monitoring
```

---

# partner-ui

Owns:

```text
Partner Domain presentation
```

---

# services/

Purpose:

Long-running backend services.

```text
services/

├── api-service/
├── orchestrator-service/
├── dependency-service/
├── invalidation-service/
├── governance-service/
├── registry-service/
├── replay-service/
├── evaluation-service/
└── observability-service/
```

---

# api-service

Owns:

```text
External APIs

Authentication

Authorization
```

---

# orchestrator-service

Owns:

```text
Job scheduling

Workflow execution
```

---

# dependency-service

Owns:

```text
Dependency Index
```

---

# invalidation-service

Owns:

```text
Hybrid invalidation
```

---

# governance-service

Owns:

```text
Knowledge governance

Prompt governance

Concept governance
```

---

# registry-service

Owns:

```text
Prompt Registry

Concept Registry

Topic Registry
```

---

# replay-service

Owns:

```text
Artifact replay
```

---

# evaluation-service

Owns:

```text
Evaluation pipeline

Calibration

Regression testing
```

---

# packages/

Purpose:

Shared platform libraries.

```text
packages/

├── artifact-framework/
├── dependency-index/
├── event-model/
├── prompt-registry/
├── concept-registry/
├── evaluation-framework/
├── governance-framework/
├── storage-framework/
├── observability-framework/
└── common/
```

---

# Rule

Packages contain:

```text
Reusable logic
```

---

# Packages MUST NOT

Contain:

```text
Builder implementations
```

---

# builders/

Purpose:

Artifact generation.

```text
builders/

├── themes/
├── topic-assignment/
├── topic-evolution/
├── quarter-change/
├── structured-intelligence/
├── company-knowledge/
├── business-signals/
├── commitment-tracking/
├── narrative-consistency/
├── accounting-stability/
├── trust-signals/
├── quarter-understanding/
├── investor-intelligence/
└── partner-domain/
```

---

# Builder Structure

Example:

```text
builders/

└── structured-intelligence/

    ├── builder.ts
    ├── contract.ts
    ├── prompt.ts
    ├── validator.ts
    ├── evaluation.ts
    └── tests/
```

---

# Rule

Each builder owns:

```text
Generation

Validation

Evaluation Hooks
```

---

# prompts/

Purpose:

Prompt source of truth.

```text
prompts/

├── themes/
├── structured-intelligence/
├── quarter-understanding/
└── investor-intelligence/
```

---

# Rule

Prompts are:

```text
Versioned Assets
```

---

# Runtime never reads prompts directly.

All prompt resolution occurs through:

```text
Prompt Registry
```

---

# contracts/

Purpose:

Shared domain contracts.

```text
contracts/

├── artifacts/
├── registries/
├── governance/
├── evaluation/
├── events/
└── apis/
```

---

# Example

```text
contracts/artifacts/

themes.ts
structured-intelligence.ts
quarter-understanding.ts
investor-intelligence.ts
```

---

# Rule

Contracts contain:

```text
Types

Interfaces

Schemas
```

Only.

---

# No Business Logic

Allowed.

---

# infrastructure/

Purpose:

Deployment assets.

```text
infrastructure/

├── docker/
├── kubernetes/
├── terraform/
├── monitoring/
└── security/
```

---

# scripts/

Purpose:

Operational utilities.

```text
scripts/

├── backfill/
├── replay/
├── migration/
└── maintenance/
```

---

# tests/

Purpose:

Cross-platform validation.

```text
tests/

├── integration/
├── replay/
├── regression/
├── evaluation/
└── performance/
```

---

# docs/

Purpose:

Architecture source of truth.

```text
docs/

├── architecture/
├── contracts/
├── governance/
├── prompts/
└── operations/
```

---

# Dependency Rules

Allowed:

```text
apps
    ↓

services
    ↓

packages
    ↓

contracts
```

---

# Forbidden

```text
packages
    ↓

services
```

---

# Forbidden

```text
builders
    ↓

services
```

---

# Forbidden

Circular dependencies.

---

# Ownership Rules

Builders own:

```text
Intelligence generation
```

---

# Services own:

```text
Execution
```

---

# Packages own:

```text
Reusable platform logic
```

---

# Contracts own:

```text
Schemas

Types

Interfaces
```

---

# Prompts own:

```text
LLM instructions
```

---

# Architectural Invariants

LOCKED.

1. Repository mirrors architecture.
2. Builders are isolated from services.
3. Prompts are separate from runtime code.
4. Contracts contain schemas only.
5. Services contain orchestration, not intelligence.
6. Packages contain reusable platform capabilities.
7. Circular dependencies are forbidden.
8. Builders are independently deployable.
9. Prompt Registry is the only prompt resolution mechanism.
10. Monorepo structure must remain aligned with architecture specifications.

End of Specification.