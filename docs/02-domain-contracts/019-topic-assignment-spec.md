# 019-topic-assignment-spec.md

# Topic Assignment Specification

Version: 1.0
Status: LOCKED
Owner: Topic Intelligence Layer

---

# Purpose

Topic Assignment converts raw filing themes into governed topics.

Themes answer:

```text
What management talked about.
```

Topic Assignment answers:

```text
Which registered topic
does this discussion belong to?
```

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
```

Topic Assignment is the bridge between:

```text
Unstructured Filing Discussion
```

and

```text
Governed Topic Intelligence
```

---

# Core Responsibility

Map extracted themes to:

```text
Topic Registry Entries
```

using deterministic classification.

Topic Assignment normalizes observations.

It does not interpret them.

---

# Topic Assignment Does NOT Do

Topic Assignment never:

- interpret meaning
- infer importance
- infer business impact
- infer direction
- infer sentiment
- generate concepts
- create topics
- detect trends
- detect temporal change
- rewrite Theme Summaries

---

# Example

Themes:

```text
AI Demand

GPU Expansion

Enterprise AI Adoption
```

Topic Assignment:

```text
AI Strategy

Infrastructure Capacity

Enterprise Adoption
```

Topic IDs come from:

```text
Topic Registry
```

---

# Design Principles

---

## Principle 1

Topic Assignment is deterministic.

No LLM.

LOCKED.

---

## Principle 2

Topic Assignment cannot create topics.

Only Topic Registry can.

---

## Principle 3

Every assignment must trace to:

```text
Theme
+
Topic Registry Entry
```

---

## Principle 4

One theme may map to multiple topics.

---

## Principle 5

One topic may receive multiple themes.

---

# Inputs

```typescript
type TopicAssignmentInputs = {
  themes: ThemesArtifact;

  topic_registry: TopicRegistry;
};
```

---

# Outputs

```typescript
type TopicAssignmentArtifact = {
  artifact_type: "topic_assignment";

  company: string;

  filing_id: string;

  period: string;

  assignments: TopicAssignment[];

  unassigned_themes: UnassignedTheme[];

  confidence: TopicAssignmentConfidence;

  metadata: ArtifactMetadata;

  lineage: ArtifactLineage;
};
```

---

# Assignment Schema

```typescript
type TopicAssignment = {
  assignment_id: string;

  theme_id: string;

  topic_id: string;

  theme_title: string;

  theme_summary: string;

  assignment_method: AssignmentMethod;

  similarity_score: number;

  confidence: number;
};
```

`theme_title` and `theme_summary` are copied unchanged from the source Theme.

They are carried forward because Topic Evolution requires the observed
narrative for temporal comparison.

---

# Assignment Methods

```typescript
type AssignmentMethod =
  | "exact_match"
  | "semantic_match"
  | "human_override";
```

---

# Assignment Identity

```typescript
assignment_id =
SHA256(
 theme_id +
 topic_id
)
```

---

# Unassigned Themes

Themes that cannot be mapped.

```typescript
type UnassignedTheme = {
  theme_id: string;

  theme_title: string;

  theme_summary: string;

  highest_similarity_score: number;

  candidate_topics: CandidateTopic[];
};
```

---

# Candidate Topics

```typescript
type CandidateTopic = {
  topic_id: string;

  similarity_score: number;
};
```

---

# Topic Registry Dependency

Topic Assignment depends on:

```text
Active Topics Only
```

Deprecated topics ignored.

Merged topics redirected.

Rejected topics unavailable.

---

# Assignment Logic

---

## Step 1

Exact Match

```text
Theme
=
Topic Synonym
```

Assign immediately.

---

## Step 2

Semantic Similarity

Embedding similarity.

---

## Step 3

Unassigned Queue

Theme remains unassigned.

---

# Assignment Thresholds

---

## Exact Match

```text
1.00
```

---

## Automatic Assignment

LOCKED

```text
>= 0.85
```

---

## Human Review Threshold

LOCKED

```text
0.70 - 0.85
```

---

## Unassigned

LOCKED

```text
< 0.70
```

---

# Multiple Topic Assignment

Allowed.

Example:

Theme:

```text
AI Infrastructure Expansion
```

May map to:

```text
AI Strategy

Infrastructure Capacity
```

---

# Maximum Topic Assignments

LOCKED

```text
3 topics per theme
```

Maximum.

---

# Confidence

Assignment confidence is classification confidence.

Not business importance.

```typescript
type TopicAssignmentConfidence = {
  overall: number;

  exact_match_rate: number;

  semantic_match_rate: number;

  unassigned_rate: number;
};
```

---

# Confidence Meaning

High confidence:

```text
Most themes clearly map
to registry topics.
```

Low confidence:

```text
Large portion of filing
contains unknown discussions.
```

---

# Semantic Similarity Contract

Non-exact assignments must use cosine similarity between:

```text
Theme embedding

Topic Registry embedding
```

Both vectors must originate from the same pinned embedding model version.

Runtime token overlap, keyword matching, regex classification, and
string-contains classification are forbidden.

```typescript
similarity_score =
  cosine_similarity(
    theme_embedding,
    topic_embedding
  )
```

`confidence` equals the normalized `similarity_score`.

Similarity values are rounded to four decimal places for stable replay.

---

# Registry Governance Integration

Topic Assignment cannot modify registry.

When unassigned themes exceed threshold:

```text
Concept Proposal
NO

Topic Proposal
YES
```

Generated for review.

---

# Topic Proposal Trigger

LOCKED

```text
Same unassigned theme
appears in

5 companies

OR

3 consecutive periods
```

---

# Topic Proposal Schema

```typescript
type TopicProposal = {
  proposal_id: string;

  proposed_topic_name: string;

  triggering_themes: string[];

  companies_observed: string[];

  periods_observed: string[];

  confidence: number;
};
```

---

# Topic Registry Relationship

Topic Assignment is the only layer that:

```text
Reads Themes

Reads Topic Registry

Produces Topic Mapping
```

This boundary is LOCKED.

---

# Outputs Used By

Downstream consumers:

```text
Topic Evolution
```

Only.

---

# Invalidation Rules

Topic Assignment becomes stale when:

- Themes changes
- Topic Registry changes
- Assignment rules change
- Similarity model changes

---

# Regeneration Rules

Full regeneration only.

No partial regeneration.

---

# Evaluation Metrics

---

## Assignment Coverage

```text
Assigned Themes
/
Total Themes
```

---

## Registry Coverage

```text
Topics Used
/
Available Topics
```

Monitoring metric.

---

## Unassigned Rate

```text
Unassigned Themes
/
Total Themes
```

---

## Assignment Accuracy

Measured via:

```text
Ground Truth Corpus
```

---

## False Positive Rate

Incorrect topic assignment.

---

## False Negative Rate

Missed valid topic assignment.

---

# Human Review

Human review only required for:

```text
0.70 - 0.85 similarity range
```

if review workflow enabled.

Otherwise:

```text
Remain unassigned.
```

---

# Governance

Topic Assignment owns:

```text
Topic Classification

Assignment Confidence

Canonical Topic Normalization

Theme Summary Propagation
```

Only.

---

# It Does Not Own

```text
Topic Creation

Topic Governance

Topic Evolution

Trend Detection

Business Delta Detection

Business Meaning
```

---

# Metadata

```typescript
type ArtifactMetadata = {
  schema_version: string;

  assignment_rules_version: string;

  similarity_model_version: string;

  generated_at: string;

  artifact_version: number;
};
```

---

# Lineage

```typescript
type ArtifactLineage = {
  themes_version: number;

  topic_registry_version: number;

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

# Performance Target

```text
< 10 seconds
```

per filing.

---

# Architectural Invariants

The following are LOCKED:

1. Topic Assignment is deterministic.
2. Topic Assignment uses no LLM.
3. Topic Assignment cannot create topics.
4. Topic Assignment only maps themes to active topics.
5. One theme may map to multiple topics.
6. Maximum 3 topics per theme.
7. Topic Registry is the source of truth.
8. Unassigned themes may trigger topic proposals.
9. Topic Assignment never interprets business meaning.
10. Topic Evolution begins only after Topic Assignment.
11. Topic Assignment propagates Theme Summaries unchanged.
12. Topic Assignment never performs temporal comparison.

End of Specification.
