# prompt

Audit every concept currently produced by
build-quarter-understanding-concepts.ts

For each concept determine:

1. Can it be replaced directly by a canonical topic_id?

2. Does it require multiple topic_ids?

3. Does it require an explicit relationship graph?

4. Which concepts disappear entirely if Topic Registry becomes canonical?

Produce:
- mapping table
- concepts requiring graph support
- concepts that should become new Topic Registry topics
- minimal migration path from current Quarter Understanding concepts to canonical topic identities

---

# output

**Mapping Table**

| Current Quarter Understanding Concept | Direct Canonical Topic Replacement? | Requires Multiple Topic IDs? | Requires Relationship Graph? | Notes |
|---|---:|---:|---:|---|
| `cloud_platform_growth` | Yes: `cloud` | Sometimes | Yes | Direct topic is `cloud`, but current consolidation also absorbs Azure, Microsoft Cloud revenue, datacenter dependency, and cloud opportunity. Relationship graph needed for `cloud -> depends_on -> supply_chain/investments` or `cloud -> related_to -> artificial_intelligence`. |
| `ai_investment_and_dependency` | Yes: `artificial_intelligence` | Yes | Yes | Primary topic is `artificial_intelligence`, but current concept also combines OpenAI partnership, AI infrastructure investment, AI regulation, compliance, and cloud adjacency. Needs graph links to `investments`, `regulation`, and possibly `cloud`. |
| `regulatory_pressure` | Yes: `regulation` | Sometimes | Yes | Direct replacement is `regulation`. Graph needed when regulation affects `artificial_intelligence`, data protection, cybersecurity, or cloud operations. |
| `infrastructure_supply_dependency` | Partial: `supply_chain` | Yes | Yes | Current concept includes supply chain, components, suppliers, hardware, datacenter operations. Registry has `supply_chain`, but not `datacenter` or infrastructure dependency as separate topics. Relationship graph needed at minimum; possibly new topic for infrastructure capacity. |
| `cybersecurity` | Yes: `cybersecurity` | No | Optional | Direct canonical replacement exists. Graph optional for relations to privacy/regulation/customer trust. |
| `competitive_pressure` | Yes: `competition` | No | Optional | Direct canonical replacement exists. Graph useful if competition is specifically tied to `cloud` or `artificial_intelligence`. |
| `macroeconomic_exposure` | Yes: `macroeconomic` | Sometimes | Optional | Direct replacement exists. Could relate to `foreign_exchange`, demand, IT spending, and customer budgets. |
| `taxation` | Yes: `taxation` | No | No | Direct canonical replacement exists. |
| `product_quality` | Yes: `product_quality` | No | Optional | Direct canonical replacement exists. |
| `intellectual_property` | No | No | No, unless linked later | Not in Topic Registry. Should become a new topic if it is material. |
| `margin_pressure` | Yes: `margins` | No | Optional | Direct replacement exists, but naming differs. |
| `customer_demand` | No | Maybe | Yes if split | Not in Topic Registry. Could become `customer_demand` or be represented through relationships between `growth`, `cloud`, and customer segments. |
| `developer_ecosystem` | No | Maybe | Yes if treated as advantage | Not in Topic Registry. Could become a topic or be a relationship/attribute under competition/product/platform. |
| `growth_momentum` | Yes: `growth` | No | No | Direct replacement exists, but current concept is generic and may disappear if only specific topic IDs are retained. |

**Concepts Requiring Graph Support**

These should not be represented as standalone second-namespace concepts because they are composites of canonical topics:

| Current Concept | Primary Topic | Related Topics Needed |
|---|---|---|
| `cloud_platform_growth` | `cloud` | `supply_chain`, `investments`, `artificial_intelligence`, maybe `margins` |
| `ai_investment_and_dependency` | `artificial_intelligence` | `investments`, `regulation`, `cloud`, possibly `product_quality` |
| `regulatory_pressure` | `regulation` | `artificial_intelligence`, `cybersecurity`, cloud/data protection depending on evidence |
| `infrastructure_supply_dependency` | `supply_chain` | `cloud`, `investments`, possible new `datacenter_infrastructure` |
| `macroeconomic_exposure` | `macroeconomic` | `foreign_exchange`, customer demand, IT spending if modeled |
| `customer_demand` | New or relationship-driven | Could relate customers to `cloud`, `growth`, `products` |
| `developer_ecosystem` | New or relationship-driven | Could relate to `competition`, `product_quality`, `cloud`, `artificial_intelligence` |

**Concepts That Should Become New Topic Registry Topics**

Based on current `normalizeConceptId()` and generated MSFT artifact:

| Proposed New Topic | Reason |
|---|---|
| `intellectual_property` | Current Quarter Understanding emits it from Company Knowledge risk and Quarter Change category evidence. No registry topic exists. |
| `customer_demand` | Current normalization creates it from customer/enterprise language. If customer demand is tracked longitudinally, it needs canonical identity. |
| `developer_ecosystem` | Current normalization creates it from developer/ecosystem language. This is a business moat/platform concept, not currently in registry. |
| `datacenter_infrastructure` or `infrastructure_capacity` | Current `infrastructure_supply_dependency` groups datacenter, hardware, suppliers, and components under supply chain. This is broader than `supply_chain`. |

**Concepts That Disappear Entirely If Topic Registry Becomes Canonical**

These should disappear as durable IDs and become either direct topic IDs or graph rollups:

| Current Concept | Replacement |
|---|---|
| `cloud_platform_growth` | `cloud` plus relationships |
| `ai_investment_and_dependency` | `artificial_intelligence` plus relationships |
| `regulatory_pressure` | `regulation` |
| `infrastructure_supply_dependency` | `supply_chain` plus relationships / possible `datacenter_infrastructure` |
| `competitive_pressure` | `competition` |
| `macroeconomic_exposure` | `macroeconomic` |
| `margin_pressure` | `margins` |
| `growth_momentum` | `growth` |

Directly retained as-is:

| Current Concept | Registry Status |
|---|---|
| `cybersecurity` | Already canonical |
| `taxation` | Already canonical |
| `product_quality` | Already canonical |

**Minimal Migration Path**

1. Treat `topic_id` as the canonical identity for Quarter Understanding `semantic_anchor_key`.

2. Replace current concept IDs with canonical topic IDs where one-to-one mapping exists:

```text
cloud_platform_growth -> cloud
ai_investment_and_dependency -> artificial_intelligence
regulatory_pressure -> regulation
infrastructure_supply_dependency -> supply_chain
competitive_pressure -> competition
macroeconomic_exposure -> macroeconomic
margin_pressure -> margins
growth_momentum -> growth
```

3. Add missing topics to Topic Registry:

```text
intellectual_property
customer_demand
developer_ecosystem
datacenter_infrastructure
```

4. Add a relationship layer beside the registry, not inside Quarter Understanding normalization code.

Example relationship records:

```text
cloud -> depends_on -> datacenter_infrastructure
cloud -> related_to -> artificial_intelligence
artificial_intelligence -> exposed_to -> regulation
artificial_intelligence -> requires -> investments
supply_chain -> affects -> cloud
competition -> affects -> cloud
```

5. Update Quarter Understanding consolidation to group by:

```text
primary_topic_id
related_topic_ids
relationship_type
```

instead of hardcoded text matching.

6. Keep Quarter Understanding responsible for synthesis only:

```text
canonical topics + relationships + evidence
→ business-level understanding
```

**Bottom Line**

Current concepts are useful as a prototype consolidation layer, but they should not remain a second durable ontology.

Target:

```text
Topic Registry = canonical concepts
Relationship Graph = concept connections
Quarter Understanding = synthesis over topic_ids + relationships
```