# Structured Intelligence Specification

Version: 2.0
Status: LOCKED
Owner: Business Understanding Layer

---

# Purpose

Structured Intelligence answers:

```text
What does this filing tell us about the business?
```

It transforms the current Filing and its Themes into evidence-grounded,
filing-scoped business understanding.

---

# Architectural Position

```text
Filing + Themes
      ↓
Structured Intelligence
      ├──→ Company Knowledge Candidate
      └──→ Quarter Change
               ↑
     Prior Structured Intelligence
```

The topic chain is independent:

```text
Themes → Topic Assignment → Topic Evolution
```

Topic Assignment and Topic Evolution are not Structured Intelligence inputs.

---

# Ownership

Structured Intelligence owns:

* filing-scoped business understanding
* evidence-grounded structured claims
* per-claim extraction confidence
* deterministic value references used by Quarter Change
* replayability metadata for its own generation

Structured Intelligence does not own:

* durable Company Knowledge
* topic normalization or topic evolution
* cross-period comparison
* trust assessment
* Business Signals
* investor conclusions or recommendations
* artifact identity, framework metadata, framework lineage, versioning,
  persistence, current pointers, archive/history, or framework hashes

Artifact Framework owns the artifact lifecycle responsibilities listed above.

---

# Inputs

```typescript
type StructuredIntelligenceInputs = {
  filing: FilingArtifact;
  themes: ThemesArtifact;
};
```

Both inputs must represent the same company, period, and filing.

No other input is allowed. In particular, Structured Intelligence must not
consume Topic Assignment, Topic Evolution, prior filings, Company Knowledge,
Business Signals, Trust artifacts, market data, or external knowledge.

---

# Artifact Content

The builder returns:

```typescript
BuilderResult<StructuredIntelligenceArtifactContent>
```

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

type StructuredIntelligenceStatus =
  | "complete"
  | "partial"
  | "insufficient_filing";
```

Artifact Framework wraps this content with identity, framework metadata,
framework lineage, versioning, persistence, current-pointer, archive, and
framework-hash mechanics.

---

# Structured Understanding

```typescript
type StructuredUnderstanding = {
  business_model: BusinessModelUnderstanding | null;
  products: ProductUnderstanding[];
  customers: CustomerUnderstanding[];
  revenue_model: RevenueModelUnderstanding | null;
  revenue_drivers: RevenueDriverUnderstanding[];
  competitive_positioning: CompetitiveUnderstanding[];
  strategic_priorities: StrategicPriorityUnderstanding[];
  management_focus: ManagementFocusUnderstanding[];
  risks: RiskUnderstanding[];
  dependencies: DependencyUnderstanding[];
};
```

Every emitted claim requires at least one filing evidence reference. Missing
information is represented by `null` for singleton fields and `[]` for
collections. Placeholder or guessed claims are forbidden.

```typescript
type GroundedUnderstanding = {
  confidence: number;
  evidence_refs: string[];
};

type BusinessModelUnderstanding = GroundedUnderstanding & {
  summary: string;
  value_creation: string;
};

type ProductUnderstanding = GroundedUnderstanding & {
  product_name: string;
  description: string;
  importance: "high" | "medium" | "low";
};

type CustomerUnderstanding = GroundedUnderstanding & {
  customer_segment: string;
  description: string;
};

type RevenueModelUnderstanding = GroundedUnderstanding & {
  summary: string;
  recurring_components: string[];
  transactional_components: string[];
};

type RevenueDriverUnderstanding = GroundedUnderstanding & {
  driver: string;
  explanation: string;
};

type CompetitiveUnderstanding = GroundedUnderstanding & {
  position: string;
  supporting_reasoning: string;
};

type StrategicPriorityUnderstanding = GroundedUnderstanding & {
  priority: string;
  rationale: string;
};

type ManagementFocusUnderstanding = GroundedUnderstanding & {
  focus_area: string;
  explanation: string;
};

type RiskUnderstanding = GroundedUnderstanding & {
  risk: string;
  explanation: string;
};

type DependencyUnderstanding = GroundedUnderstanding & {
  dependency: string;
  explanation: string;
};
```

All confidence values are normalized to `0 <= value <= 1`.

---

# Filing Scope and Promotion Eligibility

All Structured Intelligence fields are filing-scoped. Promotion eligibility
does not make a field durable and does not authorize promotion.

| Structured Intelligence field | Filing-scoped | Company Knowledge eligibility |
|---|---:|---|
| `business_model` | Yes | Always promotable |
| `products` | Yes | Always promotable |
| `customers` | Yes | Conditionally promotable |
| `revenue_model` | Yes | Always promotable as Company Knowledge `revenue_structure` |
| `revenue_drivers` | Yes | Conditionally promotable |
| `competitive_positioning` | Yes | Conditionally promotable |
| `strategic_priorities` | Yes | Conditionally promotable |
| `management_focus` | Yes | Conditionally promotable |
| `dependencies` | Yes | Conditionally promotable |
| `risks` | Yes | Never promotable |

`risks` remain filing-specific risk characterization. Company Knowledge must
not store them as durable truth.

---

# Deterministic Value References

Every comparable Structured Intelligence value must have one reference:

```typescript
type StructuredValueReference = {
  value_ref: string;
  field_path: string;
  value_hash: string;
  evidence_refs: string[];
};
```

References are required for:

* `business_model` when present
* each `products` item
* each `customers` item
* `revenue_model` when present
* each `revenue_drivers` item
* each `competitive_positioning` item
* each `strategic_priorities` item
* each `management_focus` item
* each `risks` item
* each `dependencies` item

## Field Paths

Singleton paths are:

```text
understanding.business_model
understanding.revenue_model
```

Collection paths use the normalized primary label:

```text
understanding.products[product_name=<normalized>]
understanding.customers[customer_segment=<normalized>]
understanding.revenue_drivers[driver=<normalized>]
understanding.competitive_positioning[position=<normalized>]
understanding.strategic_priorities[priority=<normalized>]
understanding.management_focus[focus_area=<normalized>]
understanding.risks[risk=<normalized>]
understanding.dependencies[dependency=<normalized>]
```

Normalization is deterministic: Unicode NFKC normalization, trim, collapse
internal whitespace, and lowercase. The normalized label is URI-encoded in the
field path. It is used only for identity and does not rewrite the emitted
value.

Normalized primary labels must be unique within each collection. A duplicate
normalized label is a validation failure; positional suffixes are forbidden.

## Hash and Reference Generation

`value_hash` is the stable hash of the canonical JSON value excluding
`confidence` and `evidence_refs`.

Canonical JSON recursively sorts object keys, applies Unicode NFKC
normalization to strings, removes undefined fields, and sorts and deduplicates
set-like arrays.

`evidence_refs` are sorted, deduplicated filing evidence references copied from
the source value.

`value_ref` is:

```text
structured-value:<stableHash({
  company_id,
  period_id,
  filing_id,
  field_path,
  value_hash
})>
```

Value references are sorted by `field_path`, then `value_ref`.

The validator must reconcile every reference to exactly one emitted value,
verify its hash and evidence references, and reject missing, duplicate,
or orphaned references.

---

# Status Calculation

```text
no emitted grounded values
→ insufficient_filing

at least one emitted grounded value and fewer than ten populated top-level fields
→ partial

all ten top-level fields populated
→ complete
```

An `insufficient_filing` artifact emits no value references and numeric
confidence components are `0`.

---

# Confidence Model

The builder owns confidence computation. Prompt output must not emit artifact
confidence.

```typescript
type StructuredIntelligenceConfidence = {
  overall: number;
  evidence_coverage: number;
  field_completeness: number;
  theme_utilization: number;
  hallucination_risk: "not_assessed";
};
```

Definitions:

* `evidence_coverage`: emitted values with valid evidence divided by emitted
  values; `0` when no values are emitted.
* `field_completeness`: populated top-level understanding fields divided by the
  ten defined top-level fields. A singleton is populated when non-null; a
  collection is populated when it contains at least one item.
* `theme_utilization`: themes whose evidence excerpt hashes intersect the union
  of emitted `evidence_refs`, divided by available themes; `0` when no themes
  are available. Theme IDs do not count as evidence references.
* `hallucination_risk`: always `"not_assessed"` in V1. Semantic claim-support
  assessment is deferred.
* `overall`: arithmetic mean of `evidence_coverage`, `field_completeness`, and
  `theme_utilization`.

All components are rounded to four decimals and must be recomputed by
validation.

---

# Replayability Metadata

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

This is builder-owned replayability metadata. It is not Artifact Framework
lineage and does not replace framework-owned hashes.

Prompt and model versions must be pinned. Context assembly, value-reference
ordering, evidence ordering, and output hashing must be deterministic.

---

# Evaluation Hooks

```typescript
type StructuredIntelligenceEvaluationHooks = {
  schema_compliance: number;
  field_coverage: number;
  evidence_coverage: number;
  theme_utilization: number;
  unsupported_claim_count: "not_assessed";
};
```

Evaluation hooks are content-level observability fields. They do not own
evaluation policy or Artifact Framework metadata.

V1 does not perform semantic claim-support validation.

---

# Invalidation

Structured Intelligence becomes stale when:

* the Filing changes
* the Themes artifact changes
* the prompt version changes
* the pinned model version changes
* deterministic context or validation rules change

Topic Assignment and Topic Evolution changes do not invalidate Structured
Intelligence.

---

# Architectural Invariants

1. Structured Intelligence is filing-scoped.
2. Filing and Themes are its only inputs.
3. Topic Assignment and Topic Evolution are independent.
4. The governed prompt owns filing interpretation.
5. The builder owns orchestration, validation, confidence, value references,
   replayability metadata, evaluation hooks, and content assembly.
6. Artifact Framework owns lifecycle, identity, framework metadata, framework
   lineage, versioning, persistence, current pointers, archive/history, and
   framework hashes.
7. Every emitted value is evidence-grounded.
8. Every comparable value has one deterministic value reference.
9. Structured Intelligence never writes Company Knowledge.
10. Quarter Change is the only owner of cross-period business comparison.

End of Specification.
