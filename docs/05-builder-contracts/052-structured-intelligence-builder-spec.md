# Structured Intelligence Builder Specification

Version: 2.0
Status: LOCKED
Owner: Builder Layer

Depends On:

* `012-artifact-framework-spec.md`
* `013-prompt-registry-spec.md`
* `014-dependency-index-spec.md`
* `015-invalidation-engine-spec.md`
* `022-structured-intelligence-spec.md`
* `042-structured-intelligence-prompt-contract.md`

Consumes:

* Filing
* Themes Artifact

Produces:

* `BuilderResult<StructuredIntelligenceArtifactContent>`

---

# Purpose

The Structured Intelligence Builder orchestrates governed prompt execution for
one Filing and its canonical Themes artifact.

```text
Filing + Themes
      ↓
Structured Intelligence Builder
      ↓
BuilderResult<StructuredIntelligenceArtifactContent>
      ↓
Artifact Framework
```

Topic Assignment and Topic Evolution are not dependencies and must not be
available to the prompt context.

---

# Ownership

The builder owns:

* dependency resolution and validation
* deterministic context assembly
* Prompt Registry resolution
* governed LLM execution
* response parsing
* output validation
* confidence computation
* deterministic value-reference generation
* replayability metadata generation
* evaluation hook assembly
* artifact content assembly

The governed prompt owns:

* filing interpretation
* generation of `StructuredUnderstanding`

Artifact Framework owns:

* artifact identity and type registration
* framework metadata and framework lineage
* artifact versioning
* framework hashes
* persistence
* current pointer
* archive/history

Dependency Index owns:

* dependency registration
* dependency graph state
* invalidation dependency state

The builder must not persist, version, register dependencies, or create
framework lineage.

---

# Input Contract

```typescript
type StructuredIntelligenceBuilderInput = {
  company_id: string;
  period_id: string;
  filing_id: string;
};

type StructuredIntelligenceDependencies = {
  filing: FilingArtifact;
  themes: ThemesArtifact;
};
```

The builder must validate:

* Filing artifact type
* Themes artifact type
* company identity against `company_id`
* period identity against `period_id`
* filing identity against `filing_id`
* Filing and Themes identity consistency
* dependency freshness through the Dependency Index

Missing or mismatched required dependencies are build failures.

---

# Forbidden Inputs

The builder and prompt context must not consume:

* Topic Assignment
* Topic Evolution
* prior Structured Intelligence
* Company Knowledge
* Quarter Change
* Business Signals
* Trust artifacts
* Quarter Understanding
* Investor Intelligence
* market data or external knowledge

---

# Execution Flow

```text
1. Resolve Filing and Themes through Dependency Index
2. Validate artifact types and business identities
3. Resolve the Structured Intelligence prompt through Prompt Registry
4. Assemble deterministic Filing + Themes context
5. Execute the pinned model at temperature 0
6. Parse exact-schema StructuredUnderstanding output
7. Validate evidence grounding and ownership boundaries
8. Generate deterministic StructuredValueReference entries
9. Compute StructuredIntelligenceConfidence
10. Assemble replayability metadata and evaluation hooks
11. Validate full StructuredIntelligenceArtifactContent
12. Return BuilderResult<StructuredIntelligenceArtifactContent>
13. Artifact Framework performs lifecycle operations
```

No builder step may perform persistence or dependency registration.

---

# Prompt Resolution and Execution

The prompt must be resolved from Prompt Registry. Prompt content must not be
embedded in builder code.

```typescript
type StructuredPromptContext = {
  filing: {
    filing_id: string;
    company_id: string;
    period_id: string;
    filing_type: string;
    filing_content: string;
    evidence_catalog: EvidenceReference[];
  };
  themes: CanonicalTheme[];
};
```

Context arrays and evidence catalogs must use stable ordering before hashing
and prompt execution.

Execution requirements:

```text
temperature = 0
pinned prompt version
pinned model version
structured JSON output
```

The prompt may emit only `StructuredUnderstanding`. It must not emit status,
confidence, value references, replayability metadata, evaluation hooks,
framework metadata, or framework lineage.

---

# Response Parsing

The response parser must:

* parse JSON only
* reject malformed JSON
* enforce the exact `StructuredUnderstanding` schema from `022`
* reject unknown fields
* reject builder-owned or framework-owned fields
* require at least one valid evidence reference for every emitted value
* reject evidence references absent from the supplied Filing/Theme evidence
  catalog

Cast-based parsing is prohibited.

---

# Content Assembly

The builder must produce exactly:

```typescript
type StructuredIntelligenceArtifactContent = {
  artifact_type: "structured_intelligence";
  company_id: string;
  period_id: string;
  filing_id: string;
  status: StructuredIntelligenceStatus;
  understanding: StructuredUnderstanding;
  value_references: StructuredValueReference[];
  confidence: StructuredIntelligenceConfidence;
  replayability_metadata: StructuredIntelligenceReplayabilityMetadata;
  evaluation_hooks: StructuredIntelligenceEvaluationHooks;
};
```

All nested types and field semantics are defined only by
`022-structured-intelligence-spec.md`.

---

# Status Assembly

The builder owns deterministic status assembly:

* `complete`: all required singleton fields are present and all ten top-level
  understanding fields are populated.
* `partial`: at least one grounded value exists, but one or more top-level
  fields are absent.
* `insufficient_filing`: no grounded business value can be emitted.

An `insufficient_filing` artifact must contain empty collections, null
singletons, no value references, zero confidence components except
`hallucination_risk = 0`, and replayability metadata.

---

# Value References

The builder generates and validates `StructuredValueReference` entries exactly
as defined in `022`.

Requirements:

* one reference per emitted comparable value
* no reference for absent values
* stable field paths
* stable canonical hashing
* sorted and deduplicated evidence references
* deterministic ordering
* no duplicate or orphaned references

---

# Confidence

The builder computes the sole canonical
`StructuredIntelligenceConfidence` model from `022`:

```typescript
type StructuredIntelligenceConfidence = {
  overall: number;
  evidence_coverage: number;
  field_completeness: number;
  theme_utilization: number;
  hallucination_risk: number;
};
```

Validation must independently recompute all components and reject mismatches.
Prompt-supplied confidence is forbidden.

---

# Replayability

The builder records:

```typescript
type StructuredIntelligenceReplayabilityMetadata = {
  prompt_id: string;
  prompt_version: string;
  model_version: string;
  temperature: 0;
  filing_input_hash: string;
  themes_input_hash: string;
  context_hash: string;
  output_hash: string;
  evaluation_version: string;
};
```

The hashes must use stable canonical serialization. `output_hash` covers the
builder-owned content excluding `replayability_metadata.output_hash` itself.

This metadata is content-level replayability information, not Artifact
Framework lineage.

---

# Evaluation

The builder assembles the evaluation hooks defined in `022`. Evaluation
failures are observable validation/evaluation failures; they do not authorize
the builder to persist, delete, or mutate an artifact.

---

# Invalidation and Dependencies

The builder emits dependency references for Filing and Themes in its
`BuilderResult`. The Dependency Index registers and manages those references.

Structured Intelligence invalidation inputs are:

* Filing version/content change
* Themes version/content change
* prompt version change
* model version change
* deterministic context, validation, confidence, or value-reference rule
  version change

Topic Assignment and Topic Evolution must not appear in dependency references
or invalidation triggers.

---

# Error Categories

```typescript
type StructuredIntelligenceBuilderError =
  | "DEPENDENCY_MISSING"
  | "DEPENDENCY_IDENTITY_MISMATCH"
  | "PROMPT_RESOLUTION_FAILURE"
  | "PROMPT_EXECUTION_FAILURE"
  | "RESPONSE_PARSE_FAILURE"
  | "OUTPUT_VALIDATION_FAILURE"
  | "EVIDENCE_RECONCILIATION_FAILURE"
  | "VALUE_REFERENCE_RECONCILIATION_FAILURE"
  | "CONFIDENCE_RECONCILIATION_FAILURE";
```

Retries, persistence recovery, and dependency state transitions remain owned
by their platform frameworks.

---

# Architectural Invariants

1. Filing and Themes are the only dependencies.
2. Topic Assignment and Topic Evolution are independent.
3. Prompt Registry owns prompt content.
4. The governed prompt owns interpretation.
5. The builder owns orchestration and deterministic content assembly.
6. The builder returns `BuilderResult<StructuredIntelligenceArtifactContent>`.
7. Artifact Framework owns lifecycle, persistence, versioning, framework
   lineage, and framework hashes.
8. Dependency Index owns registration and graph state.
9. Every emitted value and value reference must reconcile.
10. Builder confidence and replayability metadata must be deterministic.

End of Specification.
