# Quarter Change Specification

Version: 1.0
Status: LOCKED
Owner: Business Delta Layer

---

# Purpose

Quarter Change answers:

```text
What changed in the business between the current and prior period?
```

Quarter Change is a deterministic business-delta artifact.

It is not a topic-delta artifact.

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

Topic Evolution independently provides topic-level temporal enrichment to
Business Signals.

---

# Required Inputs

```typescript
type QuarterChangeInputs = {
  current_structured_intelligence: StructuredIntelligenceArtifact;

  prior_structured_intelligence: StructuredIntelligenceArtifact;
};
```

Both artifacts must:

* belong to the same company
* represent distinct ordered periods
* satisfy the Structured Intelligence contract

---

# Minimum History

Quarter Change requires current and prior Structured Intelligence.

If the prior period is unavailable:

```typescript
status: "insufficient_history"
```

No business changes may be fabricated.

---

# Core Ownership

Quarter Change owns deterministic comparison of:

* revenue drivers
* strategic priorities
* competitive positioning
* risk characterization
* operating model
* management emphasis

---

# Quarter Change Does NOT Own

Quarter Change does not:

* detect topic persistence
* detect topic emergence
* detect topic disappearance
* detect topic strengthening
* detect topic weakening
* detect narrative drift
* interpret why a change matters
* generate Business Signals
* generate investor conclusions

Topic-level temporal behavior belongs exclusively to Topic Evolution.

---

# Output

```typescript
type QuarterChangeArtifact = {
  artifact_type: "quarter_change";

  company: string;

  current_period: string;

  prior_period: string;

  status:
    | "complete"
    | "insufficient_history";

  changes: BusinessChange[];

  summary: QuarterChangeSummary;

  confidence: QuarterChangeConfidence;

  metadata: ArtifactMetadata;

  lineage: ArtifactLineage;
};
```

---

# Business Change Schema

```typescript
type BusinessChange = {
  change_id: string;

  dimension: BusinessChangeDimension;

  change_type:
    | "added"
    | "removed"
    | "modified"
    | "unchanged";

  current_value_refs: string[];

  prior_value_refs: string[];

  evidence_refs: string[];
};

type BusinessChangeDimension =
  | "revenue_driver"
  | "strategic_priority"
  | "competitive_positioning"
  | "risk_characterization"
  | "operating_model"
  | "management_emphasis";
```

Quarter Change records observable differences between Structured Intelligence
dimensions.

It does not assign business significance.

---

# Summary

```typescript
type QuarterChangeSummary = {
  total_changes: number;

  by_dimension: Record<BusinessChangeDimension, number>;

  added: number;

  removed: number;

  modified: number;
};
```

Summary values must reconcile with emitted changes.

---

# Confidence

```typescript
type QuarterChangeConfidence = {
  overall: number;

  current_period_completeness: number;

  prior_period_completeness: number;

  evidence_coverage: number;
};
```

Confidence measures source completeness and evidence coverage.

It does not measure importance, magnitude, or investor relevance.

---

# Determinism

Quarter Change uses no LLM.

Identical current and prior Structured Intelligence artifacts and identical
comparison rules must produce identical output.

---

# Evidence and Lineage

Every change must trace to:

* current Structured Intelligence references
* prior Structured Intelligence references
* supporting filing evidence references preserved by those artifacts

```typescript
type QuarterChangeLineage = {
  current_structured_intelligence_version: number;

  prior_structured_intelligence_version: number;

  comparison_rules_version: string;

  input_hash: string;
};
```

---

# Invalidation

Quarter Change becomes stale when:

* current Structured Intelligence changes
* prior Structured Intelligence changes
* comparison rules change

Topic Assignment and Topic Registry changes do not directly invalidate Quarter
Change.

---

# Output Consumption

Primary consumer:

```text
Business Signals
```

Quarter Change emits business deltas.

Business Signals transforms supported deltas into typed observations.

---

# Architectural Invariants

1. Quarter Change is deterministic.
2. Quarter Change uses no LLM.
3. Quarter Change consumes current and prior Structured Intelligence.
4. Quarter Change owns business-level period deltas.
5. Quarter Change does not consume Topic Assignments.
6. Quarter Change does not emit topic-level temporal behavior.
7. Topic Evolution owns all topic-level temporal behavior.
8. Quarter Change never creates Business Signals.
9. Quarter Change never performs investor interpretation.
10. Every change must trace to both compared Structured Intelligence artifacts.

End of Specification.
