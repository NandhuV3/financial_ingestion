# Platform Glossary

Status: LOCKED

# 1. Purpose

The Platform Glossary defines the canonical vocabulary used throughout the intelligence platform.

Every architecture specification, artifact contract, builder contract, governance document, and prompt contract uses the definitions in this document.

This glossary exists to ensure every term has one meaning across the entire platform.

If a document uses one of these terms, it inherits the definition from this glossary unless explicitly stated otherwise.

---

# 2. Design Principles

A glossary term must:

* have exactly one canonical meaning
* remain stable over time
* avoid implementation details
* describe concepts rather than code
* be reusable across the platform

---

# 3. Core Platform Concepts

## Artifact

A versioned, immutable output produced by a platform layer.

Artifacts are the primary units of intelligence exchanged between layers.

Examples:

* Filing Artifact
* Themes
* Structured Intelligence
* Company Knowledge
* Business Signals
* Investor Intelligence

Artifacts are never modified after creation.

New versions produce new artifacts.

---

## Builder

A platform component responsible for constructing an artifact.

Builders orchestrate:

* input collection
* prompt execution (when applicable)
* validation
* artifact construction
* lineage generation
* persistence

Builders do not own business concepts.

Builders implement architecture.

---

## Layer

A logical stage within the intelligence pipeline.

Each layer owns one responsibility.

A layer may produce one or more artifacts.

Layers never duplicate responsibilities owned by other layers.

---

## Pipeline

The ordered execution of layers from raw filing ingestion to investor-facing intelligence.

The pipeline begins with SEC filings.

The pipeline ends with Partner Domain presentation.

---

## Registry

A governed catalog of reusable platform objects.

Registries own reusable concepts.

Examples:

* Topic Registry
* Prompt Registry

Registries are governed.

Builders consume registries.

Builders never modify registries.

---

## Governance

Rule-based control over platform evolution.

Governance decides:

* approval
* rejection
* promotion
* versioning
* lifecycle

Governance never produces intelligence.

Governance controls platform correctness.

---

# 4. Evidence Concepts

## Evidence

A filing-derived unit that supports downstream intelligence.

Evidence always originates from filing content.

Evidence never originates from LLM reasoning.

---

## Evidence Identity

The stable identity assigned to an evidence unit.

Evidence Identity enables:

* citation
* traceability
* lineage
* reproducibility

Evidence Identity does not determine importance.

---

## Evidence Unit

The smallest citable filing element defined by the Evidence Identity specification.

In Version 1 the canonical evidence unit is a paragraph.

---

## Filing Artifact

The canonical structured representation of one SEC filing.

Every downstream artifact traces lineage back to a Filing Artifact.

---

# 5. Intelligence Concepts

## Theme

A filing-scoped business narrative extracted from filing evidence.

Themes describe:

> What management discussed in this filing.

Themes are observations.

Themes are not durable knowledge.

Themes are not investor conclusions.

---

## Topic

A reusable business concept.

Topics are independent of:

* company
* filing
* reporting period

Topics normalize Themes into reusable concepts.

---

## Topic Assignment

The deterministic mapping between Themes and Topics.

Topic Assignment classifies.

It does not interpret.

---

## Topic Evolution

The deterministic observation of how Topics change across reporting periods.

Topic Evolution detects patterns.

It does not explain them.

---

## Structured Intelligence

A filing-scoped description of how the business works according to this filing.

Structured Intelligence organizes filing-supported observations into structured business understanding.

It does not produce durable truth.

---

## Company Knowledge

The governed, durable understanding of how a company operates.

Company Knowledge accumulates across filings.

It changes slowly through governance.

---

## Quarter Change

The deterministic comparison between two Structured Intelligence snapshots.

Quarter Change answers:

> What changed between this filing and the previous filing?

It does not explain why the change occurred.

---

## Business Signal

A deterministic observation derived from Company Knowledge and enrichment inputs.

Business Signals describe:

> What is observably true right now?

Business Signals do not interpret implications.

---

## Trust Signal

A deterministic trust observation derived from Trust Architecture evidence.

Trust Signals describe:

* trust observations
* severity
* direction
* confidence

Trust Signals do not produce trust verdicts.

---

## Quarter Understanding

A period-level interpretation of Business Signals in the context of Company Knowledge.

Quarter Understanding answers:

> What happened this period and why does it matter to understanding the business?

Quarter Understanding does not answer ownership questions.

---

## Investor Intelligence

The investor-facing synthesis layer.

Investor Intelligence answers the five ownership questions.

No upstream layer may answer them directly.

---

# 6. Reasoning Concepts

## Observation

A description of what evidence states.

Observations do not explain.

Observations do not evaluate.

Observations do not conclude.

Examples:

* Azure revenue increased.
* Management discussed AI investment.

---

## Interpretation

An explanation of what observations mean within business context.

Interpretation begins in Quarter Understanding.

No upstream deterministic layer performs interpretation.

---

## Conclusion

A synthesized judgment derived from multiple interpretations.

Investor Intelligence owns conclusions.

---

## Narrative

A coherent business story expressed within a filing.

Narratives become Themes.

Narratives are filing-scoped.

---

## Signal

A structured observation produced deterministically from upstream artifacts.

Signals are classified.

Signals are not interpreted.

---

# 7. Scope Concepts

## Filing-Scoped

Applies only to one filing.

Examples:

* Themes
* Structured Intelligence

---

## Period-Scoped

Applies to one reporting period.

Examples:

* Quarter Understanding

---

## Cross-Period

Requires multiple reporting periods.

Examples:

* Topic Evolution
* Quarter Change
* Trust Architecture

---

## Durable

Expected to remain valid across many reporting periods.

Examples:

* Company Knowledge

---

## Canonical

The officially governed platform truth.

Canonical artifacts are produced only through governance.

---

# 8. Ownership Concepts

## Required Input

An upstream artifact that must exist before a layer executes.

Without Required Inputs the layer cannot execute.

---

## Enrichment Input

An optional upstream artifact that improves output quality.

Enrichment Inputs never change ownership.

Their absence produces reduced depth, not failure.

---

## Upstream

A producer layer.

---

## Downstream

A consumer layer.

---

## Lineage

The complete chain of artifacts used to construct another artifact.

Lineage guarantees traceability.

---

## Provenance

The original source of information.

For this platform, provenance begins with SEC filing evidence.

---

# 9. Quality Concepts

## Confidence

An estimate of how strongly available evidence supports an output.

Confidence measures evidence support.

It does not measure correctness.

---

## Coverage

The extent to which available evidence contributes to an artifact.

---

## Depth

The richness of available inputs used to construct an artifact.

Depth decreases when enrichment inputs are unavailable.

---

## Validation

Verification that an artifact satisfies its schema and contract.

Validation does not assess business quality.

---

# 10. Golden Rules

Every layer owns exactly one responsibility.

Every artifact has exactly one owner.

Evidence precedes intelligence.

Observation precedes interpretation.

Interpretation precedes investor conclusions.

Governance controls durable truth.

Historical artifacts are immutable.

Lineage is mandatory.

Reproducibility is mandatory.

Architecture defines ownership.

Builders implement architecture.
