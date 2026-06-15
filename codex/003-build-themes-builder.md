# 003-build-themes-builder.md

Version: 1.0

Status: IMPLEMENTATION TASK

Purpose:

Implement the Themes Builder defined by:

* 018-themes-spec.md
* 041-themes-prompt-contract.md
* 050-themes-builder-spec.md

This is the first intelligence-producing builder in the platform.

The Themes Builder converts filing content into structured Themes artifacts.

---

# Prerequisites

Read:

* 000-implementation-rules.md
* 002-codex-operating-manual.md
* 018-themes-spec.md
* 041-themes-prompt-contract.md
* 050-themes-builder-spec.md
* 012-artifact-framework-spec.md
* 002-build-builder-framework.md

---

# Objective

Generate a Themes Artifact from a filing.

Input:

```text
Filing Content
```

Output:

```text
Themes Artifact
```

Themes Builder does not:

```text
Assign Topics

Generate Signals

Interpret Business Meaning

Generate Investor Intelligence
```

LOCKED.

---

# Architectural Responsibility

Themes owns:

```text
Theme Extraction
```

Themes does NOT own:

```text
Topic Assignment
Topic Evolution
Quarter Change
Structured Intelligence
Company Knowledge
Quarter Understanding
Investor Intelligence
```

LOCKED.

---

# Inputs

Required Input:

```typescript
type ThemesInput = {
  companyId: string;

  periodId: string;

  filingType: string;

  filingContent: string;
};
```

---

# Output Artifact

Must conform to:

```text
Themes Artifact Contract
```

Defined in:

```text
018-themes-spec.md
```

---

# Builder Location

Create:

```text
builders/themes/
```

---

# Folder Structure

```text
builders/themes/

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

Register through:

```typescript
BuilderRegistry
```

Builder Type:

```text
themes
```

---

# Prompt Resolution

Prompt must be loaded from:

```text
Prompt Registry
```

Do not load prompts directly from files.

Do not hardcode prompts.

LOCKED.

---

# LLM Invocation

Use:

```text
callLLM()
```

through platform abstraction.

Do not call provider SDKs directly.

LOCKED.

---

# Expected LLM Output

Must return:

```typescript
type ThemeCandidate = {
  theme_id: string;

  title: string;

  description: string;

  evidence: string[];

  confidence: number;
};
```

---

# Validation Rules

Implement:

```typescript
validateTheme()

validateThemesOutput()
```

---

# Required Checks

Theme Title:

```text
Non-empty
```

---

Description:

```text
Non-empty
```

---

Evidence:

```text
At least one citation
```

---

Confidence:

```text
0.0 - 1.0
```

---

# Artifact Creation

Builder returns:

```typescript
BuilderResult<ThemesArtifact>
```

Framework creates artifact.

Builder must not persist directly.

LOCKED.

---

# Lineage Requirements

Artifact lineage must include:

```text
Source Filing
```

---

Example

```typescript
lineage: {
  parent_artifacts: [
    {
      artifact_type: "filing",
      artifact_id: "..."
    }
  ]
}
```

---

# Metadata Requirements

Metadata must contain:

```typescript
{
  builder_type: "themes",

  prompt_version: "...",

  artifact_version: 1
}
```

---

# Error Handling

Use:

```typescript
BuilderValidationError

BuilderExecutionError
```

No generic errors.

---

# Evaluation Hooks

Even though evaluation is implemented later:

Emit:

```typescript
{
  promptVersion,

  model,

  confidenceDistribution,

  themeCount
}
```

for future evaluation.

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
themeCount

averageConfidence

executionTimeMs
```

---

# Unit Tests

Create tests for:

---

# Test 1

Valid Filing

```text
Input Filing
      ↓
Themes Generated
```

Pass.

---

# Test 2

Empty Filing

Must fail validation.

---

# Test 3

Malformed LLM Response

Must fail validation.

---

# Test 4

Artifact Generation

Verify:

```text
Artifact Created

Lineage Present

Metadata Present
```

---

# Test 5

Prompt Version Tracking

Verify:

```text
Prompt Version Stored
```

---

# Files To Create

```text
builders/themes/builder.ts

builders/themes/contract.ts

builders/themes/prompt.ts

builders/themes/validator.ts

builders/themes/types.ts

builders/themes/evaluation.ts
```

---

# Files To Modify

```text
Builder Registry
```

Register:

```text
themes
```

builder.

---

# Success Criteria

Workflow executes:

```text
Filing
      ↓

Themes Builder
      ↓

Themes Artifact
      ↓

Artifact Stored
```

---

# Out Of Scope

Do NOT implement:

```text
Topic Assignment

Topic Evolution

Quarter Change

Structured Intelligence

Company Knowledge

Business Signals

Quarter Understanding

Investor Intelligence
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

* Themes Specification
* Themes Prompt Contract
* Builder Framework
* Artifact Framework
* Codex Operating Manual

LOCKED.
