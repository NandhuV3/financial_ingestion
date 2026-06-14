# Pipeline Validation Plan

Scope:

- Company Knowledge
- Business Signals
- Quarter Understanding

This plan defines validation expectations only. It does not introduce implementation changes.

## 1. Company Knowledge

### Inputs

- Company Identity enrichment or evidence
- Company Profile, as a temporary migration source
- Filing metadata
- Optional `derivedFrom` artifact references

### Outputs

- `CompanyKnowledge`
- Durable company-scoped business understanding
- Metadata:
  - `schema_version`
  - `pipeline_version`
  - `knowledge_version`
  - `generated_at`
  - `input_hash`
- Lineage:
  - `source_filings`
  - `derived_from`
  - `model_version`
  - `prompt_version`

### Expected Behavior

- Assemble only from explicitly supplied source fields.
- Preserve source precedence:
  - Company Identity
  - Company Profile
  - Filing Metadata
  - Empty fallback
- Do not infer missing business facts.
- Do not classify unknown values into known categories.
- Return a valid object for empty or partial inputs.
- Generate deterministic hashes from meaningful inputs only.
- Merge and deduplicate lineage deterministically.

### Validation Criteria

- Empty inputs return valid `CompanyKnowledge`.
- No returned field is `undefined`.
- Arrays are always present.
- Strings fall back to `""`.
- Higher-priority sources win field-by-field.
- Same inputs produce the same `input_hash`.
- `generated_at` changes do not change `input_hash`.
- Real source changes do change `input_hash`.
- Confidence remains within valid bounds.
- Lineage is deduplicated and stably ordered.
- Repository persistence preserves artifacts exactly when storage is involved.

### Failure Examples

- Builder maps an unknown revenue model to `"mixed"` without an explicit source.
- Builder converts generic business risks into key dependencies.
- Company Profile overwrites a populated Company Identity field.
- Hash changes only because `generated_at` changed.
- Lineage contains duplicate source filings.
- Empty input causes a thrown exception.

## 2. Business Signals

### Inputs

- `CompanyKnowledge`
- Filing metadata
- `reportingPeriod`
- Optional `derivedFrom` artifact references

### Outputs

- `BusinessSignalArtifact`
- Signals generated from durable Company Knowledge fields
- Metadata:
  - `schema_version`
  - `pipeline_version`
  - `signal_version`
  - `generated_at`
  - `input_hash`
- Lineage:
  - `source_filings`
  - `derived_from`

### Expected Behavior

- Generate deterministic in-memory signals only.
- Use `reportingPeriod` as the artifact period.
- Never infer reporting period from filing dates.
- Generate signals from known Company Knowledge fields:
  - `revenue_drivers`
  - `products`
  - `customers`
  - `competitive_positioning`
  - `operating_model`
  - `key_dependencies`
- Attach deterministic evidence to every signal.
- Deduplicate equivalent signals and evidence.
- Preserve stable ordering.
- Return a valid empty artifact when no signal inputs exist.
- Do not explain signals.
- Do not generate recommendations.
- Do not modify Company Knowledge.

### Validation Criteria

- `artifact.period === reportingPeriod`.
- Missing `reportingPeriod` produces `period === ""`.
- Filing dates never become `artifact.period`.
- Every signal has:
  - deterministic `signal_id`
  - category
  - summary
  - direction
  - magnitude
  - confidence
  - evidence
- Every evidence item has deterministic identity.
- Confidence is within `[0, 1]`.
- Duplicate source values produce one signal.
- Same inputs produce identical output.
- Same inputs produce identical `input_hash`.
- Changes to product, customer, revenue driver, or reporting period change the hash.
- Empty input returns a valid artifact with `signals: []`.
- Repository persistence preserves artifacts exactly when storage is involved.

### Failure Examples

- Artifact period falls back to filing date.
- Signal is created without evidence.
- Duplicate products create duplicate product signals.
- Signal summary contains explanatory narrative instead of observation.
- Builder mutates Company Knowledge.
- Hash changes only because `generated_at` changed.
- Empty inputs throw.

## 3. Quarter Understanding

### Inputs

- `CompanyKnowledge`
- `BusinessSignalArtifact`
- LLM reasoning output
- `reportingPeriod`
- Optional `derivedFrom` artifact references

### Outputs

- `QuarterUnderstandingArtifact`
- Deterministic assembly of owner-neutral quarter understandings
- Metadata:
  - `schema_version`
  - `pipeline_version`
  - `understanding_version`
  - `generated_at`
  - `input_hash`
- Lineage:
  - Company Knowledge lineage
  - Business Signal lineage
  - automatic Business Signal artifact reference
  - caller-provided `derivedFrom`

### Expected Behavior

- Validate LLM reasoning output before assembly.
- Do not call LLM providers.
- Do not execute prompts.
- Do not perform file IO.
- Generate deterministic `understanding_id` values from:
  - `semantic_anchor_key`
  - category
  - `reportingPeriod`
- Generate `business_key` from:
  - company
  - category
  - topic from `semantic_anchor_key`
- Resolve evidence only from known Business Signal IDs.
- Ignore unknown supporting signal IDs safely.
- Build confidence deterministically.
- Do not trust LLM confidence scores.
- Sort understandings by:
  - importance: high, medium, low
  - then `semantic_anchor_key`
- Return a valid empty artifact when no valid understandings exist.

### Validation Criteria

- Happy path produces expected understandings.
- `understanding_id` is deterministic.
- `business_key` is persisted.
- Evidence references resolve only known signal IDs.
- Unknown signal IDs do not create evidence.
- Confidence reflects resolved evidence count and deterministic rules.
- Business Signal artifact automatically appears in lineage.
- Lineage deduplicates source filings and derived artifacts.
- Metadata is populated.
- Input hash is stable for identical inputs.
- Input hash changes when:
  - reasoning output changes
  - Business Signal artifact changes
  - Company Knowledge changes
  - reporting period changes
- Empty reasoning output returns `understandings: []`.
- Repository persistence preserves artifacts exactly when storage is involved.

### Failure Examples

- Builder creates evidence for an unknown signal ID.
- LLM-provided confidence is copied directly into the artifact.
- `business_key.topic` is invented instead of using `semantic_anchor_key`.
- Business Signal lineage is omitted unless caller manually passes it.
- Understanding order changes between identical runs.
- Hash changes only because `generated_at` changed.
- Empty reasoning output throws.

## Cross-Pipeline Validation

### Required End-To-End Checks

- Company Knowledge output can be passed into Business Signals without transformation.
- Business Signal output can be passed into Quarter Understanding without transformation.
- Lineage flows forward across all three layers.
- Hashes are stable and meaningful at each layer.
- Repositories, where used, preserve artifacts exactly.
- No layer performs responsibilities owned by a downstream layer.

### Ownership Boundaries

- Company Knowledge owns durable business facts.
- Business Signals own observations about movement around those facts.
- Quarter Understanding owns explanation assembly from signals and reasoning output.

### Invalid Cross-Layer Behavior

- Business Signals redefining company products or customers.
- Quarter Understanding modifying Business Signals.
- Company Knowledge deriving quarter-specific movement.
- Any layer producing investment recommendations.
- Any builder performing storage or repository work.
- Any repository mutating artifact contents.

## Validation Commands

Recommended validation before pipeline promotion:

```bash
npm run typecheck
npm test
```

Optional focused validation:

```bash
npm test -- company-knowledge
npm test -- business-signal
npm test -- quarter-understanding
```

Command names may vary by test runner configuration.
