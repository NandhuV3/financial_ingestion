## prompt

Perform a complete architecture ownership audit of the intelligence pipeline.

Current pipeline:

Themes
→ Topic Assignments
→ Topic Evolution
→ Quarter Change
→ Structured Intelligence
→ Company Knowledge
→ Business Signals
→ Quarter Understanding
→ Partner Domain

Ignore legacy implementations and historical decisions.

For every artifact identify:

1. Inputs
2. Outputs
3. Canonical owner
4. Business meaning
5. Whether the artifact represents:
   - Fact
   - Observation
   - Change
   - Trend
   - Insight
   - Narrative

6. Whether another artifact duplicates its responsibility.

Output:

A table showing:
Artifact
Owner
Purpose
Consumes
Produces
Potential duplication
Recommended responsibility

Do NOT propose code changes yet.
Only identify ownership boundaries and duplication.



---

# Output

**Architecture Ownership Audit**

Current code shows one important mismatch: `Quarter Understanding` exists as an artifact, but `Partner Domain` currently does **not** consume it. `PartnerSourceArtifacts` contains `companyKnowledge`, `themes`, `quarterChange`, and `topicEvolution`, but no `quarterUnderstanding`.

| Artifact | Owner | Represents | Purpose | Consumes | Produces | Potential Duplication | Recommended Responsibility |
|---|---|---|---|---|---|---|---|
| Themes | `src/themes` | Observation | Extract filing-level business themes from chunks using LLM. | Filing chunks, company config, prompt registry | `themes.json`: theme, category, importance, summary, evidence | Can overlap with Structured Intelligence because SI consumes themes and restates business meaning. | Own raw filing observations only. Do not own durable facts, trends, or synthesized business understanding. |
| Topic Assignments | `src/topic-assignment-v2` | Observation / Classification | Attach deterministic topic IDs to themes using semantic matches and confidence thresholds. | `themes.json`, `semantic-topic-matches.json` | `themes.with-topics.json`: topic_id, confidence, assignment_status | Duplicates none directly, but classification later appears in Topic Evolution and Quarter Change. | Own theme-to-topic classification only. No trend, change, or insight ownership. |
| Topic Evolution | `src/topic-evolution` | Trend | Track topic presence, persistence, recurrence, dormancy, strengthening, weakening across filings. | Historical `themes.with-topics.json`, topic registry | `topic-evolution-report.json` | Duplicates topic movement previously recomputed by Quarter Change. Some trend observations also become Business Signals and Quarter Understanding evidence. | Canonical owner of cross-filing topic history and trend state. |
| Quarter Change | `src/change-engine` | Change | Compare current filing against previous filing for category and topic-level movement. | Current filing, previous filing, themes, Topic Evolution | `quarter-change-report.json`: category changes, topic changes, summaries | Overlaps with Topic Evolution for topic movement. After Phase 7.3A, it consumes Topic Evolution for topic changes, reducing duplication. | Own quarter-over-quarter delta only. Should not own long-term trend history. |
| Structured Intelligence | `src/structured-intelligence` | Fact / LLM-derived business understanding | Convert filing intelligence into structured business fields. | Filing metadata, themes, topic assignments, quarter change, topic evolution, prompt/model output | `structured-intelligence.json`: business_description, products, customers, revenue_drivers, competitive_positioning, operating_model, dependencies, priorities, risks, opportunities | Strong field duplication with Company Knowledge, because Company Knowledge maps these same fields directly. | Canonical LLM extraction layer for business facts and business understanding candidates. |
| Company Knowledge | `src/company-knowledge` | Fact | Durable normalized company understanding. Deterministically maps Structured Intelligence into warehouse artifact. | Structured Intelligence, filing metadata | `company-knowledge/current.json`: normalized business facts, metadata, lineage | Duplicates Structured Intelligence field set almost one-for-one. Also becomes source for Business Signals and Partner Domain. | Canonical durable fact artifact. Should own stable read path, versioning, normalized fact schema, lineage, confidence. Should not create new facts. |
| Business Signals | `src/business-signal-intelligence` | Observation / Change / Trend | Emit signal-level observations from durable facts, Quarter Change, and Topic Evolution. | Company Knowledge, Quarter Change, Topic Evolution | `business-signals/{period}/current.json`: signal_type, category, summary, direction, magnitude, confidence, evidence | Duplicates Company Knowledge durable facts as signals, and duplicates Quarter Change / Topic Evolution movements as signal records. | Canonical signal layer. Should expose atomic observations with evidence, not consolidated insights. |
| Quarter Understanding | `src/quarter-understanding-intelligence` | Insight | Consolidate deterministic inputs into business-level quarter understandings. | Company Knowledge, Business Signals, Quarter Change, Topic Evolution | `quarter-understanding/{period}/current.json`: understandings, business_key, confidence, evidence | Overlaps with Business Signals, Quarter Change, and Topic Evolution by summarizing them. Recent consolidation reduces signal-level duplication. | Canonical business insight layer for the quarter. Should synthesize signals/trends/changes into fewer business-level conclusions. |
| Partner Domain | `src/partner-domain` | Narrative / Presentation | Convert intelligence artifacts into frontend-facing view model: profile, summary, story, customers, money, trust, forensics, health, fiveQuestions. | Currently: Company Knowledge, Themes, Quarter Change, Topic Evolution | `PartnerCompanyIntelligence` response model | Duplicates Quarter Understanding responsibility because it still derives business health, forensics, Five Questions, and summary directly from upstream artifacts instead of consuming Quarter Understanding. | Backend-for-Frontend presentation layer. Should format and organize intelligence, not become canonical owner of facts, signals, changes, trends, or insights. |

**Ownership Boundaries**

| Layer | Should Own | Should Not Own |
|---|---|---|
| Themes | Filing-level observations | Durable facts, trends, insights |
| Topic Assignments | Topic classification | Change detection, trend detection |
| Topic Evolution | Cross-filing trend state | Quarter-only deltas, business insight synthesis |
| Quarter Change | Current-vs-previous movement | Longitudinal trend history |
| Structured Intelligence | LLM-extracted business understanding | Persistence/version authority |
| Company Knowledge | Durable normalized facts | LLM generation, movement signals |
| Business Signals | Atomic observations/signals | Consolidated business conclusions |
| Quarter Understanding | Business-level quarter insight | UI formatting, frontend-specific language |
| Partner Domain | UI-ready presentation | Canonical intelligence generation |

**Primary Duplication Findings**

1. `Structured Intelligence` and `Company Knowledge` contain the same business fact fields. This is intentional if SI is extraction and CK is durable normalization, but ownership must remain strict.

2. `Business Signals` duplicates source observations from `Company Knowledge`, `Quarter Change`, and `Topic Evolution`. This is acceptable only if signals are treated as traceable atomic observations.

3. `Quarter Understanding` duplicates upstream signal/change/trend language unless it consolidates into business-level concepts. The new consolidation layer addresses this by reducing signal-level understandings into concept-level insights.

4. `Partner Domain` currently duplicates insight synthesis because it consumes `Company Knowledge`, `Quarter Change`, and `Topic Evolution` directly, while `Quarter Understanding` is not yet part of `PartnerSourceArtifacts`.

5. `Quarter Change` and `Topic Evolution` previously duplicated topic movement logic. Current direction makes Topic Evolution the canonical trend source and Quarter Change the quarter-delta consumer.

**Current Responsibility Risk**

The main ownership risk is at the bottom of the pipeline:

```text
Quarter Understanding
Partner Domain
```

`Quarter Understanding` is intended to own business-level insight, but `Partner Domain` still derives owner-facing conclusions directly from lower-level artifacts. That makes Partner Domain a hybrid presentation-plus-reasoning layer today, not a pure BFF.


----

## GPT review

Current mapping becomes:

Themes
      Observation

Topic Assignment
      Classification

Topic Evolution
      Trend

Quarter Change
      Change

Structured Intelligence
      Fact Extraction

Company Knowledge
      Durable Facts

Business Signals
      Observations

Quarter Understanding
      Insights

Partner Domain
      Narrative

This hierarchy makes sense.