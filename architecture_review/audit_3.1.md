# prompt

Audit whether Quarter Understanding should use:

1. Topic Registry topic_ids directly

OR

2. Topic Registry topic_ids + relationship graph

for consolidation.

Determine:
- what information would be lost if normalizeConceptId() is removed
- whether all current consolidations can be represented using canonical topic_ids
- whether a relationship layer is needed instead of a second concept namespace
- proposed target architecture for:
  Topic Registry
  Topic Evolution
  Quarter Change
  Business Signals
  Quarter Understanding


# output

**Short Answer**

Quarter Understanding should use:

```text
Topic Registry topic_ids + relationship graph
```

It should not keep a separate `normalizeConceptId()` namespace as the durable concept system.

Topic Registry should own canonical concepts. Quarter Understanding should own synthesis across those concepts.

---

**1. What `normalizeConceptId()` Currently Adds**

Evidence: [build-quarter-understanding-concepts.ts](/Users/Nandhu/Downloads/financial_ingestion/src/quarter-understanding-intelligence/build-quarter-understanding-concepts.ts)

Current mappings include:

| Input Terms | Current QU Concept |
|---|---|
| `cloud`, `azure` | `cloud_platform_growth` |
| `artificial_intelligence`, `openai`, `ai_infrastructure` | `ai_investment_and_dependency` |
| `regulation`, `regulatory`, `compliance`, `data_protection` | `regulatory_pressure` |
| `supply_chain`, `component`, `supplier`, `datacenter`, `hardware` | `infrastructure_supply_dependency` |
| `competition`, `competitive`, `competitor` | `competitive_pressure` |
| `macroeconomic`, `inflation`, `geopolitical`, `it_spending` | `macroeconomic_exposure` |

This creates business synthesis buckets, not raw filing topics.

---

**2. What Would Be Lost If `normalizeConceptId()` Is Removed**

| Lost Capability | Example |
|---|---|
| Synonym consolidation from non-topic text | `Azure`, `Microsoft Cloud`, `cloud services` currently collapse into `cloud_platform_growth`. |
| Cross-artifact free-text grouping | Company Knowledge revenue drivers, risks, opportunities, and dependencies do not always carry `topic_id`. |
| Business framing | `cloud_platform_growth` is more owner-facing than raw `cloud`. |
| Cross-topic synthesis | AI opportunity + OpenAI dependency + AI regulation currently collapse into one AI-related understanding. |
| Operational dependency grouping | `datacenter`, `hardware`, `supplier`, `component` collapse into `infrastructure_supply_dependency`. |
| Non-registry concept capture | `intellectual_property`, `customer_demand`, `developer_ecosystem` exist in QU normalization but not in current Topic Registry. |

So removing it without replacement would reduce consolidation quality and cause more fragmented understandings.

---

**3. Can Current Consolidations Be Represented Using Canonical Topic IDs?**

Mostly, but not fully with the current registry.

| Current QU Concept | Registry Representation |
|---|---|
| `cloud_platform_growth` | Mostly `cloud` |
| `ai_investment_and_dependency` | Mostly `artificial_intelligence`, but also touches `investments` and `regulation` |
| `regulatory_pressure` | `regulation` |
| `infrastructure_supply_dependency` | Mostly `supply_chain`, but also touches `investments`, `cloud`, and operational dependencies |
| `cybersecurity` | `cybersecurity` |
| `competitive_pressure` | `competition` |
| `macroeconomic_exposure` | `macroeconomic` |
| `taxation` | `taxation` |
| `product_quality` | `product_quality` |
| `margin_pressure` | `margins` |
| `growth_momentum` | `growth` |
| `intellectual_property` | Missing from registry |
| `customer_demand` | Missing from registry |
| `developer_ecosystem` | Missing from registry |

Direct topic IDs can represent most current concepts, but not the relationship between them.

Example:

```text
AI thesis =
artificial_intelligence
+ investments
+ regulation
+ cloud
+ operating dependency
```

A single raw topic ID cannot express that relationship.

---

**4. Is A Relationship Layer Needed?**

Yes.

Current Topic Registry schema has:

```ts
topic_id
topic_name
description
supported_categories
categories
theme_variants
```

It does not contain relationships such as:

```text
cloud related_to investments
artificial_intelligence depends_on cloud
artificial_intelligence exposed_to regulation
supply_chain supports cloud
regulation affects artificial_intelligence
```

Without relationships, Quarter Understanding either:

1. uses raw topic IDs only and loses synthesis, or
2. recreates synthesis through `normalizeConceptId()`, which becomes a second concept system.

The better architecture is:

```text
Topic Registry owns canonical topic IDs.
Topic Relationship Graph owns relationships between topic IDs.
Quarter Understanding uses both for consolidation.
```

---

**5. Proposed Target Architecture**

**Topic Registry**

Owns canonical concept identity.

```text
topic_id:
  cloud
  artificial_intelligence
  regulation
  supply_chain
  cybersecurity
  competition
```

Should also eventually include currently missing concepts if they matter:

```text
intellectual_property
customer_demand
developer_ecosystem
```

**Topic Relationship Graph**

Owns relationships between canonical topics.

Examples:

```text
artificial_intelligence -> related_to -> cloud
artificial_intelligence -> exposed_to -> regulation
cloud -> depends_on -> supply_chain
cloud -> requires -> investments
supply_chain -> affects -> cloud
competition -> affects -> cloud
```

This should be explicit data, not hardcoded keyword rules inside Quarter Understanding.

**Topic Evolution**

Owns longitudinal state per canonical topic ID:

```text
topic_id
presence_state
trend_state
history
```

No business synthesis.

**Quarter Change**

Owns current-vs-previous delta per canonical topic ID:

```text
TOPIC_NEW
TOPIC_INTENSIFIED
TOPIC_WEAKENED
TOPIC_DISAPPEARED
```

No broad concept grouping.

**Business Signals**

Owns atomic observations tied to canonical topic IDs where possible.

Examples:

```text
signal_type: topic_intensified
topic_id: cloud
```

For Company Knowledge-derived signals, it should ideally attach a canonical topic ID through registry matching, not free-text-only summaries.

**Quarter Understanding**

Owns synthesis.

It should consolidate by:

```text
primary_topic_id
related_topic_ids
relationship types
source evidence
```

Example:

```text
primary_topic_id: cloud
related_topic_ids:
  - artificial_intelligence
  - supply_chain
  - investments

summary:
Cloud remains the primary growth engine, supported by Azure demand and AI-related investment, while datacenter and supply-chain execution remain important dependencies.
```

---

**Recommendation**

Use:

```text
Topic Registry topic_ids + relationship graph
```

Do not use raw Topic Registry topic IDs alone.

Do not keep Quarter Understanding’s `normalizeConceptId()` as a separate durable concept namespace.

The target boundary should be:

```text
Topic Registry = canonical concepts
Relationship Graph = how concepts connect
Quarter Understanding = synthesis over canonical concepts and relationships
```

That preserves consolidation quality without creating a competing ontology.