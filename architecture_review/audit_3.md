# prompt
Audit all deterministic logic introduced after Topic Evolution.

Search:

Quarter Change
Business Signals
Quarter Understanding
Partner Domain

Identify:

1. Keyword matching
2. Rule engines
3. Template-based NLG
4. Hardcoded ontologies
5. Hardcoded concept mappings
6. Business logic duplicated from Topic Registry

Output:

File
Function
Purpose
Risk level
Suggested owner

Do not refactor.
Only inventory the logic.

---

# output

**Deterministic Logic Inventory**

| File | Function | Logic Type | Purpose | Risk | Suggested Owner |
|---|---|---|---|---|---|
| `src/change-engine/compare-filings.ts` | `compareFilings` | Rule engine | Detects `NEW_CATEGORY`, `REMOVED_CATEGORY`, importance changes, evidence changes. | Medium | Quarter Change |
| `src/change-engine/compare-filings.ts` | `importanceRank` / `highestImportance` | Hardcoded ranking | Maps `low/medium/high` to numeric rank. | Low | Shared change-ranking utility or Quarter Change |
| `src/change-engine/compare-filings.ts` | `buildCategorySnapshots` | Deterministic aggregation | Groups themes by category, dedupes evidence, chooses highest importance. | Low | Quarter Change |
| `src/change-engine/derive-quarter-topic-changes-from-evolution.ts` | `deriveQuarterTopicChangesFromEvolution` | Rule engine | Converts Topic Evolution history into `TOPIC_NEW`, `TOPIC_DISAPPEARED`, `TOPIC_PERSISTED`, `TOPIC_EVOLVED`, `TOPIC_INTENSIFIED`, `TOPIC_WEAKENED`. | Medium | Quarter Change, consuming Topic Evolution |
| `src/change-engine/derive-quarter-topic-changes-from-evolution.ts` | `topicEvolved` | Rule engine | Detects topic evolution from changed theme names/categories. | Medium | Topic Evolution or Quarter Change |
| `src/change-engine/derive-quarter-topic-changes-from-evolution.ts` | `topicIntensified` / `topicWeakened` | Rule engine | Detects movement from importance/evidence count changes. | Medium | Topic Evolution should own trend; Quarter Change should own current-vs-previous delta |
| `src/change-engine/generate-quarter-change-report.ts` | `buildMarkdownReport` and append helpers | Template-based NLG | Generates markdown report text from Quarter Change data. | Low | Reporting / Quarter Change presentation |
| `src/business-signal-intelligence/build-business-signals.ts` | `buildStringSignals` | Template-based NLG | Emits summaries like `Revenue driver observed: ...`, `Customer dependency observed: ...`. | Medium | Business Signals |
| `src/business-signal-intelligence/build-business-signals.ts` | `buildCompetitiveSignals` | Template-based NLG / classification | Converts Company Knowledge competitive positioning into `competitive_advantage` signals. | Medium | Business Signals |
| `src/business-signal-intelligence/build-business-signals.ts` | `buildDependencySignals` | Template-based NLG / classification | Converts Company Knowledge dependencies into `operating_dependency` signals. | Medium | Business Signals |
| `src/business-signal-intelligence/build-business-signals.ts` | `buildQuarterChangeSignals` | Rule engine | Maps Quarter Change topic types into Business Signal types, directions, categories, magnitudes, confidence. | High | Business Signals, but should align with Topic Registry / Quarter Change semantics |
| `src/business-signal-intelligence/build-business-signals.ts` | `buildTopicEvolutionSignals` | Rule engine | Maps `persistent`, `strengthening`, `dormant` topic states into signals. | High | Business Signals, consuming Topic Evolution |
| `src/business-signal-intelligence/build-business-signals.ts` | `confidenceForType` | Hardcoded scoring | Assigns fixed confidence by signal type. | Medium | Business Signals |
| `src/business-signal-intelligence/build-business-signals.ts` | `topicDisplayName` | Template formatting | Converts topic IDs to display labels. | Low | Shared topic display helper |
| `src/business-signal-intelligence/build-business-signals.ts` | `topicChangeEvidence` | Template-based evidence text | Builds semicolon-delimited evidence descriptions. | Low | Business Signals evidence formatting |
| `src/quarter-understanding-intelligence/build-deterministic-quarter-understanding.ts` | `insightFromBusinessSignal` | Rule engine | Maps signal types to `strength`, `concern`, `change`, `watchlist`. | High | Quarter Understanding, but should consume canonical signal taxonomy |
| `src/quarter-understanding-intelligence/build-deterministic-quarter-understanding.ts` | `insightFromTopicChange` | Rule engine / template NLG | Converts topic change types into insight types and summaries. | High | Quarter Understanding, consuming Quarter Change |
| `src/quarter-understanding-intelligence/build-deterministic-quarter-understanding.ts` | `insightFromCategoryChange` | Rule engine / template NLG | Converts category changes into insight types and summaries. | Medium | Quarter Understanding |
| `src/quarter-understanding-intelligence/build-deterministic-quarter-understanding.ts` | `insightFromTopicEvolution` | Rule engine / template NLG | Converts Topic Evolution states into insight types. | High | Quarter Understanding, consuming Topic Evolution |
| `src/quarter-understanding-intelligence/build-deterministic-quarter-understanding.ts` | `insightsFromCompanyKnowledge` | Template-based NLG | Converts durable facts into insight candidates. | Medium | Quarter Understanding |
| `src/quarter-understanding-intelligence/build-deterministic-quarter-understanding.ts` | `semanticAnchorFromText` | Hardcoded normalization | Creates semantic anchors from arbitrary text. | Medium | Shared identity/key utility |
| `src/quarter-understanding-intelligence/build-quarter-understanding-concepts.ts` | `normalizeConceptId` | Hardcoded concept mapping / duplicated ontology | Maps terms like `cloud`, `azure`, `openai`, `regulation`, `supply_chain` into new concept IDs. | High | Topic Registry should own canonical concept identity |
| `src/quarter-understanding-intelligence/build-quarter-understanding-concepts.ts` | `sourceTypeForInsight` | Keyword matching | Infers source type from summary prefixes. | High | Lineage/source provenance should come from structured fields, not summary text |
| `src/quarter-understanding-intelligence/build-quarter-understanding-concepts.ts` | `importanceScoreForInsight` | Hardcoded scoring | Scores concepts from importance, insight type, and summary keywords. | High | Quarter Understanding scoring policy |
| `src/quarter-understanding-intelligence/consolidate-quarter-understandings.ts` | `buildSummary` | Template-based NLG | Generates consolidated understanding summaries. | Medium | Quarter Understanding |
| `src/quarter-understanding-intelligence/consolidate-quarter-understandings.ts` | `phrase` | Keyword/template rewriting | Strips and rewrites upstream summary prefixes. | High | Quarter Understanding, but should not depend on upstream prose templates |
| `src/quarter-understanding-intelligence/consolidate-quarter-understandings.ts` | `chooseCategory` | Hardcoded category priority | Picks category using ranked category list. | Medium | Quarter Understanding category policy |
| `src/quarter-understanding-intelligence/consolidate-quarter-understandings.ts` | `importanceFromScore` | Hardcoded thresholds | Converts numeric concept score to importance. | Medium | Quarter Understanding scoring policy |
| `src/quarter-understanding-intelligence/consolidate-quarter-understandings.ts` | `observationRank` | Keyword ranking | Prioritizes revenue/opportunity/risk/dependency/topic templates. | High | Quarter Understanding evidence ranking policy |
| `src/quarter-understanding-intelligence/build-quarter-understanding.ts` | `calculateConfidenceScore` | Hardcoded scoring | Maps agreement/source count to fixed confidence scores. | Medium | Quarter Understanding confidence policy |
| `src/quarter-understanding-intelligence/build-quarter-understanding.ts` | `resolveSignalsForInsight` | Keyword/fuzzy matching | Resolves Business Signal refs by normalized substring matching. | High | Quarter Understanding evidence resolution |
| `src/quarter-understanding-intelligence/build-quarter-understanding.ts` | `matchesBusinessSignal` / `matchesQuarterChange` / `matchesTopicEvolution` / `matchesCompanyKnowledge` | Keyword/source matching | Counts evidence sources by normalized anchors and summaries. | High | Quarter Understanding lineage/evidence policy |
| `src/quarter-understanding-intelligence/build-quarter-understanding.ts` | `signalAgreementForInsight` | Rule engine | Assigns `conflicting`, `mixed`, `corroborating` from insight type/source count. | Medium | Quarter Understanding confidence policy |
| `src/partner-domain/builders/build-business-health.ts` | `buildBusinessHealth` | Rule engine | Determines `improving/stable/weakening` from Topic Evolution and Quarter Change counts. | High | Quarter Understanding or Partner Domain BFF, depending final architecture |
| `src/partner-domain/builders/build-business-question.ts` | `buildBusinessQuestion` | Template-based NLG | Generates Q1 answer from Company Knowledge fields. | Medium | Partner Domain presentation |
| `src/partner-domain/builders/build-business-question.ts` | `confidenceFromParts` | Hardcoded confidence rule | Confidence from populated field count. | Medium | Partner Domain presentation confidence |
| `src/partner-domain/builders/build-growth-question.ts` | `buildGrowthQuestion` | Template-based NLG | Generates Q2 growth answer from revenue drivers, priorities, topic movement. | Medium | Partner Domain presentation |
| `src/partner-domain/builders/build-growth-question.ts` | `strengtheningTopics` | Rule engine | Extracts growth signals from `TOPIC_INTENSIFIED`, positive category changes, strengthening/new topics. | High | Quarter Understanding should own growth synthesis |
| `src/partner-domain/builders/build-growth-question.ts` | `confidenceFromSignals` | Hardcoded confidence rule | Confidence from count of growth inputs. | Medium | Partner Domain presentation confidence |
| `src/partner-domain/builders/build-trust-question.ts` | `buildTrustQuestion` | Template-based NLG | Generates Q3 trust answer from risks, health, forensics. | Medium | Partner Domain presentation |
| `src/partner-domain/builders/build-trust-question.ts` | `confidenceFromRiskSignals` | Hardcoded confidence rule | Confidence from risk/forensics counts. | Medium | Partner Domain presentation confidence |
| `src/partner-domain/builders/build-hold-question.ts` | `buildHoldQuestion` | Template-based NLG | Generates Q5 hold thesis from business health, priorities, risks, other question outputs. | High | Quarter Understanding should own thesis-level insight; Partner Domain should render |
| `src/partner-domain/builders/build-hold-question.ts` | `confidenceFromQuestions` | Hardcoded confidence rule | Aggregates question confidence by count of high/low answers. | Medium | Partner Domain presentation confidence |
| `src/partner-domain/builders/build-valuation-question.ts` | `buildValuationQuestion` | Hardcoded response | Always returns insufficient market data. | Low | Partner Domain presentation |
| `src/partner-domain/builders/build-company-story.ts` | `buildCompanyStory` | Template-based NLG | Builds story fields from Company Knowledge. | Medium | Partner Domain presentation |
| `src/partner-domain/builders/build-customer-segments.ts` | `buildCustomerSegments` | Template-based NLG / rule engine | Creates one customer card per customer and assigns first as `core`. | Medium | Partner Domain presentation |
| `src/partner-domain/builders/build-money-profile.ts` | `buildMoneyProfile` / `getMoneyContext` | Template-based NLG | Builds money explanations from products, customers, revenue drivers, positioning. | Medium | Partner Domain presentation |
| `src/partner-domain/builders/build-trust-profile.ts` | `buildTrustProfile` | Template-based NLG | Produces fixed trust profile language and hardcoded `medium/partial`. | High | Partner Domain presentation; may duplicate Quarter Understanding trust synthesis |
| `src/partner-domain/builders/build-forensics-signals.ts` | `buildForensicsSignals` | Rule engine / template formatting | Combines Company Knowledge risks and risk themes into forensics signals. | High | Business Signals or Quarter Understanding should own risk signal synthesis |
| `src/partner-domain/builders/build-forensics-signals.ts` | `toPartnerRiskLanguage` | Keyword/template rewriting | Converts filing-style phrases into owner language. | Medium | Partner Domain language layer |
| `src/partner-domain/builders/build-forensics-signals.ts` | `categorizeRisk` | Keyword matching / duplicated ontology | Maps text to `Competition`, `Cybersecurity`, `Regulation`, `Supply Chain`, `Taxation`, `Macroeconomic`, `AI`, etc. | High | Topic Registry / Business Signals taxonomy |
| `src/partner-domain/builders/build-forensics-signals.ts` | `severityRank` | Hardcoded severity ranking | Ranks green/yellow/red. | Low | Partner Domain presentation |
| `src/partner-domain/builders/build-owner-business-health.ts` | `buildStrengtheningAreas` | Rule engine | Pulls strengthening areas from Quarter Change and Topic Evolution. | High | Quarter Understanding should own synthesized strengthening areas |
| `src/partner-domain/builders/build-owner-business-health.ts` | `buildWatchAreas` | Rule engine | Pulls watch areas from weakened topics, absent topics, risks. | High | Quarter Understanding should own synthesized watch areas |
| `src/partner-domain/builders/build-owner-business-health.ts` | `buildHealthExplanation` | Template-based NLG | Creates business health explanation from strengthening/watch areas. | Medium | Partner Domain presentation |
| `src/partner-domain/builders/build-owner-business-health.ts` | `buildHealthTimeline` / `inferHistoricalStatus` | Rule engine | Infers historical health from topic observations, present/absent counts, high importance counts. | High | Topic Evolution / Quarter Understanding |
| `src/partner-domain/builders/build-owner-business-health.ts` | `themeLabel` / `categoryLabel` / `topicLabel` / `riskLabel` / `cleanLabel` | Template/label normalization | Converts internal labels to owner-facing labels. | Low | Partner Domain presentation |
| `src/partner-domain/builders/build-owner-business-health.ts` | `isWeakLabel` | Hardcoded filtering | Suppresses labels like `Growth`, `Investments`, `Macroeconomic`, `Regulation`. | Medium | Partner Domain presentation policy |
| `src/partner-domain/builders/builder-utils.ts` | `findTheme` | Keyword matching | Finds themes by keyword list. | Medium | Partner Domain utility; risk if used for intelligence |
| `src/partner-domain/builders/builder-utils.ts` | `isRiskTheme` | Keyword matching / duplicated ontology | Detects risk themes using `risk`, `competition`, `cybersecurity`, `supply`, `regulation`, `tax`, `macro`. | High | Topic Registry / Business Signals risk taxonomy |
| `src/partner-domain/builders/builder-utils.ts` | `inferWhoTheyServe` | Keyword matching | Infers customers from text containing cloud/business/consumer. | High | Company Knowledge should own customers |
| `src/partner-domain/builders/builder-utils.ts` | `calculateConviction` | Hardcoded scoring | Conviction from source artifact count. | Medium | Partner Domain presentation confidence |
| `src/partner-domain/builders/business-language.ts` | `removeFilingStyleLanguage` | Keyword/template rewriting | Rewrites filing/internal terms into owner-facing language. | Low | Partner Domain language layer |
| `src/partner-domain/builders/business-language.ts` | `firstSentence` | Text heuristic | Extracts sentence by punctuation/length. | Low | Partner Domain presentation |
| `src/partner-domain/builders/business-language.ts` | `sentenceList` / `dedupeStrings` | Formatting/deduping | Formats lists into prose. | Low | Partner Domain presentation |

**Duplicated Topic Registry Business Logic**

| Duplicate Logic | Current Location | Duplicates Registry Concepts |
|---|---|---|
| Concept normalization to `cloud_platform_growth`, `ai_investment_and_dependency`, `regulatory_pressure`, `infrastructure_supply_dependency` | `build-quarter-understanding-concepts.ts::normalizeConceptId` | `cloud`, `artificial_intelligence`, `regulation`, `supply_chain` |
| Risk categorization keywords | `build-forensics-signals.ts::categorizeRisk` | `competition`, `cybersecurity`, `regulation`, `supply_chain`, `taxation`, `macroeconomic`, `artificial_intelligence` |
| Risk theme detection keywords | `builder-utils.ts::isRiskTheme` | `competition`, `cybersecurity`, `supply_chain`, `regulation`, `taxation`, `macroeconomic` |
| Business health strengthening/watch extraction | `build-owner-business-health.ts` | Reinterprets Topic Evolution and Quarter Change topic states |
| Business Signals topic movement mapping | `build-business-signals.ts::buildQuarterChangeSignals`, `buildTopicEvolutionSignals` | Re-expresses Topic Evolution/Quarter Change semantics as signals |
| Quarter Understanding source-type inference from summary prefixes | `build-quarter-understanding-concepts.ts::sourceTypeForInsight` | Duplicates source ownership through prose templates instead of artifact metadata |

**Highest-Risk Areas**

| Area | Reason |
|---|---|
| `normalizeConceptId` | Introduces a second concept ontology after Topic Registry. |
| `categorizeRisk` / `isRiskTheme` | Duplicates registry concepts with keyword matching. |
| `resolveSignalsForInsight` and source matching in Quarter Understanding | Evidence resolution depends on substring matching and summaries. |
| Partner Domain health / forensics / Five Questions | Performs deterministic synthesis that overlaps with Quarter Understanding ownership. |
| Business Signals movement generation | Reclassifies Topic Evolution and Quarter Change into another taxonomy; useful, but must stay aligned with canonical topic IDs. |

No code changes made.