# Topic Assignment Builder Specification

Version: 1.0
Status: LOCKED
Owner: Builder Layer

Depends On:

* 012-artifact-framework-spec.md
* 014-dependency-index-spec.md
* 015-invalidation-engine-spec.md
* 017-topic-registry-spec.md
* 019-topic-assignment-spec.md

Consumes:

* Themes Artifact
* Active Topic Registry

Produces:

* Topic Assignment Artifact

---

# Purpose

The Topic Assignment Builder orchestrates deterministic normalization from
filing-specific Themes to canonical Topic Registry entries.

It does not execute prompts or use an LLM.

---

# Architectural Position

```text
Themes Artifact
      +
Active Topic Registry
        ↓
Topic Assignment Builder
        ↓
Topic Assignment Artifact
        ↓
Topic Evolution Builder
```

---

# Builder Ownership

Topic Assignment Builder owns:

* upstream artifact resolution and validation
* active Topic Registry loading
* deterministic assignment orchestration
* assignment confidence calculation
* output validation
* Theme Summary propagation
* artifact content assembly
* BuilderResult emission

Topic Assignment Builder does not own:

* Theme extraction
* Topic creation
* Topic governance
* Topic Evolution
* temporal comparison
* business interpretation
* persistence
* artifact identity
* artifact versioning
* framework lineage
* dependency registration

Artifact Framework owns persistence, identity, versioning, metadata, framework
lineage, hashes, current pointers, and history.

Dependency Index owns dependency registration, dependency graph state, and
invalidation state.

---

# Input Contract

```typescript
type TopicAssignmentBuilderInput = {
  company_id: string;

  period_id: string;

  filing_id: string;
};
```

Required dependencies:

```typescript
type TopicAssignmentBuilderDependencies = {
  themes: ThemesArtifact;

  topic_registry: TopicRegistryArtifact;
};
```

The Themes artifact company, period, and filing identity must match the build
target.

The Topic Registry must be active and globally scoped.

---

# Deterministic Execution

The builder must:

1. Resolve and validate Themes.
2. Resolve and validate the active Topic Registry.
3. Load the pinned semantic model version.
4. Construct deterministic Theme and Topic embedding inputs.
5. Execute exact and semantic assignment rules.
6. Apply contract-owned assignment thresholds.
7. Enforce active-topic-only and maximum-three-assignment rules.
8. Compute assignment confidence.
9. Preserve Theme title and Theme Summary unchanged.
10. Validate output reconciliation.
11. Return `BuilderResult<TopicAssignmentArtifactContent>`.

No prompt resolution, prompt execution, or LLM reasoning is permitted.

---

# Theme Summary Propagation

Each assignment must preserve:

```typescript
type PropagatedThemeContext = {
  theme_id: string;

  theme_title: string;

  theme_summary: string;
};
```

The builder copies these fields from Themes.

It must not summarize, reinterpret, or rewrite them.

---

# Output Contract

The output content must conform to `019-topic-assignment-spec.md`.

```typescript
type TopicAssignmentArtifactContent = {
  artifact_type: "topic_assignment";

  company: string;

  filing_id: string;

  period: string;

  assignments: TopicAssignment[];

  unassigned_themes: UnassignedTheme[];

  confidence: TopicAssignmentConfidence;
};
```

---

# Validation

The builder must validate:

* required dependencies exist
* dependency artifact types
* company, period, and filing identity
* Topic Registry lifecycle status
* active Topic IDs
* semantic model version consistency
* assignment confidence bounds
* stable assignment IDs
* maximum three assignments per Theme
* deterministic ordering
* Theme Summary propagation
* every Theme is assigned or explicitly unassigned

---

# Replayability

Replayability requires:

* Themes artifact hash and version
* Topic Registry artifact hash and version
* semantic model version
* assignment rules version
* deterministic input hash
* deterministic output ordering

Identical inputs and versions must produce identical artifact content.

---

# Invalidation

Topic Assignment becomes stale when:

* Themes changes
* Topic Registry changes
* semantic model version changes
* assignment rules change

---

# Consumer

```text
Topic Evolution Builder
```

Quarter Change does not consume Topic Assignment.

---

# Architectural Invariants

1. Topic Assignment consumes Themes and Topic Registry.
2. Topic Assignment is deterministic.
3. Topic Assignment uses no LLM and no Prompt Registry.
4. Topic Registry is the source of canonical topic truth.
5. Only active topics may be assigned.
6. Topic Assignment cannot create or govern topics.
7. Assignment confidence is builder-computed.
8. Theme Summaries are propagated unchanged.
9. Topic Assignment performs no temporal analysis.
10. The builder returns BuilderResult and does not persist directly.

End of Specification.
