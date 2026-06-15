# 040-prompt-governance-spec.md

Version: 1.0
Status: LOCKED
Owner: Prompt Registry

---

# Purpose

Prompt Governance defines how prompts are:

- created
- versioned
- evaluated
- activated
- deprecated
- rolled back
- audited

across the platform.

Prompts are production assets.

They are governed artifacts.

They are not configuration files.

---

# Architectural Position

```text
Prompt Registry
        ↓

Prompt Governance
        ↓

Prompt Contracts
        ↓

Prompt Versions
        ↓

Artifact Generation
```

---

# Why This Exists

Without governance:

```text
Prompt drift

Undocumented changes

Unexplained output shifts

No rollback

No auditability
```

With governance:

```text
Controlled evolution

Safe activation

Full lineage

Replayability

Evaluation-driven deployment
```

---

# Core Principle

A prompt is:

```text
Production Code
```

Therefore:

```text
Every prompt change
must be governed.
```

---

# Ownership

Prompt Governance owns:

- prompt lifecycle
- prompt activation
- prompt evaluation
- prompt rollback
- prompt lineage
- prompt auditability

Prompt Governance does NOT own:

- artifact schemas
- business logic
- dependency rules
- storage

---

# Prompt Identity

Every prompt has:

```typescript
type PromptIdentity = {
  prompt_id: string;

  prompt_name: string;

  layer: string;

  domain: string;
};
```

---

# Example

```typescript
{
  prompt_id:
    "ii_q3_trust",

  prompt_name:
    "Investor Intelligence Q3",

  layer:
    "investor_intelligence",

  domain:
    "trust"
}
```

---

# Prompt Registry Integration

All prompts must exist in:

```text
Prompt Registry
```

No filesystem-only prompts.

No hardcoded prompts.

---

# Registry Schema

```typescript
type PromptRegistryEntry = {
  prompt_id: string;

  active_version: string;

  status:
    | "active"
    | "inactive"
    | "deprecated";

  created_at: string;

  updated_at: string;
};
```

---

# Prompt Versioning

Every prompt version is immutable.

---

# Version Schema

```typescript
type PromptVersion = {
  prompt_id: string;

  version: string;

  content: string;

  status:
    | "draft"
    | "candidate"
    | "active"
    | "deprecated";

  created_at: string;

  created_by: string;

  activation_date: string | null;
};
```

---

# Version Naming

Format:

```text
v1
v2
v3
...
```

Never reuse versions.

---

# Immutability Rule

After activation:

```text
Prompt content
cannot be modified.
```

Create new version.

---

# Prompt Lifecycle

```text
Draft
  ↓

Candidate
  ↓

Evaluation
  ↓

Active
  ↓

Deprecated
```

---

# Draft

Used during development.

Not executable in production.

---

# Candidate

Ready for evaluation.

Awaiting governance review.

---

# Active

Approved for production use.

---

# Deprecated

No longer used.

Retained for lineage.

---

# Activation Workflow

```text
Create Candidate
       ↓

Run Evaluation
       ↓

Pass Gates
       ↓

Approve
       ↓

Activate
```

---

# Activation Authority

Activation requires:

```text
Human Approval
```

No automatic activation.

---

# Evaluation Requirement

No prompt may become active without:

```text
Evaluation Pass
```

---

# Evaluation Gates

All prompts must pass:

---

## Gate 1

Schema Compliance

---

## Gate 2

Automated Metrics

---

## Gate 3

Regression Tests

---

## Gate 4

Confidence Calibration

---

## Gate 5

Human Review

---

## Gate 6

Cross-Company Consistency

---

## Gate 7

Longitudinal Consistency

---

# Gate Failure

Any failed gate:

```text
Activation Blocked
```

---

# Evaluation Record

```typescript
type PromptEvaluationRecord = {
  prompt_id: string;

  version: string;

  evaluation_date: string;

  result:
    | "pass"
    | "fail";

  failed_gates: string[];

  notes: string;
};
```

---

# Rollback Architecture

Rollback is mandatory.

---

# Trigger Events

Examples:

```text
Output Quality Regression

Calibration Failure

Production Incident

Governance Violation
```

---

# Rollback Process

```text
Current Active
        ↓

Deactivate

Previous Active
        ↓

Reactivate
```

---

# Rollback Rule

Rollback never modifies history.

Only changes:

```text
active_version
```

---

# Prompt Lineage

Every artifact records:

```typescript
type PromptLineage = {
  prompt_id: string;

  prompt_version: string;
};
```

---

# Why Lineage Matters

Supports:

```text
Replayability

Auditability

Root Cause Analysis
```

---

# Replayability Requirement

Given:

```text
Inputs

Prompt Version

Model Version
```

Platform must reproduce:

```text
Original Artifact
```

---

# Prompt Metadata

Every prompt version stores:

```typescript
type PromptMetadata = {
  author: string;

  created_at: string;

  rationale: string;

  change_summary: string;

  evaluation_version: string;
};
```

---

# Change Summary Requirement

Every version must explain:

```text
What changed

Why it changed
```

---

# Prompt Categories

```typescript
type PromptCategory =
  | "theme_extraction"
  | "structured_intelligence"
  | "quarter_understanding"
  | "investor_intelligence"
  | "partner_domain";
```

---

# Prompt Contracts

Every production prompt must have:

```text
Prompt Contract
```

---

# Contract Purpose

Defines:

```text
Inputs

Outputs

Grounding Rules

Confidence Rules

Forbidden Behaviors

Evaluation Rules
```

---

# Contract Compliance

Prompt output violating contract:

```text
Governance Failure
```

---

# Grounding Requirements

All prompts must:

```text
Ground outputs
in provided inputs.
```

---

# Forbidden

```text
Invent Sources

Invent Facts

Invent Signals

Invent Concepts
```

---

# Confidence Governance

Confidence cannot be:

```text
Self-Assessed
```

---

# Allowed

Confidence derived from:

```text
Evidence

Coverage

Consistency

Historical Support
```

---

# Recommendation Boundary

Applies to:

```text
Q3

Q4

Q5

Partner Domain
```

---

# Forbidden Language

Examples:

```text
Buy

Sell

Outperform

Underperform

Price Target

Expected Return
```

---

# Governance Action

Detection:

```text
Prompt Failure
```

---

# Human Review Requirements

Required for:

```text
Activation

Major Revisions

Rollback Approval
```

---

# Major Revision Definition

Changes to:

```text
Output Structure

Reasoning Strategy

Confidence Model

Grounding Rules
```

---

# Minor Revision Definition

Changes to:

```text
Examples

Formatting

Clarity
```

---

# Audit Requirements

Track:

```text
Prompt Created

Prompt Evaluated

Prompt Activated

Prompt Deprecated

Prompt Rolled Back
```

---

# Audit Schema

```typescript
type PromptAuditEvent = {
  event_id: string;

  prompt_id: string;

  version: string;

  event_type: string;

  timestamp: string;

  actor: string;

  notes: string;
};
```

---

# Dependency Index Integration

Prompt versions participate in:

```text
Hybrid Invalidation
```

---

# Candidate Invalidation

Trigger:

```text
Prompt Version Change
```

---

# Propagation Decision

Based on:

```text
Content Hash Comparison
```

of downstream artifacts.

---

# Prompt Hash

Every prompt version stores:

```typescript
prompt_hash: string;
```

---

# Hash Purpose

Detect:

```text
Prompt Changes

Replay Differences

Audit Events
```

---

# Storage Requirements

Prompts stored in:

```text
Database Registry
```

not source code.

---

# Environment Support

Each environment may have:

```text
Development

Staging

Production
```

active versions.

---

# Environment Isolation

Production activation:

```text
Does Not
Automatically Activate
In Other Environments
```

---

# Scaling Requirements

Target:

```text
10,000+ companies
```

Must support:

- prompt lineage
- prompt replayability
- safe rollout
- rollback
- evaluation gating

---

# Architectural Invariants

LOCKED.

1. Prompts are governed production assets.
2. Prompt versions are immutable.
3. Every prompt requires evaluation before activation.
4. Every prompt requires lineage tracking.
5. Rollback is mandatory.
6. Prompt changes participate in hybrid invalidation.
7. Confidence cannot be self-assessed.
8. Grounding is mandatory.
9. Prompt contracts are required for production prompts.
10. Prompt Registry is the source of truth.

End of Specification.