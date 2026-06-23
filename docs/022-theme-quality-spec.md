# Theme Quality Specification

Version: 1.0
Status: LOCKED
Owner: Filing Intelligence Layer

---

# Purpose

Themes answer:

```text
What did management discuss in this filing?
```

Themes are filing-scoped observations extracted from filing evidence.

Themes are not:

* business conclusions
* investor conclusions
* recommendations
* trust judgments
* durable company knowledge
* topic evolution
* quarter-over-quarter change

This specification defines what constitutes a high-quality Themes artifact.

It governs:

* quality objectives
* coverage evaluation
* evidence diversity evaluation
* grounding quality
* Theme distinctiveness
* category distribution observability
* precision evaluation
* quality metrics
* Themes quality ownership

It does not redefine:

* the Theme schema
* Theme extraction mechanics
* Evidence Identity
* Filing Artifact behavior
* Topic Assignment
* Topic Evolution
* Structured Intelligence
* Company Knowledge
* Business Signals
* Trust Architecture

The following specifications remain authoritative for their owned contracts:

* `020-filing-artifact-spec.md`
* `021-evidence-identity-spec.md`
* `018-themes-spec.md`
* `019-topic-assignment-spec.md`
* `020-topic-evolution-spec.md`
* `022-structured-intelligence-spec.md`

Where evidence identity terminology conflicts, the locked Evidence Identity
Specification is authoritative.

---

# Architectural Position

Theme quality is evaluated at the Themes layer without changing the ownership
or meaning of any upstream or downstream artifact.

```text
Filing Artifact
      ↓
Evidence Catalog
      ↓
Themes
      ↓
Topic Assignment
      ↓
Topic Evolution
```

Structured Intelligence independently consumes the Filing Artifact and Themes:

```text
Filing Artifact + Themes
          ↓
Structured Intelligence
```

Theme quality evaluation observes whether Themes adequately represent the
filing discussion. It does not perform topic normalization, temporal
comparison, business interpretation, or durable knowledge promotion.

---

# Theme Quality Objectives

## 1. Evidence Grounding

Every Theme must be supported by one or more canonical `evidence_ref` values
from the Evidence Catalog for the same filing.

Grounding quality evaluates whether the selected evidence directly supports
the Theme title and summary.

Evidence is not adequate merely because it:

* belongs to the same filing
* belongs to a related section
* mentions a related entity
* contains adjacent but different business discussion
* is broad enough to contain many unrelated statements

A high-quality Theme cites evidence that makes the observation independently
auditable without requiring unsupported inference.

## 2. Filing Coverage

A high-quality Themes artifact represents the material range of discussion in
the filing without attempting to restate every paragraph.

Coverage must consider:

* evidence catalog utilization
* canonical section coverage
* category coverage
* observation coverage

Coverage quality is not equivalent to Theme count.

## 3. Evidence Diversity

A high-quality Themes artifact uses evidence references that reflect the
diversity of filing discussions represented by its Themes.

Evidence diversity evaluates:

* how many unique evidence references are used
* how frequently the same evidence reference is reused
* whether one paragraph dominates multiple Themes
* whether both required filing sections contribute where applicable
* whether distinct Themes rely on meaningfully distinct support

Evidence reuse is allowed when one paragraph directly supports multiple
distinct observations. Reuse becomes a quality concern when it substitutes
for broader filing grounding or supports Themes not directly stated by the
paragraph.

## 4. Theme Distinctiveness

Each Theme should represent a coherent and distinguishable filing
observation.

Distinctiveness requires that two Themes not differ only through:

* synonymous titles
* minor wording changes
* broader versus narrower restatements of the same observation
* category changes without a different underlying observation
* duplicated evidence with materially equivalent summaries

Distinctiveness does not require unrelated evidence. One filing statement may
support multiple Themes when each Theme captures a genuinely different
observable discussion.

## 5. Category Balance

Theme categories organize observations. They do not interpret importance,
sentiment, direction, or investor relevance.

Quality evaluation observes whether category distribution is plausible for the
filing and whether substantial discussion areas appear omitted or
overrepresented.

Category balance is contextual. A filing may legitimately concentrate on one
or two categories.

## 6. Theme Precision

A precise Theme states only what is observable in its cited filing evidence.

Theme titles and summaries must avoid:

* unsupported implications
* inferred consequences
* predictions
* investor conclusions
* recommendations
* valuation language
* trust verdicts
* durable-company assertions
* cross-period claims

## 7. Replayability

Theme quality evaluation must remain reproducible for the same Themes artifact
and Evidence Catalog.

Quality metrics must be derived from persisted artifact content and governed
evaluation rules. They must not depend on:

* unordered iteration
* filesystem enumeration
* mutable external data
* hidden randomness
* model-generated evidence identities
* downstream artifacts

Quality metrics observe an artifact. They do not rewrite it.

---

# Coverage Model

Coverage measures how effectively the Themes artifact represents the available
filing discussion.

Coverage is multidimensional. No single count is sufficient.

## Evidence Catalog Utilization

Evidence catalog utilization measures the share of available canonical
evidence records referenced by at least one Theme.

```text
evidence_catalog_utilization =
unique_theme_evidence_refs
/
total_evidence_catalog_entries
```

The measure is observational.

Low utilization may be appropriate when a filing contains extensive repeated,
administrative, tabular, or immaterial disclosure. It becomes a quality
concern when material discussion areas are absent from Themes.

High utilization does not prove quality. A builder may cite many paragraphs
without producing precise or distinct Themes.

## Section Coverage

Section coverage records which canonical Filing Artifact sections contribute
evidence to at least one Theme.

For the current 10-Q policy, the observable sections are:

```text
management_discussion
risk_factors
```

Section coverage must be evaluated against the filing's actual discussion.
The presence of a required section does not require a fixed number of Themes
from that section.

## Category Coverage

Category coverage records the set and distribution of Theme categories
present in the artifact.

The canonical categories are:

* `strategy`
* `financial`
* `operations`
* `competition`
* `regulatory`
* `management`
* `technology`
* `capital_allocation`
* `customer`
* `product`
* `trust`
* `other`

Category coverage does not require every category to be populated.

A missing category is a quality signal only when the filing contains material
discussion that should have produced an observation in that category.

## Observation Coverage

Observation coverage evaluates whether the Themes artifact captures the
distinct material discussions present in the filing.

Observation coverage is not paragraph coverage. Multiple paragraphs may
support one coherent Theme, and one paragraph may contain multiple observable
discussions.

Evaluation may identify apparent omitted observations, but must not create or
persist new Themes as part of the metric.

## Theme Count Interpretation

Low Theme count is not automatically bad.

High Theme count is not automatically good.

A concise artifact may be high quality when it captures all material
discussions with distinct, well-grounded Themes.

A large artifact may be low quality when it contains:

* duplicates
* fragmented restatements
* unsupported implications
* administrative filing text
* repeated observations separated only by wording

Coverage quality matters more than raw Theme count.

---

# Evidence Diversity

Evidence diversity measures whether Theme grounding reflects the breadth of
the filing discussions represented by the artifact.

## Diversity Observations

The following values must be observable:

* total evidence selections
* unique evidence references used
* evidence reuse count
* evidence concentration by reference
* evidence distribution by canonical section
* paragraph dominance

## Evidence Concentration

Evidence concentration describes how Theme evidence selections are distributed
across unique evidence references.

A concentrated artifact relies heavily on a small number of evidence
references. Concentration may indicate:

* legitimate multi-observation paragraphs
* broad source paragraphs containing several filing discussions
* weak evidence selection
* omitted filing coverage
* duplicated Themes
* claims grounded to adjacent rather than direct evidence

Concentration is a quality signal, not automatically a validation failure.

## Paragraph Dominance

Paragraph dominance occurs when one evidence record supports a disproportionate
share of Themes.

Dominance requires review when:

* the Themes describe materially different observations
* the paragraph does not directly state every observation
* more precise evidence exists elsewhere in the catalog
* repeated citation hides omitted filing sections or categories

No universal dominance threshold is locked because paragraph size, filing
type, disclosure structure, and business complexity vary.

Any future threshold must be justified through governed evaluation data across
multiple companies, sectors, and filing types.

## Evidence Reuse

Evidence reuse is permitted.

Reuse is high quality only when the same paragraph directly supports each
Theme that cites it.

Reuse must not:

* replace more precise available evidence
* justify inferred claims
* create artificial coverage
* conceal duplicated Themes
* substitute one broad paragraph for the filing as a whole

## Audit Example

An observed filing produced:

```text
Evidence Catalog records: 59
Unique evidence references used by Themes: 4
```

This is a quality concern because the Themes artifact represented only a small
portion of the available filing evidence and repeatedly relied on one
paragraph for distinct observations.

The result is not automatically invalid. It requires quality review for:

* omitted material discussions
* paragraph dominance
* weak claim-to-evidence alignment
* duplicate or overlapping Themes
* section and category imbalance

The concern must not be resolved by mechanically increasing Theme count or
forcing arbitrary catalog utilization.

---

# Theme Distinctiveness

## Duplicate Themes

Duplicate Themes represent materially the same observation using equivalent
titles, summaries, and evidence.

Examples:

```text
AI Investment
```

and:

```text
Increased AI Spending
```

may be duplicates when both describe the same disclosed infrastructure
investment and rely on the same evidence.

## Near-Duplicate Themes

Near-duplicate Themes overlap substantially but are not textually identical.

Near-duplicate indicators include:

* equivalent normalized titles
* materially equivalent summaries
* the same primary evidence
* one Theme being a restatement of another
* one Theme being an unsupported implication of another
* category differences without observation differences

## Legitimately Related Themes

Related Themes are not duplicates when the filing separately discusses
distinct observable facts.

For example:

```text
AI infrastructure capital investment
```

and:

```text
AI product adoption
```

may remain distinct when each is independently stated and separately grounded.

## Governance Principles

Duplicate and overlap evaluation must:

* preserve the filing-scoped meaning of each Theme
* use deterministic, observable inputs where possible
* distinguish textual similarity from semantic duplication
* consider titles, summaries, categories, and evidence together
* report uncertainty rather than silently deleting Themes
* avoid assigning canonical Topic ownership
* avoid performing temporal comparison

This specification does not prescribe a duplicate-detection algorithm.

---

# Category Distribution

Category distribution is an observability view over the canonical Theme
categories:

* strategy
* financial
* operations
* competition
* regulatory
* management
* technology
* capital allocation
* customer
* product
* trust
* other

Category imbalance is a quality signal, not automatically a validation
failure.

A category distribution may be appropriate when it reflects the filing. For
example, a risk-heavy filing may legitimately contain substantial regulatory,
competition, trust, or operations discussion.

Category distribution requires review when:

* one category absorbs observations that belong to materially different
  organizational categories
* substantial filing discussions have no corresponding category presence
* `other` is used as a substitute for available canonical categories
* category assignment introduces interpretation
* category concentration correlates with evidence concentration or omitted
  sections

Category quality evaluation must not create Topic Registry assignments or
Topic Evolution state.

---

# Theme Precision

Themes must be observable in the cited filing evidence.

A Theme may summarize multiple related statements, but the summary must remain
descriptive and filing scoped.

## Acceptable Themes

Acceptable:

```text
Title:
Cloud revenue growth

Summary:
Management reported increased Microsoft Cloud and Azure revenue.
```

Acceptable:

```text
Title:
Datacenter capacity investment

Summary:
Management discussed continued investment in datacenter capacity for cloud
and AI services.
```

Acceptable:

```text
Title:
Competition across technology platforms

Summary:
The filing discussed competition from alternative platforms, ecosystems, and
cloud services.
```

## Unacceptable Themes

Unacceptable:

```text
Title:
Strong AI growth opportunity

Summary:
AI investment will drive superior future returns.
```

Reason:

* prediction
* investor-oriented conclusion
* unsupported significance judgment

Unacceptable:

```text
Title:
Microsoft is undervalued

Summary:
Current cloud momentum supports a higher price target.
```

Reason:

* valuation language
* recommendation reasoning
* investor conclusion

Unacceptable:

```text
Title:
Management can be trusted

Summary:
The disclosed strategy proves strong execution quality.
```

Reason:

* trust verdict
* interpretation
* execution judgment

Unacceptable:

```text
Title:
Durable competitive moat

Summary:
Microsoft's ecosystem guarantees long-term competitive advantage.
```

Reason:

* durable-company assertion
* unsupported implication
* prediction

---

# Quality Metrics

Theme quality metrics are evaluation and observability fields.

They describe artifact characteristics. They do not automatically determine
artifact validity.

## Required Metric Semantics

### `theme_count`

The number of emitted Themes.

### `unique_evidence_refs`

The number of distinct canonical Evidence Catalog references used by Themes.

### `evidence_utilization`

The proportion of Evidence Catalog entries referenced by at least one Theme.

### `evidence_concentration`

A distribution describing how frequently each evidence reference is selected
across Themes.

This may be represented through counts, shares, or governed concentration
statistics. No single formula is locked by this specification.

### `category_distribution`

The number or proportion of Themes in each canonical category.

### `duplicate_count`

The number of Themes identified as exact duplicates under the active governed
evaluation method.

### `overlap_count`

The number of Theme pairs identified as materially overlapping but not exact
duplicates under the active governed evaluation method.

### `section_coverage`

The canonical filing sections represented by Theme evidence and their
evidence-selection counts.

## Additional Observable Metrics

Evaluators may also record:

* total evidence selections
* evidence reuse count
* maximum paragraph dominance
* Themes per section
* Themes with multi-paragraph support
* Themes with multi-section support
* unrepresented material-observation warnings
* category concentration

Additional metrics must remain observational and must not redefine artifact
content or ownership.

## Metric Interpretation

Quality metrics must be reviewed together.

Examples:

* low utilization plus broad section coverage may still reflect concise,
  high-quality extraction
* high utilization plus high duplicate count may indicate over-extraction
* balanced categories with weak grounding remain low quality
* concentrated evidence with precise multi-observation support may be valid
* high Theme count with low distinctiveness indicates fragmentation

No metric in this specification independently authorizes:

* artifact rejection
* Theme deletion
* Theme rewriting
* confidence recalibration
* Topic creation
* downstream interpretation

Validation rules remain owned by the applicable Themes contracts and builder
contracts.

---

# Builder Responsibilities

The Themes Builder owns:

* extraction
* deduplication
* evidence assignment
* confidence generation
* evaluation metrics

The Themes Builder must:

* consume canonical filing content
* consume canonical Evidence Catalog identities
* preserve filing scope
* validate that selected evidence references exist
* reject fabricated evidence references
* produce observable quality metrics through governed rules

The Themes Builder does not own:

* Evidence Identity generation
* filing content assembly
* topic assignment
* topic evolution
* business understanding
* company knowledge
* quarter-over-quarter comparison
* Business Signals
* trust
* investor intelligence
* artifact identity, framework metadata, framework lineage, persistence,
  versioning, current pointers, archive/history, or framework hashes

Quality evaluation must not expand the Builder's ownership boundary.

---

# Quality Review Principles

Quality findings must distinguish:

* invalid artifact structure
* invalid evidence reference
* unsupported Theme content
* low coverage
* low diversity
* duplication
* overlap
* category imbalance
* extraction variance

Only violations of locked validity rules may block artifact creation.

Coverage, diversity, balance, and overlap findings are evaluation outcomes
unless another locked contract explicitly defines them as validation rules.

Quality review must not:

* invent missing Themes
* rewrite emitted Themes
* create Topics
* infer business meaning
* infer investor relevance
* compare with another period
* alter evidence identity

---

# Architectural Invariants

The following rules are strict and LOCKED:

1. Themes answer what management discussed in one filing.
2. Themes remain filing scoped.
3. Themes remain period specific.
4. Themes are observations, not conclusions.
5. Every Theme must be evidence grounded.
6. Evidence identity originates from the Evidence Catalog.
7. Themes must never generate evidence identities.
8. Themes must preserve canonical evidence references without rewriting them.
9. Unknown or fabricated evidence references must be rejected.
10. Theme evidence must belong to the same filing as the Themes artifact.
11. Theme titles and summaries must be supported by their cited evidence.
12. Themes must not infer consequences not stated in filing evidence.
13. Themes must not make predictions.
14. Themes must not emit valuation language.
15. Themes must not emit investor recommendations.
16. Themes must not emit investor conclusions.
17. Themes must not emit trust judgments or trust verdicts.
18. Themes must not create or assign canonical Topics.
19. Themes must not perform Topic Evolution.
20. Themes must not perform cross-period comparison.
21. Themes must not generate Quarter Change.
22. Themes must not generate Structured Intelligence.
23. Themes must never write or promote Company Knowledge.
24. Themes must not generate Business Signals.
25. Theme categories remain organizational and non-interpretive.
26. Category imbalance is a quality signal, not automatically a validity
    failure.
27. Low Theme count is not automatically a quality failure.
28. High Theme count is not automatically evidence of quality.
29. Evidence reuse is permitted only when the cited paragraph directly
    supports each Theme.
30. Evidence concentration and paragraph dominance must remain observable.
31. Duplicate and overlapping Themes must remain observable quality concerns.
32. Quality metrics must not change Theme meaning.
33. Coverage metrics are observational unless a separate locked contract
    explicitly defines a validation rule.
34. Quality metrics must not silently delete, merge, or rewrite Themes.
35. Quality evaluation must not create missing Themes.
36. Quality evaluation must not alter evidence identity or lineage.
37. Theme quality evaluation must be replayable.
38. Theme quality evaluation must not depend on downstream artifacts.
39. Artifact Framework lifecycle ownership remains separate from Theme quality.
40. Quality observability must preserve the ownership boundaries of Filing,
    Evidence Identity, Topic Intelligence, Structured Intelligence, Company
    Knowledge, Business Signals, Trust Architecture, and Investor Intelligence.
