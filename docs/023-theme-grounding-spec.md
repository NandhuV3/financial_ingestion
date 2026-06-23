# Theme Grounding Specification

Version: 1.0
Status: LOCKED
Owner: Themes Grounding Boundary

---

# Purpose

Theme grounding answers:

```text
Which exact filing statements support this Theme?
```

Themes are filing-scoped observations. Grounding connects each Theme to the
canonical paragraph evidence that supports its title and summary.

This specification governs only the relationship:

```text
Evidence Catalog
      ↓
Themes
```

It defines:

* the authoritative evidence source for Themes
* permitted Theme evidence references
* prompt grounding requirements
* parser preservation requirements
* validation and artifact-creation behavior
* downstream reliance on validated Theme evidence identity
* migration away from chunk-based grounding terminology

It does not redefine:

* Filing Artifact content or assembly
* Evidence Identity generation
* Evidence Catalog schema
* Theme schema
* Theme extraction mechanics
* Theme quality metrics
* Topic Assignment
* Topic Evolution
* Structured Intelligence
* Company Knowledge
* Quarter Change
* Business Signals
* trust architecture
* investor intelligence

The following locked specifications remain authoritative for their owned
contracts:

* `020-filing-artifact-spec.md`
* `021-evidence-identity-spec.md`
* `022-theme-quality-spec.md`

Where evidence identity terminology conflicts, the Evidence Identity
Specification is authoritative.

---

# Architectural Position

The required grounding flow is:

```text
Filing Artifact
      ↓
Evidence Catalog
      ↓
Themes
```

The Filing Artifact supplies canonical normalized filing content.

The Evidence Catalog supplies deterministic paragraph identities derived from
that content.

Themes select those existing identities to ground filing-scoped observations.

Themes must never bypass the Evidence Catalog when assigning evidence.

Prompt delivery may include filing content or catalog paragraph text to support
Theme extraction, but filing text does not become a valid evidence identity by
itself. Every emitted Theme must resolve through the Evidence Catalog.

---

# Canonical Evidence Source

The only valid Theme grounding source is:

```text
Evidence Catalog Artifact
```

Every Theme evidence reference must resolve to exactly one entry in the
Evidence Catalog associated with the same Filing Artifact.

Themes may not use the following as grounding identities:

* raw filing text
* raw SEC HTML
* normalized section paths
* processed section paths
* chunk IDs
* extraction identifiers
* temporary identifiers
* prompt-generated identifiers
* inferred identifiers
* Theme IDs
* evidence hashes substituted for references
* Artifact Framework artifact IDs
* Artifact Framework lineage entries

Source text may be delivered to a prompt for extraction context. Source text
must not be returned in place of a canonical evidence reference.

---

# Theme Evidence Requirements

Every Theme must contain at least one:

```typescript
evidence_ref: string;
```

Each `evidence_ref` must:

* originate from the active Evidence Catalog dependency
* belong to the same `filing_id` as the Themes artifact
* identify a paragraph that directly supports the Theme title and summary
* be preserved exactly from prompt context through parsing and validation
* resolve to exactly one canonical catalog entry

Theme evidence may include catalog-owned enrichment fields such as:

```typescript
evidence_hash: string;
section_name: string;
paragraph_index: number;
```

When present, these fields must be copied from the catalog entry identified by
`evidence_ref`.

They must reconcile to that same entry. They must not be independently
generated, inferred, transformed, or supplied as substitutes for
`evidence_ref`.

Theme grounding validity is separate from Theme grounding quality.

A valid reference proves that the cited paragraph exists in the catalog.
Theme quality evaluation determines whether the paragraph directly and
adequately supports the observation.

---

# Evidence Reference Rules

The platform-wide Theme grounding identifier is:

```text
evidence_ref
```

The Themes Builder may:

* receive catalog entries through a governed dependency
* expose catalog entries to the governed Theme prompt
* select existing `evidence_ref` values
* copy catalog-owned evidence metadata after selection
* reject references that do not reconcile with the catalog

The Themes Builder may not:

* generate an `evidence_ref`
* calculate an `evidence_ref`
* hash an `evidence_ref`
* shorten an `evidence_ref`
* transform an `evidence_ref`
* normalize an `evidence_ref`
* synthesize an `evidence_ref`
* infer an `evidence_ref` from paragraph text
* infer an `evidence_ref` from `evidence_hash`
* repair an invalid `evidence_ref`
* replace an invalid reference with a nearby catalog entry

Reference comparison must use exact string equality.

---

# Prompt Contract

Theme prompts must describe the Evidence Catalog as the canonical grounding
source.

The governed prompt context must expose enough catalog information for the
model to select valid support. It may include:

* `evidence_ref`
* `section_name`
* `paragraph_index`
* `paragraph_text`

The prompt may include `evidence_hash` for audit context, but the model must
not return it in place of `evidence_ref`.

Theme prompts must:

* require exact selection of supplied `evidence_ref` values
* state that evidence identity already exists before prompt execution
* prohibit creation, calculation, shortening, transformation, or guessing of
  identifiers
* require at least one catalog-backed reference for every Theme
* require only references that directly support the Theme
* distinguish evidence selection from evidence identity generation
* use Evidence Catalog terminology consistently

Theme prompts must not:

* reference chunk IDs
* reference chunk identifiers
* reference filing chunks
* reference chunk references
* request extraction identifiers
* request prompt-generated identifiers
* instruct the model to calculate hashes
* imply that the model owns evidence identity

If bounded prompt delivery groups catalog entries, every delivered paragraph
must retain its original `evidence_ref`. Delivery grouping must not create a
replacement grounding identity.

---

# Parser Contract

The Theme response parser must preserve every emitted:

```text
evidence_ref
```

verbatim.

The parser may:

* verify that the value is present
* verify that the value is a non-empty string
* enforce the exact governed output shape
* pass the unchanged value to validation

The parser may not:

* trim or normalize a reference into a different accepted value
* add or remove a prefix
* convert an evidence hash into a reference
* convert paragraph text into a reference
* map a temporary identifier to a reference
* replace an unknown reference
* perform nearest-reference matching
* silently discard invalid evidence selections

Parser acceptance does not establish grounding validity. Catalog
reconciliation remains mandatory.

---

# Validator Contract

Theme validators are authoritative for grounding integrity.

For every Theme evidence selection, validation must verify:

* `evidence_ref` is present
* `evidence_ref` is a non-empty string
* `evidence_ref` exactly matches one entry in the active Evidence Catalog
* the catalog entry belongs to the same filing as the Themes artifact
* the reference resolves to exactly one catalog entry
* any emitted `evidence_hash` matches the resolved catalog entry
* any emitted `section_name` matches the resolved catalog entry
* any emitted `paragraph_index` matches the resolved catalog entry
* Theme evidence count reconciles with emitted Theme evidence

The validator must reject:

* unknown `evidence_ref` values
* transformed `evidence_ref` values
* fabricated `evidence_ref` values
* references absent from the catalog
* references from another filing
* evidence hashes used as references
* chunk identities used as references
* Theme IDs used as references
* paragraph text used as a reference
* conflicting catalog enrichment fields
* missing required evidence

The validator must not:

* attempt repair
* infer intended evidence
* substitute a similar catalog entry
* remove only the invalid Theme
* remove only the invalid evidence item
* downgrade grounding failure to a quality warning

Grounding validity is a blocking artifact requirement.

---

# Artifact Creation Rules

If any Theme contains an invalid `evidence_ref`:

```text
Artifact creation fails
```

The Themes Builder must return no partial Themes artifact.

The platform must not:

* persist the partially valid Themes content
* omit the invalid Theme and continue
* omit the invalid evidence selection and continue
* auto-correct the reference
* fall back to filing text without a reference
* fall back to an evidence hash
* fall back to a chunk identity
* create a placeholder reference

Artifact Framework lifecycle operations occur only after the complete Themes
content passes grounding validation and all other applicable validation.

Artifact Framework remains the owner of artifact identity, metadata, framework
lineage, versioning, persistence, current pointers, archive/history, and
framework-level hashes.

---

# Downstream Dependency Rules

Validated Theme evidence identity is a guaranteed upstream contract.

## Topic Assignment

Topic Assignment may trust that every Theme evidence reference was validated
against the source Evidence Catalog.

Topic Assignment must not create, replace, or reinterpret filing evidence
identity.

## Topic Evolution

Topic Evolution may consume Theme context propagated through Topic Assignment
without reopening filing content to reconstruct evidence identity.

Topic Evolution must preserve any propagated evidence references unchanged.

## Structured Intelligence

Structured Intelligence may trust Theme grounding integrity because Themes
validation has already established catalog membership.

Structured Intelligence must preserve catalog-backed references and must not
generate replacement evidence identities.

## Company Knowledge

Company Knowledge Candidate generation and governance may trust the provenance
of evidence references preserved from validated upstream artifacts.

Promotion must not rewrite original filing evidence identity.

## Business Signals

Business Signals may trust upstream Theme evidence identity when it is
preserved through its approved dependency chain.

Business Signals must not create replacement evidence identities.

Downstream trust in Theme grounding does not transfer Theme ownership to
downstream layers. It also does not prohibit downstream validators from
checking their own content and provenance contracts.

---

# Migration Rules

Chunk-based Theme grounding is deprecated.

The following terms are prohibited in Theme grounding architecture, Theme
prompt instructions, Theme parser contracts, Theme validator contracts, and
Theme builder grounding behavior:

```text
chunk id
chunk identifier
filing chunk
chunk reference
```

Plural, capitalization, underscore, and hyphen variants are also prohibited
when they describe Theme evidence identity.

The required terminology is:

```text
Evidence Catalog
evidence_ref
catalog entry
paragraph evidence
```

Chunks may remain internal prompt-delivery containers where separately
governed. They must retain the original catalog entries and must never become
Theme grounding identities.

Legacy prompts, examples, test fixtures, reporting logic, and operational
messages that describe Theme evidence through chunk identities must not govern
new Theme generation.

---

# Governance Invariants

The following rules are strict and LOCKED:

1. The Evidence Catalog is the only valid Theme grounding source.
2. The required grounding flow is Filing Artifact to Evidence Catalog to
   Themes.
3. Themes must never bypass the Evidence Catalog when assigning evidence.
4. Every Theme must contain at least one canonical `evidence_ref`.
5. Every Theme `evidence_ref` must resolve to exactly one catalog entry.
6. Every Theme evidence reference must belong to the same filing as the
   Themes artifact.
7. Evidence identity must exist before Theme prompt execution.
8. Themes may select evidence identity but must never generate it.
9. LLMs must never calculate, synthesize, infer, or repair evidence identity.
10. Theme prompts must expose exact catalog `evidence_ref` values.
11. Theme prompts must require exact reference selection.
12. Theme prompts must prohibit generated or transformed identifiers.
13. Chunk-based grounding terminology is prohibited in governed Theme prompts.
14. Chunk IDs must never appear as Theme evidence references.
15. Evidence hashes must never be substituted for evidence references.
16. Theme IDs must never be substituted for evidence references.
17. Raw filing text must never be substituted for evidence references.
18. Theme parsers must preserve `evidence_ref` values verbatim.
19. Theme parsers must not map invalid identifiers to catalog entries.
20. Theme validators must use exact reference equality.
21. Unknown, transformed, fabricated, or cross-filing references must be
    rejected.
22. Catalog enrichment fields must reconcile with the selected
    `evidence_ref`.
23. Validators must not repair, replace, remove, or downgrade invalid
    grounding.
24. Any invalid Theme evidence reference must stop complete artifact
    creation.
25. Partial Themes artifacts must never be persisted after a grounding
    failure.
26. Theme grounding validity remains separate from Theme grounding quality.
27. Downstream layers may trust validated Theme evidence identity but must
    preserve it unchanged.
28. Artifact Framework ownership remains separate from Theme grounding
    ownership.

LOCKED.
