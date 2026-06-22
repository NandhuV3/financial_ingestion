# Company Knowledge Candidate Builder Specification

Version: 2.0
Status: LOCKED
Owner: Builder Layer

Depends On:

* `012-artifact-framework-spec.md`
* `014-dependency-index-spec.md`
* `015-invalidation-engine-spec.md`
* `022-structured-intelligence-spec.md`
* `023-company-knowledge-builder-spec.md`
* `024-company-knowledge-governance-engine-spec.md`
* `025-company-knowledge-spec.md`

Consumes:

* Structured Intelligence Artifact
* current approved Company Knowledge Artifact, when present

Produces:

* `BuilderResult<CompanyKnowledgeCandidateArtifactContent>`

---

# Purpose

The Company Knowledge Candidate Builder deterministically converts eligible
Structured Intelligence values into governance candidates.

```text
Structured Intelligence
        +
Current approved Company Knowledge, when present
        ↓
Company Knowledge Candidate Builder
        ↓
BuilderResult<CompanyKnowledgeCandidateArtifactContent>
        ↓
Artifact Framework
        ↓
Company Knowledge Governance
```

---

# Ownership

The builder owns:

* dependency resolution and identity validation
* admission-matrix application
* deterministic field comparison
* stability classification
* extraction confidence propagation
* supporting-period reconciliation
* durability confidence computation
* recommendation and review-flag derivation
* evidence packaging
* candidate summary and confidence assembly
* replayability metadata
* content validation and assembly

The builder does not own:

* promotion, merge, retain, reject, or review decisions
* governance confidence
* Company Knowledge creation or mutation
* artifact identity, framework metadata, framework lineage, versioning,
  persistence, current pointers, archive/history, or framework hashes
* dependency registration or dependency graph state

Company Knowledge Governance owns decisions and approved knowledge creation.
Artifact Framework owns artifact lifecycle. Dependency Index owns dependency
registration and state.

---

# Input Contract

```typescript
type CompanyKnowledgeCandidateBuilderInput = {
  company_id: string;
  period_id: string;
  filing_id: string;
};

type CompanyKnowledgeCandidateDependencies = {
  structured_intelligence: StructuredIntelligenceArtifact;
  current_company_knowledge?: CompanyKnowledgeArtifact;
};
```

The builder resolves dependencies through the Dependency Index.

Validation must enforce:

* source artifact types
* Structured Intelligence company, period, and filing identity against the
  build target
* current Company Knowledge company identity, when present
* current approved status of Company Knowledge
* current-pointer resolution through the Artifact Framework/Dependency Index
* exact source value-reference reconciliation

Historical archives are not direct builder inputs. Supporting periods stored
on current approved Company Knowledge are sufficient for candidate assembly.

---

# Execution Flow

```text
1. Resolve Structured Intelligence
2. Resolve current approved Company Knowledge, if it exists
3. Validate dependency identities and source value references
4. Apply the Company Knowledge admission matrix
5. Map eligible Structured Intelligence paths to knowledge paths
6. Compare canonical source and current value hashes
7. Reconcile supporting periods
8. Compute durability confidence
9. Derive candidate recommendation and review requirement
10. Assemble candidate_changes
11. Compute candidate summary and confidence
12. Assemble replayability metadata
13. Validate full candidate content
14. Return BuilderResult<CompanyKnowledgeCandidateArtifactContent>
15. Artifact Framework performs lifecycle operations
```

---

# Canonical Output

The builder output must exactly match
`CompanyKnowledgeCandidateArtifactContent` from `023`:

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

The builder must not emit `proposals`, `candidate_fields`, or
`promotion_proposals`.

---

# Admission

The builder uses the exact admission matrix in
`025-company-knowledge-spec.md`.

* always-promotable fields are eligible immediately
* conditionally-promotable fields are emitted but cannot receive a promote or
  merge recommendation until durability requirements are met
* never-promotable fields are excluded and counted in the summary

Admission eligibility never authorizes a governance decision.

---

# First Population

When current Company Knowledge is absent:

* set `population_mode = "first_population"`
* do not fail dependency resolution
* treat eligible values as `new_information`
* use the current period as the initial supporting period
* apply the same durability formula and recommendation rules
* require governance approval before Company Knowledge creation

When current Company Knowledge exists:

* set `population_mode = "update"`
* compare against only the current approved artifact

---

# Determinism

The builder must use:

* canonical JSON hashing
* stable field-path mappings
* sorted unique supporting periods
* sorted unique evidence references
* candidate ordering by `field_path`, then `candidate_id`
* contract-owned stability and supporting-period constants

No LLM or semantic classification call is allowed.

---

# Confidence

The builder computes:

* per-candidate extraction confidence
* per-candidate durability confidence
* artifact-level candidate confidence

All formulas are defined in `023`. Validation must independently recompute and
reconcile every value.

The builder must not produce `governance_confidence`.

---

# Replayability

The builder records:

```typescript
type CompanyKnowledgeCandidateReplayabilityMetadata = {
  structured_intelligence_ref: string;
  current_company_knowledge_ref: string | null;
  admission_rules_version: string;
  input_hash: string;
  output_hash: string;
};
```

Stable hashing must cover all dependency content used by candidate generation.
This replayability metadata is not Artifact Framework lineage.

---

# Governance Handoff

Governance consumes the persisted candidate artifact and produces governance
decisions.

The builder must not:

* auto-create approved Company Knowledge
* apply a promotion or merge
* mutate current Company Knowledge
* write governance confidence
* bypass review requirements

---

# Dependency and Invalidation Boundary

The builder emits dependency references in `BuilderResult`. Dependency Index
owns registration, graph management, and stale state.

Candidate invalidation inputs are:

* Structured Intelligence content/version change
* current approved Company Knowledge content/version change
* admission rules version change
* stability or durability contract change
* deterministic comparison or confidence rule change

Candidate artifacts are governance inputs, not canonical downstream Company
Knowledge dependencies.

---

# Error Categories

```typescript
type CompanyKnowledgeCandidateBuilderError =
  | "STRUCTURED_INTELLIGENCE_MISSING"
  | "DEPENDENCY_IDENTITY_MISMATCH"
  | "CURRENT_KNOWLEDGE_INVALID"
  | "SOURCE_REFERENCE_RECONCILIATION_FAILURE"
  | "ADMISSION_MAPPING_FAILURE"
  | "DURABILITY_RECONCILIATION_FAILURE"
  | "CANDIDATE_VALIDATION_FAILURE";
```

Persistence and framework recovery errors remain owned by Artifact Framework.

---

# Architectural Invariants

1. `candidate_changes` is the only candidate collection.
2. The builder is deterministic and uses no LLM.
3. Structured Intelligence is the source of candidate values.
4. Current approved Company Knowledge is optional only for first population.
5. The builder proposes; governance decides.
6. Durability and extraction confidence remain separate.
7. Never-promotable fields never reach governance as candidates.
8. The builder returns `BuilderResult`.
9. Artifact Framework owns lifecycle mechanics.
10. Dependency Index owns registration and dependency state.

End of Specification.
