# Evidence Identity Specification

Version: 1.0
Status: LOCKED
Owner: Evidence Identity Layer

## Layer Contract Summary

Inputs

* Filing Artifact

Outputs

* Evidence Identity Artifact

Primary Consumer

* Themes Quality Layer

Execution Type

* Deterministic

---

# Purpose

The Evidence Identity layer is the canonical evidence ownership layer.

It answers:

```text
What does this layer own?
```

It owns deterministic mapping from preserved filing content to canonical
evidence identities.

The Evidence Identity layer owns:

* evidence identities
* evidence references
* evidence hashes
* canonical evidence units
* evidence catalog
* evidence lineage
* deterministic evidence mapping

It establishes the only approved evidence source consumed by downstream
layers.

Evidence Identity contains no intelligence.

It performs no LLM reasoning.

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

Evidence Identity begins immediately after Filing Artifact.

It consumes the canonical preserved filing produced by Filing Artifact.

It ends after producing deterministic evidence identities.

All downstream layers consume canonical evidence from Evidence Identity.

No downstream layer may reopen the Filing Artifact to generate new evidence
identities.

---

# Platform Object Classification

Evidence Identity is a Platform Foundation Artifact.

Reason:

Evidence Identity creates deterministic evidence units.

It contains no intelligence.

It enables downstream evidence grounding, auditability, and replayability
without performing observation extraction, business understanding, or
interpretation.

Artifact Framework owns:

* artifact identity
* framework metadata
* framework lineage
* artifact versioning
* persistence
* current pointer management
* archive and history
* framework-level artifact hashes

The Evidence Identity content contract does not own those mechanics.

Evidence hashes and evidence references are content-level evidence identity
fields owned by this specification. They are distinct from Artifact Framework
hashes and artifact identifiers.

---

# Input Boundary

The Evidence Identity layer consumes only the Filing Artifact.

It must never consume:

* raw SEC filings
* Extraction output
* Normalization output

The Filing Artifact is the only approved upstream input.

This preserves deterministic layer ownership and prevents upstream boundary
leakage.

---

# Canonical Evidence Principle

Evidence identity is established exactly once.

The Evidence Identity layer is the only layer that creates canonical evidence
identities for preserved filing content.

No downstream layer may:

* generate new evidence identities
* redefine evidence references
* replace evidence hashes
* reconstruct the evidence catalog
* treat chunk identifiers as evidence identities
* substitute raw paragraph text for evidence references

Every downstream layer consumes canonical evidence.

This principle prevents replay ambiguity and preserves one authoritative
evidence boundary for the platform.

---

# Ownership Boundary

Evidence Identity owns:

* canonical evidence unit
* evidence reference generation
* evidence hash generation
* evidence catalog construction
* evidence ordering
* evidence lineage
* deterministic evidence mapping
* evidence identity stability
* duplicate paragraph identity
* evidence reference validation rules

Evidence Identity does not own:

* SEC acquisition
* extraction
* normalization
* Filing Artifact preservation
* Themes Quality
* Themes
* Topic Assignment
* Topic Evolution
* Structured Intelligence
* Company Knowledge
* Quarter Change
* Business Signals
* trust intelligence
* Quarter Understanding
* Investor Intelligence
* investor conclusions or recommendations
* artifact persistence or lifecycle mechanics

Filing Artifact owns canonical filing preservation.

Evidence Identity consumes the Filing Artifact and produces canonical evidence.

Themes Quality owns structural quality evaluation.

Themes owns filing-scoped observation extraction.

Downstream layers consume evidence identities but do not define, rewrite, or
replace them.

---

# Forbidden Responsibilities

Evidence Identity never:

* preserves filings
* performs LLM reasoning
* extracts Themes
* assigns Topics
* generates intelligence
* performs business understanding
* performs business interpretation
* generates Company Knowledge
* generates Business Signals
* evaluates trust
* compares periods for business meaning
* performs investor reasoning
* recommends actions

Any responsibility in this list belongs to another platform layer or contract.

---

# Evidence Identity Content

## Evidence Identity Artifact

```text
Artifact Framework
    ├── artifact_id
    ├── artifact_version
    ├── framework_metadata
    ├── framework_lineage
    └── artifact_hash

↓

EvidenceIdentityContent
    ├── evidence catalog
    ├── evidence references
    ├── evidence hashes
    ├── evidence lineage
    └── deterministic evidence mapping
```

Artifact Framework owns artifact lifecycle.

Evidence Identity owns evidence content.

`artifact_hash` and `evidence_hash` are different concepts with different
ownership.

`artifact_hash` is owned by Artifact Framework and identifies complete
artifact content.

`evidence_hash` is owned by Evidence Identity and identifies normalized
paragraph content.

The Evidence Identity builder returns:

```typescript
BuilderResult<EvidenceIdentityContent>
```

```typescript
type EvidenceIdentityContent = {
  filing_id: string;
  filing_hash: string;
  entries: EvidenceCatalogEntry[];
};

type EvidenceCatalogEntry = {
  evidence_ref: string;
  evidence_hash: string;
  filing_id: string;
  section_name: string;
  paragraph_index: number;
  paragraph_text: string;
};
```

`EvidenceIdentityContent` is the canonical persisted source for evidence
identity.

It is not a Theme.

It is not a Topic.

It is not business understanding.

It is not investor interpretation.

---

# Canonical Evidence Unit

The canonical evidence unit is:

```text
Paragraph
```

This decision is LOCKED.

Paragraphs are derived from preserved Filing Artifact content. A paragraph is
the smallest evidence unit allowed in V1.

Themes, Structured Intelligence, Company Knowledge Candidates, Company
Knowledge, Quarter Change, Business Signals, Quarter Understanding, and
Investor Intelligence must never use chunk identities as evidence identities.

Chunks are prompt-delivery artifacts only.

Chunks may group paragraphs for bounded model input, but chunking must not
change evidence identity, evidence hashing, evidence ordering, or evidence
lineage.

---

# Evidence Unit Contract

## `evidence_ref`

The globally unique, filing-scoped reference consumed by downstream layers.

Every downstream evidence citation must use `evidence_ref`.

Evidence hashes, paragraph text, Theme IDs, chunk IDs, and artifact IDs do not
substitute for `evidence_ref`.

## `evidence_hash`

The content hash of the normalized paragraph text.

The same normalized paragraph text produces the same `evidence_hash`,
regardless of filing, section, position, storage location, prompt, model, or
chunking configuration.

## `filing_id`

The stable business identifier of the Filing Artifact source filing.

It is not the Artifact Framework `artifact_id`.

## `paragraph_index`

The one-based ordinal of the paragraph within its canonical section after
deterministic paragraph formation.

The index is scoped to the pair:

```text
filing_id + section_name
```

## `section_name`

The canonical section identifier defined by the active filing-type policy.

Section display labels are not evidence identity inputs.

Only canonical section identifiers are permitted.

## `paragraph_text`

The normalized paragraph text used to generate `evidence_hash`.

It is retained so evidence references remain independently auditable.

---

# Section Sources

Evidence identity generation is section-aware.

For the current supported filing type, allowed canonical sections are:

```text
management_discussion
risk_factors
```

These correspond to the approved normalized sections preserved by the Filing
Artifact.

Future filing types may define additional canonical sections, but they must
not change the evidence normalization, hash, reference, ordering, or lineage
semantics defined here.

Evidence Identity does not discover filing sections.

Evidence Identity does not infer headings or categories.

Section ownership comes from the approved Filing Artifact and filing-type
policy.

---

# Paragraph Formation

Evidence paragraphs must be formed from canonical preserved Filing Artifact
content before prompt delivery or chunking.

For each canonical section:

1. normalize line endings
2. split on one or more blank lines
3. normalize each resulting paragraph
4. remove empty paragraphs
5. preserve the remaining paragraph order
6. assign one-based `paragraph_index` values

Paragraph formation must not:

* summarize text
* split text using model output
* merge semantically related paragraphs
* infer headings or categories
* depend on chunk-size configuration
* depend on filesystem order
* evaluate business meaning

---

# Paragraph Normalization

Paragraph normalization must execute in this exact order:

1. normalize line endings from CRLF or CR to LF
2. apply Unicode NFKC normalization
3. replace all internal whitespace runs with one ASCII space
4. trim leading and trailing whitespace

Normalization occurs before hashing, reference generation, catalog creation,
validation, prompt delivery, and downstream consumption.

Therefore:

```text
Revenue increased.
```

and:

```text
Revenue    increased.
```

produce identical normalized paragraph text and identical `evidence_hash`
values.

Normalization must not:

* lowercase text
* remove punctuation
* remove numbers
* rewrite words
* perform stemming
* perform semantic canonicalization
* alter business meaning

---

# Evidence Hash

The canonical evidence hash is:

```text
evidence_hash = sha256(normalized_paragraph_text)
```

The hash input is the UTF-8 byte representation of the exact normalized
paragraph text.

Hash generation must be:

* deterministic
* content-based
* independent of storage location
* independent of artifact identity
* independent of prompt delivery
* independent of prompt and model versions
* independent of chunk boundaries

Identical normalized paragraph text must generate identical `evidence_hash`
values.

Different normalized paragraph text must generate a different
`evidence_hash`, subject only to the cryptographic collision properties of
SHA-256.

---

# Evidence Reference

The canonical evidence reference is:

```text
evidence:<stableHash({
  filing_id,
  section_name,
  paragraph_index,
  evidence_hash
})>
```

The exact reference input fields are:

```text
filing_id
section_name
paragraph_index
evidence_hash
```

No additional field may be added to the V1 reference hash input.

Evidence references must be:

* globally unique within the platform namespace
* deterministic
* reproducible from canonical filing content
* stable for identical source position and content
* generated before any prompt execution

LLMs must never generate evidence references.

---

# Evidence Catalog

The Evidence Catalog is the ordered set of all canonical evidence entries for
one Filing Artifact.

It must contain:

* exactly one entry for every canonical paragraph occurrence
* no duplicate `evidence_ref`
* no missing paragraph indexes within a section
* section names allowed by the filing-type policy
* one `filing_id` matching the source Filing Artifact
* one `filing_hash` matching the source Filing Artifact

## Catalog Ordering

Catalog entries must be ordered by:

1. canonical section order defined by the Filing Artifact filing-type policy
2. ascending `paragraph_index`
3. ascending `evidence_ref` as a deterministic tie-breaker

Filesystem order, object key order, asynchronous execution order, and model
output order must never determine catalog ordering.

The catalog must be generated before Themes Quality, Themes, or any other
LLM-assisted layer executes.

---

# Evidence Lineage

Evidence lineage is:

```text
Filing Artifact
→ canonical section
→ paragraph index
→ normalized paragraph text
→ evidence_hash
→ evidence_ref
```

Every downstream evidence reference must resolve to exactly one
`EvidenceCatalogEntry` in the referenced filing.

Evidence lineage must preserve:

* source `filing_id`
* source `filing_hash`
* canonical section
* paragraph position
* normalized paragraph content hash

Artifact Framework lineage remains separate from evidence lineage.

Framework lineage identifies artifact dependencies and generation context.

Evidence lineage identifies the exact filing statement supporting a claim.

An artifact dependency does not substitute for claim-level evidence
references.

---

# Evidence Ordering

Evidence ordering preserves filing-scoped source order.

Ordering must be deterministic for every execution.

Ordering must not depend on:

* filesystem enumeration
* object key order
* asynchronous completion order
* prompt delivery order
* LLM output order
* downstream artifact order

Evidence ordering is part of deterministic evidence mapping.

Downstream layers may filter or select evidence references, but they must not
redefine canonical evidence ordering.

---

# Identity Stability Rules

## Case 1: Formatting Changes Only

Examples include Unicode compatibility forms, line-ending differences, and
equivalent whitespace formatting.

Result:

```text
same normalized paragraph
→ same evidence_hash
→ same evidence_ref
```

## Case 2: Whitespace Changes Only

Result:

```text
same evidence identity
```

Whitespace differences removed by canonical normalization do not change
`evidence_hash` or `evidence_ref`.

## Case 3: Paragraph Text Changes

Result:

```text
new evidence_hash
→ new evidence_ref
```

Any content change that survives normalization creates a new evidence
identity.

## Case 4: Paragraph Moves Within Or Between Sections

Result:

```text
same evidence_hash
→ new evidence_ref
```

Paragraph location is part of filing-scoped evidence lineage. Moving a
paragraph changes `paragraph_index`, `section_name`, or both, and therefore
changes `evidence_ref`.

This rule preserves deterministic positional traceability and prevents a
reordered filing from appearing lineage-identical to its source.

## Case 5: Identical Paragraph Appears Twice In One Filing

Result:

```text
same evidence_hash
→ distinct evidence_ref values
```

Each occurrence retains its own section and paragraph index.

The platform must preserve both occurrences.

## Case 6: Identical Paragraph Appears Across Filings

Result:

```text
same evidence_hash
→ different evidence_ref values
```

`filing_id` differs, so each filing receives a distinct evidence reference.
The shared hash permits content-equivalence analysis without collapsing filing
lineage.

---

# Duplicate Paragraph Policy

The platform preserves duplicate paragraphs during evidence generation.

This decision is LOCKED.

## Rejected Option: Deduplicate During Evidence Generation

Evidence generation must not remove repeated normalized paragraphs.

Deduplicating evidence occurrences would:

* erase source position
* make filing reconstruction incomplete
* make repeated disclosure indistinguishable from a single disclosure
* create ambiguity when period comparison evaluates source support
* weaken lineage and auditability

## Required Behavior

When identical normalized text appears multiple times:

* preserve every occurrence
* assign each occurrence its own `paragraph_index`
* reuse the same `evidence_hash`
* generate a distinct `evidence_ref`

Upstream preprocessing may remove duplicates only according to its separately
governed normalization contract. Evidence Identity must preserve every
paragraph occurrence present in the canonical Filing Artifact input.

---

# Builder Boundary

The Evidence Identity builder owns:

* evidence extraction from Filing Artifact
* evidence identity generation
* evidence hashing
* evidence catalog assembly
* validation
* deterministic ordering

The builder returns:

```typescript
BuilderResult<EvidenceIdentityContent>
```

The builder must never:

* perform LLM reasoning
* detect Themes
* assign Topics
* generate intelligence
* evaluate business meaning
* summarize evidence
* preserve filings
* persist artifacts directly
* assign artifact IDs
* assign artifact versions
* manage current pointers

The standard builder lifecycle, persistence sequence, lineage requirements,
and failure behavior are defined by the Builder Contract and Builder
Implementation Guide. This specification does not duplicate those contracts.

---

# Validation

Evidence Identity validates that evidence identities are complete,
deterministic, ordered, and correctly scoped to the source Filing Artifact.

Validation must verify:

* every paragraph has one canonical evidence identity
* every required evidence reference is present
* no evidence reference is orphaned
* every reference resolves to exactly one catalog entry
* every catalog entry has a non-empty normalized paragraph
* evidence references are deterministic
* evidence hashes are deterministic
* every `evidence_hash` reconciles with `paragraph_text`
* every `evidence_ref` reconciles with its canonical hash input
* every catalog `filing_id` matches the Filing Artifact
* every catalog `filing_hash` matches the Filing Artifact
* every section name is allowed by the filing-type policy
* paragraph indexes are positive, one-based, contiguous, and unique within
  each section
* evidence ordering is preserved
* catalog ordering is deterministic
* duplicate paragraph occurrences retain distinct references
* duplicate evidence identities are rejected
* evidence hashes are not used in place of evidence references
* chunk IDs are not used as evidence references
* no downstream artifact emits unsupported references

Validation failures must stop artifact creation.

Validators must not silently remove, rewrite, repair, or replace invalid
evidence references.

Validation does not evaluate:

* Theme quality
* business relevance
* trust
* investor meaning

Those responsibilities belong to downstream specifications.

---

# Replayability

Evidence replayability belongs to Evidence Identity only.

For identical Filing Artifact content and identical Evidence Identity contract
version:

```text
Identical Filing Artifact
      ↓
Identical Evidence Identity Artifact
```

Evidence generation must produce:

* identical paragraph boundaries
* identical normalized paragraphs
* identical paragraph indexes
* identical `evidence_hash` values
* identical `evidence_ref` values
* identical catalog ordering
* identical Evidence Identity content

Replayability must not depend on:

* prompt versions
* model versions
* model providers
* model output
* chunk sizes
* chunk IDs
* storage paths
* artifact persistence location
* filesystem enumeration order
* execution concurrency

Evidence generation must be deterministic and must not use an LLM.

---

# Downstream Boundary

Evidence Identity becomes the only approved evidence source.

```text
Evidence Identity
      ↓
Themes Quality
      ↓
Themes
      ↓
Structured Intelligence
      ↓
Every downstream LLM layer
```

Themes Quality, Themes, Structured Intelligence, Company Knowledge, Business
Signals, Quarter Understanding, Investor Intelligence, and every downstream
LLM layer must consume canonical evidence.

No downstream layer may reopen Filing Artifact to generate new evidence
identities.

No downstream layer may invent evidence identity.

## Prompt Delivery

Prompt contexts may include:

* `evidence_ref`
* `section_name`
* `paragraph_index`
* `paragraph_text`

Prompt contexts must not require the model to calculate hashes or references.

Chunking may package multiple catalog entries for bounded prompt execution.
Each packaged paragraph must retain its original `evidence_ref`.

Model output may select only supplied `evidence_ref` values.

Prompt parsing and validation must reject:

* fabricated evidence references
* chunk IDs used as evidence references
* theme IDs used as evidence references
* raw paragraph text substituted for evidence references
* evidence hashes substituted for evidence references

---

# Future Compatibility

Evidence identity semantics are filing-type agnostic.

Future filing categories may introduce new canonical sections, including:

```text
10-K
transcript
investor_presentation
other approved filing categories
```

Each filing-type policy may define:

* canonical section identifiers
* required and optional sections
* deterministic section ordering
* source adapter mappings

Future filing types must continue using:

* paragraph evidence units
* the same paragraph normalization
* content-based `evidence_hash`
* filing-, section-, and position-aware `evidence_ref`
* preserved duplicate occurrences
* deterministic catalog ordering

Adding a filing type must not change existing evidence identities.

If a future source lacks natural paragraphs, its source adapter must define a
deterministic paragraph projection before Evidence Identity generation. That
projection must be contract-owned by the filing-type source policy and must
not alter the evidence identity semantics in this specification.

---

# Architectural Invariants

The following rules are strict and LOCKED:

1. Evidence identity is established exactly once.
2. Evidence Identity is the canonical evidence owner.
3. Evidence Identity contains no intelligence.
4. Evidence Identity performs no LLM reasoning.
5. Paragraph is the canonical evidence unit.
6. Paragraph is the smallest evidence unit allowed in V1.
7. Every evidence unit has exactly one canonical reference.
8. Evidence hashes are deterministic.
9. Evidence references are deterministic.
10. Evidence ordering is deterministic.
11. Evidence catalog ordering is deterministic.
12. Evidence catalog is immutable.
13. Evidence Identity produces exactly one canonical Evidence Catalog for one
    Filing Artifact.
14. All downstream evidence references originate from that catalog.
15. No downstream layer may construct an alternative canonical evidence
    catalog.
16. Identical Filing Artifact content and contract versions always produce
    identical Evidence Identity content.
17. Filing Artifact never owns evidence identity.
18. Downstream layers never recreate evidence identity.
19. Downstream layers never redefine evidence references.
20. Downstream layers never replace evidence hashes.
21. Downstream layers never reconstruct the evidence catalog.
22. Chunks are delivery artifacts and never evidence identities.
23. Chunk IDs must never appear as canonical filing evidence references.
24. Evidence hashes are generated from normalized paragraph content.
25. Paragraph normalization occurs before hashing and reference generation.
26. Formatting-only and whitespace-only changes must preserve evidence
    identity.
27. Paragraph content changes must create a new evidence hash and reference.
28. Paragraph movement must preserve the content hash and create a new
    positional evidence reference.
29. Duplicate paragraph occurrences within one filing must be preserved.
30. Duplicate paragraph occurrences share an evidence hash but have distinct
    evidence references.
31. Identical paragraphs across filings share an evidence hash but have
    filing-specific evidence references.
32. Evidence references must include filing, section, position, and content
    identity.
33. Evidence references must be generated before prompt execution.
34. LLMs must never generate evidence identities.
35. Evidence identity must remain stable across prompt and model changes.
36. Evidence identity must remain independent of chunk size and chunk
    boundaries.
37. Evidence identity must remain independent of storage paths.
38. Evidence lineage must be traceable to exact normalized filing content.
39. Every downstream evidence reference must resolve to exactly one catalog
    entry.
40. Evidence hashes must never be substituted for evidence references.
41. Artifact Framework lineage must not be substituted for claim-level
    evidence lineage.
42. No downstream artifact may emit unsupported evidence references.
43. Invalid or orphaned evidence references must stop artifact creation.
44. Future filing types must preserve the evidence identity semantics defined
    by this specification.

LOCKED.

---

# References

This specification defines Evidence Identity ownership only.

Related architecture is defined by:

## Platform Foundation

* `001-layer-ownership.md`
* `005-builder-implementation-guide.md`
* `006-engineering-standards.md`

## Execution Layers

* `020-filing-artifact-spec.md`
* `022-themes-quality-spec.md`
* `023-themes-spec.md`

## Implementation Contracts

* `039-builder-contract.md`
