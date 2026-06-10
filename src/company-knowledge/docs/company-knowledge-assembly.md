# Company Knowledge Assembly Contract

Company Knowledge will become the future source of truth for durable business understanding.

This document defines assembly rules only. It does not define builders, accessors, storage paths, commands, enrichment prompts, or generated artifacts.

## 1. Allowed Inputs

Company Knowledge may assemble information from:

- Company Identity.
- Company Profile as a temporary migration source.
- Filing metadata.
- Existing deterministic intelligence artifacts.

Company Knowledge may not assemble directly from:

- Health Dashboard.
- Narratives.
- Owner Questions.
- Frontend view models.
- Portfolio data.
- Journal data.

### Input Boundary

Allowed inputs must represent source facts, durable business understanding, or deterministic intermediate intelligence.

Disallowed inputs are presentation, user-specific, narrative, or downstream interpretation layers. They may consume Company Knowledge later, but they must not become upstream sources for Company Knowledge.

## 2. Ownership Migration

| Area | Current Owner | Future Owner | Migration Rule |
| --- | --- | --- | --- |
| Business description | Company Identity | Company Knowledge | Company Identity becomes a source; Company Knowledge owns the canonical durable description. |
| Products | Company Identity / Company Profile | Company Knowledge | Product lists move into Company Knowledge as durable business facts. |
| Customers | Company Identity / Company Profile | Company Knowledge | Customer groups move into Company Knowledge as durable buyer understanding. |
| Revenue drivers | Company Identity | Company Knowledge | Revenue drivers become canonical Company Knowledge fields. |
| Operating signals | Company Identity | Company Knowledge | Renamed and consolidated into `operating_model`. |
| Competitive signals | Company Identity | Company Knowledge | Renamed and consolidated into typed `competitive_positioning`. |
| Business risks | Company Profile / Theme Intelligence | Existing risk and signal layers | Company Knowledge may track dependencies, but it does not own risk classification. |
| Presentation summaries | Company Profile / Partner Domain | Company Profile / Partner Domain | Presentation remains outside Company Knowledge. |

### Current State

Company Identity owns:

- Business description.
- Products.
- Customers.
- Revenue drivers.
- Operating signals.
- Competitive signals.

### Future State

Company Knowledge owns:

- Business model.
- Products.
- Customers.
- Revenue drivers.
- Operating model.
- Competitive positioning.
- Key dependencies.

Company Identity becomes a supporting intelligence artifact.

Company Profile remains presentation support only.

## 3. Confidence Contract

Company Knowledge confidence must be deterministic and measurable.

No LLM scoring is allowed.

Confidence should be calculated from documented factors such as:

- Filing coverage.
- Identity coverage.
- Required field completeness.
- Lineage availability.

### Conceptual Formula

```text
confidence_score =
  filing_coverage_score
  + identity_coverage_score
  + completeness_score
  + lineage_score
```

The final score should be normalized to a bounded range.

Recommended range:

```text
0.0 to 1.0
```

### Factor Definitions

| Factor | Description |
| --- | --- |
| Filing coverage | Measures whether one or more current source filings support the knowledge artifact. |
| Identity coverage | Measures whether Company Identity provides usable products, customers, revenue drivers, operating signals, and competitive signals. |
| Required field completeness | Measures whether required Company Knowledge fields are populated. |
| Lineage availability | Measures whether source filings, derived artifacts, input hash, pipeline version, model version, prompt version, and generated timestamp are present. |

### Confidence Rules

- Confidence must never be inferred from presentation quality.
- Confidence must not depend on Health Dashboard output.
- Confidence must not depend on Investor Narrative output.
- Confidence must not depend on frontend usage.
- Confidence must be reproducible from stored inputs.

## 4. Lineage Propagation Rules

Every future Company Knowledge artifact must propagate:

- `source_filings`
- `derived_from`
- `input_hash`
- `pipeline_version`
- `model_version`
- `prompt_version`
- `generated_at`

### Source Filings

`source_filings` must list filing dates or filing identifiers used to assemble the artifact.

The field should come from:

- Filing metadata.
- Company Identity lineage.
- Company Profile lineage during migration.
- Deterministic intelligence artifacts that reference source filings.

### Derived From

`derived_from` must list upstream artifact names or paths used as inputs.

Examples:

```text
company-identity.enriched.json
company-profile.raw.json
metadata/filing.json
intelligence/themes.json
```

### Input Hash

`input_hash` must represent the normalized assembly input, excluding volatile timestamps.

If any upstream source used for assembly changes, the input hash must change.

### Pipeline Version

`pipeline_version` must identify the Company Knowledge assembly contract or implementation version used to produce the artifact.

### Model Version

`model_version` must identify the model or deterministic assembly model version used to produce the artifact.

If no LLM or model-backed enrichment is used, this should still contain an explicit deterministic assembly version such as:

```text
deterministic-v1
```

### Prompt Version

`prompt_version` must identify the prompt contract used when a future enrichment step contributes to the artifact.

If no prompt is used, this should still contain an explicit value such as:

```text
none
```

### Generated At

`generated_at` must record when the artifact was assembled.

This timestamp is audit metadata only and must not affect `input_hash`.

## 5. Future Dependency Graph

```text
Source Filings
  ↓
Existing Structured Intelligence
  ↓
Company Knowledge
  ↓
Business Signal Intelligence
  ↓
Quarter Understanding Intelligence
  ↓
Owner Questions Intelligence
```

Owner Intelligence is intentionally excluded from this dependency diagram unless a future dedicated artifact is created with clear ownership.

## 6. Assembly Principles

### Single Source Of Truth

Company Knowledge owns durable business understanding.

Other layers may consume Company Knowledge, but they should not redefine what the company does, who it serves, how it earns money, or why it has advantages.

### No Duplicated Ownership

If a field belongs to Company Knowledge, it should not be regenerated independently by Company Identity, Health Dashboard, Partner Domain, or frontend code.

Migration may temporarily read from older artifacts, but ownership should move toward Company Knowledge.

### Deterministic First

Assembly should prefer deterministic, reproducible inputs and rules.

LLM enrichment may improve wording or synthesis in future phases, but it must not replace lineage, confidence, or source-grounded assembly.

### Enrichment Second

If future enrichment exists, it must sit after deterministic assembly and preserve deterministic lineage.

Enrichment must not erase source fields or create unsupported facts.

### Reproducibility Through Lineage

Every Company Knowledge artifact must be reproducible from its declared inputs.

Lineage exists so engineers can audit why a fact exists and which upstream artifacts supported it.

### Confidence Is Measurable

Confidence must be computed from observable assembly quality signals.

It must not be a subjective narrative score.
