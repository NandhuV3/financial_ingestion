# 074-quarter-understanding-spec.md

Status: LOCKED

Version: 1.0

Purpose:

Defines the Quarter Understanding domain.

Quarter Understanding transforms deterministic business observations into period-level business understanding.

Quarter Understanding explains what happened during a period and what the observed business developments mean.

Quarter Understanding is the LLM-assisted interpretation layer.

Quarter Understanding does not generate observations.

Quarter Understanding does not generate investor conclusions.

LOCKED.

---

# Architectural Position

```text
Company Knowledge
        ↓

Business Signals
        ↓

Quarter Understanding
        ↓

Investor Intelligence
```

Trust enrichment:

```text
Trust Signals
        ↓

Quarter Understanding
        ↓

Investor Intelligence Q3
```

LOCKED.

---

# Mission

Quarter Understanding answers:

```text
What does this quarter mean?
```

Quarter Understanding converts:

```text
Business Facts
```

into:

```text
Business Understanding
```

LOCKED.

---

# Owns

Quarter Understanding owns:

* Period interpretation
* Signal interpretation
* Business synthesis
* Strategic synthesis
* Operational synthesis
* Management execution interpretation
* Business momentum interpretation
* Understanding generation
* Importance assessment
* Direction assessment
* Trust interpretation when Trust Signals are available

LOCKED.

---

# Does Not Own

Quarter Understanding does NOT own:

* Filing understanding
* Themes
* Topic Assignment
* Topic Evolution
* Company Knowledge
* Business Signals
* Trust Signal generation
* Concept governance
* Investor conclusions
* Valuation opinions
* Recommendations
* Report generation

LOCKED.

---

# Artifact Enrichment Pattern

Quarter Understanding follows:

```text
018-artifact-enrichment-pattern.md
```

LOCKED.

---

# Required Inputs

Required:

```text
Company Knowledge
Business Signals
```

Without required inputs:

```text
Artifact generation is not allowed.
```

LOCKED.

---

# Enrichment Inputs

Optional:

```text
Trust Signals
Topic Evolution
Concept Registry
```

Future:

```text
Transcript Signals
Cross-Company Context
Industry Context
```

Missing enrichment inputs reduce depth.

Missing enrichment inputs do not block artifact generation.

LOCKED.

---

# Quarter Change Boundary

Quarter Understanding receives quarter-over-quarter observations exclusively through Business Signals movement signals and must not consume QuarterChangeArtifact directly.

Quarter Change remains solely an upstream dependency of Business Signals.

LOCKED.

---

# Enrichment Status

```ts
type EnrichmentInputStatus = {
  available: boolean;
  artifact_ref: string | null;
  artifact_version: number | null;
  absent_reason: string | null;
};
```

```ts
type EnrichmentStatus = {
  trust_signals: EnrichmentInputStatus;
  topic_evolution: EnrichmentInputStatus;
  concept_registry: EnrichmentInputStatus;
};
```

`artifact_ref` and `artifact_version` are Artifact Framework-provided
references.

LOCKED.

---

# Depth Indicator

```ts
type DepthIndicator = {
  overall:
    | "base"
    | "standard"
    | "full";

  trust_dimension:
    | "present"
    | "absent";

  longitudinal_dimension:
    | "present"
    | "absent";
};
```

LOCKED.

---

# Understanding Categories

Quarter Understanding may generate:

```ts
type UnderstandingCategory =
  | "business_model"
  | "revenue"
  | "products"
  | "customers"
  | "competition"
  | "operations"
  | "strategy"
  | "execution"
  | "trust";
```

Trust category:

```text
Allowed only when:

trust_dimension = present
```

LOCKED.

---

# Understanding Structure

```ts
type Understanding = {
  understanding_id: string;

  category: UnderstandingCategory;

  concept_id?: string;

  title: string;

  explanation: string;

  importance:
    | "low"
    | "medium"
    | "high";

  direction:
    | "improving"
    | "stable"
    | "deteriorating"
    | "mixed";

  evidence_package: EvidencePackage;
};
```

LOCKED.

---

# Evidence Package

```ts
type EvidencePackage = {
  signal_refs: string[];

  company_knowledge_refs: string[];

  trust_signal_refs: string[];

  topic_refs: string[];
};
```

LOCKED.

---

# Evidence Reference Rules

When:

```text
trust_dimension = absent
```

Then:

```text
trust_signal_refs must be empty.
```

When:

```text
longitudinal_dimension = absent
```

Then:

```text
topic_refs must be empty.
```

Evidence references may not imply unavailable enrichment.

LOCKED.

---

# Trust Rules

When:

```text
trust_dimension = absent
```

Quarter Understanding must not generate:

```text
Trust Understandings

Trust Direction Assessments

Trust Conclusions
```

LOCKED.

---

# Proposed Concepts

```ts
type ProposedConcept = {
  proposed_concept_id: string;

  title: string;

  description: string;

  evidence_refs: string[];

  rationale: string;
};
```

Proposals only.

Quarter Understanding does not create concepts.

Quarter Understanding does not approve concepts.

LOCKED.

---

# Concept Registry Validation Rules

When:

```text
concept_registry.available = true
```

Then:

```text
concept_id is required.

concept_id must reference an active concept.
```

When:

```text
concept_registry.available = false
```

Then:

```text
concept_id must be absent.
```

Quarter Understanding may still emit:

```text
Proposed Concepts
```

under either mode.

LOCKED.

---

# Concept Registry Integration

Quarter Understanding may:

```text
Use Concepts

Reference Concepts

Propose Concepts
```

Quarter Understanding may NOT:

```text
Create Concepts

Approve Concepts

Govern Concepts
```

LOCKED.

---

# Confidence

```ts
type QuarterUnderstandingConfidence = {
  overall: number;

  grounding_score: number;

  signal_utilization_score: number;

  evidence_coverage_score: number;

  interpretation_quality_score: number;
};
```

Values must be in:

```text
[0,1]
```

Confidence is builder-owned.

Confidence is not generated by the prompt.

LOCKED.

---

# Evaluation Hooks

```ts
type QuarterUnderstandingEvaluationHooks = {
  prompt_version: string;

  model_version: string;

  understanding_count: number;

  signal_utilization: {
    available_signal_count: number;
    used_signal_count: number;
    ignored_signal_count: number;
  };

  grounding: {
    evidence_package_count: number;
    missing_evidence_count: number;
  };

  concept_usage: {
    concept_registry_available: boolean;
    emitted_concept_count: number;
    proposed_concept_count: number;
  };

  depth: DepthIndicator;

  enrichment_status: EnrichmentStatus;
};
```

Evaluation hooks are content-level replayability metadata only.

Evaluation hooks do not execute evaluation.

Evaluation hooks do not define scoring logic.

LOCKED.

---

# Limitations

```ts
type QuarterUnderstandingLimitations = {
  trust_dimension_gaps: TrustDimension[];
};
```

Trust dimension gaps are Quarter Understanding-owned interpretation limitations
derived from Trust Signals `missing_dimensions`.

When Trust Signals enrichment is absent:

```text
trust_dimension_gaps must include every Trust Dimension.
```

When Trust Signals enrichment is present:

```text
trust_dimension_gaps must match Trust Signals missing_dimensions.
```

Investor Intelligence must consume these limitations when producing Q3 trust
synthesis.

LOCKED.

---

# Artifact Content

```ts
type QuarterUnderstandingEvaluationMetadata =
  Record<string, unknown>;
```

```ts
type QuarterUnderstandingPromptLineage = {
  prompt_id: string;

  prompt_version: string;

  model_version: string;
};
```

```ts
type QuarterUnderstandingReplayabilityMetadata = {
  prompt_lineage: QuarterUnderstandingPromptLineage;

  prompt_version: string;

  model_version: string;

  concept_registry_version: string | null;

  input_hash: string;

  output_hash: string;

  evaluation_hooks: QuarterUnderstandingEvaluationHooks;

  evaluation_metadata: QuarterUnderstandingEvaluationMetadata;

  enrichment_status: EnrichmentStatus;

  depth_indicators: DepthIndicator;

  builder_version: string;

  calibration_contract_version: string;
};
```

Quarter Understanding owns this content-level replayability metadata.

Prompt Registry supplies prompt metadata. The builder records it in
`replayability_metadata`. Prompt output does not emit lineage.

This is not Artifact Framework lineage.

```ts
type QuarterUnderstandingArtifactContent = {
  company_id: string;

  period_id: string;

  understandings: Understanding[];

  proposed_concepts: ProposedConcept[];

  enrichment_status: EnrichmentStatus;

  depth_indicator: DepthIndicator;

  limitations: QuarterUnderstandingLimitations;

  confidence: QuarterUnderstandingConfidence;

  evaluation_hooks: QuarterUnderstandingEvaluationHooks;

  replayability_metadata: QuarterUnderstandingReplayabilityMetadata;
};
```

Artifact Framework owns:

```text
artifact identity
artifact metadata
framework lineage
artifact versioning
persistence
current pointers
archive/history
framework hashes
```

Quarter Understanding content must not model those responsibilities.

LOCKED.

---

# Consumer Contract

Investor Intelligence must inspect:

```text
depth_indicator
```

before generating conclusions.

Consumers may not assume enrichment exists.

Investor Intelligence must not generate longitudinal conclusions when:

```text
longitudinal_dimension = absent
```

Examples:

```text
Long-term momentum
Multi-period trend claims
Sustained improvement claims
```

are forbidden when longitudinal enrichment is absent.

Investor Intelligence must not assume concept-normalized understanding when:

```text
concept_registry.available = false
```

Consumers must respect concept depth limitations.

LOCKED.

---

# Depth Propagation Rule

A downstream artifact cannot have deeper depth than its shallowest required input.

LOCKED.

---

# Evaluation Requirements

Quarter Understanding should be evaluated for:

* Grounding quality
* Signal utilization
* Interpretation quality
* Concept compliance
* Evidence coverage
* Importance calibration
* Direction calibration

LOCKED.

---

# Replayability Metadata

Quarter Understanding must be replayable.

Required content-level replayability references:

```text
Company Knowledge
Business Signals
```

Optional content-level replayability references:

```text
Trust Signals
Topic Evolution
Concept Registry
```

Quarter Understanding may own:

```text
prompt lineage
prompt versions
model versions
input references
input hashes
output hashes
evaluation metadata
enrichment status
depth indicators
```

These are content-level replayability references and metadata.

They are not Artifact Framework lineage.

LOCKED.

---

# Final Principle

Quarter Understanding explains business developments.

Quarter Understanding does not decide whether investors should act.

Investor conclusions belong to Investor Intelligence.

LOCKED.
