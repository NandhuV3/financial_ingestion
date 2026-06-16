# 031-capital-allocation-tracking-spec.md

Version: 1.0

Status: LOCKED

Owner: Trust Architecture Layer

---

# Purpose

Capital Allocation Tracking answers:

```text
Did management deploy capital according to stated capital priorities?
```

This is a Trust Architecture pillar artifact.

Capital Allocation Tracking is not valuation.

Capital Allocation Tracking is not investment recommendation.

Capital Allocation Tracking is not trust interpretation.

LOCKED.

---

# Trust Architecture Position

```text
Commitment Tracking
Narrative Consistency
Accounting Stability
Capital Allocation Tracking
        ↓
Trust Signals
        ↓
Quarter Understanding
        ↓
Investor Intelligence Q3
```

LOCKED.

---

# Ownership

Capital Allocation Tracking owns:

- Stated capital priorities
- Observed capital deployment
- Priority-versus-deployment gaps
- Capital allocation evidence references
- Capital allocation coverage status

Capital Allocation Tracking does NOT own:

- Trust conclusions
- Commitment lifecycle
- Management credibility conclusions
- Recommendations
- Valuation
- Investor conclusions
- Quarter Understanding interpretation

LOCKED.

---

# Relationship To Commitment Tracking

Commitment Tracking owns explicit management commitments and their lifecycle.

Capital Allocation Tracking owns whether observed capital deployment aligns with stated capital priorities.

When a capital allocation statement is an explicit commitment, Commitment Tracking may track the commitment lifecycle.

Capital Allocation Tracking may reference the same source evidence, but it does not own commitment status.

LOCKED.

---

# Relationship To Trust Signals

Trust Signals consume Capital Allocation Tracking as a pillar artifact.

Trust Signals may emit:

```text
CAPITAL_ALLOCATION_ALIGNED
CAPITAL_ALLOCATION_UNDER_SUPPORTED
CAPITAL_ALLOCATION_UNSUPPORTED_DEPLOYMENT
CAPITAL_ALLOCATION_EVIDENCE_INSUFFICIENT
```

only when Capital Allocation Tracking is available.

Trust Signals may not emit capital allocation consistency observations from adjacent pillar evidence.

LOCKED.

---

# Inputs

Required Inputs:

```text
Company Knowledge
Current Filing
Current Financial Statements
```

Without required inputs:

```text
Artifact generation is not allowed.
```

LOCKED.

---

# Enrichment Inputs

Optional enrichment inputs:

```text
Prior Capital Allocation Tracking Artifact
Prior Financial Statements
```

Missing enrichment inputs reduce historical depth.

Missing enrichment inputs do not block artifact generation.

LOCKED.

---

# Evidence Model

Every stated priority must reference source evidence.

Every observed deployment must reference filing or financial statement evidence.

Every gap must reference:

- a stated priority, or
- an observed deployment, or
- both

No gap may exist without evidence references.

No inferred evidence is allowed.

LOCKED.

---

# Artifact Contract

```typescript
type CapitalAllocationTrackingArtifactContent = {
  company_id: string;

  period_id: string;

  stated_priorities: CapitalAllocationPriority[];

  observed_deployments: CapitalDeployment[];

  gaps: CapitalAllocationGap[];

  coverage_status: CapitalAllocationCoverageStatus;

  period_summary: CapitalAllocationPeriodSummary;

  enrichment_status: EnrichmentStatus;

  depth_indicator: DepthIndicator;
};
```

Artifact metadata, identity, lineage, versioning, persistence, archive, and current pointer belong to:

```text
Artifact Framework
```

LOCKED.

---

# Priority Schema

```typescript
type CapitalAllocationPriority = {
  priority_id: string;

  priority_type:
    | "buybacks"
    | "dividends"
    | "acquisitions"
    | "organic_investment"
    | "debt_reduction"
    | "capital_expenditure"
    | "other";

  description: string;

  evidence_refs: string[];

  filing_refs: string[];
};
```

LOCKED.

---

# Deployment Schema

```typescript
type CapitalDeployment = {
  deployment_id: string;

  deployment_type:
    | "buybacks"
    | "dividends"
    | "acquisitions"
    | "organic_investment"
    | "debt_reduction"
    | "capital_expenditure"
    | "other";

  amount: number | null;

  evidence_refs: string[];

  filing_refs: string[];

  financial_statement_refs: string[];
};
```

LOCKED.

---

# Gap Schema

```typescript
type CapitalAllocationGap = {
  gap_id: string;

  gap_type:
    | "aligned"
    | "under_supported"
    | "unsupported_deployment"
    | "insufficient_evidence";

  priority_refs: string[];

  deployment_refs: string[];

  evidence_refs: string[];

  explanation: string;
};
```

Gap explanations describe the observed relationship between priorities and deployments.

Gap explanations must not contain trust conclusions.

LOCKED.

---

# Coverage Status

```typescript
type CapitalAllocationCoverageStatus = {
  priorities_available: boolean;

  deployments_available: boolean;

  prior_period_available: boolean;

  financial_statement_coverage:
    | "complete"
    | "partial"
    | "missing";
};
```

LOCKED.

---

# Period Summary

```typescript
type CapitalAllocationPeriodSummary = {
  priority_count: number;

  deployment_count: number;

  gap_count: number;

  aligned_gap_count: number;

  under_supported_gap_count: number;

  unsupported_deployment_gap_count: number;

  insufficient_evidence_gap_count: number;
};
```

Summary counts are reconciliation metrics.

They are not trust scores.

LOCKED.

---

# Enrichment Status

```typescript
type EnrichmentInputStatus = {
  available: boolean;
  artifact_path: string | null;
  artifact_version: number | null;
  absent_reason: string | null;
};

type EnrichmentStatus = {
  prior_capital_allocation_tracking: EnrichmentInputStatus;
  prior_financial_statements: EnrichmentInputStatus;
};
```

LOCKED.

---

# Depth Indicator

```typescript
type DepthIndicator = {
  overall: "base" | "standard" | "full";

  prior_period_dimension:
    | "present"
    | "absent";
};
```

Depth rules:

```text
overall = base
```

Current period required inputs only.

```text
overall = standard
```

Current period required inputs plus one enrichment input.

```text
overall = full
```

Current period required inputs plus all supported enrichment inputs.

LOCKED.

---

# Validation Rules

Validation must enforce:

- Required inputs exist.
- Every priority has evidence references.
- Every priority has filing references.
- Every deployment has evidence references.
- Every deployment has filing or financial statement references.
- Every gap references existing priorities or deployments.
- Every gap has evidence references.
- No orphaned gap references exist.
- Period summary counts reconcile with artifact arrays.
- Enrichment status is internally consistent.
- Depth indicator matches enrichment status.
- No recommendations are emitted.
- No valuation claims are emitted.
- No trust conclusions are emitted.

LOCKED.

---

# Replayability Requirements

Capital Allocation Tracking must be replayable.

Required lineage:

```text
Company Knowledge
Current Filing
Current Financial Statements
```

Optional lineage when used:

```text
Prior Capital Allocation Tracking
Prior Financial Statements
```

Required replay metadata:

- input hash
- artifact hash
- schema version
- builder version
- generated period

LOCKED.

---

# Invalidation Behavior

Regenerate when:

```text
Company Knowledge changes
Current Filing changes
Current Financial Statements change
Prior Capital Allocation Tracking changes
Prior Financial Statements change when used
```

When Capital Allocation Tracking changes, mark stale:

```text
Trust Signals
Quarter Understanding
Investor Intelligence
Partner Domain
```

LOCKED.

---

# Final Principle

Capital Allocation Tracking compares:

```text
Stated Capital Priorities
```

against:

```text
Observed Capital Deployment
```

It produces evidence-backed observations only.

Interpretation belongs downstream.

LOCKED.
