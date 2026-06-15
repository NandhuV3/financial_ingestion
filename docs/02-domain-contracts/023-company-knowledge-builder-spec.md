# 023-company-knowledge-builder-spec.md

Version: 1.0
Status: LOCKED
Owner: Company Knowledge Layer

---

# Purpose

Company Knowledge Builder answers:

```text
Should this filing change what we believe about the company?
```

It is the deterministic layer between:

```text
Structured Intelligence
        ↓
Company Knowledge Builder
        ↓
Promotion Governance
        ↓
Company Knowledge
```

Its responsibility is NOT to update Company Knowledge.

Its responsibility is to prepare:

```text
Promotion Candidates
```

for Governance.

---

# Architectural Position

```text
Structured Intelligence
        ↓
Company Knowledge Builder
        ↓
Promotion Governance
        ↓
Company Knowledge
```

---

# Core Responsibility

Compare:

```text
Current Company Knowledge
```

against

```text
New Structured Intelligence
```

and produce:

```text
Knowledge Change Candidates
```

for governance evaluation.

---

# What This Layer Owns

Owns:

- field comparison
- semantic change detection
- confidence comparison
- evidence accumulation detection
- promotion candidate generation
- promotion recommendation generation

---

# What This Layer Does NOT Own

Does NOT own:

- promotion decisions
- company knowledge updates
- human review
- rollback
- governance rules

Those belong to:

```text
Company Knowledge Governance
```

---

# Design Principle

Builder proposes.

Governance decides.

Always.

---

# Inputs

```typescript
type CompanyKnowledgeBuilderInputs = {
  company_knowledge: CompanyKnowledgeArtifact;

  structured_intelligence: StructuredIntelligenceArtifact;
};
```

---

# Output

```typescript
type CompanyKnowledgeCandidateArtifact = {
  artifact_type: "company_knowledge_candidate";

  company: string;

  filing_period: string;

  candidate_changes: CandidateChange[];

  candidate_summary: CandidateSummary;

  metadata: ArtifactMetadata;

  lineage: ArtifactLineage;
};
```

---

# Candidate Change

```typescript
type CandidateChange = {
  field_path: string;

  current_value: unknown;

  candidate_value: unknown;

  change_type: ChangeType;

  semantic_similarity: number;

  confidence_delta: number;

  evidence_delta: number;

  builder_recommendation: BuilderRecommendation;

  review_required: boolean;

  supporting_evidence: EvidenceReference[];
};
```

---

# Change Types

```typescript
type ChangeType =
  | "new_information"
  | "minor_update"
  | "major_update"
  | "contradiction"
  | "evidence_accumulation"
  | "no_change";
```

---

# Builder Recommendation

Important:

Builder recommendation is not a decision.

```typescript
type BuilderRecommendation =
  | "candidate_promote"
  | "candidate_merge"
  | "candidate_review"
  | "candidate_retain";
```

Governance may disagree.

---

# Candidate Summary

```typescript
type CandidateSummary = {
  total_fields_evaluated: number;

  unchanged_fields: number;

  changed_fields: number;

  major_changes: number;

  contradictions: number;

  review_candidates: number;
};
```

---

# Comparison Engine

Core function:

```typescript
compare(
    companyKnowledge,
    structuredIntelligence
)
```

---

# Comparison Strategy

Field-by-field.

Never artifact-level.

---

# Example

Current:

```text
Primary Revenue Driver:
Cloud Infrastructure
```

Candidate:

```text
Primary Revenue Driver:
Cloud Infrastructure + AI Services
```

Result:

```text
minor_update
```

---

# Example

Current:

```text
Business Model:
Subscription
```

Candidate:

```text
Business Model:
Transaction Driven
```

Result:

```text
major_update
```

and

```text
review_required = true
```

---

# Semantic Similarity

Required.

Builder computes:

```typescript
semantic_similarity: number;
```

Range:

```text
0.0 → 1.0
```

---

# Interpretation

```text
> 0.90
No Change

0.75 - 0.90
Minor Update

0.50 - 0.75
Moderate Update

< 0.50
Major Update
```

---

# Stable Field Rules

Stable fields:

```typescript
business_model

revenue_structure

products
```

Any change:

```text
review_required = true
```

Always.

---

# Semi-Stable Fields

```typescript
revenue_drivers

customers

competitive_positioning
```

Moderate threshold.

---

# Dynamic Fields

```typescript
strategic_priorities

management_focus

dependencies
```

Changes expected.

---

# Confidence Delta

Builder computes:

```typescript
confidence_delta =
candidate_confidence
-
current_confidence
```

---

# Example

Current:

```text
0.70
```

Candidate:

```text
0.85
```

Result:

```text
+0.15
```

---

# Evidence Delta

Measures:

```text
How much new evidence exists?
```

Example:

Current:

```text
2 filings support field
```

Candidate:

```text
5 filings support field
```

Result:

```text
evidence_accumulation
```

---

# Contradiction Detection

Critical.

---

# Example

Current:

```text
Primary Customer:
Enterprise
```

Candidate:

```text
Primary Customer:
Consumer
```

Result:

```text
contradiction
```

---

# Contradiction Handling

Builder never resolves contradictions.

Builder flags:

```typescript
review_required = true;
change_type = "contradiction";
```

Governance decides.

---

# First Population

If Company Knowledge empty:

```typescript
change_type = "new_information";
```

No comparison possible.

---

# Builder Recommendation Logic

---

## Candidate Promote

Conditions:

```text
High Confidence

+
Minor Change

+
Evidence Increase
```

---

## Candidate Merge

Conditions:

```text
Adds Information

Without Replacing Prior Knowledge
```

---

## Candidate Review

Conditions:

```text
Contradiction

or

Major Change

or

Stable Field Change
```

---

## Candidate Retain

Conditions:

```text
No Material Change
```

---

# Multi-Field Change Detection

If:

```text
3+ fields change simultaneously
```

Builder emits:

```typescript
review_required = true;
```

for summary.

---

# Change Event Classification

```typescript
type ChangeEventClassification =
  | "routine"
  | "significant"
  | "critical";
```

---

# Routine

Minor updates only.

---

# Significant

Stable fields affected.

---

# Critical

Contradictions detected.

Business model changed.

Revenue structure changed.

---

# Evidence Requirements

Every candidate change requires:

```typescript
supporting_evidence[]
```

No evidence:

```text
No candidate.
```

---

# Builder Confidence

```typescript
type BuilderConfidence = {
  comparison_confidence: number;

  evidence_strength: number;

  contradiction_confidence: number;
};
```

---

# Relationship to Governance

Builder cannot:

```text
Promote

Merge

Retain

Rollback
```

Builder only recommends.

Governance owns decisions.

---

# Promotion Governance Contract

Builder outputs:

```typescript
CandidateChange[]
```

Governance consumes:

```typescript
CandidateChange[]
```

and produces:

```typescript
PromotionDecision[]
```

---

# Invalidation Rules

Candidate artifact becomes stale when:

- Structured Intelligence changes
- Company Knowledge changes
- Promotion Rules version changes

---

# Regeneration Rules

Regenerate if:

```text
Input Hash Changed
```

---

# Evaluation Metrics

---

## Comparison Accuracy

Measures:

```text
Correctly Detected Changes
```

---

## False Positive Change Rate

Measures:

```text
Detected Change

when

No Change Exists
```

---

## False Negative Change Rate

Measures:

```text
Missed Changes
```

---

## Contradiction Detection Accuracy

Measures:

```text
Detected Contradictions
/
Actual Contradictions
```

---

## Evidence Coverage

Measures:

```text
Changes With Evidence
/
Total Changes
```

---

# Metadata

```typescript
type ArtifactMetadata = {
  schema_version: string;

  builder_version: string;

  generated_at: string;

  artifact_version: number;
};
```

---

# Lineage

```typescript
type ArtifactLineage = {
  company_knowledge_version: number;

  structured_intelligence_version: number;

  promotion_rules_version: string;

  input_hash: string;
};
```

---

# Archive Strategy

```text
current.json

archive/
```

Store all candidate generations.

Needed for:

- governance audits
- rollback investigations
- promotion evaluation

---

# Scaling Requirements

Target:

```text
10,000+ companies
```

---

# Performance Requirement

```text
< 5 seconds
```

per company.

Deterministic.

No LLM calls.

---

# Architectural Invariants

LOCKED.

1. Builder never updates Company Knowledge.
2. Builder never makes promotion decisions.
3. Builder is deterministic.
4. Every candidate requires evidence.
5. Contradictions always require review.
6. Stable field changes always require review.
7. Builder outputs recommendations, not decisions.
8. Governance is the only promotion authority.
9. Candidate artifacts are auditable.
10. Promotion logic remains outside Builder.

End of Specification.