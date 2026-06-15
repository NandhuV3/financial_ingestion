# 009-company-knowledge-governance.md

# Purpose

Company Knowledge is the canonical understanding of a business.

It represents:

- Durable facts
- Stable business understanding
- Long-term business characteristics

It is NOT a copy of Structured Intelligence.

Structured Intelligence is filing-level.

Company Knowledge is company-level.

LOCKED.

---

# Core Principle

Company Knowledge must evolve slowly.

New filings do not automatically overwrite Company Knowledge.

Every update must pass through governance.

Promotion is a decision process.

Not a write operation.

LOCKED.

---

# Governance Objectives

Company Knowledge Governance exists to:

- Prevent accidental overwrites
- Preserve durable understanding
- Ensure auditability
- Control knowledge evolution
- Support rollback
- Enable human review

LOCKED.

---

# Ownership

Company Knowledge Governance owns:

- Promotion Rules
- Promotion Decisions
- Review Triggers
- Audit Trail
- Rollback Decisions

Company Knowledge Governance does NOT own:

- Structured Intelligence Generation
- Business Signal Generation
- Investor Intelligence

LOCKED.

---

# Promotion Lifecycle

```text
Structured Intelligence
          ↓
Promotion Evaluation
          ↓
Decision Engine
          ↓
 ┌───────────────┬───────────────┬───────────────┬───────────────┐
 │ Promote       │ Merge         │ Retain Prior  │ Review Queue  │
 └───────────────┴───────────────┴───────────────┴───────────────┘
          ↓
Company Knowledge Update
          ↓
Audit Log Entry
```

LOCKED.

---

# Promotion Outcomes

Every candidate update produces one outcome.

---

## Promote

Candidate replaces current value.

Used when:

- Confidence is sufficiently higher
- Evidence accumulated
- Threshold met

---

## Merge

Candidate augments existing value.

Used when:

- New information is additive
- Existing information remains valid

Example:

Existing Revenue Driver:

```text
Cloud Services
```

New Revenue Driver:

```text
Cloud Services
AI Platform
```

Result:

```text
Cloud Services
AI Platform
```

---

## Retain Prior

Current value remains unchanged.

Used when:

- Threshold not met
- Candidate confidence too low
- Evidence insufficient

---

## Flag Review

Human review required.

Used when:

- Significant change detected
- Stable field changes
- Contradictory evidence appears

LOCKED.

---

# Promotion Decision Schema

```typescript
type PromotionDecision = {
  field: string;

  outcome:
    | "promote"
    | "merge"
    | "retain_prior"
    | "flag_review";

  reason: PromotionReason;

  prior_value_hash: string;

  candidate_value_hash: string;

  confidence_delta: number;

  reviewer_required: boolean;
}
```

---

# Promotion Reasons

```typescript
type PromotionReason =
  | "first_population"
  | "confidence_improvement"
  | "evidence_accumulation"
  | "significant_change_detected"
  | "threshold_not_met"
  | "change_exceeds_stability_limit"
  | "manual_approval";
```

LOCKED.

---

# Knowledge Stability Classes

Every Company Knowledge field belongs to a stability class.

This drives promotion behavior.

LOCKED.

---

# Stable Fields

Rarely change.

Require strongest governance.

Examples:

```text
Business Model

Revenue Structure

Products

Core Value Creation
```

---

## Promotion Rules

Promote only when:

- Confidence improvement ≥ 0.15

OR

- Consistent across 3+ filings

OR

- Supported by major business event

Otherwise:

```text
Review Required
```

LOCKED.

---

# Semi-Stable Fields

Change occasionally.

Examples:

```text
Revenue Drivers

Customers

Competitive Positioning

Distribution Strategy
```

---

## Promotion Rules

Promote when:

- Confidence improvement ≥ 0.10

OR

- Consistent across 2 filings

Review when:

- Significant semantic change detected

LOCKED.

---

# Dynamic Fields

Expected to change frequently.

Examples:

```text
Strategic Priorities

Management Focus

Operational Initiatives

Key Dependencies
```

---

## Promotion Rules

Promote when:

```text
Confidence ≥ 0.60
```

Review only when:

- Large unexpected shift detected

LOCKED.

---

# Confidence Thresholds

## Minimum Promotion Threshold

```text
0.60
```

Below:

```text
Retain Prior
```

Always.

LOCKED.

---

## Automatic Promotion Threshold

```text
0.80
```

Above:

Automatic promotion allowed.

Provided semantic change is small.

LOCKED.

---

## Human Review Threshold

Review required when:

```text
0.60 ≤ Confidence < 0.80

AND

Significant Change Detected
```

LOCKED.

---

# Semantic Change Detection

Promotion decisions must be deterministic.

No LLM involvement.

LOCKED.

---

# String Fields

Compare using:

```text
Normalized Edit Distance
```

---

# Array Fields

Compare using:

```text
Jaccard Similarity
```

---

# Structured Fields

Compare using:

```text
Field-by-Field Similarity
```

---

# Similarity Thresholds

```text
> 0.85
Minor Change

0.75 – 0.85
Moderate Change

< 0.75
Significant Change
```

LOCKED.

---

# Human Review Triggers

Any trigger below creates a review queue entry.

---

## Stable Field Change

```text
Any change to stable field
```

Review required.

---

## Multi Field Change

```text
3+ fields changed simultaneously
```

Review required.

---

## Confidence Gap

Incoming confidence lower than current confidence.

Review required.

---

## Business Model Change

Revenue model changes.

Example:

```text
Subscription
        ↓
Marketplace
```

Review required.

---

## First Population Low Confidence

First population confidence < 0.75

Review required.

---

## Restatement Context

Accounting restatement detected.

Review required.

---

## CEO/CFO Change Context

Management turnover detected.

Review required.

---

## Contradicts Prior Three Filings

Candidate conflicts with prior history.

Review required.

LOCKED.

---

# Review Queue Schema

```typescript
type ReviewQueueEntry = {
  review_id: string;

  company: string;

  field: string;

  trigger: ReviewTrigger;

  current_value: unknown;

  candidate_value: unknown;

  confidence_score: number;

  structured_intelligence_version: number;

  filing_id: string;

  created_at: string;

  status:
    | "pending"
    | "approved"
    | "rejected";
}
```

LOCKED.

---

# Audit Trail

Every governance action creates an immutable audit entry.

Audit trail is separate from archive.

LOCKED.

---

# Audit Entry Schema

```typescript
type CompanyKnowledgeAuditEntry = {
  entry_id: string;

  company: string;

  timestamp: string;

  event_type:
    | "promotion"
    | "review_approved"
    | "review_rejected"
    | "rollback"
    | "manual_override";

  knowledge_version_before: number;

  knowledge_version_after: number;

  field_decisions: PromotionDecision[];

  triggered_by: {
    filing_id: string;

    structured_intelligence_version: number;
  };

  reviewer?: string;

  notes?: string;

  promotion_rules_version: string;
}
```

LOCKED.

---

# Promotion Rules Versioning

Promotion logic is versioned.

Required field:

```typescript
promotion_rules_version
```

Purpose:

Determine:

```text
Which rule set approved this change?
```

Without this:

Historical governance becomes unauditable.

LOCKED.

---

# Rollback Governance

Rollback is first-class.

Not emergency-only.

LOCKED.

---

# Rollback Flow

```text
Current Version
        ↓
Select Prior Version
        ↓
Restore Version
        ↓
Increment Version
        ↓
Write Audit Entry
        ↓
Trigger Invalidation
```

LOCKED.

---

# Rollback Audit Example

```typescript
{
  event_type: "rollback",

  rolled_back_from: 12,

  restored_version: 9,

  reason:
    "Incorrect promotion approved"
}
```

LOCKED.

---

# Downstream Impact

Company Knowledge changes invalidate:

```text
Business Signals

Quarter Understanding

Investor Intelligence

Partner Domain
```

Handled by Invalidation Engine.

LOCKED.

---

# Scaling Strategy

Promotion evaluation runs asynchronously.

Pipeline does NOT wait.

LOCKED.

---

# Processing Flow

```text
Structured Intelligence Created
          ↓
Promotion Job Queued
          ↓
Rules Evaluated
          ↓
Decision Generated
          ↓
Automatic Promotion
OR
Review Queue Entry
```

LOCKED.

---

# Review Capacity Planning

Expected Review Rate:

```text
10% – 20%
```

At:

```text
10,000 Companies
```

Potential reviews:

```text
4,000 – 8,000
per quarter
```

Requires:

- Review UI
- Review Workflow
- Approval Tracking

LOCKED.

---

# Governance Rules

## Rule 1

Company Knowledge never updates directly.

LOCKED.

---

## Rule 2

Every update passes through Promotion Engine.

LOCKED.

---

## Rule 3

Every decision creates Audit Entry.

LOCKED.

---

## Rule 4

Stable fields require strict review.

LOCKED.

---

## Rule 5

Rollback must always be possible.

LOCKED.

---

## Rule 6

Promotion logic must be versioned.

LOCKED.

---

## Rule 7

Human review queue is mandatory.

LOCKED.

---

# Future Enhancements

Planned:

- Reviewer assignment system
- Approval SLA tracking
- Escalation workflow
- Governance analytics
- Knowledge drift monitoring

Not required for MVP.

---

# Final Principle

Company Knowledge is the memory of the company.

Memory cannot be rewritten by a single filing.

Every change must be:

Evaluated.
Governed.
Audited.
Versioned.
Rollbackable.

LOCKED.