# Evidence Identity Specification

Version: 1.0
Status: LOCKED
Owner: Evidence Identity Layer

---

# Purpose

Evidence Identity answers:

```text
What exact filing statement supports this claim?
```

This specification defines the canonical evidence identity system for the
entire intelligence platform.

It guarantees:

* deterministic evidence references
* stable replayability
* traceability to normalized filing content
* platform-wide evidence consistency
* unambiguous evidence lineage

This specification is the platform-wide source of truth for evidence units,
normalization, hashing, references, catalogs, stability, and lineage.

Where another document defines a conflicting evidence identity format, this
specification takes precedence.

---

# Architectural Position

Evidence Identity sits below all intelligence layers.

```text
SEC Extraction
      ↓
Filing Artifact
      ↓
Evidence Identity
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
      ↓
Investor Intelligence
```

The Filing Artifact supplies the normalized, deterministically ordered filing
content from which evidence identities are generated.

All downstream intelligence artifacts must reference filing evidence through
the identities defined by this specification.

---

# Ownership

Evidence Identity owns:

* evidence units
* evidence references
* evidence hashing
* evidence normalization
* evidence catalog construction
* evidence catalog ordering
* evidence identity stability
* duplicate paragraph identity
* evidence lineage rules
* evidence reference validation rules

Evidence Identity does not own:

* SEC acquisition
* section extraction
* filing content assembly
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
* artifact identity, metadata, framework lineage, versioning, persistence,
  current pointers, archive/history, or framework hashes

Downstream layers consume evidence identities but do not define, rewrite, or
replace them.

---

# Canonical Evidence Unit

The canonical evidence unit is:

```text
Paragraph
```

This decision is LOCKED.

Paragraphs are derived from normalized Filing Artifact content. A paragraph is
the smallest evidence unit allowed in V1.

Themes, Structured Intelligence, Company Knowledge Candidates, Company
Knowledge, Quarter Change, Business Signals, Quarter Understanding, and
Investor Intelligence must never use chunk identities as evidence identities.

Chunks are prompt-delivery artifacts only.

Chunks may group paragraphs for bounded model input, but chunking must not
change evidence identity, evidence hashing, or evidence lineage.

---

# Evidence Unit Contract

```typescript
type EvidenceUnit = {
  evidence_ref: string;
  evidence_hash: string;
  filing_id: string;
  paragraph_index: number;
  section_name: string;
  paragraph_text: string;
};
```

## Field Definitions

### `evidence_ref`

The globally unique, filing-scoped reference consumed by downstream
intelligence artifacts.

### `evidence_hash`

The content hash of the normalized paragraph text.

The same normalized paragraph text produces the same `evidence_hash`,
regardless of filing, section, position, storage location, prompt, model, or
chunking configuration.

### `filing_id`

The stable business identifier of the Filing Artifact source filing.

It is not the Artifact Framework `artifact_id`.

### `paragraph_index`

The one-based ordinal of the paragraph within its canonical section after
normalization and deterministic filing assembly.

The index is scoped to the pair:

```text
filing_id + section_name
```

### `section_name`

The canonical section identifier defined by the active filing-type source
policy.

### `paragraph_text`

The normalized paragraph text used to generate `evidence_hash`.

---

# Section Sources

Evidence identity generation is section-aware.

For the current 10-Q processing path, allowed canonical sections are:

```text
management_discussion
risk_factors
```

These correspond to the approved normalized Filing Artifact inputs:

```text
normalized/management-discussion.cleaned.txt
normalized/risk-factors.cleaned.txt
```

Future filing types may define additional canonical sections, but they must
not change the evidence normalization, hash, or reference semantics defined
here.

Section display labels are not evidence identity inputs. Only canonical
section identifiers are permitted.

---

# Paragraph Formation

Evidence paragraphs must be formed from the canonical normalized section
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

---

# Paragraph Normalization

Paragraph normalization must execute in this exact order:

1. normalize line endings from CRLF or CR to LF
2. apply Unicode NFKC normalization
3. replace all internal whitespace runs with one ASCII space
4. trim leading and trailing whitespace

The normalized paragraph is:

```typescript
function normalizeEvidenceParagraph(value: string): string {
  return value
    .replace(/\r\n?/g, "\n")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();
}
```

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

# Evidence Hash Generation

```text
evidence_hash = stableHash(normalized_paragraph_text)
```

For V1, `stableHash` is SHA-256 over the UTF-8 bytes of the exact normalized
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

# Evidence Reference Generation

The canonical evidence reference is:

```text
evidence:<stableHash({
  filing_id,
  section_name,
  paragraph_index,
  evidence_hash
})>
```

The structured hash input must use canonical JSON with recursively sorted
object keys and no undefined fields.

The exact hash input fields are:

```typescript
{
  filing_id: string;
  section_name: string;
  paragraph_index: number;
  evidence_hash: string;
}
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

## Case 4: Paragraph Moves Within or Between Sections

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

## Case 5: Identical Paragraph Appears Twice in One Filing

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
* create ambiguity when Quarter Change compares source support
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

# Evidence Catalog

The canonical evidence catalog is:

```typescript
type EvidenceCatalog = {
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

`EvidenceCatalogEntry` is the canonical persisted and prompt-projection source
for evidence identity.

## Catalog Ordering

Catalog entries must be ordered by:

1. canonical section order defined by the Filing Artifact filing-type policy
2. ascending `paragraph_index`
3. ascending `evidence_ref` as a deterministic tie-breaker

Filesystem order, object key order, asynchronous execution order, and model
output order must never determine catalog ordering.

## Catalog Constraints

The catalog must contain:

* exactly one entry for every canonical paragraph occurrence
* no duplicate `evidence_ref`
* no missing paragraph indexes within a section
* section names allowed by the filing-type policy
* one `filing_id` matching the source Filing Artifact
* one `filing_hash` matching the source Filing Artifact

The catalog must be generated before Themes or any other LLM-assisted layer
executes.

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

# Downstream Usage Rules

## Themes

Themes:

* may reference only `evidence_ref` values supplied by the Evidence Catalog
* must preserve references without rewriting them
* must reject unknown or fabricated references
* must not emit chunk IDs as evidence references

## Structured Intelligence

Structured Intelligence:

* may reference only catalog-backed `evidence_ref` values
* must preserve claim-level references
* must reject Theme IDs, chunk IDs, raw hashes, or unknown references as
  evidence identities

## Company Knowledge

Company Knowledge Candidate and governance flows:

* must preserve the evidence references supporting candidate values
* must not replace evidence identities during promotion
* may aggregate references but must retain each original `evidence_ref`

## Quarter Change

Quarter Change:

* compares deterministic value references
* preserves prior and current evidence references
* may compare `evidence_hash` values for exact content equivalence
* must not compare or interpret raw paragraph text as its primary value
  comparison mechanism

## Business Signals

Business Signals:

* must trace emitted observations to upstream `evidence_ref` values
* must not generate replacement evidence identities

## Quarter Understanding

Quarter Understanding:

* may preserve evidence references from upstream observations
* must not create filing evidence identities

## Investor Intelligence

Investor Intelligence:

* may trace synthesis to upstream `evidence_ref` values
* must not create, rewrite, or infer filing evidence identities

No downstream layer may invent evidence identity.

---

# Prompt Delivery

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

# Replayability

For identical Filing Artifact content and identical Evidence Identity contract
version, evidence generation must produce:

* identical paragraph boundaries
* identical normalized paragraphs
* identical paragraph indexes
* identical `evidence_hash` values
* identical `evidence_ref` values
* identical catalog ordering
* identical Evidence Catalog content

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

# Validation Requirements

Evidence validation must verify:

* every required evidence reference is present
* no evidence reference is orphaned
* every reference resolves to exactly one catalog entry
* every catalog entry has a non-empty normalized paragraph
* every `evidence_hash` reconciles with `paragraph_text`
* every `evidence_ref` reconciles with its canonical hash input
* every catalog `filing_id` matches the Filing Artifact
* every catalog `filing_hash` matches the Filing Artifact
* every section name is allowed by the filing-type policy
* paragraph indexes are positive, one-based, contiguous, and unique within
  each section
* catalog ordering is deterministic
* duplicate paragraph occurrences retain distinct references
* evidence hashes are not used in place of evidence references
* chunk IDs are not used as evidence references
* no downstream artifact emits unsupported references

Validation failures must stop artifact creation.

Validators must not silently remove, rewrite, repair, or replace invalid
evidence references.

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

# Implementation Boundary

Evidence Identity generation is a deterministic platform capability.

It may be implemented within the Filing Artifact builder boundary or as a
reusable deterministic component invoked by that builder.

The implementation must not:

* call an LLM
* read arbitrary downstream artifacts
* use prompt output to create identity
* depend on chunk configuration
* persist artifacts directly
* own Artifact Framework identity or lifecycle
* own downstream intelligence

The Filing Artifact owns the normalized content inputs required for evidence
generation.

Artifact Framework owns persistence and framework lifecycle.

Downstream builders consume the generated Evidence Catalog.

---

# Architectural Invariants

The following rules are strict and LOCKED:

1. Paragraph is the canonical evidence unit.
2. Paragraph is the smallest evidence unit allowed in V1.
3. Chunks are delivery artifacts and never evidence identities.
4. Chunk IDs must never appear as canonical filing evidence references.
5. Evidence identity is deterministic.
6. Evidence references are replayable.
7. Evidence hashes are generated from normalized paragraph content.
8. Paragraph normalization occurs before hashing and reference generation.
9. Formatting-only and whitespace-only changes must preserve evidence
   identity.
10. Paragraph content changes must create a new evidence hash and reference.
11. Paragraph movement must preserve the content hash and create a new
    positional evidence reference.
12. Duplicate paragraph occurrences within one filing must be preserved.
13. Duplicate paragraph occurrences share an evidence hash but have distinct
    evidence references.
14. Identical paragraphs across filings share an evidence hash but have
    filing-specific evidence references.
15. Evidence references must include filing, section, position, and content
    identity.
16. Evidence references must be generated before prompt execution.
17. LLMs must never generate evidence identities.
18. Filing Artifact owns evidence generation inputs.
19. Evidence Identity owns evidence normalization, hashing, references,
    catalogs, stability, and lineage rules.
20. Downstream artifacts consume evidence identities but do not define them.
21. Evidence identity must remain stable across prompt and model changes.
22. Evidence identity must remain independent of chunk size and chunk
    boundaries.
23. Evidence identity must remain independent of storage paths.
24. Evidence lineage must be traceable to exact normalized filing content.
25. Every downstream evidence reference must resolve to exactly one catalog
    entry.
26. Evidence hashes must never be substituted for evidence references.
27. Artifact Framework lineage must not be substituted for claim-level
    evidence lineage.
28. No intelligence artifact may emit unsupported evidence references.
29. Invalid or orphaned evidence references must stop artifact creation.
30. Future filing types must preserve the evidence identity semantics defined
    by this specification.

LOCKED.
