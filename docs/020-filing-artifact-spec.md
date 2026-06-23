# Filing Artifact Specification

Version: 1.0
Status: LOCKED
Owner: Filing Content Layer

---

# Purpose

The Filing Artifact is the governed bridge between SEC filing extraction and
the Builder Intelligence Pipeline.

It answers:

```text
What normalized, validated, filing-scoped content is available for downstream
intelligence generation?
```

The Filing Artifact converts approved normalized section outputs into one
deterministic filing content payload. It is the canonical source of filing
content for all downstream intelligence builders.

---

# Architectural Position

```text
SEC Ingestion
      ↓
Extraction
      ↓
Deduplication
      ↓
Normalization
      ↓
Filing Artifact
      ↓
Themes
      ↓
Structured Intelligence
      ↓
Company Knowledge
      ↓
Quarter Change
      ↓
Business Signals
```

The Filing Artifact is the only approved content handoff between filing
preprocessing and the Builder Intelligence Pipeline.

Downstream builders must consume filing content from the Filing Artifact.
They must not reopen raw SEC HTML, normalized section files, processed section
files, or chunk files.

---

# Object Classification

The Filing Artifact is an Intelligence Artifact under the Platform Object
Model because it is a durable, replayable, downstream-consumed representation
of filing-scoped source content.

Artifact Framework owns:

* artifact identity
* framework metadata
* framework lineage
* artifact versioning
* persistence
* current pointer management
* archive and history
* framework-level artifact hashes

The Filing Artifact content contract does not own those mechanics.

`filing_hash` is a content-level source hash owned by the Filing Artifact. It
is distinct from the Artifact Framework `artifact_hash`.

---

# Ownership

The Filing Artifact owns:

* filing-scoped content assembly
* deterministic section ordering
* explicit section separation
* paragraph-boundary preservation
* filing content validation
* filing-type-aware completeness validation
* deterministic `filing_hash` generation
* replayability inputs for content assembly
* canonical filing evidence identity

The Filing Artifact does not own:

* SEC download or connector execution
* section-boundary discovery
* extraction heuristics
* deduplication algorithms
* normalization algorithms
* chunk generation
* Themes
* Topic Assignment
* Topic Evolution
* Structured Intelligence
* Company Knowledge
* Quarter Change
* Business Signals
* trust observations or interpretation
* investor conclusions or recommendations
* artifact persistence or lifecycle mechanics

SEC Ingestion owns acquisition of the source filing.

Extraction, deduplication, and normalization own their preprocessing outputs.

The Filing Artifact consumes those approved outputs and assembles canonical
filing content without reinterpreting them.

---

# Filing Artifact Content

The Filing Artifact builder returns:

```typescript
BuilderResult<FilingArtifactContent>
```

```typescript
type FilingArtifactContent = {
  filing_id: string;
  filing_type: string;
  filing_content: string;
  filing_hash: string;
  filing_period: string;
};
```

## Field Definitions

### `filing_id`

A stable business identifier for the source filing.

It must identify the same filing across deterministic replays. It must not be
the Artifact Framework `artifact_id`.

### `filing_type`

The canonical filing category used to select the filing-type-specific
completeness policy.

Examples include:

```text
10-Q
10-K
transcript
investor_presentation
```

### `filing_content`

The deterministic assembly of approved normalized source sections.

It must preserve paragraph boundaries and must not contain raw HTML, XBRL,
scripts, navigation content, or chunk metadata.

### `filing_hash`

The deterministic hash of the exact emitted `filing_content`.

### `filing_period`

The canonical reporting period associated with the filing and the downstream
build target.

---

# Canonical Content Source

## Current 10-Q Pipeline

For the current 10-Q pipeline, `filing_content` must be assembled only from:

```text
normalized/management-discussion.cleaned.txt
normalized/risk-factors.cleaned.txt
```

These files are the approved normalized outputs of:

```text
raw/latest-10q.html
      ↓
section extraction
      ↓
exact deduplication
      ↓
overlap deduplication
      ↓
normalization
```

## Forbidden Direct Sources

Raw SEC HTML must never be used directly as `filing_content`.

The following are not valid direct Filing Artifact content sources:

```text
raw/latest-10q.html
raw/latest-10q-index.html
processed/management-discussion.txt
processed/risk-factors.txt
processed/*.deduped.txt
processed/*.overlap-deduped.txt
chunks/management-discussion.chunks.json
chunks/risk-factors.chunks.json
```

Processed files are intermediate preprocessing outputs.

Chunk files are derived prompt-delivery units. Chunk boundaries may change
when chunking configuration changes and therefore must not define canonical
filing content or evidence identity.

---

# Deterministic Assembly

## 10-Q Section Order

The required order is:

```text
Management Discussion

Risk Factors
```

The assembly order must not depend on filesystem enumeration, map insertion
order, source discovery order, or asynchronous completion order.

## Canonical Section Separator

Sections must be separated using the following exact boundary:

```text
\n\n
```

Each normalized section must first be canonicalized by:

1. converting CRLF line endings to LF
2. applying Unicode NFKC normalization
3. trimming leading and trailing whitespace from the complete section
4. preserving internal paragraph boundaries as exactly one blank line
5. removing trailing whitespace from paragraph lines

The builder must not collapse paragraph boundaries into a single line.

The builder must not summarize, rewrite, classify, or infer content during
assembly.

The resulting 10-Q content is:

```text
canonical_management_discussion
+ "\n\n"
+ canonical_risk_factors
```

Identical normalized inputs must always produce byte-identical
`filing_content`.

---

# Evidence Identity Strategy

## Decision

The canonical Filing Artifact evidence unit is a normalized paragraph.

This decision is LOCKED.

Chunk-level evidence identity is not canonical.

## Canonical Paragraph

A canonical paragraph is one non-empty paragraph from an assembled normalized
section after:

1. Unicode NFKC normalization
2. CRLF-to-LF conversion
3. inline whitespace collapse
4. leading and trailing whitespace removal

Paragraph order must be preserved within each section.

## Evidence Reference

The canonical paragraph evidence reference is:

```text
filing-evidence:<sha256({
  filing_id,
  section,
  paragraph_ordinal,
  canonical_paragraph
})>
```

Where:

* `filing_id` identifies the source filing
* `section` is the canonical section identifier
* `paragraph_ordinal` is one-based within the canonical section
* `canonical_paragraph` is the normalized paragraph text

Canonical section identifiers for the current 10-Q pipeline are:

```text
management_discussion
risk_factors
```

Evidence references must be generated before prompt execution.

LLM output may select only evidence references supplied in the prompt context.
An LLM must never generate evidence identity.

## Why Paragraph-Level Evidence Is Canonical

Paragraph-level evidence:

* remains stable when chunk-size thresholds change
* preserves a precise connection to filing language
* permits multiple claims to cite the same paragraph when justified
* avoids treating prompt-delivery batching as source identity
* supports deterministic replay and evidence reconciliation
* provides finer provenance than section-level or filing-level hashes

Chunk-level identity is unsuitable because chunks are derived from batching
configuration and may combine or split paragraphs without any source-content
change.

## Downstream Consequences

### Themes

Themes must cite one or more canonical paragraph evidence references supplied
by the Filing Artifact evidence catalog.

Themes must not create hashes from free-form model excerpts.

### Structured Intelligence

Every emitted claim must preserve canonical paragraph evidence references
received through Filing and Themes context.

Structured Intelligence must reject unknown, theme-ID, or chunk-ID references.

### Company Knowledge

Company Knowledge Candidate generation must preserve the evidence references
associated with the Structured Intelligence values under governance review.

Promotion does not change the identity of the original filing evidence.

### Quarter Change

Quarter Change compares Structured Intelligence value references while
preserving the canonical filing evidence references attached to prior and
current values.

### Business Signals

Business Signals must preserve upstream evidence provenance. They must not
replace paragraph evidence with newly generated evidence identities.

---

# Filing Completeness Validation

Completeness validation must be selected through a filing-type policy.

The generic Filing Artifact builder must not contain scattered or implicit
10-Q assumptions.

```typescript
type FilingCompletenessPolicy = {
  filing_type: string;
  required_sections: CanonicalSectionId[];
  optional_sections: CanonicalSectionId[];
};
```

The active policy is resolved by exact canonical `filing_type`.

## 10-Q Policy

The current 10-Q policy requires:

```text
management_discussion
risk_factors
```

The builder must fail when either required section:

* is missing
* is not a string
* is empty before normalization
* becomes empty after normalization
* contains no canonical paragraphs

The builder must not emit a partial 10-Q Filing Artifact when a required
section is absent.

## Extensibility

Future filing types must define their own contract-owned completeness policy
before implementation.

Expected future policies include:

```text
10-K
transcript
investor_presentation
other approved filing categories
```

Adding a filing type requires:

1. a canonical filing-type identifier
2. required and optional section definitions
3. deterministic section order
4. source adapter mappings
5. completeness validation
6. evidence identity section identifiers

Unknown filing types must be rejected. They must not silently inherit the
10-Q policy.

---

# Validation

The Filing Artifact builder must validate:

* `company_id` matches the build target
* `filing_period` matches the build target period
* `filing_id` is non-empty and stable for the source filing
* `filing_type` has a registered completeness policy
* required source sections are present
* required source sections remain non-empty after canonicalization
* section identifiers are unique
* source section order matches the filing-type policy
* assembled content matches deterministic recomputation
* paragraph boundaries are preserved
* `filing_hash` matches the emitted `filing_content`
* source hashes and source metadata reconcile with replayability inputs

The builder must fail before artifact creation when validation fails.

Validation must not silently omit malformed required content.

---

# Hashing

`filing_hash` must be:

```text
sha256(filing_content)
```

The hash input is the UTF-8 byte representation of the exact emitted
`filing_content`.

The builder must independently recompute and validate `filing_hash` before
returning its result.

`raw_html_hash` is a replayability input describing the acquired source. It
must remain lineage input metadata and must not become `filing_hash`.

The following hashes are distinct:

| Hash | Owner | Purpose |
|---|---|---|
| `raw_html_hash` | Ingestion/replayability input | Identifies downloaded SEC HTML |
| normalized section hash | Preprocessing/replayability input | Identifies canonical builder inputs |
| `filing_hash` | Filing Artifact content | Identifies assembled filing content |
| `artifact_hash` | Artifact Framework | Identifies complete artifact content |

These hashes must not be substituted for one another.

---

# Replayability

The Filing Artifact builder is deterministic and does not use an LLM.

Replayability inputs must include:

* builder version
* filing completeness policy version
* content assembly rule version
* evidence identity rule version
* filing metadata reference
* raw HTML hash
* Management Discussion normalized-section hash
* Risk Factors normalized-section hash

Artifact Framework lineage records source artifact or source-input
relationships. Content-level replayability inputs remain distinct from
Artifact Framework lineage.

For identical normalized section inputs and identical contract versions, the
builder must produce:

* identical canonical paragraphs
* identical paragraph evidence references
* identical `filing_content`
* identical `filing_hash`
* identical `BuilderResult<FilingArtifactContent>`

Generated timestamps, artifact IDs, artifact versions, persistence state, and
current-pointer state are Artifact Framework concerns and are excluded from
builder-output determinism.

---

# Builder Boundary

The Filing Artifact builder owns:

* input validation
* filing-type policy resolution
* deterministic section canonicalization
* deterministic section assembly
* paragraph evidence catalog generation
* filing completeness validation
* `filing_hash` generation
* replayability input emission
* `FilingArtifactContent` assembly

The builder returns:

```typescript
BuilderResult<FilingArtifactContent>
```

The builder must not:

* read arbitrary filesystem paths
* download SEC content
* persist artifacts directly
* assign artifact IDs
* assign artifact versions
* manage current pointers
* register dependencies
* generate Themes or other intelligence

---

# Extraction Adapter

The extraction adapter is responsible for translating existing preprocessing
outputs into typed Filing Artifact builder inputs.

For the current 10-Q pipeline it must:

1. resolve the company and filing date
2. read `metadata/filing.json`
3. read `raw/latest-10q.html` only to calculate or verify `raw_html_hash`
4. read `normalized/management-discussion.cleaned.txt`
5. read `normalized/risk-factors.cleaned.txt`
6. calculate normalized-section input hashes
7. map metadata to `filing_id`, `filing_type`, and `filing_period`
8. invoke the Filing Artifact builder through the Builder Framework

The adapter does not own content assembly, completeness decisions, evidence
identity, filing hash generation, artifact identity, or persistence.

---

# Integration Plan

## Shared Contract

Create:

```text
contracts/artifacts/filing-artifact-content.ts
```

Move `FilingArtifactContent` ownership from Structured Intelligence-local
types into this shared contract.

Themes, Structured Intelligence, and pipeline orchestration must import the
shared contract.

## Filing Artifact Builder

Create:

```text
builders/filing-artifact-builder/contract.ts
builders/filing-artifact-builder/types.ts
builders/filing-artifact-builder/completeness-policy.ts
builders/filing-artifact-builder/content-assembler.ts
builders/filing-artifact-builder/evidence-catalog.ts
builders/filing-artifact-builder/replayability.ts
builders/filing-artifact-builder/validator.ts
builders/filing-artifact-builder/builder.ts
builders/filing-artifact-builder/tests/filing-artifact-builder.test.ts
```

## Extraction Adapter

Create:

```text
builders/filing-artifact-builder/extracted-filing.adapter.ts
```

This adapter reads approved extraction outputs and constructs typed builder
inputs. It must not create artifacts directly.

## Builder Registration

Modify:

```text
builders/upstream-pipeline/register-builders.ts
```

Register the Filing Artifact builder with:

```text
builder_type: filing-artifact
artifact_type: filing
```

## Pipeline Orchestration

Modify:

```text
builders/upstream-pipeline/run-upstream-pipeline.ts
src/pipeline/pipeline-pre-ai.ts
```

The pipeline must execute:

```text
normalization
→ extraction adapter
→ Filing Artifact builder
→ Artifact Framework creation
→ Themes Builder
```

The generated Filing Artifact must be passed unchanged to Themes and
Structured Intelligence.

## Demo Migration

Modify:

```text
builders/upstream-pipeline/run-demo.ts
```

The demo must support loading approved normalized extraction outputs and
generating the Filing Artifact through the governed builder path.

The handwritten fixture:

```text
builders/upstream-pipeline/fixtures/demo-filing-artifact.json
```

must no longer be the default source for production-like demo execution.

It may remain only as an isolated test fixture where explicitly required.

---

# Required Test Coverage

Tests must verify:

* deterministic 10-Q section ordering
* exact section separator behavior
* paragraph-boundary preservation
* required Management Discussion validation
* required Risk Factors validation
* rejection of empty normalized sections
* rejection of unknown filing types
* deterministic `filing_content`
* deterministic `filing_hash`
* distinction between `raw_html_hash` and `filing_hash`
* deterministic paragraph evidence references
* evidence stability when chunk-size configuration changes
* replayability for identical normalized inputs
* company, filing, and period identity validation
* Builder Framework execution
* Artifact Framework persistence ownership
* end-to-end handoff from normalized sections to Themes

---

# Architectural Invariants

The following rules are strict and LOCKED:

1. The Filing Artifact is the canonical filing content source for downstream
   intelligence builders.
2. Downstream intelligence builders must not read raw SEC HTML or extraction
   files directly.
3. Raw SEC HTML must never become `filing_content`.
4. Chunk files must never become the canonical `filing_content` source.
5. Chunk IDs must never become canonical filing evidence identity.
6. The current 10-Q Filing Artifact must use normalized Management Discussion
   and Risk Factors content.
7. The current 10-Q Filing Artifact must reject missing or empty required
   sections.
8. Filing-type completeness requirements must be contract-owned policies.
9. Unknown filing types must be rejected rather than inheriting 10-Q rules.
10. Section order and separators must be deterministic.
11. Paragraph boundaries must be preserved.
12. Paragraph-level evidence identity is canonical.
13. Evidence references must be generated deterministically before prompt
    execution.
14. LLM output must never create evidence identity.
15. `filing_hash` must be calculated from the exact emitted
    `filing_content`.
16. `raw_html_hash` must remain a replayability input and must not be used as
    `filing_hash`.
17. Identical normalized inputs and contract versions must produce identical
    builder output.
18. The Filing Artifact builder must not generate intelligence owned by
    Themes or downstream layers.
19. The Filing Artifact builder must return
    `BuilderResult<FilingArtifactContent>`.
20. Artifact Framework exclusively owns artifact identity, framework
    metadata, framework lineage, versioning, persistence, current pointers,
    archive/history, and framework-level hashes.
21. Dependency registration and dependency graph state remain owned by the
    Dependency Index.
22. No future builder may bypass the Filing Artifact to consume preprocessing
    outputs directly.

LOCKED.
