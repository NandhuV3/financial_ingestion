# Company Knowledge Candidate Specification

Version: 2.0
Status: LOCKED
Owner: Company Knowledge Candidate Layer

---

# Purpose

The Company Knowledge Candidate layer answers:

```text
Which filing-scoped Structured Intelligence values are eligible to be
considered for durable Company Knowledge?
```

It is deterministic and prepares candidate changes for governance. It never
updates Company Knowledge and never makes a governance decision.

---

# Architectural Position

```text
Structured Intelligence
        +
Current Company Knowledge, when present
        ↓
Company Knowledge Candidate
        ↓
Company Knowledge Governance
        ↓
Company Knowledge
```

---

# Ownership

The candidate layer owns:

* admission-matrix application
* deterministic field comparison
* stability classification
* extraction confidence propagation
* supporting-period reconciliation
* durability confidence computation
* candidate recommendation
* review requirement derivation
* evidence packaging
* replayability metadata

Company Knowledge Governance owns:

* promotion, merge, retain, reject, and review decisions
* governance confidence
* Company Knowledge creation or mutation

Artifact Framework owns identity, framework metadata, framework lineage,
versioning, persistence, current pointers, archive/history, and framework
hashes.

---

# Inputs

```typescript
type CompanyKnowledgeCandidateInputs = {
  structured_intelligence: StructuredIntelligenceArtifact;
  current_company_knowledge?: CompanyKnowledgeArtifact;
};
```

`structured_intelligence` is required.

`current_company_knowledge` is absent only for first population. When present,
it must belong to the same company and must be the current approved Company
Knowledge artifact.

Company Knowledge history is not a separate content input. Supporting periods
already recorded on current approved knowledge are authoritative.

---

# Artifact Content

The builder returns:

```typescript
BuilderResult<CompanyKnowledgeCandidateArtifactContent>
```

```typescript
type CompanyKnowledgeCandidateArtifactContent = {
  artifact_type: "company_knowledge_candidate";
  company_id: string;
  period_id: string;
  filing_id: string;
  population_mode: "first_population" | "update";
  candidate_changes: CandidateChange[];
  candidate_summary: CandidateSummary;
  confidence: CompanyKnowledgeCandidateConfidence;
  replayability_metadata: CompanyKnowledgeCandidateReplayabilityMetadata;
};
```

`candidate_changes` is the sole canonical candidate collection. The terms
`proposals`, `candidate_fields`, and `promotion_proposals` are obsolete.

---

# Candidate Change

```typescript
type CandidateChange = {
  candidate_id: string;
  field_path: string;
  admission_class: AdmissionClass;
  stability_class: StabilityClass;
  change_type: CandidateChangeType;
  current_value: unknown | null;
  candidate_value: unknown;
  current_value_hash: string | null;
  candidate_value_hash: string;
  extraction_confidence: number;
  durability_confidence: number;
  supporting_periods: string[];
  required_supporting_periods: number;
  evidence_refs: string[];
  builder_recommendation: BuilderRecommendation;
  review_required: boolean;
};

type AdmissionClass =
  | "always_promotable"
  | "conditionally_promotable";

type StabilityClass =
  | "stable"
  | "semi_stable"
  | "dynamic";

type CandidateChangeType =
  | "new_information"
  | "changed"
  | "evidence_accumulation"
  | "no_change";

type BuilderRecommendation =
  | "candidate_promote"
  | "candidate_merge"
  | "candidate_review"
  | "candidate_retain";
```

Never-promotable Structured Intelligence fields do not produce candidate
changes.

---

# Stable Identity

`field_path` is copied from the source Structured Intelligence
`StructuredValueReference.field_path`, with these canonical mappings:

```text
understanding.revenue_model
→ knowledge.revenue_structure

all other eligible understanding paths
→ the corresponding knowledge path
```

`candidate_id` is:

```text
company-knowledge-candidate:<stableHash({
  company_id,
  period_id,
  filing_id,
  field_path,
  candidate_value_hash
})>
```

Candidate changes are ordered by `field_path`, then `candidate_id`.

---

# Confidence Ownership

The candidate builder owns:

* `extraction_confidence`
* `durability_confidence`
* `supporting_periods`
* `stability_class`

Governance owns:

* `governance_confidence`
* the final promotion decision

`extraction_confidence` is copied from the matching Structured Intelligence
value and must reconcile exactly.

---

# Supporting Period Requirements

```typescript
const REQUIRED_SUPPORTING_PERIODS = {
  stable: 1,
  semi_stable: 2,
  dynamic: 3,
} as const;
```

`supporting_periods` contains sorted unique periods that support the exact
candidate value hash.

For first population, it contains the current Structured Intelligence period.

For updates, prior supporting periods are retained only when the current
approved Company Knowledge value represents the same canonical value hash.
The current period is then added.

A changed value starts a new supporting-period set containing only the current
period.

---

# Durability Confidence

```text
durability_confidence =
min(
  distinct_supporting_periods / required_supporting_periods,
  1
)
```

The value is rounded to four decimals.

No extraction-confidence weighting, boost, penalty, or temporary calibration
may be added.

---

# Deterministic Comparison

Comparison uses canonical value hashes:

* no current value: `new_information`
* equal value hash and no new supporting period: `no_change`
* equal value hash and a newly added supporting period:
  `evidence_accumulation`
* different value hash: `changed`

Semantic similarity is not part of the canonical candidate artifact.

---

# Recommendation Rules

The builder recommendation is deterministic:

* `no_change` → `candidate_retain`
* `evidence_accumulation` below required durability →
  `candidate_retain`
* eligible value meeting durability with no conflicting current value →
  `candidate_promote`
* eligible value meeting durability that extends an existing compatible
  collection → `candidate_merge`
* any changed stable field → `candidate_review`
* any changed semi-stable or dynamic field → `candidate_review`
* any candidate below required durability → `candidate_retain`

The builder recommendation is not a governance decision.

`review_required` is `true` for every `candidate_review` recommendation and
`false` otherwise.

---

# First Population

First population is allowed when no approved Company Knowledge exists.

The candidate builder must:

* set `population_mode = "first_population"`
* treat every eligible source value as `new_information`
* start `supporting_periods` with the current period
* compute durability using the canonical stability requirement
* recommend promotion only for values whose durability is `1`
* emit no candidate for never-promotable fields

This permits stable fields to become governance candidates on first
population. Semi-stable and dynamic values remain retained candidates until
their supporting-period requirements are met.

Governance approval remains mandatory for all first-population values.

---

# Candidate Summary

```typescript
type CandidateSummary = {
  total_fields_evaluated: number;
  candidates_emitted: number;
  promotable_candidates: number;
  merge_candidates: number;
  review_candidates: number;
  retained_candidates: number;
  never_promotable_values_excluded: number;
};
```

Summary values must reconcile exactly with `candidate_changes`.

---

# Candidate Confidence

```typescript
type CompanyKnowledgeCandidateConfidence = {
  overall: number;
  extraction_confidence: number;
  durability_confidence: number;
  evidence_coverage: number;
};
```

Each component is the arithmetic mean across emitted candidate changes.
`evidence_coverage` is candidates with non-empty evidence divided by emitted
candidates. All components are `0` when no candidates are emitted.

`overall` is the arithmetic mean of the other three components. Values are
rounded to four decimals and must be recomputed by validation.

---

# Evidence

Every candidate must copy the sorted, deduplicated evidence references from
its source Structured Intelligence value reference.

No evidence means no candidate.

Candidate evidence must not be synthesized or replaced with artifact paths.

---

# Replayability Metadata

```typescript
type CompanyKnowledgeCandidateReplayabilityMetadata = {
  structured_intelligence_ref: string;
  current_company_knowledge_ref: string | null;
  admission_rules_version: string;
  input_hash: string;
  output_hash: string;
};
```

This is content-owned replayability metadata, not Artifact Framework lineage.

---

# Invalidation

The candidate becomes stale when:

* source Structured Intelligence changes
* current approved Company Knowledge changes
* the admission matrix changes
* stability requirements change
* deterministic comparison or confidence rules change

---

# Architectural Invariants

1. `candidate_changes` is the canonical schema.
2. The candidate builder never creates or mutates Company Knowledge.
3. Governance is the only decision authority.
4. Never-promotable fields are excluded.
5. Stability and durability are independent of extraction confidence.
6. Supporting periods support an exact canonical value.
7. First population never bypasses governance.
8. Every candidate has source evidence.
9. Candidate generation is deterministic and replayable.
10. Artifact Framework owns artifact lifecycle mechanics.

End of Specification.
