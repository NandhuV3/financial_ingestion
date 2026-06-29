# Filing Artifact Specification

Version: 1.0
Status: LOCKED
Owner: Filing Artifact Layer

## Layer Contract Summary

Inputs

* Approved Normalized Filing

Outputs

* Filing Artifact

Primary Consumer

* Evidence Identity Layer

Execution Type

* Deterministic

---

# Purpose

The Filing Artifact is the canonical preserved filing representation.

It answers:

```text
What does this layer own?
```

It owns preservation of normalized filing content into one deterministic
filing artifact.

It establishes the canonical preserved filing consumed by downstream layers.

The Filing Artifact contains no intelligence.

It performs no interpretation.

---

# Architectural Position

```text
SEC Filing
      ↓
Extraction
      ↓
Normalization
      ↓
Filing Artifact
      ↓
Evidence Identity
      ↓
Themes Quality
      ↓
Themes Builder
      ↓
Topic Assignment
      ↓
Structured Intelligence
      ↓
Company Knowledge
      ↓
Business Signals
      ↓
Quarter Understanding
      ↓
Investor Intelligence
```

The Filing Artifact is the only approved content handoff between filing
preprocessing and downstream platform layers.

Downstream layers must consume filing content from the Filing Artifact or from
approved artifacts derived from it.

They must not reopen raw SEC HTML, normalized section files, processed section
files, or chunk files.

---

# Platform Object Classification

The Filing Artifact is a Platform Foundation Artifact.

Reason:

The Filing Artifact contains no intelligence.

It preserves canonical filing structure and normalized filing content so that
downstream platform layers can produce governed evidence, quality evaluation,
observations, and intelligence.

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

# Canonical Preservation Principle

Canonical preservation occurs exactly once.

The Filing Artifact layer is the only layer that preserves normalized filing
content into a canonical filing artifact.

No downstream layer may reconstruct filing structure.

No downstream layer may reorder preserved paragraphs.

No downstream layer may reopen preprocessing outputs to create an alternate
filing content representation.

All downstream layers consume approved upstream artifacts.

This principle prevents replay ambiguity and preserves one authoritative
filing-content boundary for the platform.

---

# Ownership Boundary

The Filing Artifact layer owns only canonical preservation.

Responsibilities end after producing the canonical Filing Artifact.

The Filing Artifact owns:

* canonical preservation
* canonical filing hierarchy
* normalized filing content
* filing-scoped content assembly
* deterministic section ordering
* explicit section separation
* paragraph-boundary preservation
* filing content validation
* filing-type-aware completeness validation
* deterministic `filing_hash` generation
* replayability inputs for content preservation
* filing metadata required to identify the preserved source filing

The Filing Artifact does not own:

* SEC download or connector execution
* section-boundary discovery
* extraction heuristics
* deduplication algorithms
* normalization algorithms
* chunk generation
* evidence identity
* evidence references
* evidence hashing
* evidence catalog construction
* Themes Quality
* Themes
* Topic Assignment
* Topic Evolution
* Structured Intelligence
* Company Knowledge
* Quarter Change
* Business Signals
* trust observations or interpretation
* Quarter Understanding
* Investor Intelligence
* investor conclusions or recommendations
* artifact persistence or lifecycle mechanics

SEC Ingestion owns acquisition of the source filing.

Extraction and Normalization own their preprocessing outputs.

Evidence Identity owns evidence units, evidence references, evidence catalog
construction, and evidence lineage.

Themes Quality owns structural quality evaluation for Themes.

Themes owns filing-scoped observation extraction.

The Filing Artifact consumes approved normalized outputs and assembles
canonical filing content without reinterpreting them.

---

# Forbidden Responsibilities

The Filing Artifact never:

* performs LLM reasoning
* creates evidence identities
* creates evidence references
* creates an evidence catalog
* detects Themes
* assigns Topics
* generates intelligence
* performs business understanding
* performs business interpretation
* performs investor interpretation
* evaluates trust
* compares periods
* promotes durable knowledge
* recommends actions

Any responsibility in this list belongs to a downstream layer or another
platform contract.

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

`filing_content` is preserved filing content.

It is not evidence identity.

It is not a Theme input boundary by itself.

Evidence Identity and Themes Quality define their own owned contracts for
downstream use.

### `filing_hash`

The deterministic hash of the exact emitted `filing_content`.

### `filing_period`

The canonical reporting period associated with the filing and the downstream
build target.

---

# Canonical Content Source

## Current Supported Filing Type

For the current 10-Q pipeline, `filing_content` must be assembled only from
approved normalized Management Discussion and Risk Factors content.

These normalized sections are the approved outputs of:

```text
raw filing
      ↓
extraction
      ↓
normalization
      ↓
Filing Artifact
```

The Filing Artifact does not own extraction or normalization. It consumes their
approved outputs.

## Forbidden Direct Sources

Raw SEC HTML must never be used directly as `filing_content`.

The following are not valid direct Filing Artifact content sources:

```text
raw SEC HTML
raw filing index files
processed extraction intermediates
deduplication intermediates
normalization intermediates not approved by policy
chunk files
prompt-delivery files
```

Processed files are intermediate preprocessing outputs.

Chunk files are derived prompt-delivery units. Chunk boundaries may change when
chunking configuration changes and therefore must not define canonical filing
content.

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

# Filing Completeness Validation

Completeness validation must be selected through a filing-type policy.

The Filing Artifact layer must not contain scattered or implicit 10-Q
assumptions.

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

The Filing Artifact must fail when either required section:

* is missing
* is not a string
* is empty before normalization
* becomes empty after normalization
* contains no preserved content

The Filing Artifact must not emit a partial 10-Q Filing Artifact when a
required section is absent.

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

Unknown filing types must be rejected. They must not silently inherit the
10-Q policy.

---

# Validation Philosophy

The Filing Artifact layer validates that preserved filing content is complete,
canonical, deterministic, and correctly scoped to the build target.

Validation includes:

* artifact identity `company_id` matches the build target
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

The layer must fail before artifact creation when validation fails.

Validation must not silently omit malformed required content.

Validation does not evaluate evidence grounding, Theme quality, business
meaning, trust, or investor relevance.

Those responsibilities belong to downstream specifications.

---

# Hashing

`filing_hash` must be:

```text
sha256(filing_content)
```

The hash input is the UTF-8 byte representation of the exact emitted
`filing_content`.

The layer must independently recompute and validate `filing_hash` before
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

Evidence hashes and evidence references are not owned by this specification.
They are defined by the Evidence Identity specification.

---

# Replayability

The Filing Artifact layer is deterministic and does not use an LLM.

Replayability is only about canonical filing preservation.

Replayability inputs must include:

* builder version
* filing completeness policy version
* content assembly rule version
* filing metadata reference
* raw HTML hash
* Management Discussion normalized-section hash
* Risk Factors normalized-section hash

Artifact Framework lineage records source artifact or source-input
relationships. Content-level replayability inputs remain distinct from
Artifact Framework lineage.

For identical normalized section inputs and identical contract versions, the
Filing Artifact layer must produce:

* identical preserved section ordering
* identical paragraph-boundary preservation
* identical `filing_content`
* identical `filing_hash`
* identical `BuilderResult<FilingArtifactContent>`

Generated timestamps, artifact IDs, artifact versions, persistence state, and
current-pointer state are Artifact Framework concerns and are excluded from
builder-output determinism.

Evidence identity replayability belongs to the Evidence Identity
specification.

---

# Builder Boundary

The Filing Artifact builder owns:

* input validation
* filing-type policy resolution
* deterministic section canonicalization
* deterministic section assembly
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
* create evidence identities
* create evidence references
* create an evidence catalog
* generate Themes
* assign Topics
* generate Structured Intelligence
* generate Company Knowledge
* generate Business Signals
* perform business understanding
* perform interpretation

The standard builder lifecycle, persistence sequence, lineage requirements,
and failure behavior are defined by the Builder Contract and Builder
Implementation Guide. This specification does not duplicate those contracts.

---

# Downstream Boundary

The Filing Artifact is a source artifact for downstream layers.

It does not define downstream behavior.

Downstream responsibilities are owned as follows:

* Evidence Identity defines evidence units, evidence references, evidence
  catalog construction, evidence hashing, and evidence lineage.
* Themes Quality defines structural quality objectives, quality metrics, and
  quality evaluation for Themes.
* Themes defines filing-scoped observation extraction.
* Topic Assignment defines classification of Themes into governed topics.
* Structured Intelligence defines business understanding.
* Company Knowledge defines governed durable knowledge.
* Business Signals defines deterministic observable business facts.
* Quarter Understanding defines business interpretation.
* Investor Intelligence defines ownership synthesis.

Downstream layers must not reconstruct Filing Artifact responsibilities in
order to satisfy their own contracts.

---

# Architectural Invariants

The following rules are strict and LOCKED:

1. The Filing Artifact is the canonical preserved filing content source for
   downstream platform layers.
2. Canonical preservation occurs exactly once.
3. The Filing Artifact is immutable.
4. Once produced, it is never modified.
5. Any change to preserved filing content results in a new artifact version.
6. Downstream layers must not reconstruct filing structure.
7. Downstream layers must not reorder preserved paragraphs.
8. Downstream layers must not read raw SEC HTML or preprocessing files
   directly.
9. Raw SEC HTML must never become `filing_content`.
10. Chunk files must never become the canonical `filing_content` source.
11. Chunk IDs must never define Filing Artifact identity.
12. The current 10-Q Filing Artifact must use normalized Management Discussion
   and Risk Factors content.
13. The current 10-Q Filing Artifact must reject missing or empty required
    sections.
14. Filing-type completeness requirements must be contract-owned policies.
15. Unknown filing types must be rejected rather than inheriting 10-Q rules.
16. Section order and separators must be deterministic.
17. Paragraph boundaries must be preserved.
18. `filing_hash` must be calculated from the exact emitted
    `filing_content`.
19. `raw_html_hash` must remain a replayability input and must not be used as
    `filing_hash`.
20. Identical normalized inputs and contract versions must produce identical
    builder output.
21. The Filing Artifact builder must not generate intelligence owned by
    Themes or downstream layers.
22. The Filing Artifact builder must not create evidence identities,
    evidence references, or evidence catalogs.
23. The Filing Artifact builder must return
    `BuilderResult<FilingArtifactContent>`.
24. Artifact Framework exclusively owns artifact identity, framework
    metadata, framework lineage, versioning, persistence, current pointers,
    archive/history, and framework-level hashes.
25. No future builder may bypass the Filing Artifact to consume preprocessing
    outputs directly.

LOCKED.

---

# References

This specification defines Filing Artifact ownership only.

Related architecture is defined by:

## Platform Foundation

* `001-layer-ownership.md`
* `005-builder-implementation-guide.md`
* `006-engineering-standards.md`

## Execution Layers

* `009-evidence-identity-spec.md`
* `010-themes-quality-spec.md`
* `011-themes-spec.md`

## Implementation Contracts

* `039-builder-contract.md`
