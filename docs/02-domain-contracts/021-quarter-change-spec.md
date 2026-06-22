# Quarter Change Specification

Version: 2.0
Status: LOCKED
Owner: Business Delta Layer

---

# Purpose

Quarter Change answers:

```text
What changed in the business between the current and prior period?
```

It is a deterministic comparison of two Structured Intelligence snapshots.
It is not a topic-delta artifact and does not consume Topic Assignment or Topic
Evolution.

---

# Architectural Position

```text
Current Structured Intelligence
Prior Structured Intelligence
             ↓
       Quarter Change
             ↓
       Business Signals
```

Topic Evolution is an independent Business Signals enrichment.

---

# Inputs

```typescript
type QuarterChangeInputs = {
  current_structured_intelligence: StructuredIntelligenceArtifact;
  prior_structured_intelligence?: StructuredIntelligenceArtifact;
};
```

Validation must require:

* current artifact type is `structured_intelligence`
* prior artifact type is `structured_intelligence`, when present
* both artifacts belong to the same company
* periods are distinct
* prior period chronologically precedes current period
* every source `StructuredValueReference` reconciles with its artifact content

Topic Assignment, Topic Evolution, Company Knowledge, and Business Signals are
forbidden inputs.

---

# Minimum History

When prior Structured Intelligence is unavailable:

```typescript
status: "insufficient_history"
changes: []
confidence.overall: 0
```

No business change may be fabricated.

---

# Artifact Content

```typescript
type QuarterChangeArtifactContent = {
  artifact_type: "quarter_change";
  company_id: string;
  current_period: string;
  prior_period: string | null;
  status: "complete" | "insufficient_history";
  changes: BusinessChange[];
  summary: QuarterChangeSummary;
  confidence: QuarterChangeConfidence;
  replayability_metadata: QuarterChangeReplayabilityMetadata;
};
```

Artifact Framework owns artifact identity, framework metadata, framework
lineage, versioning, persistence, current pointers, archive/history, and
framework hashes.

---

# Consumed Structured Intelligence Fields

Quarter Change consumes only reconciled `StructuredValueReference` entries
from these Structured Intelligence paths:

| Quarter Change dimension | Structured Intelligence source fields |
|---|---|
| `revenue_driver` | `understanding.revenue_drivers[...]` |
| `strategic_priority` | `understanding.strategic_priorities[...]` |
| `competitive_positioning` | `understanding.competitive_positioning[...]` |
| `risk_characterization` | `understanding.risks[...]` |
| `operating_model` | `understanding.business_model`, `understanding.revenue_model`, `understanding.products[...]`, `understanding.customers[...]`, `understanding.dependencies[...]` |
| `management_emphasis` | `understanding.management_focus[...]` |

No source mapping may be inferred outside this table.

---

# Business Change

```typescript
type BusinessChange = {
  change_id: string;
  dimension: BusinessChangeDimension;
  change_type: BusinessChangeType;
  field_path: string;
  current_value_refs: string[];
  prior_value_refs: string[];
  evidence_refs: string[];
  confidence: number;
};

type BusinessChangeDimension =
  | "revenue_driver"
  | "strategic_priority"
  | "competitive_positioning"
  | "risk_characterization"
  | "operating_model"
  | "management_emphasis";

type BusinessChangeType =
  | "added"
  | "removed"
  | "modified"
  | "unchanged";
```

`change_id` is:

```text
quarter-change:<stableHash({
  company_id,
  prior_period,
  current_period,
  dimension,
  field_path,
  change_type,
  prior_value_refs,
  current_value_refs
})>
```

---

# Deterministic Comparison Rules

For each allowed source mapping:

1. Index prior and current references by `field_path`.
2. Compare the union of field paths in sorted order.
3. Apply exactly one transition:

```text
absent prior + present current  → added
present prior + absent current  → removed
present prior + present current with equal value_hash → unchanged
present prior + present current with different value_hash → modified
absent prior + absent current → no output
```

Collection identity is already encoded in the Structured Intelligence
`field_path`. Quarter Change must not perform semantic matching, label
inference, topic matching, or LLM comparison.

`current_value_refs` and `prior_value_refs` contain the matching `value_ref`
values in sorted order.

`evidence_refs` is the sorted, deduplicated union of evidence references from
the participating current and prior values.

Changes are ordered by:

1. dimension
2. field path
3. change type
4. change ID

---

# Change Confidence

Each source Structured Intelligence value carries extraction confidence.

```text
added      → current value confidence
removed    → prior value confidence
unchanged  → average(prior value confidence, current value confidence)
modified   → average(prior value confidence, current value confidence)
```

Values are rounded to four decimals.

Quarter Change confidence measures comparison support, not business
importance, magnitude, or investor relevance.

---

# Summary

```typescript
type QuarterChangeSummary = {
  total_comparisons: number;
  changed_comparisons: number;
  by_dimension: Record<BusinessChangeDimension, number>;
  added: number;
  removed: number;
  modified: number;
  unchanged: number;
};
```

`by_dimension` counts all emitted comparisons in each dimension.
`changed_comparisons = added + removed + modified`.
All summary values must reconcile exactly.

---

# Artifact Confidence

```typescript
type QuarterChangeConfidence = {
  overall: number;
  current_period_completeness: number;
  prior_period_completeness: number;
  evidence_coverage: number;
};
```

There are six comparison dimensions.

```text
current_period_completeness =
current dimensions containing at least one valid mapped value / 6

prior_period_completeness =
prior dimensions containing at least one valid mapped value / 6

evidence_coverage =
emitted comparisons with non-empty evidence_refs / emitted comparisons
```

When no comparisons are emitted, `evidence_coverage = 0`.

```text
overall =
average(
  current_period_completeness,
  prior_period_completeness,
  evidence_coverage
)
```

All values are rounded to four decimals. Validation must independently
recompute them.

For `insufficient_history`, every confidence component is `0`.

---

# Replayability Metadata

```typescript
type QuarterChangeReplayabilityMetadata = {
  current_structured_intelligence_ref: string;
  prior_structured_intelligence_ref: string | null;
  comparison_rules_version: string;
  current_input_hash: string;
  prior_input_hash: string | null;
  output_hash: string;
};
```

This is content-owned replayability metadata, not Artifact Framework lineage.

Identical input content and comparison-rules versions must produce identical
changes, summaries, confidence, ordering, and output hash.

---

# Invalidation

Quarter Change becomes stale when:

* current Structured Intelligence changes
* prior Structured Intelligence changes
* source value-reference rules change
* comparison rules or confidence formulas change

Topic Registry, Topic Assignment, and Topic Evolution changes do not directly
invalidate Quarter Change.

---

# Architectural Invariants

1. Quarter Change is deterministic and uses no LLM.
2. It consumes current and prior Structured Intelligence only.
3. It compares reconciled Structured Value References.
4. It owns business-level delta, not topic temporal behavior.
5. It does not interpret why a change matters.
6. It does not create Business Signals.
7. It performs no semantic matching.
8. Every comparison is evidence-grounded.
9. Replayability metadata is separate from Artifact Framework lineage.
10. Artifact Framework owns lifecycle mechanics.

End of Specification.
