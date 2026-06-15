# 005-build-quarter-understanding-builder.md

Version: 1.0

Status: IMPLEMENTATION TASK

Purpose:

Implement the Quarter Understanding Builder defined by:

* 030-quarter-understanding-trust-extension-spec.md
* 043-quarter-understanding-prompt-contract.md
* 054-quarter-understanding-builder-spec.md

Quarter Understanding is the first interpretation layer.

It converts business observations into business understanding.

---

# Prerequisites

Read:

* 000-implementation-rules.md
* 002-codex-operating-manual.md
* 030-quarter-understanding-trust-extension-spec.md
* 043-quarter-understanding-prompt-contract.md
* 054-quarter-understanding-builder-spec.md
* 022-structured-intelligence-spec.md
* 004-build-structured-intelligence-builder.md

---

# Objective

Generate a Quarter Understanding Artifact.

Input:

```text
Structured Intelligence
```

MVP Version:

```text
Structured Intelligence Only
```

Future Versions:

```text
Structured Intelligence
+
Business Signals
+
Trust Signals
+
Company Knowledge
```

---

# Architectural Responsibility

Quarter Understanding owns:

```text
Interpretation

Significance Assessment

Business Context

Business Direction

Quarter Narrative
```

---

# Quarter Understanding Does NOT Own

```text
Theme Extraction

Business Description

Knowledge Storage

Signal Generation

Trust Judgement

Investor Intelligence
```

LOCKED.

---

# Core Question

Quarter Understanding answers:

```text
What happened?

Why does it matter?

How important is it?
```

It does NOT answer:

```text
Should I invest?

Should I buy?

Should I sell?
```

LOCKED.

---

# Inputs

```typescript
type QuarterUnderstandingInput = {
  companyId: string;

  periodId: string;

  structuredIntelligenceArtifactId: string;
};
```

---

# Required Dependencies

Consume:

```text
Structured Intelligence Artifact
```

through Artifact Framework.

---

# Output

Produce:

```text
Quarter Understanding Artifact
```

defined in:

```text
030-quarter-understanding-trust-extension-spec.md
```

---

# Builder Location

Create:

```text
builders/quarter-understanding/
```

---

# Folder Structure

```text
builders/quarter-understanding/

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
quarter-understanding
```

Register in Builder Registry.

---

# Prompt Resolution

Prompt must be resolved through:

```text
Prompt Registry
```

Never load prompt files directly.

Never hardcode prompts.

LOCKED.

---

# LLM Invocation

Use:

```typescript
callLLM()
```

through platform abstraction.

---

# Understanding Entry

Expected output structure:

```typescript
type UnderstandingEntry = {
  understanding_id: string;

  title: string;

  summary: string;

  significance: "low" | "medium" | "high";

  confidence: number;

  evidence: string[];

  concept_ids?: string[];
};
```

---

# Interpretation Rules

The builder may:

```text
Interpret

Connect Ideas

Explain Importance

Describe Direction
```

The builder may not:

```text
Predict Stock Returns

Recommend Actions

Create Price Targets

Provide Investment Advice
```

LOCKED.

---

# Significance Assessment

Every understanding must include:

```text
low

medium

high
```

importance.

---

# Validation Rules

Implement:

```typescript
validateUnderstanding()

validateSignificance()

validateEvidence()
```

---

# Required Validation

Title:

```text
Required
```

---

Summary:

```text
Required
```

---

Evidence:

```text
At least one evidence reference
```

---

Significance:

```text
Must be valid enum
```

---

Confidence:

```text
0.0 - 1.0
```

---

# Internal Consistency Check

Implement:

```typescript
validateInternalConsistency()
```

Purpose:

Detect contradictory interpretations.

Example:

```text
Revenue accelerating

Revenue weakening
```

inside same artifact.

Must fail.

---

# Recommendation Language Detection

Implement:

```typescript
detectRecommendationLanguage()
```

Forbidden examples:

```text
Buy

Sell

Strong upside

Price target

Expected return

Investors should
```

Validation failure if present.

LOCKED.

---

# Artifact Creation

Builder returns:

```typescript
BuilderResult<
  QuarterUnderstandingArtifact
>
```

Framework creates artifact.

Builder does not persist.

LOCKED.

---

# Lineage Requirements

Must include:

```text
Structured Intelligence
```

---

Example

```typescript
lineage: {
  parent_artifacts: [
    {
      artifact_type:
      "structured-intelligence"
    }
  ]
}
```

---

# Metadata Requirements

```typescript
{
  builder_type:
    "quarter-understanding",

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

  understandingCount,

  significanceDistribution,

  confidenceDistribution
}
```

Required for future evaluation.

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
understandingCount

averageConfidence

highSignificanceCount

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

Valid Structured Intelligence

```text
Structured Intelligence
 ↓
Quarter Understanding
```

Pass.

---

# Test 2

Missing Dependency

Must fail.

---

# Test 3

Recommendation Language

Must fail validation.

---

# Test 4

Contradictory Understandings

Must fail validation.

---

# Test 5

Artifact Creation

Verify:

```text
Metadata Present

Lineage Present

Artifact Created
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
builders/quarter-understanding/builder.ts

builders/quarter-understanding/contract.ts

builders/quarter-understanding/prompt.ts

builders/quarter-understanding/validator.ts

builders/quarter-understanding/evaluation.ts

builders/quarter-understanding/types.ts
```

---

# Files To Modify

```text
Builder Registry
```

Register:

```text
quarter-understanding
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

Quarter Understanding
      ↓

Artifact Stored
```

---

# Out Of Scope

Do NOT implement:

```text
Business Signals

Trust Signals

Company Knowledge

Concept Registry

Investor Intelligence
```

These are separate tasks.

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

* Quarter Understanding Specification
* Quarter Understanding Prompt Contract
* Builder Framework
* Artifact Framework
* Codex Operating Manual

LOCKED.
