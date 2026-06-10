# Company Knowledge Builder Design

This document defines how a future Company Knowledge artifact will be assembled.

It is design only. It does not implement builders, commands, accessors, storage paths, enrichment prompts, or generated artifacts.

## 1. Field Assembly Mapping

### `business_model`

`business_model` is structured into:

- `value_creation`
- `monetization`
- `revenue_structure`

Allowed `revenue_structure` values:

- `recurring`
- `transactional`
- `project`
- `mixed`

| Rule | Source Artifact | Source Field | Behavior |
| --- | --- | --- | --- |
| Primary | Company Identity | `business_description`, `revenue_drivers`, business model signals | Use to populate value creation, monetization, and revenue structure when explicitly supported. |
| Fallback | Company Profile | legacy presentation/profile business model fields, if present during migration | Use only as a temporary migration source. |
| Deterministic fallback | Filing metadata | `company` | Produce empty strings and `mixed` revenue structure only when no better supported value exists. |
| Missing data | None | None | Set `value_creation` and `monetization` to `""`; set `revenue_structure` to `mixed`. |

### `products`

| Rule | Source Artifact | Source Field | Behavior |
| --- | --- | --- | --- |
| Primary | Company Identity | `primary_products` | Use normalized product/service list. |
| Fallback | Company Profile | `products` | Use during migration if identity products are missing. |
| Deterministic fallback | Existing deterministic artifacts | supported product-like facts only | Include only explicit product/service facts. |
| Missing data | None | None | Set `products` to `[]`. |

### `customers`

| Rule | Source Artifact | Source Field | Behavior |
| --- | --- | --- | --- |
| Primary | Company Identity | `primary_customers` | Use normalized customer and buyer groups. |
| Fallback | Company Profile | `customers` | Use during migration if identity customers are missing. |
| Deterministic fallback | Existing deterministic artifacts | supported customer-like facts only | Include only explicit customer/buyer facts. |
| Missing data | None | None | Set `customers` to `[]`. |

### `revenue_drivers`

| Rule | Source Artifact | Source Field | Behavior |
| --- | --- | --- | --- |
| Primary | Company Identity | `revenue_drivers` | Use explicit revenue driver signals. |
| Fallback | Company Profile | temporary revenue-related fields, if present during migration | Use only if identity revenue drivers are missing. |
| Deterministic fallback | Existing deterministic artifacts | supported revenue mechanism facts only | Include only explicit monetization mechanisms. |
| Missing data | None | None | Set `revenue_drivers` to `[]`. |

### `competitive_positioning`

| Rule | Source Artifact | Source Field | Behavior |
| --- | --- | --- | --- |
| Primary | Company Identity | `competitive_signals` | Convert supported durable signals into `{ signal, source_type }` entries. |
| Fallback | Company Profile | temporary competitive fields, if present during migration | Use only if identity competitive signals are missing. |
| Deterministic fallback | Existing deterministic artifacts | durable, supported positioning signals only | Include only supported signals; do not infer moats. |
| Missing data | None | None | Set `competitive_positioning` to `[]`. |

`source_type` rules:

- `claimed`: management-presented or filing-described positioning statements.
- `observed`: deterministic signals observed across artifacts, such as recurring customer behavior, platform use, or durable operating signals.

### `operating_model`

| Rule | Source Artifact | Source Field | Behavior |
| --- | --- | --- | --- |
| Primary | Company Identity | `operating_signals` | Convert supported operating signals into operating model entries. |
| Fallback | Company Profile | temporary operating fields, if present during migration | Use only if identity operating signals are missing. |
| Deterministic fallback | Existing deterministic artifacts | supported operating capability facts only | Include only explicit operating capabilities. |
| Missing data | None | None | Set `operating_model` to `[]`. |

### `key_dependencies`

| Rule | Source Artifact | Source Field | Behavior |
| --- | --- | --- | --- |
| Primary | Company Identity | supported dependencies if available in identity evidence | Use explicit dependencies only and preserve dependency type. |
| Fallback | Company Profile | `business_risks` only when risk describes a concrete dependency | Use cautiously during migration. |
| Deterministic fallback | Existing deterministic artifacts | dependency-like facts from topics, themes, or risk signals | Include only concrete dependencies. |
| Missing data | None | None | Set `key_dependencies` to `[]`. |

## 2. Assembly Precedence

| Rank | Source | Use Case |
| --- | --- | --- |
| 1 | Company Identity | Primary source for durable business understanding during migration. |
| 2 | Company Profile | Temporary migration source only. |
| 3 | Filing metadata | Company name, ticker, filing lineage, and minimal audit fields. |
| 4 | Existing deterministic intelligence artifacts | Explicit facts or signals not available through identity/profile. |
| 5 | Deterministic empty fallback | Empty strings or arrays when no supported data exists. |

### Rationale

Company Identity currently owns most durable business-understanding fields, so it should have highest precedence until ownership migrates to Company Knowledge.

Company Profile is presentation-oriented and should be used only to preserve compatibility during migration.

Filing metadata provides auditability but should not synthesize business understanding.

Existing deterministic artifacts may fill gaps only when they contain explicit supported facts.

Empty fallback is preferred over unsupported inference.

## 3. Competitive Advantage Rules

Future `competitive_positioning` must follow these rules:

- No new facts.
- No LLM-generated moat creation.
- No unsupported inference.
- No generic claims such as "strong brand", "market leadership", or "innovation" unless supported by upstream evidence.
- Only supported durable signals may become competitive positioning entries.
- Every entry must include `source_type`.

Allowed examples:

| Supported Signal | Allowed Competitive Positioning |
| --- | --- |
| `developer ecosystem` | Developer ecosystem. |
| `switching costs` | Customer switching costs. |
| `network effects` | Network effects. |
| `brand trust and customer loyalty` | Brand trust and customer loyalty. |
| `scale advantages` | Scale advantages. |

Not allowed:

- "Wide moat" unless explicitly supported by an upstream field.
- "Dominant market position" unless explicitly supported by source intelligence.
- "Best-in-class management" because trust and management quality belong outside Company Knowledge.
- Risk-only statements converted into advantages.

## 4. Operating Model Rules

Future `operating_model` describes how the business runs and delivers value.

Allowed sources:

- Company Identity `operating_signals`.
- Explicit business model evidence.
- Supported deterministic identity intelligence.

Allowed examples:

| Supported Signal | Operating Model Entry |
| --- | --- |
| `cloud infrastructure` | Cloud infrastructure. |
| `logistics network` | Logistics network. |
| `manufacturing capability` | Manufacturing capability. |
| `developer platform ecosystem` | Developer platform ecosystem. |
| `global distribution network` | Global distribution network. |

Not allowed:

- Invented operating structures.
- Generic "efficient operations" statements.
- Macroeconomic commentary.
- Quarterly cost observations without durable operating support.

## 5. Key Dependency Rules

`key_dependencies` captures concrete things the business depends on to operate, grow, or deliver its products.

Every dependency must include:

- `description`
- `type`

Allowed dependency types:

- `supplier`
- `platform`
- `technology`
- `customer`
- `regulatory`

Allowed examples:

- Cloud infrastructure.
- Distribution partners.
- Supplier concentration.
- Developer ecosystem.
- Payment networks.
- Manufacturing capacity.
- Data center capacity.
- Energy availability.
- Advertising demand.

Not allowed:

- Generic risks.
- Macroeconomic commentary.
- Narrative observations.
- Quarter-specific performance movement.
- Frontend or portfolio behavior.

### Inclusion Rules

A dependency may be included only when:

- It is concrete.
- It is supported by an allowed upstream artifact.
- It affects how the business operates, sells, delivers, or scales.
- It is not merely a broad risk category.

## 6. Confidence Calculation Design

Confidence must be deterministic.

No LLM scoring is allowed.

### Score Range

```text
minimum: 0.0
maximum: 1.0
```

### Weighted Factors

| Factor | Weight | Description |
| --- | ---: | --- |
| Filing coverage | 0.25 | Measures whether current and historical source filings are available. |
| Identity coverage | 0.30 | Measures whether Company Identity supplies usable durable business fields. |
| Field completeness | 0.30 | Measures whether required Company Knowledge fields are populated. |
| Lineage completeness | 0.15 | Measures whether lineage and audit metadata are complete. |

### Calculation Concept

```text
confidence_score =
  (filing_coverage * 0.25)
  + (identity_coverage * 0.30)
  + (field_completeness * 0.30)
  + (lineage_completeness * 0.15)
```

Each subscore must be normalized to `0.0` through `1.0` before weighting.

The final score must be clamped to:

```text
0.0 <= confidence_score <= 1.0
```

### Subscore Design

| Subscore | Full Credit Example | Partial Credit Example | No Credit Example |
| --- | --- | --- | --- |
| Filing coverage | Current filing plus historical lineage exists. | Current filing only. | No source filing lineage. |
| Identity coverage | Identity has business description, products, customers, revenue drivers, operating signals, and competitive signals. | Identity has some fields. | Identity missing. |
| Field completeness | All Company Knowledge fields populated. | Some arrays empty. | Most fields missing. |
| Lineage completeness | `source_filings`, `derived_from`, `input_hash`, `pipeline_version`, `model_version`, `prompt_version`, and `generated_at` present. | Some lineage fields present. | No lineage metadata. |

## 7. Lineage Merge Design

Lineage must be merged from upstream artifacts without duplicates.

Example:

```text
Identity source_filings:
  A
  B

Profile source_filings:
  B
  C

Result:
  A
  B
  C
```

### Deduplication

- Deduplicate exact filing identifiers.
- Normalize whitespace.
- Preserve original filing identifiers after normalization.
- Do not create synthetic filing IDs.

### Ordering

Preferred ordering:

```text
oldest → newest
```

If dates cannot be parsed reliably:

```text
first observed → last observed
```

### Propagation

`source_filings` should include all filings that materially support the assembled artifact.

`derived_from` should include every upstream artifact used in assembly.

`input_hash` should be computed from normalized assembly inputs and exclude volatile timestamps.

`pipeline_version` should identify the future Company Knowledge assembly implementation version.

`model_version` should identify the model or deterministic assembly model version used.

`prompt_version` should identify the prompt contract used when enrichment contributes to the artifact, or `none` if no prompt is used.

`generated_at` should reflect artifact creation time and should not affect the input hash.

## 8. Failure Modes

### Company Identity Missing

Use Company Profile as a temporary migration source.

If Company Profile is also missing, use filing metadata and deterministic empty fallback.

Confidence should decrease through identity coverage and field completeness.

### Company Profile Missing

Use Company Identity directly.

Confidence should not decrease if Company Identity provides enough coverage.

### Both Missing

Create no synthesized knowledge.

Fields should use empty string or empty arrays.

Lineage should still include available filing metadata if present.

Confidence should be low.

### Incomplete Lineage

Assemble only supported fields.

Confidence should decrease through lineage completeness.

The artifact should remain auditable about what lineage is missing.

### Incomplete Filings

Use available source filings only.

Do not backfill missing quarters through inference.

Confidence should decrease through filing coverage.

### Fallback Philosophy

Empty, auditable fields are better than plausible but unsupported business claims.

## 9. Future Implementation Checklist

For future Phase 5.4.4:

- Create a Company Knowledge builder module.
- Load only allowed inputs.
- Do not read Health Dashboard, Narratives, Owner Questions, frontend view models, portfolio data, or journal data.
- Implement field assembly using this mapping.
- Implement source precedence exactly as documented.
- Implement competitive advantage rules without inferred moats.
- Preserve `claimed` versus `observed` competitive positioning source type.
- Implement operating model rules without invented structures.
- Implement key dependency rules with concrete dependency filters.
- Preserve key dependency type.
- Implement deterministic confidence scoring with documented weights.
- Implement lineage merge with deduplication and stable ordering.
- Compute `input_hash` from normalized inputs excluding timestamps.
- Preserve `pipeline_version` and `generated_at`.
- Add tests for every field mapping.
- Add tests for precedence.
- Add tests for confidence scoring.
- Add tests for lineage merging.
- Add tests for missing identity/profile failure modes.
- Add tests proving disallowed inputs are not used.
- Do not create enrichment prompts in the builder phase unless a separate enrichment phase is explicitly approved.
