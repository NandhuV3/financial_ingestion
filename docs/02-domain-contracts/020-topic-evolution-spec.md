# Topic Evolution Specification

Version: 1.0
Status: LOCKED
Owner: Longitudinal Topic Intelligence Layer

---

# Purpose

Topic Evolution answers:

```text
How has a canonical topic changed across periods?
```

Topic Evolution owns all topic-level temporal behavior.

Topic Delta is not a separate architecture layer.

---

# Architectural Position

```text
Filing
   ↓
Themes
   ↓
Topic Assignment
   ↓
Topic Evolution
   ↓
Business Signals
```

Topic Evolution and Quarter Change are independent enrichment producers for
Business Signals.

---

# Inputs

```typescript
type TopicEvolutionInputs = {
  current_topic_assignments: TopicAssignmentArtifact;

  historical_topic_assignments: TopicAssignmentArtifact[];
};
```

Topic Assignments must carry the source Theme title and Theme Summary.

Topic Evolution consumes:

* canonical Topic IDs
* assignment confidence
* Theme Summaries
* historical Topic Assignments

Topic Evolution never consumes raw filing text.

---

# Minimum History Requirement

Topic Evolution requires at least:

```text
2 periods
```

With fewer than two periods:

```typescript
status: "insufficient_history"
```

No persistence, emergence, disappearance, strengthening, weakening, or
narrative-drift classification may be emitted.

---

# Version 1 Scope

Topic Evolution V1 supports only:

```typescript
type TopicEvolutionState =
  | "PERSISTENT"
  | "EMERGING"
  | "DISAPPEARED";
```

V1 compares the current Topic Assignment period with the immediately preceding
Topic Assignment period.

The following capabilities are reserved for future versions:

* strengthening
* weakening
* narrative drift
* dormant state
* interrupted or recurring lifecycle classification
* advanced scoring

Reserved capabilities remain owned by Topic Evolution. Deferring their
implementation does not transfer ownership to another layer.

---

# Core Ownership

Topic Evolution owns:

* persistence
* emergence
* disappearance
* strengthening
* weakening
* narrative drift

These responsibilities must not be duplicated by Quarter Change.

---

# Topic Evolution Does NOT Own

Topic Evolution does not:

* interpret business meaning
* generate investor conclusions
* generate Business Signals
* compare Structured Intelligence business dimensions
* create or govern topics
* assess trust or management quality

---

# Deterministic Behavior

Topic Evolution is deterministic.

No LLM is allowed.

Identical ordered input artifacts, Theme Summaries, rules version, and Topic
Registry version must produce identical output.

---

# Output

```typescript
type TopicEvolutionArtifact = {
  artifact_type: "topic_evolution";

  company: string;

  period: string;

  status:
    | "complete"
    | "insufficient_history";

  topic_evolutions: TopicEvolution[];

  confidence: TopicEvolutionConfidence;

  metadata: ArtifactMetadata;

  lineage: ArtifactLineage;
};
```

---

# Topic Evolution Schema

```typescript
type TopicEvolution = {
  topic_id: string;

  first_seen_period: string;

  last_seen_period: string;

  periods_present: number;

  evolution_state: TopicEvolutionState;

  strength_direction: StrengthDirection;

  narrative_drift: NarrativeDrift;

  confidence: number;

  evidence: TopicEvolutionEvidence;
};
```

---

# V1 Transition Rules

```typescript
type TopicEvolutionState =
  | "PERSISTENT"
  | "EMERGING"
  | "DISAPPEARED";
```

V1 applies the following deterministic transition matrix:

| Prior Period | Current Period | V1 Output |
|---|---|---|
| Present | Present | `PERSISTENT` |
| Absent | Present | `EMERGING` |
| Present | Absent | `DISAPPEARED` |
| Absent | Absent | no output |

Presence means that at least one Topic Assignment references the canonical
`topic_id` in that period.

For V1:

* `PERSISTENT` uses assignment references from both periods.
* `EMERGING` uses current-period assignment references.
* `DISAPPEARED` uses prior-period assignment references.
* Topics absent from both periods are not emitted.
* Output ordering is ascending by `topic_id`.

---

# Deferred Assessment Fields

```typescript
type StrengthDirection =
  | "strengthening"
  | "weakening"
  | "stable"
  | "not_assessed";

type NarrativeDrift =
  | "changed"
  | "unchanged"
  | "not_assessed";
```

V1 must emit:

```typescript
strength_direction: "not_assessed";
narrative_drift: "not_assessed";
```

V1 must not infer `stable` or `unchanged` merely because advanced comparison is
not implemented.

---

# Evidence

```typescript
type TopicEvolutionEvidence = {
  periods_analyzed: string[];

  supporting_assignment_refs: string[];

  theme_summaries_by_period: {
    period: string;

    theme_summaries: string[];
  }[];
};
```

Every temporal classification must reconcile with Topic Assignment references
and propagated Theme Summaries.

---

# Confidence

```typescript
type TopicEvolutionConfidence = {
  overall: number;
};
```

Each emitted `TopicEvolution` also records its own deterministic `confidence`.

For a topic with multiple assignments in one period:

```typescript
period_assignment_confidence =
  average(all assignment confidence values for that topic in that period)
```

V1 classification confidence is:

```typescript
PERSISTENT =
  average(
    prior_period_assignment_confidence,
    current_period_assignment_confidence
  )

EMERGING =
  current_period_assignment_confidence

DISAPPEARED =
  prior_period_assignment_confidence
```

All classification confidence values are rounded to four decimal places after
the final calculation.

Artifact confidence is:

```typescript
TopicEvolutionConfidence.overall =
  average(all emitted TopicEvolution confidence values)
```

Artifact confidence is rounded to four decimal places.

When no evolutions are emitted:

```typescript
confidence.overall = 0
```

When `status = "insufficient_history"`:

```typescript
topic_evolutions = []
confidence.overall = 0
```

Confidence measures assignment support for the temporal classification. It
does not measure business importance.

---

# Invalidation

Topic Evolution becomes stale when:

* any contributing Topic Assignment changes
* any contributing Theme Summary changes
* Topic Registry canonicalization changes
* evolution rules change

Rebuild the affected period and all dependent future periods for the company.

---

# Outputs Used By

```text
Business Signals

Quarter Understanding enrichment
```

Topic Evolution is the sole source of topic emergence, disappearance,
strengthening, weakening, persistence, and narrative drift.

V1 emits only persistence, emergence, and disappearance classifications.
Strengthening, weakening, narrative drift, and dormant-state classification
remain reserved for future Topic Evolution versions.

---

# Architectural Invariants

1. Topic Evolution is deterministic.
2. Topic Evolution uses no LLM.
3. Topic Evolution requires at least two periods.
4. Topic Evolution consumes Topic Assignments and propagated Theme Summaries.
5. Topic Evolution owns all topic-level temporal behavior.
6. Topic Delta is not a separate architecture layer.
7. Quarter Change does not duplicate topic temporal behavior.
8. Topic Evolution measures change and does not interpret business meaning.
9. Topic Evolution cannot create or govern topics.
10. Every output must trace to Topic Assignments and Theme Summaries.
11. V1 emits only `PERSISTENT`, `EMERGING`, and `DISAPPEARED`.
12. V1 emits `not_assessed` for strength direction and narrative drift.
13. V1 confidence follows the locked assignment-confidence formulas and is
    rounded to four decimal places.

End of Specification.
