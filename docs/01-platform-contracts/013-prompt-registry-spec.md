# 013-prompt-registry-spec.md

# Prompt Registry Specification

Version: 1.0
Status: LOCKED
Owner: Architecture

---

# Purpose

The Prompt Registry is the governance system for all
LLM prompts used throughout the platform.

Prompts are production assets.

Prompts are not strings in source code.

Prompts are not configuration files.

Prompts are versioned, auditable, reviewable,
deployable platform artifacts.

---

# Architectural Principle

Prompt changes are equivalent to code changes.

Every prompt change must be:

- versioned
- reviewed
- evaluated
- activated
- auditable
- reversible

No prompt may be modified directly in production.

---

# Registry Responsibilities

The Prompt Registry owns:

1. Prompt storage
2. Prompt versioning
3. Prompt activation
4. Prompt rollback
5. Prompt lineage
6. Prompt evaluation
7. Prompt governance
8. Prompt deployment history

The Prompt Registry does NOT own:

- LLM execution
- Artifact generation
- Model selection

---

# Registry Architecture

```text
Prompt Author
      ↓
Draft Prompt
      ↓
Evaluation
      ↓
Governance Review
      ↓
Activation
      ↓
Production Registry
      ↓
Artifact Generation
```

---

# Core Design Principle

Artifacts reference prompts.

Prompts never reference artifacts.

Artifacts store prompt lineage.

Prompt Registry stores deployment history.

---

# Prompt Identity

Every prompt receives a permanent identity.

```typescript
type PromptIdentity = {
  prompt_id: string;
  layer: PromptLayer;
};
```

---

# Prompt Layers

```typescript
type PromptLayer =
  | "themes"
  | "structured_intelligence"
  | "quarter_understanding"
  | "investor_intelligence_q1"
  | "investor_intelligence_q2"
  | "investor_intelligence_q3"
  | "investor_intelligence_q4"
  | "investor_intelligence_q5";
```

Each layer owns exactly one active prompt.

Multiple historical versions may exist.

---

# Prompt Entry

```typescript
type PromptRegistryEntry = {
  identity: PromptIdentity;

  version: string;

  status: PromptStatus;

  prompt_text: string;

  metadata: PromptMetadata;

  governance: PromptGovernance;

  evaluation: PromptEvaluation;

  lineage: PromptLineage;
};
```

---

# Prompt Status

```typescript
type PromptStatus =
  | "draft"
  | "evaluation"
  | "approved"
  | "active"
  | "deprecated"
  | "rolled_back";
```

Only one prompt version may be ACTIVE per layer.

---

# Prompt Metadata

```typescript
type PromptMetadata = {
  created_at: string;

  created_by: string;

  modified_at: string;

  modified_by: string;

  purpose: string;

  prompt_hash: string;

  registry_version: number;
};
```

---

# Prompt Hash

Generated from:

```typescript
SHA256(prompt_text)
```

Purpose:

- change detection
- auditability
- activation tracking

---

# Prompt Governance

```typescript
type PromptGovernance = {
  review_required: boolean;

  approved_by: string | null;

  approved_at: string | null;

  rejection_reason: string | null;

  governance_flags: string[];
};
```

---

# Prompt Lineage

Tracks prompt evolution.

```typescript
type PromptLineage = {
  parent_version: string | null;

  derived_from: string | null;

  activation_history: ActivationEvent[];

  rollback_history: RollbackEvent[];
};
```

---

# Activation Event

```typescript
type ActivationEvent = {
  activation_id: string;

  activated_at: string;

  activated_by: string;

  previous_active_version: string | null;

  reason: string;
};
```

---

# Rollback Event

```typescript
type RollbackEvent = {
  rollback_id: string;

  rolled_back_at: string;

  rolled_back_by: string;

  source_version: string;

  restored_version: string;

  reason: string;
};
```

---

# Prompt Storage Structure

```text
/prompts/
   themes/
      active.json
      archive/
         v1.json
         v2.json

   structured_intelligence/
      active.json
      archive/

   quarter_understanding/
      active.json
      archive/

   investor_intelligence/
      q1/
      q2/
      q3/
      q4/
      q5/
```

---

# Versioning Strategy

Semantic versioning.

```text
major.minor.patch
```

Examples:

```text
1.0.0
1.1.0
1.2.0
2.0.0
```

---

# Version Increment Rules

Major:

```text
Prompt structure changes
Output schema changes
Behavior changes
```

Minor:

```text
Prompt improvements
Instruction additions
Context improvements
```

Patch:

```text
Grammar fixes
Typos
Formatting updates
```

---

# Draft Workflow

```text
Create Draft
     ↓
Store in Registry
     ↓
Assign Version
     ↓
Submit Evaluation
```

Draft prompts cannot generate production artifacts.

---

# Evaluation Workflow

Every prompt version must pass evaluation.

Evaluation runs against:

```text
Ground Truth Corpus
Regression Suite
Holdout Set
```

No prompt bypasses evaluation.

---

# Evaluation Architecture

Prompt evaluation uses:

1. Structural Validation
2. Regression Testing
3. Human Review
4. Confidence Calibration
5. Governance Checks

---

# Activation Gates

Gate 1

Schema Compliance

```text
PASS REQUIRED
```

---

Gate 2

Regression Testing

```text
No metric regression > 5%
```

---

Gate 3

Confidence Calibration

```text
ECE <= 0.10
```

---

Gate 4

Human Review

```text
Minimum acceptance threshold met
```

---

Gate 5

Governance Review

```text
Approval required
```

---

Gate 6

Activation

```text
Prompt becomes ACTIVE
```

---

# Activation Constraints

Only one active prompt per layer.

Example:

```text
Structured Intelligence

v1.4.0 ACTIVE

v1.3.0 ARCHIVED

v1.2.0 ARCHIVED
```

No dual-active state allowed.

---

# Prompt Deployment History

Prompt Registry records:

```typescript
type PromptDeploymentHistory = {
  activation_id: string;

  prompt_id: string;

  prompt_version: string;

  activated_at: string;

  deactivated_at: string | null;

  deployment_duration_days: number | null;
};
```

Purpose:

Understand prompt effectiveness over time.

---

# Prompt Rollback

Rollback is first-class.

Rollback restores prior prompt version.

Rollback creates a new activation event.

History remains immutable.

Example:

```text
v1.3 active

v1.4 activated

issues found

rollback

v1.3 active again
```

Registry records both events.

---

# Artifact Lineage Integration

Every LLM-generated artifact must record:

```typescript
prompt_id

prompt_version

activation_id
```

Example:

```typescript
lineage: {
  prompt_reference: {
    prompt_id: "quarter_understanding",

    prompt_version: "1.7.0",

    activation_id: "act_90871"
  }
}
```

---

# Why This Matters

The platform must answer:

```text
Why did this artifact change?
```

Possible answers:

- filing changed
- prompt changed
- model changed

Prompt lineage enables this.

---

# Prompt Activation Impact

Activating a new prompt version creates an invalidation event.

Example:

```text
Structured Intelligence v1.5
       ↓
Structured Intelligence v1.6
```

Impact:

```text
All Structured Intelligence artifacts become candidate stale
```

Hybrid invalidation determines actual propagation.

---

# Prompt Registry and Invalidation

Prompt activation does NOT automatically regenerate everything.

Process:

```text
Prompt Activated
        ↓
Candidate Stale
        ↓
Content Hash Check
        ↓
Propagation Decision
```

This is required for scalability.

---

# Prompt Evaluation Records

Stored separately from prompt.

```typescript
type PromptEvaluation = {
  evaluation_id: string;

  evaluation_version: string;

  completed_at: string;

  evaluator: string;

  structural_score: number;

  regression_score: number;

  calibration_score: number;

  human_review_score: number;

  passed: boolean;
};
```

---

# Auditability Requirements

For every prompt version the platform must answer:

1. Who created it?
2. Why was it created?
3. What changed?
4. Who approved it?
5. When was it activated?
6. What artifacts were generated from it?
7. Was it rolled back?
8. Why was it rolled back?

Failure to answer any of these is a governance defect.

---

# Prompt Registry API Contract

Required operations:

```typescript
createPrompt()

submitForEvaluation()

approvePrompt()

activatePrompt()

rollbackPrompt()

getActivePrompt()

getPromptHistory()

getActivationHistory()
```

Implementation details are not defined here.

Only contracts.

---

# Scaling Requirements

Target:

```text
10,000+ companies
millions of artifacts
multiple prompt activations
```

Registry must support:

- activation history
- prompt lineage
- audit queries
- rollback queries

without scanning artifacts.

---

# Security Requirements

Prompts are governed assets.

Requirements:

- immutable archive
- audit trail
- role-based approval
- activation logging
- rollback logging

No direct production edits.

---

# Future Compatibility

Must support:

- Prompt A/B testing
- Model-specific prompts
- Multi-language prompts
- Layer-specific variants
- Evaluation automation improvements

without schema redesign.

---

# Architectural Invariants

The following are LOCKED:

1. Prompts are production assets.
2. Prompts are versioned.
3. Prompts are governed.
4. Prompts require evaluation.
5. Prompts require activation.
6. One active prompt per layer.
7. Rollback is first-class.
8. Artifacts record prompt lineage.
9. Prompt activation triggers invalidation.
10. Prompt changes are equivalent to code changes.

End of Specification.