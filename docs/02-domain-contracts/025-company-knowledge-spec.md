# Company Knowledge Specification

Version: 2.0
Status: LOCKED
Owner: Company Knowledge Layer

---

# Purpose

Company Knowledge answers:

```text
What do we currently believe to be durably true about this company?
```

It is company-scoped, governed durable knowledge. It is not a copy of the
latest filing and is not written directly by Structured Intelligence or the
Company Knowledge Candidate Builder.

---

# Architectural Position

```text
Structured Intelligence
        ↓
Company Knowledge Candidate
        ↓
Company Knowledge Governance
        ↓
Company Knowledge
        ↓
Business Signals
```

Governance is the only writer.

---

# Ownership

Company Knowledge owns:

* approved durable business model knowledge
* approved durable products and customer segments
* approved durable revenue structure and revenue drivers
* approved durable competitive positioning
* approved durable strategic priorities
* approved durable management focus
* approved durable operating dependencies
* supporting periods and source promotion references for each knowledge value

Company Knowledge does not own:

* filing-specific risk observations
* quarter-specific events
* Topic Assignment or Topic Evolution
* Business Signals
* trust assessment
* investor conclusions
* artifact identity, framework metadata, framework lineage, versioning,
  persistence, current pointers, archive/history, or framework hashes

Artifact Framework owns artifact lifecycle mechanics. Governance owns approved
content creation and governance confidence.

---

# Artifact Content

```typescript
type CompanyKnowledgeArtifactContent = {
  artifact_type: "company_knowledge";
  company_id: string;
  knowledge: CompanyKnowledge;
  confidence: CompanyKnowledgeConfidence;
  governance_summary: CompanyKnowledgeGovernanceSummary;
};

type CompanyKnowledge = {
  business_model: BusinessModelKnowledge | null;
  products: ProductKnowledge[];
  customers: CustomerKnowledge[];
  revenue_structure: RevenueStructureKnowledge | null;
  revenue_drivers: RevenueDriverKnowledge[];
  competitive_positioning: CompetitivePositionKnowledge[];
  strategic_priorities: StrategicPriorityKnowledge[];
  management_focus: ManagementFocusKnowledge[];
  dependencies: DependencyKnowledge[];
};
```

Artifact Framework supplies artifact identity and artifact version. Content
must not own `artifact_id`, `artifact_version`, framework metadata, or
framework lineage.

---

# Governed Knowledge Value

Every Company Knowledge value includes:

```typescript
type GovernedKnowledgeValue = {
  stability_class: StabilityClass;
  extraction_confidence: number;
  durability_confidence: number;
  governance_confidence: number;
  supporting_periods: string[];
  last_updated_period: string;
  source_promotions: string[];
};

type StabilityClass =
  | "stable"
  | "semi_stable"
  | "dynamic";
```

Domain-specific values extend `GovernedKnowledgeValue`:

```typescript
type BusinessModelKnowledge = GovernedKnowledgeValue & {
  summary: string;
  value_creation: string;
};

type ProductKnowledge = GovernedKnowledgeValue & {
  product_name: string;
  description: string;
  importance: "high" | "medium" | "low";
};

type CustomerKnowledge = GovernedKnowledgeValue & {
  customer_segment: string;
  description: string;
};

type RevenueStructureKnowledge = GovernedKnowledgeValue & {
  summary: string;
  recurring_components: string[];
  transactional_components: string[];
};

type RevenueDriverKnowledge = GovernedKnowledgeValue & {
  driver: string;
  description: string;
};

type CompetitivePositionKnowledge = GovernedKnowledgeValue & {
  positioning: string;
  rationale: string;
};

type StrategicPriorityKnowledge = GovernedKnowledgeValue & {
  priority: string;
  description: string;
};

type ManagementFocusKnowledge = GovernedKnowledgeValue & {
  focus_area: string;
  description: string;
};

type DependencyKnowledge = GovernedKnowledgeValue & {
  dependency: string;
  description: string;
};
```

`supporting_periods` and `source_promotions` are sorted and deduplicated.

---

# Confidence Ownership

The Company Knowledge Candidate Builder supplies:

* `stability_class`
* `extraction_confidence`
* `durability_confidence`
* `supporting_periods`

Company Knowledge Governance supplies:

* `governance_confidence`
* the promotion decision
* `source_promotions`
* `last_updated_period`

```typescript
type CompanyKnowledgeConfidence = {
  overall: number;
  extraction_confidence: number;
  durability_confidence: number;
  governance_confidence: number;
  evidence_depth: number;
};
```

Artifact-level confidence is computed from approved values only. It must not
be used as a substitute for per-value durability or governance approval.

---

# Admission Matrix

`Always promotable` means immediately eligible to become a governance
candidate. It does not mean automatically approved.

`Conditionally promotable` means eligible for governance promotion only after
the required supporting-period count is met.

`Never promotable` means the candidate builder must exclude the field.

| Structured Intelligence field | Company Knowledge target | Admission | Stability | Required supporting periods | Reason |
|---|---|---|---|---:|---|
| `business_model` | `business_model` | Always promotable | stable | 1 | Core operating model can bootstrap durable knowledge, subject to governance |
| `products` | `products` | Always promotable | stable | 1 | Core products are durable identity fields, subject to governance |
| `revenue_model` | `revenue_structure` | Always promotable | stable | 1 | Revenue structure is a durable business-model field |
| `customers` | `customers` | Conditionally promotable | semi_stable | 2 | Customer segmentation can reflect filing emphasis and needs confirmation |
| `revenue_drivers` | `revenue_drivers` | Conditionally promotable | semi_stable | 2 | Drivers may change with period conditions |
| `competitive_positioning` | `competitive_positioning` | Conditionally promotable | semi_stable | 2 | Positioning claims require longitudinal support |
| `strategic_priorities` | `strategic_priorities` | Conditionally promotable | dynamic | 3 | Filing priorities are dynamic and require repeated support |
| `management_focus` | `management_focus` | Conditionally promotable | dynamic | 3 | Management emphasis is period-sensitive |
| `dependencies` | `dependencies` | Conditionally promotable | dynamic | 3 | Operating dependencies may be temporary or filing-specific |
| `risks` | none | Never promotable | none | n/a | Risk characterization is filing-scoped and belongs in Quarter Change, not durable memory |

No other Structured Intelligence field is admissible without a contract
change.

---

# First-Population Matrix

First population is permitted, but governance remains mandatory.

| Admission class | Supporting-period requirement met in first period? | Candidate recommendation | Governance action |
|---|---:|---|---|
| Always promotable / stable | Yes | `candidate_promote` | Explicit approve, reject, or review |
| Conditionally promotable / semi_stable | No | `candidate_retain` | Cannot promote until two periods support the exact value |
| Conditionally promotable / dynamic | No | `candidate_retain` | Cannot promote until three periods support the exact value |
| Never promotable | Not applicable | No candidate emitted | No governance action |

Partial first population is valid. Governance creates Company Knowledge from
the approved subset only. Missing optional knowledge fields remain `null` or
empty; they are not represented by placeholder values.

An empty approved subset must not create a Company Knowledge artifact.

---

# Supporting Periods and Durability

Required supporting periods:

```typescript
const REQUIRED_SUPPORTING_PERIODS = {
  stable: 1,
  semi_stable: 2,
  dynamic: 3,
} as const;
```

Durability confidence:

```text
min(
  distinct_supporting_periods / required_supporting_periods,
  1
)
```

rounded to four decimals.

Supporting periods apply to an exact canonical value. A materially changed
value starts a new supporting-period sequence.

---

# Governance Summary

```typescript
type CompanyKnowledgeGovernanceSummary = {
  governance_decision_refs: string[];
  approved_candidate_refs: string[];
  rejected_candidate_refs: string[];
  review_candidate_refs: string[];
};
```

These are content-level governance references, not Artifact Framework lineage.

---

# Update Semantics

Governance may:

* promote a new value
* merge a compatible collection value
* retain current knowledge
* reject a candidate
* require review
* roll back through a new governed artifact version

Governance must never:

* promote a never-promotable field
* promote a conditional value below its supporting-period requirement
* infer missing candidate evidence
* treat extraction confidence as durability
* bypass an explicit review requirement

---

# Downstream Contract

Downstream layers consume only approved Company Knowledge.

Candidate artifacts and governance review state are not substitutes for
Company Knowledge.

Business Signals must tolerate partially populated Company Knowledge and may
not reconstruct excluded filing-specific risks from it.

---

# Architectural Invariants

1. Company Knowledge is governed durable truth.
2. Governance is the only writer.
3. Structured Intelligence never writes Company Knowledge.
4. Admission eligibility never bypasses governance.
5. Risks are never promoted.
6. Stability, extraction confidence, durability confidence, and governance
   confidence remain distinct.
7. Supporting periods apply to exact canonical values.
8. Partial first population is allowed.
9. Empty approval does not create Company Knowledge.
10. Artifact Framework owns lifecycle, identity, versioning, persistence, and
    framework lineage.

End of Specification.
