# Theme Input Boundary Specification

Version: 1.0
Status: LOCKED
Owner: Themes Input Boundary

---

# 1. Purpose

This specification defines and locks the input ownership boundary for the
Themes Builder.

It answers:

```text
What governed upstream information may Themes consume?
```

The boundary exists to:

* preserve architectural layering
* maintain one authoritative grounding source
* prevent Themes from bypassing Evidence Catalog ownership
* prevent duplicate representations of the same filing evidence
* prevent model-generated or reconstructed evidence identity
* keep prompt inputs deterministic and auditable
* preserve exact evidence lineage
* reduce ambiguity between source content and governed evidence

Themes answer:

```text
What did management discuss in this filing?
```

Themes answer this question using the governed paragraph evidence contained in
the Evidence Catalog.

This specification governs input ownership only. It does not redefine:

* Filing Artifact assembly
* Evidence Identity generation
* Evidence Catalog schema
* Theme schema
* Theme output validation
* Theme quality metrics
* Topic Assignment
* Topic Evolution
* Structured Intelligence
* Company Knowledge
* Quarter Change
* Business Signals
* trust architecture
* investor intelligence

---

# 2. Architectural Ownership

## Filing Artifact

The Filing Artifact owns:

* deterministic filing content assembly
* filing-type-aware completeness validation
* filing-scoped content identity
* deterministic `filing_hash`
* the normalized content from which evidence is derived

The Filing Artifact supplies canonical content to the Evidence Catalog layer.

The Filing Artifact is not a direct Themes Builder dependency after a valid
Evidence Catalog Artifact has been created.

## Evidence Catalog

The Evidence Catalog owns:

* canonical paragraph projection
* evidence units
* evidence normalization
* evidence hashes
* evidence references
* evidence ordering
* evidence identity stability
* filing, section, and paragraph traceability

The Evidence Catalog is the sole evidence-bearing input to Themes.

```text
Evidence Catalog owns evidence identity.
Themes consume evidence identity.
```

Every catalog entry contains the governed paragraph text required for Theme
extraction and the canonical `evidence_ref` required for Theme grounding.

## Themes

Themes owns:

* filing-scoped observation extraction from catalog entries
* Theme category assignment
* selection of existing catalog `evidence_ref` values
* Theme deduplication
* Theme confidence
* Theme quality evaluation
* Theme content assembly

Themes does not own:

* filing content assembly
* evidence unit formation
* evidence identity generation
* evidence hashing
* evidence reference generation
* direct source-file access
* reconstruction of filing content
* reconstruction of evidence identity

---

# 3. Allowed Inputs

The Themes Builder may consume:

## Required Input

```text
Evidence Catalog Artifact
```

The required Evidence Catalog dependency must provide:

* catalog identity
* source `filing_id`
* source `filing_hash`
* company identity
* period identity
* canonical ordered entries
* `evidence_ref`
* `evidence_hash`
* `section_name`
* `paragraph_index`
* `paragraph_text`

## Approved Configuration

Themes may also consume separately governed non-evidence configuration when
already approved by the platform architecture:

* Theme configuration
* Theme governance configuration
* governed prompt metadata
* pinned model configuration
* deterministic execution configuration
* evaluation configuration

Configuration must not contain a second copy of filing text, filing sections,
paragraph collections, or alternate evidence identities.

Configuration may constrain Theme behavior. It must not become a grounding
source.

---

# 4. Prohibited Inputs

The Themes Builder must never consume directly:

* Filing Artifact content
* `filing_content`
* full filing text
* raw filing text
* filing sections
* normalized sections
* processed sections
* extracted section text
* raw SEC HTML
* XBRL source content
* chunk artifacts
* chunk text
* chunk IDs
* extraction identifiers
* temporary paragraph collections
* paragraph collections outside the Evidence Catalog
* filesystem paths to filing content
* arbitrary source documents
* prompt-generated evidence collections
* alternate evidence catalogs

The Themes Builder must not accept the Filing Artifact and Evidence Catalog as
parallel evidence-bearing dependencies.

Filing identity values required for reconciliation must come from the Evidence
Catalog Artifact and its Artifact Framework dependency lineage. They must not
require a direct Filing Artifact content dependency at Themes execution time.

---

# 5. Single Grounding Source Principle

Theme extraction follows:

```text
One layer
One grounding source
```

Themes has exactly one evidence source:

```text
Evidence Catalog
```

The Evidence Catalog contains both:

* the paragraph text used to identify filing discussions
* the canonical evidence identity used to ground emitted Themes

Themes must not receive the same filing evidence through a second
representation.

Supplying both Evidence Catalog entries and full filing content creates:

* competing source representations
* avoidable prompt duplication
* grounding ambiguity
* evidence selection drift
* opportunities to describe uncatalogued text
* opportunities to fabricate or reconstruct references
* weaker replay and audit reasoning

The single-source rule removes that ambiguity.

---

# 6. Layer Boundary Rules

The required dependency flow is:

```text
Filing Artifact
      ↓
Evidence Catalog
      ↓
Themes
```

The following direct dependency is prohibited:

```text
Filing Artifact
      ↓
Themes
```

The following dual dependency is prohibited:

```text
Filing Artifact ───────┐
                      ├─→ Themes
Evidence Catalog ─────┘
```

The Evidence Catalog must be generated and validated before Themes executes.

Themes must fail dependency validation when:

* the Evidence Catalog is missing
* catalog company identity differs from the build target
* catalog period identity differs from the build target
* catalog filing identity is absent
* catalog filing hash is absent
* catalog content is invalid
* catalog entries are empty when the source policy requires evidence

Themes must not resolve a missing or invalid catalog by reopening the Filing
Artifact or preprocessing outputs.

---

# 7. Prompt Construction Rules

Theme prompts may include:

* Evidence Catalog entries
* Evidence Catalog metadata
* exact `evidence_ref` values
* `evidence_hash` values for audit context
* canonical section names
* paragraph indexes
* canonical paragraph text
* approved Theme configuration
* approved Theme governance configuration

Theme prompts must not include:

* complete `filing_content`
* full filing text outside catalog entries
* Filing Artifact section payloads
* normalized section text outside catalog entries
* raw SEC filing text
* raw SEC HTML
* processed section text
* chunk payloads
* alternate paragraph collections
* duplicate evidence representations

The prompt must describe the Evidence Catalog as the complete governed Theme
extraction source.

Each prompt-delivered paragraph must retain its original:

* `evidence_ref`
* section identity
* paragraph index
* paragraph text

Prompt construction must not merge, rewrite, summarize, or reconstruct catalog
entries before Theme extraction unless a separately locked contract explicitly
defines a bounded projection that preserves each original evidence identity.

---

# 8. Validator Responsibilities

Themes validation must continue enforcing:

* required Evidence Catalog dependency
* exact company identity reconciliation
* exact period identity reconciliation
* exact filing identity reconciliation
* exact catalog `evidence_ref` membership
* evidence identity ownership
* same-filing grounding
* evidence count reconciliation
* catalog enrichment-field reconciliation
* complete artifact rejection when any reference is invalid

Validators must reject:

* fabricated evidence references
* transformed evidence references
* inferred evidence references
* hashed replacement references
* references absent from the catalog
* references from another filing
* evidence hashes substituted for references
* chunk identities substituted for references
* direct filing content supplied as a Themes evidence dependency
* parallel raw-source and catalog evidence dependencies

Validators must not:

* repair invalid references
* infer intended catalog entries
* perform nearest-reference matching
* reopen the Filing Artifact
* reopen normalized source files
* derive missing evidence identity
* omit invalid Themes and continue
* persist partial Themes artifacts

---

# 9. Future Builder Guidance

Future builders must consume the nearest authoritative upstream artifact that
owns the information they require.

They must not bypass an ownership layer to consume both:

* a governed artifact
* the raw source from which that artifact was derived

The required principle is:

```text
Consume the nearest upstream owner.
Do not reopen an earlier source.
```

Examples:

* Themes consumes Evidence Catalog, not Filing Artifact content.
* Topic Assignment consumes Themes, not Evidence Catalog or filing text.
* Topic Evolution consumes Topic Assignment history, not Themes history
  directly.
* Company Knowledge consumes its approved upstream business-understanding
  artifacts, not raw filing content.

An exception requires an explicit locked architecture decision. Convenience,
prompt quality, missing implementation, or backward compatibility is not an
exception.

---

# 10. Migration Guidance

## Before

The obsolete Themes input model is:

```text
Evidence Catalog
        +
Filing Content
        ↓
Themes
```

This model exposes two evidence-bearing representations to Themes.

## After

The locked Themes input model is:

```text
Evidence Catalog
      ↓
Themes
```

Migration requires:

1. remove direct Filing Artifact content from Themes input
2. remove direct Filing Artifact dependency from Themes execution
3. remove full filing content from Theme prompt construction
4. retain catalog paragraph text in prompt context
5. retain exact catalog `evidence_ref` values
6. retain strict evidence membership validation
7. retain filing identity reconciliation through catalog content and framework
   lineage
8. retain Filing Artifact to Evidence Catalog dependency lineage
9. reject legacy dual-source invocation paths

Migration must not change:

* Evidence Catalog identity generation
* Theme output schema
* Theme grounding validation
* Theme quality semantics
* Artifact Framework ownership
* downstream evidence provenance

---

# Relationship To Existing Locked Specifications

This specification is authoritative for the Themes Builder input boundary.

It narrows earlier statements that allowed or required direct Filing Artifact
content consumption by Themes.

The following prior statements remain valid only for layers other than Themes,
or as descriptions of the upstream source chain:

* the Filing Artifact remains the canonical filing content owner
* the Evidence Catalog remains derived exclusively from the Filing Artifact
* Structured Intelligence may retain separately governed Filing Artifact
  dependencies
* all downstream evidence identity remains catalog-backed

For Themes specifically:

```text
Filing Artifact content access
is superseded by
Evidence Catalog-only access
```

This specification does not alter the Filing Artifact or Evidence Catalog
contracts. It changes only which governed artifact Themes may consume.

---

# Governance Invariants

The following rules are strict and LOCKED:

1. Evidence Catalog is the sole evidence-bearing input to Themes.
2. Themes must have exactly one grounding source.
3. Themes must never consume Filing Artifact content directly.
4. Themes must never consume full filing text directly.
5. Themes must never consume normalized section text directly.
6. Themes must never consume processed or extracted section text directly.
7. Themes must never consume raw SEC HTML.
8. Themes must never consume chunk artifacts or chunk identities.
9. Themes must never consume paragraph collections outside the Evidence
   Catalog.
10. Themes must never receive Evidence Catalog and Filing Artifact content as
    parallel grounding sources.
11. Filing Artifact must flow through Evidence Catalog before reaching Themes.
12. Direct Filing Artifact to Themes dependencies are prohibited.
13. Evidence Catalog owns evidence identity.
14. Themes consumes evidence identity but never owns it.
15. Themes must not generate, reconstruct, transform, or replace evidence
    identity.
16. Theme prompts may contain catalog entries and catalog metadata only as
    filing evidence.
17. Theme prompts must not contain full filing content outside catalog
    entries.
18. Every prompt-delivered paragraph must retain its canonical
    `evidence_ref`.
19. Prompt construction must not create duplicate evidence representations.
20. Theme validators must enforce exact catalog reference membership.
21. Theme validators must reject fabricated, transformed, inferred, or
    cross-filing references.
22. Theme validators must not repair invalid grounding.
23. Missing or invalid Evidence Catalog dependencies must stop Theme
    generation.
24. Themes must not fall back to Filing Artifact content when catalog
    validation fails.
25. Themes must not persist partial artifacts after a boundary or grounding
    failure.
26. One layer must not consume both a governed artifact and that artifact's
    raw source without an explicit locked exception.
27. Future builders must consume the nearest upstream artifact that owns the
    required information.
28. Dependency convenience must never override ownership boundaries.
29. Artifact Framework lineage must preserve Filing Artifact to Evidence
    Catalog to Themes dependency order.
30. Artifact Framework ownership remains separate from Themes input
    ownership.

LOCKED.
