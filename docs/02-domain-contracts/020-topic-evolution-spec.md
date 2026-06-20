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

  persistence: PersistenceState;

  emergence: EmergenceState;

  disappearance: DisappearanceState;

  strength_direction: StrengthDirection;

  narrative_drift: NarrativeDrift;

  evidence: TopicEvolutionEvidence;
};
```

---

# Temporal States

```typescript
type PersistenceState =
  | "new"
  | "recurring"
  | "persistent"
  | "interrupted";

type EmergenceState =
  | "emerging"
  | "not_emerging";

type DisappearanceState =
  | "present"
  | "dormant"
  | "disappeared";

type StrengthDirection =
  | "strengthening"
  | "stable"
  | "weakening";
```

---

# Narrative Drift

Narrative drift compares Theme Summaries assigned to the same canonical topic
across periods.

```typescript
type NarrativeDrift = {
  state:
    | "unchanged"
    | "evolved"
    | "materially_shifted";

  prior_theme_summaries: string[];

  current_theme_summaries: string[];

  supporting_assignment_refs: string[];
};
```

Narrative drift measures textual subject change.

It does not explain why the change matters.

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

  history_depth_score: number;

  assignment_coverage_score: number;

  summary_coverage_score: number;
};
```

Confidence measures source completeness and temporal evidence depth.

It does not measure business importance.

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

End of Specification.
