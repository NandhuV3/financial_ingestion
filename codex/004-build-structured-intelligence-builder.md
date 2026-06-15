# 004-build-structured-intelligence-builder.md

Version: 1.0

Status: IMPLEMENTATION TASK

Purpose:

Implement the Structured Intelligence Builder defined by:

* 022-structured-intelligence-spec.md
* 042-structured-intelligence-prompt-contract.md
* 052-structured-intelligence-builder-spec.md

Structured Intelligence is the first business-understanding layer.

It converts filing information and Themes into structured business intelligence.

---

# Prerequisites

Read:

* 000-implementation-rules.md
* 002-codex-operating-manual.md
* 022-structured-intelligence-spec.md
* 042-structured-intelligence-prompt-contract.md
* 052-structured-intelligence-builder-spec.md
* 012-artifact-framework-spec.md
* 002-build-builder-framework.md
* 003-build-themes-builder.md

---

# Objective

Generate a Structured Intelligence Artifact.

Input:

```text
Filing
+
Themes Artifact
```

Output:

```text
Structured Intelligence Artifact
```

---

# Architectural Responsibility

Structured Intelligence owns:

```text
Business Understanding

Business Model Understanding

Revenue Understanding

Customer Understanding

Competitive Understanding

Strategy Understanding

Management Understanding
```

---

# Structured Intelligence Does NOT Own

```text
Topic Assignment

Company Knowledge

Business Signals

Quarter Understanding

Trust Analysis

Investor Intelligence
```

LOCKED.

---

# Inputs

Required:

```typescript
type StructuredIntelligenceInput = {
  companyId: string;

  periodId: string;

  filingContent: string;

  themesArtifactId: string;
};
```

---

# Required Dependencies

```text
Themes Artifact
```

Builder must consume:

```text
Current Themes Artifact
```

through Artifact Framework.

---

# Output

Must produce:

```text
Structured Intelligence Artifact
```

defined in:

```text
022-structured-intelligence-spec.md
```

---

# Builder Location

Create:

```text
builders/structured-intelligence/
```

---

# Folder Structure

```text
builders/structured-intelligence/

builder.ts

contract.ts

prompt.ts

validator.ts

evaluation.ts

types.ts

tests/
```

---

# Builder Registration

Builder Type:

```text
structured-intelligence
```

Register through Builder Registry.

---

# Prompt Resolution

Prompt source:

```text
Prompt Registry
```

Never load prompt files directly.

Never hardcode prompts.

LOCKED.

---

# LLM Invocation

Use platform abstraction:

```typescript
callLLM()
```

Never call provider SDKs directly.

LOCKED.

---

# Required Intelligence Areas

The output must include:

```text
Business Overview

Products & Services

Customers

Revenue Model

Competitive Positioning

Growth Strategy

Management Priorities

Key Risks

Key Opportunities
```

---

# Validation Rules

Implement:

```typescript
validateStructuredIntelligence()

validateCoverage()

validateEvidence()
```

---

# Coverage Validation

Required sections:

```text
Business Overview

Products

Customers

Revenue Model
```

Missing required sections:

```text
Validation Failure
```

---

# Evidence Validation

Every major claim must include:

```text
Evidence Reference
```

Claims without evidence fail validation.

---

# Generic Language Detection

Implement:

```typescript
detectGenericLanguage()
```

Examples:

```text
The company operates in a competitive market.

Management focuses on growth.

The company serves customers globally.
```

These should lower quality score.

---

# Hallucination Prevention

Structured Intelligence may only use:

```text
Filing Content

Themes Artifact
```

No external knowledge.

No internet data.

No analyst assumptions.

LOCKED.

---

# Artifact Creation

Builder returns:

```typescript
BuilderResult<StructuredIntelligenceArtifact>
```

Framework creates artifact.

Builder does not persist.

LOCKED.

---

# Lineage Requirements

Lineage must include:

```text
Filing

Themes Artifact
```

---

Example

```typescript
lineage: {
  parent_artifacts: [
    {
      artifact_type: "filing"
    },
    {
      artifact_type: "themes"
    }
  ]
}
```

---

# Metadata Requirements

Metadata must contain:

```typescript
{
  builder_type: "structured-intelligence",

  prompt_version: "...",

  artifact_version: 1
}
```

---

# Evaluation Hooks

Emit:

```typescript
{
  promptVersion,

  sectionCoverage,

  fieldCoverage,

  evidenceCoverage,

  confidenceDistribution
}
```

Required for future evaluation architecture.

LOCKED.

---

# Observability

Emit:

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
sectionCount

fieldCoverage

evidenceCoverage

executionTimeMs
```

---

# Error Handling

Use:

```typescript
BuilderValidationError

BuilderExecutionError

BuilderDependencyError
```

No generic errors.

---

# Unit Tests

Create:

---

# Test 1

Valid Filing

```text
Filing
 ↓
Themes
 ↓
Structured Intelligence
```

Pass.

---

# Test 2

Missing Themes Artifact

Must fail.

---

# Test 3

Missing Required Sections

Must fail validation.

---

# Test 4

Evidence Validation

Claims without evidence fail.

---

# Test 5

Artifact Creation

Verify:

```text
Artifact Created

Metadata Present

Lineage Present
```

---

# Test 6

Prompt Version Tracking

Verify:

```text
Prompt Version Stored
```

---

# Files To Create

```text
builders/structured-intelligence/builder.ts

builders/structured-intelligence/contract.ts

builders/structured-intelligence/prompt.ts

builders/structured-intelligence/validator.ts

builders/structured-intelligence/evaluation.ts

builders/structured-intelligence/types.ts
```

---

# Files To Modify

```text
Builder Registry
```

Register:

```text
structured-intelligence
```

builder.

---

# Success Criteria

Workflow executes:

```text
Filing
      ↓

Themes
      ↓

Structured Intelligence
      ↓

Artifact Stored
```

---

# Out Of Scope

Do NOT implement:

```text
Company Knowledge

Business Signals

Trust Signals

Quarter Understanding

Investor Intelligence

Governance

Evaluation
```

---

# Deliverable Format

Return:

1. Design Summary

2. Files Created

3. Files Modified

4. Tests Added

5. Risks

6. Future Integration Points

Implementation must comply with:

* Structured Intelligence Specification
* Structured Intelligence Prompt Contract
* Builder Framework
* Artifact Framework
* Codex Operating Manual

LOCKED.
