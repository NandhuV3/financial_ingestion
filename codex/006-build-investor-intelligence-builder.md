# 006-build-investor-intelligence-builder.md

Version: 1.0

Status: IMPLEMENTATION TASK

Purpose:

Implement the Investor Intelligence Builder defined by:

* 031-investor-intelligence-q3-trust-spec.md
* 032-investor-intelligence-q1-spec.md
* 033-investor-intelligence-q2-spec.md
* 034-investor-intelligence-q4-spec.md
* 035-investor-intelligence-q5-spec.md
* 037-investor-intelligence-builder-spec.md
* 038-investor-intelligence-artifact-spec.md

Investor Intelligence is the primary business artifact of the platform.

It synthesizes business understanding into investor understanding.

---

# Prerequisites

Read:

* 000-implementation-rules.md
* 002-codex-operating-manual.md
* 031-038 Investor Intelligence Specifications
* 044-048 Investor Intelligence Prompt Contracts
* 055-investor-intelligence-builder-spec.md
* 005-build-quarter-understanding-builder.md

---

# Objective

Generate an Investor Intelligence Artifact.

Input:

```text
Quarter Understanding Artifact
```

MVP Version:

```text
Quarter Understanding Only
```

Future Version:

```text
Quarter Understanding
+
Company Knowledge
+
Business Signals
+
Trust Signals
+
Valuation Inputs
```

---

# Architectural Responsibility

Investor Intelligence owns:

```text
Q1 Business Understanding

Q2 Revenue Understanding

Q3 Trust Understanding

Q4 Valuation Understanding

Q5 Ownership Thesis
```

---

# Investor Intelligence Does NOT Own

```text
Theme Extraction

Business Description

Signal Generation

Trust Signal Production

Company Knowledge

Presentation Formatting
```

LOCKED.

---

# Core Questions

Investor Intelligence must answer:

```text
Q1
What does this company actually sell?

Q2
Where does the next rupee come from?

Q3
Can the story be trusted?

Q4
Is the story already too expensive?

Q5
Why would I hold it and what would change that?
```

LOCKED.

---

# Inputs

```typescript
type InvestorIntelligenceInput = {
  companyId: string;

  periodId: string;

  quarterUnderstandingArtifactId: string;
};
```

---

# Required Dependencies

Consume:

```text
Quarter Understanding Artifact
```

through Artifact Framework.

---

# Output

Produce:

```text
Investor Intelligence Artifact
```

defined in:

```text
038-investor-intelligence-artifact-spec.md
```

---

# Builder Location

Create:

```text
builders/investor-intelligence/
```

---

# Folder Structure

```text
builders/investor-intelligence/

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
investor-intelligence
```

Register through Builder Registry.

---

# Prompt Resolution

Prompts must be resolved through:

```text
Prompt Registry
```

Never hardcode prompts.

Never load prompt files directly.

LOCKED.

---

# MVP Generation Strategy

Generate:

```text
Q1

Q2

Q3

Q4

Q5
```

in a single builder execution.

Do NOT create five separate builders.

Investor Intelligence is a single artifact.

LOCKED.

---

# Q1 Requirements

Must answer:

```text
What does this company actually sell?
```

Must be grounded in:

```text
Quarter Understanding
```

Must avoid:

```text
Generic industry descriptions
```

---

# Q2 Requirements

Must answer:

```text
Where does the next rupee come from?
```

Must identify:

```text
Revenue Drivers

Growth Drivers

Business Expansion Drivers
```

Must be evidence-based.

---

# Q3 Requirements

MVP Version:

```text
Quarter Understanding Based
```

Future Version:

```text
Trust Architecture Based
```

Must answer:

```text
Can the story be trusted?
```

Must not generate:

```text
High Trust

Low Trust
```

without supporting evidence.

---

# Q4 Requirements

MVP Version:

```text
insufficient_data
```

allowed.

Future valuation system not yet implemented.

Must support:

```typescript
status:
  "answered"
  |
  "insufficient_data"
```

---

# Q5 Requirements

Must answer:

```text
Why would I hold it?

What would change that?
```

Must include:

```text
Ownership Thesis

Change Conditions

Signals To Watch
```

---

# Recommendation Boundary

Investor Intelligence may:

```text
Explain

Interpret

Assess
```

Investor Intelligence may not:

```text
Buy

Sell

Price Target

Expected Return

Investment Advice
```

LOCKED.

---

# Forbidden Language Detection

Implement:

```typescript
detectRecommendationLanguage()
```

Examples:

```text
Buy

Sell

Strong Upside

Price Target

Expected Return

Investors Should
```

Validation failure.

LOCKED.

---

# Validation Rules

Implement:

```typescript
validateQ1()

validateQ2()

validateQ3()

validateQ4()

validateQ5()

validateArtifact()
```

---

# Required Validation

All Q sections present.

All required fields populated.

No forbidden language.

No missing evidence references.

---

# Artifact Creation

Builder returns:

```typescript
BuilderResult<
  InvestorIntelligenceArtifact
>
```

Framework creates artifact.

Builder does not persist.

LOCKED.

---

# Lineage Requirements

Must include:

```text
Quarter Understanding Artifact
```

---

Example

```typescript
lineage: {
  parent_artifacts: [
    {
      artifact_type:
      "quarter-understanding"
    }
  ]
}
```

---

# Metadata Requirements

```typescript
{
  builder_type:
    "investor-intelligence",

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

  q1Confidence,

  q2Confidence,

  q3Confidence,

  q4Confidence,

  q5Confidence
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
executionTimeMs

qCount

averageConfidence

insufficientDataCount
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

Valid Quarter Understanding

```text
Quarter Understanding
 ↓
Investor Intelligence
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

Missing Q Section

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
builders/investor-intelligence/builder.ts

builders/investor-intelligence/contract.ts

builders/investor-intelligence/prompt.ts

builders/investor-intelligence/validator.ts

builders/investor-intelligence/evaluation.ts

builders/investor-intelligence/types.ts
```

---

# Files To Modify

```text
Builder Registry
```

Register:

```text
investor-intelligence
```

builder.

---

# Success Criteria

MVP workflow executes:

```text
Filing
      ↓

Themes
      ↓

Structured Intelligence
      ↓

Quarter Understanding
      ↓

Investor Intelligence
      ↓

Artifact Stored
```

Investor Intelligence artifact contains:

```text
Q1

Q2

Q3

Q4

Q5
```

and passes validation.

---

# Out Of Scope

Do NOT implement:

```text
Company Knowledge

Business Signals

Trust Signals

Concept Registry

Governance

Evaluation Framework

Partner Domain
```

These are future phases.

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

* Investor Intelligence Specifications
* Investor Intelligence Prompt Contracts
* Builder Framework
* Artifact Framework
* Codex Operating Manual

LOCKED.
