# Business Signal Builder Design

## Goal

The future Business Signal Builder assembles Business Signal artifacts from upstream intelligence.

Business Signal Intelligence is an observation layer. It owns movement, change detection, signal normalization, and prioritization. It does not own explanations, narratives, recommendations, owner questions, or company facts.

Company Knowledge remains the source of truth for durable business understanding. Business Signals observe movement around Company Knowledge.

## 1. Builder Inputs

The builder may consume already-loaded structured inputs. It should not own file loading, repository access, or storage path construction.

Allowed future inputs:

- Company Knowledge
- Filing metadata
- Quarter Change Engine outputs
- Topic Evolution outputs
- Theme Intelligence outputs
- Topic Assignment outputs
- Health evidence artifacts
- Historical Business Signal artifacts
- Deterministic structured intelligence artifacts

Company Knowledge provides stable business context:

- What the company does
- How it makes money
- Products
- Customers
- Competitive positioning
- Operating model
- Dependencies

Structured intelligence provides movement context:

- What changed this quarter
- What intensified
- What weakened
- What emerged
- What disappeared
- What received more emphasis

The builder must not consume frontend view models, portfolio data, journal data, owner questions, recommendations, or presentation narratives as signal sources.

## 2. Builder Outputs

The builder should produce a Business Signal artifact using the frozen Business Signal schema.

The output should include:

- Normalized signals
- Signal category
- Signal direction
- Signal magnitude
- Signal confidence
- Attached evidence
- Source lineage
- Generation metadata

The output should not include:

- Explanations
- Narratives
- Recommendations
- Owner questions
- Modified Company Knowledge
- Presentation-specific copy

The artifact should be reproducible from its inputs and auditable through lineage.

## 3. Signal-Contributing Intelligence Layers

Multiple intelligence layers may contribute candidate signals.

### Company Knowledge

Company Knowledge contributes context, not signal movement by itself.

Example:

```text
Company Knowledge:
  Cloud infrastructure is a revenue driver.

Candidate signal from quarter evidence:
  Cloud revenue acceleration observed.
```

### Quarter Change Engine

Quarter Change outputs can contribute category and topic movement.

Examples:

- New category observed
- Removed category observed
- Evidence count increased
- Importance increased
- Topic intensified
- Topic weakened

### Topic Evolution

Topic Evolution can contribute longitudinal movement.

Examples:

- Topic emerged
- Topic persisted
- Topic strengthened
- Topic weakened
- Topic disappeared

### Theme Intelligence

Theme Intelligence can contribute filing-specific observations.

Examples:

- Theme importance changed
- Evidence concentration increased
- New risk theme appeared
- Product theme received more emphasis

### Filing Metadata

Filing metadata contributes time and filing context.

Examples:

- Ticker
- Filing date
- Form type
- Accession number

### Historical Business Signals

Historical signal artifacts can support deduplication, persistence tracking, and signal lifecycle analysis in future phases.

They should not be required for initial signal assembly.

## 4. Builder Vs Future Enrichment

The design must support both deterministic assembly and future LLM-powered enrichment without requiring schema rewrites.

### Builder Responsibilities

The builder owns deterministic signal assembly:

- Consume upstream intelligence
- Identify candidate signals
- Normalize observations
- Deduplicate signals
- Attach evidence
- Assign category
- Assign direction
- Assign magnitude
- Assign confidence
- Generate lineage
- Generate metadata

The builder must remain reproducible and auditable.

### Future Enrichment Responsibilities

Future enrichment may improve signal wording, grouping, or prioritization when deterministic evidence already exists.

Allowed future enrichment:

- Rewrite terse signal titles into clearer language
- Group closely related candidate signals
- Improve owner-readable signal summaries
- Suggest prioritization when evidence is supplied
- Identify overlapping signal intent across structured inputs

Future enrichment may not:

- Invent unsupported signals
- Add facts not present in source evidence
- Modify Company Knowledge
- Explain why a signal matters
- Generate recommendations
- Generate owner questions
- Produce narratives
- Override deterministic lineage

### Separation Rule

Deterministic signal assembly creates the auditable signal record.

Future enrichment may decorate or refine that record, but it must not become the source of truth for whether a signal exists.

## 5. Signal Deduplication Design

Signal deduplication should prevent duplicate observations from appearing when multiple upstream artifacts describe the same movement.

Deduplication should consider:

- Company
- Filing period
- Signal category
- Direction
- Referenced Company Knowledge concept
- Source topic or category
- Normalized signal title
- Evidence overlap

Example duplicate candidates:

```text
Topic Evolution:
  Cloud strengthened.

Quarter Change:
  Cloud evidence increased.

Business Signal:
  Cloud activity strengthened.
```

The builder should preserve one signal with merged evidence rather than creating multiple duplicate signals.

Deduplication should not merge unrelated signals simply because their labels are similar.

Example:

```text
Cloud revenue acceleration observed.
Cloud infrastructure cost pressure observed.
```

These are distinct signals because one is revenue-related and the other is margin or operational.

## 6. Evidence Attachment Design

Every signal must be evidence-based.

Evidence should connect the signal to upstream structured intelligence. It should make the signal auditable without requiring the signal layer to read raw filings directly.

Evidence may reference:

- Filing metadata
- Theme identifiers or theme names
- Topic identifiers or topic names
- Quarter change entries
- Topic evolution entries
- Source artifact names
- Source filing dates
- Structured evidence references already present upstream

Evidence attachment should preserve:

- Source artifact
- Source period
- Source observation
- Signal contribution

Evidence should not become narrative explanation. It should show why the signal was detected, not why the signal matters.

## 7. Confidence Design

Confidence should be deterministic first.

Conceptual confidence inputs:

- Evidence quality
- Number of contributing sources
- Source agreement
- Historical consistency
- Filing coverage
- Signal specificity
- Lineage completeness

Confidence should be lower when:

- Only one weak source supports the signal
- Evidence is vague
- Source lineage is incomplete
- Movement is ambiguous
- Candidate signals conflict

Confidence should be higher when:

- Multiple structured artifacts agree
- Evidence is specific
- Filing coverage is complete
- The signal maps cleanly to Company Knowledge context
- Historical movement supports the observation

Confidence must not be narrative-based. It should not depend on persuasive wording or frontend presentation.

Future LLM enrichment may suggest confidence annotations, but deterministic confidence remains authoritative unless a later governed contract explicitly changes ownership.

## 8. Lineage Generation Design

Lineage should explain where each signal came from.

Builder-level lineage should include:

- Source filings
- Source artifacts
- Derived-from artifact names
- Pipeline version
- Schema version
- Generation timestamp
- Input hash

Signal-level lineage should connect each signal to its contributing structured observations.

Lineage generation should be deterministic:

- Sort source filings consistently
- Deduplicate source artifact references
- Preserve stable ordering
- Never remove upstream provenance

Lineage should support future audit, regeneration, debugging, and replay-safe processing.

## 9. Deterministic Responsibilities

The following should remain deterministic:

- Input normalization
- Candidate signal extraction from structured fields
- Signal category assignment from explicit source fields
- Direction assignment from explicit source fields
- Magnitude assignment from documented deterministic rules
- Confidence calculation from documented factors
- Evidence attachment
- Deduplication
- Lineage merge
- Metadata generation
- Input hashing

- Deterministic assignment when explicit.
- LLM enrichment allowed when ambiguity exists.
- Deterministic evidence remains authoritative.

Deterministic systems own the auditable basis for each signal.

## 10. Future LLM-Powered Enrichment

The builder design should support future LLM-powered enrichment as an optional offline layer.

Allowed future LLM use:

- Improve signal phrasing from supplied structured evidence
- Cluster overlapping signal candidates for review
- Suggest owner-readable signal summaries
- Help classify ambiguous candidates into existing categories when evidence is provided

Disallowed future LLM use:

- Runtime signal generation
- Frontend signal generation
- API-time signal generation
- Unsupported fact creation
- Recommendation generation
- Owner question generation inside the signal layer
- Narrative generation inside the signal layer
- Company Knowledge mutation

Future enrichment outputs must remain cached, persisted, and attributable to deterministic signal evidence.

## 11. Failure Modes

The future builder should handle missing or incomplete inputs without throwing when reasonable.

Expected behavior:

- Missing Company Knowledge: emit low-confidence or no signals depending on available evidence.
- Missing quarter changes: rely on other structured intelligence if available.
- Missing topic evolution: omit longitudinal signals.
- Missing filing metadata: preserve signal detection only if period can still be attributed.
- No candidate signals: return a valid empty signal artifact.

The builder should not fabricate signals to compensate for missing data.

## 12. Builder Non-Responsibilities

The Business Signal Builder must not:

- Explain signals
- Generate narratives
- Generate recommendations
- Generate owner questions
- Modify Company Knowledge
- Construct storage paths
- Persist artifacts
- Read raw SEC filings
- Call OpenAI directly in the deterministic builder
- Own frontend presentation wording

## 13. Future Implementation Checklist

Before implementation, future phases should define:

- Exact TypeScript builder input contract
- Candidate extraction rules by source artifact
- Deduplication key strategy
- Evidence reference shape
- Confidence calculation rules
- Lineage merge rules
- Empty artifact behavior
- Optional enrichment boundary
- Repository and storage ownership
- Command orchestration boundaries

Implementation should begin only after these rules are frozen.

