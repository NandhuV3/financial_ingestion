# 002-build-builder-framework.md

Version: 1.0

Status: IMPLEMENTATION TASK

Purpose:

Implement the Builder Framework defined by:

* 050-056 Builder Specifications
* 012-artifact-framework-spec.md
* 070-repository-structure.md
* 071-database-schema.md

The Builder Framework is the execution layer used by all intelligence builders.

This framework must be completed before implementing:

* Themes
* Structured Intelligence
* Quarter Understanding
* Investor Intelligence
* Company Knowledge
* Business Signals

---

# Prerequisites

Read:

* 000-implementation-rules.md
* 002-codex-operating-manual.md
* 012-artifact-framework-spec.md
* 050-themes-builder-spec.md
* 070-repository-structure.md

---

# Objective

Create a standardized runtime for all builders.

Every builder in the platform must execute through the same lifecycle.

Builders must not implement their own runtime logic.

Builders must not write directly to storage.

Builders must not call other builders.

LOCKED.

---

# Architectural Principle

Builders generate intelligence.

Framework manages execution.

Builders focus on:

```text
Business Logic
```

Framework owns:

```text
Execution

Validation

Artifact Creation

Error Handling

Observability
```

---

# Deliverables

Create:

```text
packages/builder-framework/
```

---

# Package Structure

```text
packages/builder-framework/

src/

builder.ts

builder-context.ts

builder-result.ts

builder-registry.ts

builder-executor.ts

builder-validator.ts

builder-errors.ts

builder-observability.ts

tests/
```

---

# Core Interfaces

Implement:

```typescript
interface Builder<
  TInput,
  TOutput
> {
  builderType(): string;

  validateInput(
    input: TInput
  ): Promise<void>;

  execute(
    context: BuilderContext<TInput>
  ): Promise<BuilderResult<TOutput>>;
}
```

---

# Builder Context

```typescript
type BuilderContext<TInput> = {
  companyId: string;

  periodId: string;

  executionId: string;

  input: TInput;

  dependencies: Record<
    string,
    unknown
  >;
};
```

---

# Builder Result

```typescript
type BuilderResult<TOutput> = {
  content: TOutput;

  confidence?: number;

  metadata?: Record<
    string,
    unknown
  >;
};
```

---

# Builder Registry

Implement:

```typescript
registerBuilder()

getBuilder()

listBuilders()
```

---

# Purpose

Provides runtime lookup.

---

# Example

```typescript
registry.register(
  new ThemesBuilder()
);

registry.register(
  new StructuredIntelligenceBuilder()
);
```

---

# Builder Executor

Implement:

```typescript
executeBuilder()
```

---

# Lifecycle

```text
Load Builder
      ↓

Validate Input
      ↓

Execute Builder
      ↓

Validate Output
      ↓

Create Artifact
      ↓

Persist Artifact
      ↓

Return Artifact
```

---

# Artifact Integration

Builder Framework must integrate with:

```text
packages/artifact-framework
```

Builder output becomes:

```text
Artifact Content
```

Framework creates artifact.

Builder does not.

LOCKED.

---

# Input Validation

Implement:

```typescript
validateBuilderInput()
```

---

# Output Validation

Implement:

```typescript
validateBuilderOutput()
```

---

# Validation Failure

Must:

```text
Fail Fast
```

No invalid artifact may be persisted.

---

# Error Handling

Create:

```typescript
BuilderError

BuilderValidationError

BuilderExecutionError

BuilderDependencyError
```

---

# Rule

All errors must be typed.

No generic Error usage.

---

# Observability

Builder Framework must emit:

```text
Execution Start

Execution Success

Execution Failure

Execution Duration
```

---

# Metrics

Track:

```typescript
builderType

executionTimeMs

success

failureReason
```

---

# Logging

Include:

```typescript
executionId

companyId

periodId

builderType
```

---

# Builder Isolation Rules

Builders may:

```text
Generate Intelligence

Validate Inputs

Return Outputs
```

Builders may not:

```text
Write Storage

Mutate Registries

Trigger Other Builders

Perform Governance
```

Framework enforces isolation.

LOCKED.

---

# Future Compatibility

Framework must support:

```text
LLM Builders

Deterministic Builders

Hybrid Builders
```

---

# Examples

LLM Builder:

```text
Themes

Structured Intelligence

Quarter Understanding
```

---

# Deterministic Builder

```text
Quarter Change

Business Signals

Trust Signals
```

---

# Testing Requirements

Create:

```text
Builder Registry Tests

Builder Executor Tests

Validation Tests

Error Handling Tests

Artifact Integration Tests
```

---

# Example Test

```text
Register Builder
      ↓

Execute Builder
      ↓

Artifact Created
      ↓

Artifact Stored
      ↓

Artifact Retrieved
```

Must pass.

---

# Files To Create

```text
packages/builder-framework/src/builder.ts

packages/builder-framework/src/builder-context.ts

packages/builder-framework/src/builder-result.ts

packages/builder-framework/src/builder-registry.ts

packages/builder-framework/src/builder-executor.ts

packages/builder-framework/src/builder-validator.ts

packages/builder-framework/src/builder-errors.ts

packages/builder-framework/src/builder-observability.ts
```

---

# Files To Modify

```text
packages/artifact-framework
```

Only for framework integration.

No architecture changes.

---

# Success Criteria

The following workflow executes successfully:

```text
Register Builder
      ↓

Execute Builder
      ↓

Validate Input
      ↓

Generate Output
      ↓

Create Artifact
      ↓

Persist Artifact
      ↓

Retrieve Artifact
```

---

# Out Of Scope

Do NOT implement:

```text
Dependency Index

Invalidation

Governance

Evaluation

Prompt Registry

Concept Registry

Orchestrator
```

Those are separate implementation tasks.

---

# Deliverable Format

Return:

1. Design Summary

2. Files Created

3. Files Modified

4. Test Coverage

5. Risks

6. Future Integration Points

Implementation must comply with:

* Artifact Framework
* Builder Contracts
* Repository Structure
* Codex Operating Manual

LOCKED.
