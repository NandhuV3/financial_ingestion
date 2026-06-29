# Themes Specification

Version: 1.0
Status: LOCKED
Owner: Themes Layer

## Layer Contract Summary

Inputs

* Theme Input Boundary Artifact

Outputs

* Themes Artifact

Primary Consumer

* Topic Assignment Layer

Execution Type

* LLM Builder

Prompt Contract

* `02-architecture-and-contracts/contracts/033-theme-prompt-contract.md`

---

# Purpose

Themes is the first Intelligence Artifact in the platform.

It answers:

```text
What filing-scoped business narratives can be extracted from the approved
Theme Input package?
```

Themes owns:

* narrative extraction
* observation clustering
* Theme generation
* Theme summaries
* Theme categorization
* evidence-backed observations

Themes extracts filing-scoped, evidence-backed business narratives from the
approved Theme Input Boundary Artifact.

A Theme is a coherent business narrative discussed in a filing.

Themes identifies what management discussed.

Themes does not determine what is true.

Themes does not determine what matters.

Themes does not determine what investors should conclude.

Themes does not create durable knowledge.

Themes does not perform business understanding.

Themes is an observation extraction layer.

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
Theme Grounding
      ↓
Theme Input Boundary
      ↓
Themes
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

Everything before Themes is deterministic.

Themes is the first governed LLM Builder.

Themes transforms approved visible filing evidence into structured narrative
observations.

Themes does not create business understanding.

Themes does not create Company Knowledge.

Themes does not create signals.

---

# Platform Object Classification

Themes is an Intelligence Artifact.

Reason:

Themes is the first layer that invokes an LLM.

It produces governed intelligence.

It does not produce durable knowledge.

It does not perform business understanding.

Themes produces observations.

---

# Input Boundary

Themes consumes only:

* Theme Input Boundary Artifact

Themes must never consume:

* Theme Grounding
* Themes Execution Readiness
* Evidence Identity
* Filing Artifact
* raw SEC filings
* Extraction output
* Normalization output
* Topic Assignment
* Topic Evolution
* Structured Intelligence
* Company Knowledge
* Quarter Change
* Business Signals
* Trust Signals
* Quarter Understanding
* Investor Intelligence
* Market Data

Theme Input Boundary is the only approved upstream input.

Themes must not reopen upstream artifacts.

Themes must not access hidden evidence.

Themes must not reconstruct grounding.

Themes must not redefine visibility.

---

# LLM Boundary

Themes is the first governed LLM Builder.

The LLM receives only the Theme Input Boundary Artifact.

All upstream deterministic preparation has already completed.

Themes must never:

* reopen upstream artifacts
* access hidden evidence
* reconstruct grounding
* redefine visibility
* generate new evidence references
* expand the visible input
* fabricate evidence
* introduce unsupported observations

The LLM may reason only over the approved Theme Input package.

No Theme may be generated from information outside the canonical visible
input.

---

# Intelligence Boundary

Themes begins where deterministic execution ends.

Before Themes executes, the platform has already:

* preserved the filing
* established canonical evidence
* validated readiness
* assembled grounding
* constrained visibility

Themes owns only governed observation extraction.

Themes performs no deterministic preparation.

Themes never modifies deterministic preparation.

This boundary separates Platform Foundation Artifacts from Intelligence
Artifacts.

---

# Prompt Ownership

This specification defines Theme ownership.

Prompt behavior belongs to:

* `02-architecture-and-contracts/contracts/033-theme-prompt-contract.md`

Prompt Registry owns:

* prompt versioning
* prompt lifecycle
* prompt templates

Themes consumes approved prompts.

Themes does not own prompt governance.

Themes does not construct prompts.

Themes does not define prompt wording.

Themes does not manage Prompt Registry.

---

# Theme Definition

A Theme is:

```text
A filing-supported business narrative discussed by management.
```

Every Theme must originate exclusively from the approved Theme Input Boundary
Artifact.

No Theme may be generated from information outside the canonical visible
input.

A Theme is not:

* a section heading
* a document label
* a metric
* a KPI
* a business conclusion
* a durable fact
* an investor conclusion
* a trust assessment
* a Topic assignment
* a business model inference

Themes describe narratives.

Themes do not describe truth.

---

# What Themes Extract

Themes extract coherent business narratives.

Examples:

* AI infrastructure investment
* Azure demand growth
* Datacenter expansion
* Commercial cloud adoption
* Supply chain constraints
* Regulatory scrutiny
* Security investments
* Gaming revenue decline
* OpenAI partnership expansion

Themes group related evidence into narrative clusters.

Themes do not decide whether those narratives are important.

Themes do not decide whether those narratives are true.

Themes do not decide what those narratives mean for owners.

---

# What Themes Must Not Extract

## Section Headings

Invalid:

* Management Discussion Overview
* Risk Factors
* Competition

Reason:

These are document structures.

Not narratives.

---

## Isolated Metrics

Invalid:

* Revenue increased 12%
* Margin increased 3%
* Subscribers reached 100 million

Reason:

Metrics support Themes.

Metrics are not Themes.

---

## Business Conclusions

Invalid:

* Cloud is the primary business
* Enterprise customers are the core market

Reason:

These belong to Structured Intelligence.

---

## Durable Facts

Invalid:

* Microsoft is a cloud company

Reason:

Durable understanding belongs to Company Knowledge.

---

## Trust Assessments

Invalid:

* Management appears credible

Reason:

Trust Architecture owns trust evidence.

---

## Investor Conclusions

Invalid:

* AI investment strengthens the investment case

Reason:

Investor Intelligence owns ownership reasoning.

---

# Allowed Reasoning

Themes may:

* read the approved Theme Input Boundary Artifact
* identify business narratives
* group related evidence
* cluster related observations
* aggregate related observations
* normalize narrative wording
* synthesize filing-scoped narratives
* create concise narrative titles
* create concise narrative summaries
* attach supporting canonical evidence

Themes may identify narratives.

Themes may perform narrative clustering.

Themes may not interpret narratives.

Themes may never:

* infer hidden evidence
* expand visibility
* reinterpret grounding
* fabricate evidence
* introduce unsupported observations

---

# Forbidden Reasoning

## No Visibility Expansion

Invalid:

```text
The filing likely also discusses AI demand outside the provided evidence.
```

Reason:

Theme Input Boundary owns visibility.

Themes may consume only visible input.

---

## No Grounding Reconstruction

Invalid:

```text
This paragraph appears related, so a new evidence reference can be inferred.
```

Reason:

Evidence Identity and deterministic preparation own evidence references and
grounding.

Themes never generate evidence identity.

---

## No Prompt Rewriting

Invalid:

```text
The builder changes prompt instructions to improve extraction.
```

Reason:

Prompt behavior belongs to the Themes Prompt Contract and Prompt Registry.

---

## No Business Understanding

Invalid:

```text
Cloud services are the company's primary revenue model.
```

Reason:

Structured Intelligence owns business understanding.

---

## No Business Model Inference

Invalid:

```text
The company operates a cloud-first subscription business model.
```

Reason:

Structured Intelligence owns business model understanding.

---

## No Durable Claims

Invalid:

```text
Microsoft's business model is cloud software.
```

Reason:

Company Knowledge owns durable truth.

---

## No Cross-Period Analysis

Invalid:

```text
AI investment has increased for three quarters.
```

Reason:

Topic Evolution owns longitudinal analysis.

---

## No Change Detection

Invalid:

```text
Cloud emphasis strengthened.
```

Reason:

Quarter Change owns delta detection.

---

## No Signal Generation

Invalid:

```text
Cloud demand signal strengthening.
```

Reason:

Business Signals owns signals.

---

## No Trust Reasoning

Invalid:

```text
Management appears consistent.
```

Reason:

Trust Architecture owns trust evidence.

---

## No Investor Reasoning

Invalid:

```text
This improves the ownership thesis.
```

Reason:

Investor Intelligence owns ownership reasoning.

---

# Theme Quality Requirements

A valid Theme must satisfy all of the following:

## Filing Supported

Every Theme must be supported by visible filing evidence from the approved
Theme Input Boundary Artifact.

---

## Narrative Based

Every Theme must represent a business narrative.

Not a metric.

Not a section heading.

---

## Canonically Evidence Backed

Every Theme must reference canonical evidence from the Theme Input Boundary
Artifact.

No unsupported Themes are allowed.

No Theme may cite evidence outside the approved visible input.

---

## Filing Scoped

Every Theme belongs to one filing.

Themes do not span periods.

---

## Independently Understandable

A Theme title should remain understandable when viewed independently.

Good:

* AI Infrastructure Expansion
* Commercial Cloud Growth
* Supply Chain Constraints

Bad:

* Growth
* Operations
* Competition

---

# Themes Artifact Contract

## Themes Artifact

```text
Themes Artifact

Artifact Framework
    ├── artifact_id
    ├── artifact_version
    ├── artifact_hash
    ├── framework_metadata
    └── framework_lineage

↓

ThemesContent
    ├── themes
    ├── prompt_id
    ├── prompt_version
    ├── reasoning_version
    └── filing-scoped observations
```

Artifact Framework owns artifact lifecycle.

Themes owns observation content.

These responsibilities never overlap.

The Themes builder returns:

```typescript
BuilderResult<ThemesContent>
```

```typescript
type ThemesContent = {
  filing_id: string;
  themes: Theme[];
  prompt_id: string;
  prompt_version: string;
  reasoning_version: string;
};

type Theme = {
  theme_id: string;
  title: string;
  summary: string;
  category: ThemeCategory;
  evidence: CanonicalEvidenceReference[];
  evidence_count: number;
  extraction_confidence: number;
  prompt_version: string;
  reasoning_version: string;
};

type CanonicalEvidenceReference = {
  evidence_ref: string;
};
```

Every Theme includes:

* `theme_id`
* `title`
* `summary`
* `category`
* canonical evidence references
* `evidence_count`
* `extraction_confidence`
* `prompt_id`
* `prompt_version`
* `reasoning_version`

The Themes artifact must not include:

* Topic IDs
* business conclusions
* investor conclusions
* durable facts
* trust verdicts
* valuation language

---

# Theme Categories

Theme category is an organizational label.

It is not a Topic.

It is not an interpretation.

Valid categories are:

```text
strategy
product
customer
competition
operations
financial
capital_allocation
management
trust
regulatory
technology
other
```

Category assignment must remain filing-scoped and non-interpretive.

---

# Builder Boundary

The Themes builder owns:

* prompt execution
* Theme extraction
* structured output validation
* artifact construction

The builder returns:

```typescript
BuilderResult<ThemesContent>
```

The builder must never:

* assign Topics
* generate Structured Intelligence
* create Company Knowledge
* generate Business Signals
* perform Quarter Understanding
* perform Investor Intelligence
* create evidence identities
* reconstruct grounding
* change visibility
* manage Prompt Registry
* define prompt wording
* construct prompts
* mutate upstream artifacts

The standard builder lifecycle, persistence sequence, lineage requirements,
and failure behavior are defined by the Builder Contract and Builder
Implementation Guide.

Prompt execution behavior belongs to the Themes Prompt Contract.

This specification does not duplicate those contracts.

---

# Validation

Themes validation must verify:

* every Theme references canonical evidence
* evidence references exist in the Theme Input Boundary Artifact
* summaries are supported by cited visible evidence
* categories are valid
* required fields exist
* schema compliance
* replay metadata
* structured output compliance
* `evidence_count` reconciles with evidence references
* `prompt_id` is recorded
* `prompt_version` is recorded
* `reasoning_version` is recorded

Validation must reject:

* unsupported Themes
* fabricated evidence references
* evidence outside the visible input
* invalid categories
* business conclusions
* investor conclusions
* durable facts
* Topic assignments
* trust verdicts

Validation must not evaluate:

* business quality
* investment quality
* prompt quality
* company quality
* management quality
* valuation quality

Those responsibilities belong to downstream layers or other contracts.

---

# Replayability

Themes is an LLM Builder.

Replayability requires an identical governed execution context.

A governed execution context requires identical:

* identical Theme Input Boundary Artifact
* identical `prompt_id`
* identical `prompt_version`
* identical `model_name`
* identical `model_version`
* identical reasoning version
* identical `render_hash`

Differences in any of the above produce a different execution context.

Replayability does not imply identical outputs across different models or
different prompt versions.

Replayability depends on governed prompt execution metadata defined by the
Prompt Registry.

---

# Downstream Boundary

Topic Assignment consumes Themes.

Topic Assignment owns:

* Topic IDs
* Topic mapping
* taxonomy alignment
* classification

Themes owns only filing-scoped narratives.

Themes must never assign Topics.

Themes must not create Topic IDs.

Themes must not normalize filing language into the Topic Registry.

---

# Ownership Boundaries

## Themes vs Theme Input Boundary

| Dimension | Theme Input Boundary | Themes |
| --------- | -------------------- | ------ |
| Question | What is visible? | What was discussed? |
| Execution | Deterministic | LLM Builder |
| Output | Theme Input package | Narrative observations |

Theme Input Boundary determines visible evidence.

Themes extract observations from visible evidence.

---

## Themes vs Structured Intelligence

| Dimension | Themes | Structured Intelligence |
| --------- | ------ | ----------------------- |
| Question | What was discussed? | How does the business work? |
| Output | Narrative clusters | Structured business understanding |
| Example | AI Infrastructure Investment | Strategic Priority: AI Infrastructure |

Themes identify narratives.

Structured Intelligence organizes business understanding.

---

## Themes vs Topic Assignment

| Dimension | Themes | Topic Assignment |
| --------- | ------ | ---------------- |
| Purpose | Narrative extraction | Topic classification |
| Output | Theme | Topic mapping |

Themes do not assign Topic IDs.

Topic Assignment owns Topic mapping.

---

## Themes vs Quarter Change

| Dimension | Themes | Quarter Change |
| --------- | ------ | -------------- |
| Scope | Single filing | Two periods |
| Output | Narrative | Delta |

Themes do not detect change.

Quarter Change detects change.

---

# Relationship To Ownership Questions

## Q1 Ownership

What does the company actually sell?

Themes contribute raw narrative evidence only.

Structured Intelligence and Company Knowledge own the answer.

---

## Q2 Ownership

Where does the next rupee come from?

Themes contribute raw narrative evidence only.

Investor Intelligence owns the answer.

---

## Q3 Ownership

Can the story be trusted?

Themes contribute management statements only.

Trust Architecture owns trust evidence.

---

## Q4 Ownership

Is the story already too expensive?

Themes contribute nothing.

---

## Q5 Ownership

Why would I hold it and what would change that?

Themes contribute raw narrative evidence only.

Investor Intelligence owns the answer.

---

# Forbidden Responsibilities

Themes never:

* constructs prompts
* defines prompt wording
* manages Prompt Registry
* creates evidence identities
* reconstructs grounding
* changes visibility
* assigns Topics
* generates Structured Intelligence
* creates Company Knowledge
* generates Business Signals
* performs Quarter Understanding
* performs Investor Intelligence
* performs business understanding
* creates durable facts
* performs investor reasoning
* mutates upstream artifacts

---

# Architectural Invariants

The following rules are strict and LOCKED:

1. Themes is the first Intelligence Artifact.
2. Themes is the first governed LLM Builder.
3. Themes consumes only the Theme Input Boundary Artifact.
4. Themes never bypasses Theme Input Boundary.
5. Themes never consumes Theme Grounding directly.
6. Themes never consumes Themes Execution Readiness directly.
7. Themes never consumes Evidence Identity directly.
8. Themes never consumes Filing Artifact directly.
9. Themes never consumes raw SEC filings.
10. Themes never consumes Extraction output.
11. Themes never consumes Normalization output.
12. Every Theme originates exclusively from the approved Theme Input Boundary
    Artifact.
13. Every Theme references canonical evidence.
14. Every Theme evidence reference must come from the visible input.
15. Themes never generates evidence references.
16. Themes never fabricates evidence.
17. Themes never expands visibility.
18. Themes never reconstructs grounding.
19. Themes never assigns Topics.
20. Themes never creates durable knowledge.
21. Themes never performs business understanding.
22. Themes never performs investor reasoning.
23. Themes never performs trust reasoning.
24. Themes never generates Structured Intelligence.
25. Themes never generates Business Signals.
26. Themes never performs Quarter Understanding.
27. Prompt governance belongs to the Prompt Contract and Prompt Registry, not
    Themes.
28. Themes never modifies upstream artifacts.
29. Theme categories remain organizational and non-interpretive.
30. Themes remain filing scoped.
31. Themes remain period specific.
32. Themes are observations, not conclusions.
33. Themes must not infer consequences not stated in visible filing evidence.
34. Themes must not make predictions.
35. Themes must not emit valuation language.
36. Themes must not emit investor recommendations.
37. Themes must not emit investor conclusions.
38. Themes must not emit trust judgments or trust verdicts.
39. Themes must not perform cross-period comparison.
40. Artifact Framework lifecycle ownership remains separate from Themes
    content.

LOCKED.

---

# Golden Rule

Themes identify what management discussed.

Themes do not determine what it means.

Themes do not determine whether it is true.

Themes do not determine whether it matters.

Themes do not determine what investors should conclude.

---

# References

This specification defines Themes ownership only.

Related architecture is defined by:

## Platform Foundation

* `001-layer-ownership.md`
* `005-builder-implementation-guide.md`
* `006-engineering-standards.md`

## Execution Layers

* `review/024-theme-input-boundary-spec.md`
* `specification/012-topic-assignment-spec.md`

## Prompt Contracts

* `contracts/033-theme-prompt-contract.md`
* `contracts/031-prompt-registry-contract.md`

## Implementation Contracts

* `contracts/032-builder-contract.md`
