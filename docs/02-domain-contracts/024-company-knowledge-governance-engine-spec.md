# 024-company-knowledge-governance-engine-spec.md

Version: 1.0
Status: LOCKED
Owner: Knowledge Governance Layer

---

# Purpose

Company Knowledge Governance answers:

```text
Should Company Knowledge be changed?
```

It is the only layer in the platform allowed to modify:

```text
Company Knowledge
```

---

# Architectural Position

```text
Structured Intelligence
        ↓
Company Knowledge Builder
        ↓
Company Knowledge Governance
        ↓
Company Knowledge
        ↓
Business Signals
```

---

# Core Responsibility

Evaluate:

```text
Candidate Changes
```

and decide:

```text
PROMOTE
MERGE
RETAIN
FLAG_REVIEW
```

while preserving:

- auditability
- stability
- traceability
- rollback capability

---

# Governance Principle

Company Knowledge is:

```text
Canonical Truth
```

for the platform.

Changing it is expensive.

Changing it requires governance.

---

# Ownership

Governance owns:

- promotion decisions
- merge decisions
- review decisions
- audit trail generation
- rollback approval
- version advancement

Governance does NOT own:

- candidate generation
- filing interpretation
- investor reasoning

---

# Inputs

```typescript
type GovernanceInputs = {
  company_knowledge: CompanyKnowledgeArtifact;

  candidate_artifact: CompanyKnowledgeCandidateArtifact;

  promotion_rules: PromotionRules;
};
```

---

# Outputs

```typescript
type GovernanceDecisionArtifact = {
  artifact_type: "governance_decision";

  company: string;

  filing_period: string;

  decisions: PromotionDecision[];

  governance_summary: GovernanceSummary;

  metadata: ArtifactMetadata;

  lineage: ArtifactLineage;
};
```

---

# Promotion Decision

```typescript
type PromotionDecision = {
  field_path: string;

  outcome: GovernanceOutcome;

  reason: PromotionReason;

  review_required: boolean;

  prior_value_hash: string;

  candidate_value_hash: string;

  confidence_delta: number;

  decision_confidence: number;
};
```

---

# Governance Outcomes

```typescript
type GovernanceOutcome =
  | "promote"
  | "merge"
  | "retain"
  | "flag_review";
```

---

# Promotion Reasons

```typescript
type PromotionReason =
  | "first_population"
  | "confidence_improvement"
  | "evidence_accumulation"
  | "threshold_not_met"
  | "significant_change_detected"
  | "change_exceeds_stability_limit"
  | "manual_override"
  | "contradiction_detected"
  | "stable_field_change";
```

---

# Governance Summary

```typescript
type GovernanceSummary = {
  promoted_fields: number;

  merged_fields: number;

  retained_fields: number;

  review_fields: number;

  overall_decision: GovernanceResult;
};
```

---

# Governance Result

```typescript
type GovernanceResult =
  | "auto_approved"
  | "partial_review_required"
  | "full_review_required";
```

---

# Promotion Rules Engine

Governance executes:

```typescript
evaluateCandidate(
    candidate,
    rules
)
```

for every field.

---

# Stable Fields

```typescript
business_model

revenue_structure

products
```

---

# Rule

Any change:

```text
FLAG_REVIEW
```

unless manually approved.

---

# Semi-Stable Fields

```typescript
revenue_drivers

customers

competitive_positioning
```

---

# Rule

Promote when:

```text
Confidence Increase

AND

Similarity Above Threshold
```

---

# Dynamic Fields

```typescript
strategic_priorities

management_focus

dependencies
```

---

# Rule

Promotion allowed automatically.

Still audited.

---

# Confidence Thresholds

Minimum Promotion Threshold:

```text
0.60
```

Below threshold:

```text
RETAIN
```

---

# Automatic Promotion Threshold

```text
0.80
```

Above threshold:

```text
PROMOTE
```

when no review trigger exists.

---

# Semantic Similarity Rules

```text
> 0.90
No Material Change

0.75 - 0.90
Minor Change

0.50 - 0.75
Moderate Change

< 0.50
Major Change
```

---

# Major Change Rule

Major changes automatically:

```text
FLAG_REVIEW
```

---

# Contradiction Rule

If:

```text
change_type = contradiction
```

then:

```text
FLAG_REVIEW
```

Always.

No exceptions.

---

# Multi-Field Change Rule

If:

```text
3+
fields change simultaneously
```

then:

```text
full_review_required
```

---

# Business Model Change Rule

If:

```text
business_model.value_creation
```

changes:

```text
FLAG_REVIEW
```

Always.

---

# Revenue Structure Rule

If:

```text
revenue_structure
```

changes:

```text
FLAG_REVIEW
```

Always.

---

# First Population Rule

If:

```text
Company Knowledge Empty
```

then:

```text
PROMOTE
```

when:

```text
confidence >= 0.75
```

Otherwise:

```text
FLAG_REVIEW
```

---

# Evidence Accumulation Rule

Example:

Current:

```text
Supported by 2 filings
```

Candidate:

```text
Supported by 6 filings
```

Result:

```text
PROMOTE
```

even if wording unchanged.

Knowledge strength improves.

---

# Confidence Regression Rule

If:

```text
candidate_confidence
<
current_confidence
```

Result:

```text
RETAIN
```

unless human override exists.

---

# Review Triggers

```typescript
type ReviewTrigger =
  | "stable_field_change"
  | "business_model_change"
  | "multi_field_change"
  | "contradiction_detected"
  | "confidence_regression"
  | "first_population_low_confidence"
  | "restatement_context"
  | "management_change_context"
  | "contradicts_prior_three";
```

---

# Review Queue Entry

```typescript
type ReviewQueueEntry = {
  review_id: string;

  company: string;

  trigger: ReviewTrigger;

  candidate_ref: string;

  assigned_reviewer: string | null;

  status: ReviewStatus;

  created_at: string;

  due_date: string;
};
```

---

# Review Status

```typescript
type ReviewStatus =
  | "pending"
  | "in_review"
  | "approved"
  | "rejected";
```

---

# Human Review Process

Reviewer receives:

```text
Current Knowledge

Candidate Knowledge

Supporting Evidence

Trigger Reason

Recommendation
```

Reviewer chooses:

```text
PROMOTE
MERGE
RETAIN
REJECT
```

---

# Manual Override

Allowed.

Must be audited.

---

# Manual Override Schema

```typescript
type ManualOverride = {
  reviewer: string;

  decision: GovernanceOutcome;

  rationale: string;

  timestamp: string;
};
```

---

# Audit Trail

Mandatory.

Every governance action produces:

```typescript
CompanyKnowledgeAuditEntry
```

---

# Audit Entry

```typescript
type CompanyKnowledgeAuditEntry = {
  entry_id: string;

  company: string;

  timestamp: string;

  event_type: AuditEventType;

  before_version: number;

  after_version: number;

  field_decisions: PromotionDecision[];

  reviewer: string | null;

  notes: string | null;

  promotion_rules_version: string;
};
```

---

# Audit Event Types

```typescript
type AuditEventType =
  | "promotion"
  | "review_approved"
  | "review_rejected"
  | "manual_override"
  | "rollback";
```

---

# Company Knowledge Write Rules

Governance is:

```text
ONLY WRITER
```

of Company Knowledge.

No other layer may update:

```text
current.json
```

---

# Version Advancement

Whenever Company Knowledge changes:

```text
knowledge_version++
```

Always.

---

# Archive Strategy

Before write:

```text
current.json
    ↓
archive/
```

Then:

```text
new current.json
```

---

# Rollback Support

Governance owns rollback approval.

---

# Rollback Flow

```text
Select Target Version
        ↓
Restore Archive Version
        ↓
Write New Current
        ↓
Increment Version
        ↓
Create Audit Entry
        ↓
Trigger Invalidation
```

---

# Rollback Schema

```typescript
type RollbackEvent = {
  rollback_id: string;

  company: string;

  restored_version: number;

  previous_version: number;

  reviewer: string;

  reason: string;

  timestamp: string;
};
```

---

# Dependency Impact

Whenever Company Knowledge changes:

Mark stale:

```text
Business Signals

Quarter Understanding

Investor Intelligence

Partner Domain
```

via Dependency Index.

---

# Governance Rule Versioning

Critical.

Rules are versioned.

```typescript
type PromotionRules = {
  version: string;

  stable_field_thresholds: {};

  confidence_thresholds: {};

  review_triggers: {};
};
```

---

# Audit Requirement

Every decision records:

```text
promotion_rules_version
```

used at decision time.

---

# Evaluation Metrics

---

## Promotion Accuracy

Measures:

```text
Correct Promotions
/
Total Promotions
```

---

## Review Precision

Measures:

```text
Valid Review Flags
/
Review Flags
```

---

## Review Recall

Measures:

```text
Detected Problems
/
Actual Problems
```

---

## False Promotion Rate

Measures:

```text
Bad Promotions
/
Promotions
```

---

## Rollback Rate

Measures:

```text
Rollbacks
/
Promotions
```

High rollback rate indicates governance weakness.

---

# Metadata

```typescript
type ArtifactMetadata = {
  schema_version: string;

  governance_version: string;

  generated_at: string;

  artifact_version: number;
};
```

---

# Lineage

```typescript
type ArtifactLineage = {
  company_knowledge_version: number;

  candidate_artifact_version: number;

  promotion_rules_version: string;

  input_hash: string;
};
```

---

# Scaling Requirements

Target:

```text
10,000+ companies
```

---

# Operational Requirements

Governance must support:

```text
Asynchronous Reviews

Review Queues

Approval Workflows

Rollback Workflows
```

without blocking filing ingestion.

---

# Architectural Invariants

LOCKED.

1. Governance is the only writer of Company Knowledge.
2. Builder recommends, Governance decides.
3. Stable field changes require review.
4. Contradictions require review.
5. Every decision is audited.
6. Every write is versioned.
7. Rollback is first-class.
8. Promotion rules are versioned.
9. Human overrides are allowed but audited.
10. Governance decisions trigger downstream invalidation.

End of Specification.