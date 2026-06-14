# prompt
Audit whether Quarter Understanding should remain deterministic
or return to an LLM-based synthesis layer.

Evaluate:

1. What business reasoning is currently implemented through:
   - normalizeConceptId
   - phrase
   - observationRank
   - sourceTypeForInsight
   - category selection
   - summary consolidation

2. Which of those responsibilities are actually semantic reasoning?

3. What deterministic evidence package should be provided to an LLM-based Quarter Understanding layer?

4. Proposed architecture where:
   - Business Signals remains deterministic
   - Quarter Understanding becomes the primary reasoning layer
   - Partner Domain becomes presentation only

5. Migration path from current deterministic Quarter Understanding to evidence-grounded LLM synthesis.

---

# output

**Conclusion**

Quarter Understanding should return to an LLM-based synthesis layer, but not as an ungrounded prompt layer.

The deterministic layer should remain responsible for evidence packaging, identity, lineage, confidence inputs, and source references. The LLM should own semantic synthesis: what the evidence means, which facts belong together, and how to express the business-level quarter understanding.

Current deterministic Quarter Understanding is already doing semantic reasoning through rules and templates. That is the wrong long-term place for that reasoning.

---

**1. Current Business Reasoning In Deterministic Code**

| Function | Current Responsibility | Type of Reasoning |
|---|---|---|
| `normalizeConceptId` | Maps text like `Azure`, `OpenAI`, `regulatory`, `datacenter`, `supplier` into broader business concepts such as `cloud_platform_growth`, `ai_investment_and_dependency`, `regulatory_pressure`. | Semantic concept grouping |
| `phrase` | Rewrites upstream statements into smoother business language by stripping prefixes and converting topic events into prose. | Language interpretation / NLG |
| `observationRank` | Decides which observation best represents a concept, ranking revenue drivers, opportunities, risks, dependencies, and topic changes. | Business salience judgment |
| `sourceTypeForInsight` | Infers source ownership from summary text prefixes. | Semantic/source inference from prose |
| `chooseCategory` | Chooses one category from multiple evidence categories using a hardcoded priority order. | Business classification |
| `buildSummary` | Produces consolidated business statements from strengths, concerns, changes, and watch items. | Narrative synthesis |
| `importanceScoreForInsight` | Scores importance using importance, insight type, and summary keyword matches. | Business priority scoring |
| `signalAgreementForInsight` | Maps mixed positive/negative evidence into confidence agreement. | Evidence interpretation |
| `resolveSignalsForInsight` | Matches signals to consolidated concepts using normalized text overlap. | Semantic evidence matching |

---

**2. Which Responsibilities Are Actually Semantic Reasoning?**

These are semantic reasoning and are better suited for an LLM, provided evidence is constrained and source-linked:

| Responsibility | Why It Is Semantic |
|---|---|
| Concept consolidation | Determining that cloud revenue, Azure, datacenter infrastructure, and AI demand belong in one business insight requires understanding meaning, not just string matching. |
| Positive/negative tension handling | Deciding that AI is both an opportunity and a dependency requires interpretation. |
| Business salience ranking | Choosing which evidence matters most is judgment-heavy. |
| Summary generation | Turning many observations into one owner-useful insight is synthesis. |
| Category selection | A concept can be revenue, growth, dependency, or operational depending on context. |
| Evidence interpretation | Determining whether evidence corroborates, conflicts, or creates a balanced thesis is reasoning. |

These should remain deterministic:

| Responsibility | Why Deterministic |
|---|---|
| Input collection | Must be complete and reproducible. |
| Source lineage | Must be audit-safe. |
| Topic IDs and artifact IDs | Must be stable. |
| Evidence references | Must not hallucinate. |
| Hashing/versioning | Must be replay-safe. |
| Confidence calculation inputs | Should be deterministic even if final prose is LLM-generated. |
| Schema validation | Must fail predictably. |

---

**3. Deterministic Evidence Package For LLM Quarter Understanding**

Quarter Understanding should receive a structured evidence packet, not raw artifact prose.

Suggested evidence package:

```ts
type QuarterUnderstandingEvidencePackage = {
  company: string;
  reporting_period: string;

  company_knowledge: {
    business_description: string;
    products: string[];
    customers: string[];
    revenue_drivers: string[];
    competitive_positioning: string[];
    operating_model: string[];
    key_dependencies: string[];
    strategic_priorities: string[];
    risks: string[];
    opportunities: string[];
    artifact_ref: ArtifactRef;
  };

  signals: {
    signal_id: string;
    signal_type: string;
    topic_id?: string;
    category: string;
    summary: string;
    direction: string;
    magnitude: string;
    confidence: number;
    evidence: string[];
  }[];

  quarter_changes: {
    change_type: string;
    topic_id?: string;
    category?: string;
    previous_state: unknown;
    current_state: unknown;
    evidence_ref: string;
  }[];

  topic_evolution: {
    topic_id: string;
    topic_name: string;
    presence_state: string;
    trend_state: string;
    current_status: string;
    quarters_present: number;
    presence_ratio: number;
    recent_history: {
      filing_date: string;
      present: boolean;
      importance: string | null;
      evidence_count: number;
      theme_names: string[];
      categories: string[];
    }[];
  }[];

  topic_relationships?: {
    source_topic_id: string;
    relationship: string;
    target_topic_id: string;
  }[];

  lineage: {
    source_filings: SourceFiling[];
    derived_from: ArtifactRef[];
  };
};
```

The LLM should be instructed to:

- Use only supplied evidence.
- Return one insight per material business concept.
- Preserve supporting signal IDs.
- Preserve topic IDs.
- Separate strengths, concerns, changes, and watch items.
- Avoid valuation, recommendations, or portfolio advice.
- Avoid inventing facts not present in evidence.

---

**4. Proposed Architecture**

```text
Company Knowledge
  durable facts
        ↓
Business Signals
  deterministic atomic observations
        ↓
Quarter Understanding Evidence Package
  deterministic, source-linked, topic-aware
        ↓
Quarter Understanding LLM
  business-level reasoning and synthesis
        ↓
Quarter Understanding Artifact
  stable schema, evidence refs, confidence, lineage
        ↓
Partner Domain
  presentation only
```

More complete flow:

```text
Themes
  ↓
Topic Assignments
  ↓
Topic Evolution
  ↓
Quarter Change
  ↓
Structured Intelligence
  ↓
Company Knowledge
  ↓
Business Signals
  ↓
Quarter Understanding Evidence Package
  ↓
LLM Quarter Understanding
  ↓
Partner Domain
```

**Business Signals remains deterministic**

It should emit:

- atomic facts observed
- topic movement
- durable fact signals
- source evidence
- direction/magnitude/confidence

It should not explain what the quarter means.

**Quarter Understanding becomes primary reasoning layer**

It should own:

- business-level insight synthesis
- concept consolidation
- strength/concern/change/watchlist interpretation
- tension handling
- materiality ranking
- owner-useful summary
- evidence-grounded reasoning

**Partner Domain becomes presentation only**

It should consume Quarter Understanding and format:

- summary
- business health
- Five Questions
- story sections
- trust/forensics/money views

It should not independently reason from Quarter Change and Topic Evolution.

---

**5. Migration Path**

**Phase 1: Keep Deterministic Evidence Builder**

Preserve current deterministic extraction from:

- Company Knowledge
- Business Signals
- Quarter Change
- Topic Evolution

But stop treating deterministic concept consolidation as final reasoning.

Create an internal evidence package builder:

```text
buildQuarterUnderstandingEvidencePackage(...)
```

Output should be structured, source-linked, and deterministic.

**Phase 2: Add LLM Reasoning Contract**

Define a strict LLM output contract:

```ts
{
  understandings: [
    {
      semantic_anchor_key: string;
      primary_topic_id?: string;
      related_topic_ids: string[];
      category: UnderstandingCategory;
      insight_type: "strength" | "concern" | "change" | "watchlist" | "mixed";
      summary: string;
      importance: "high" | "medium" | "low";
      supporting_signal_ids: string[];
      supporting_topic_ids: string[];
      evidence_rationale: string;
    }
  ]
}
```

The LLM returns reasoning, not final metadata.

**Phase 3: Builder Assembles Final Artifact**

The deterministic builder should still own:

- `understanding_id`
- `business_key`
- evidence references
- confidence structure
- lineage
- metadata
- input hash
- validation
- dropping unsupported evidence IDs

**Phase 4: Keep Deterministic Fallback**

Keep current deterministic consolidation as a fallback path when:

- LLM unavailable
- prompt fails validation
- output references missing evidence
- governance disables LLM

But mark it as fallback, not primary reasoning.

**Phase 5: Move Partner Domain To Quarter Understanding**

Partner Domain should stop deriving business health, trust, forensics, and Five Questions directly from low-level artifacts.

Target:

```text
Partner Domain consumes:
- Company Knowledge for stable facts
- Quarter Understanding for current interpretation
```

Optional supporting inputs:

```text
- source metadata
- artifact freshness
```

But not raw reasoning over Quarter Change and Topic Evolution.

---

**Final Recommendation**

Quarter Understanding should be LLM-based synthesis over deterministic evidence.

The current deterministic implementation is valuable as a staging/evidence preparation layer, but functions like `normalizeConceptId`, `observationRank`, `phrase`, and `buildSummary` are encoding semantic judgment in brittle rules.

Best split:

```text
Deterministic:
- Business Signals
- evidence packaging
- topic IDs
- lineage
- validation
- confidence inputs
- artifact assembly

LLM:
- concept synthesis
- business meaning
- materiality
- mixed evidence interpretation
- quarter-level explanation

Partner Domain:
- presentation only
```