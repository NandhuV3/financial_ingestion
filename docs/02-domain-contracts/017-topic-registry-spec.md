# Topic Registry Specification

Version: 1.1
Status: LOCKED
Owner: Topic Governance Layer

---

# Purpose

Topic Registry is the governed cross-company ontology for canonical business
topics.

It answers:

```text
Which durable canonical topics may filing observations normalize to?
```

It is not a repository of observed Themes.

---

# Core Ownership

Topic Registry owns:

* canonical topic IDs
* topic tier classification
* topic definitions
* aliases
* examples
* exclusions
* embedding versions
* lifecycle status
* topic governance

Topic Registry does not own:

* company-specific observations
* filing-specific Themes
* Topic Evolution
* business interpretation

---

# Topic Schema

```typescript
type TopicTier =
  | "universal"
  | "sector";

type TopicLifecycleStatus =
  | "proposed"
  | "provisional"
  | "active"
  | "deprecated"
  | "merged"
  | "rejected";

type TopicRegistryEntry = {
  topic_id: string;

  topic_name: string;

  tier: TopicTier;

  sector_id?: string;

  definition: string;

  aliases: string[];

  examples: string[];

  exclusions: string[];

  embedding_version: string;

  status: TopicLifecycleStatus;

  merged_into_topic_id?: string;
};
```

Topic definitions must be reusable across companies and periods.

Aliases normalize terminology. They do not create company-specific topic
variants.

Examples provide positive classification guidance. They are not observed
Themes and are not company-specific evidence.

Exclusions define adjacent subjects that must not normalize to the topic.

`embedding_version` identifies the pinned embedding representation used for
deterministic Topic Assignment. Changing the embedding model or embedding input
contract requires a new embedding version.

For `tier = "universal"`, `sector_id` is forbidden.

For `tier = "sector"`, `sector_id` is required.

---

# Two-Tier Ontology

## Universal Topics

Universal topics represent durable business subjects that are reusable across
multiple sectors and companies.

Examples:

* recurring revenue
* capital allocation
* cybersecurity
* regulatory compliance
* supply-chain dependency

## Sector Topics

Sector topics represent durable business subjects that are reusable across
multiple companies within a governed sector.

Examples:

* same-store sales for retail
* net interest margin for banking
* reserve replacement for energy
* clinical trial progression for biopharma

Sector topics must not contain company, product, executive, filing, or
transaction-specific language.

The two tiers form one registry. Sector topics are not separate registries and
do not create a parallel assignment architecture.

---

# Registry Size Model

Topic Registry is a rich, controlled business ontology.

The expected mature operating range is:

```text
200–500 active topics
```

This range is a governance target, not a correctness threshold or automatic
admission quota.

The registry must not be artificially constrained to a small 20–50 topic
taxonomy when durable, distinct business subjects require additional coverage.

The registry must also not grow by copying filing-specific Themes into
canonical topics.

---

# Governance Boundary

Topic creation is governed.

Topic Assignment:

* may read active Topic Registry entries
* may emit Topic Proposals for governance review
* may not create, provision, activate, merge, deprecate, or reject topics

Only approved governance actions may modify Topic Registry lifecycle state.

---

# Topic Proposal Eligibility

A recurring unassigned observation may become eligible for a Topic Proposal
when the same normalized business subject appears in:

```text
5 companies

OR

3 consecutive periods
```

Eligibility does not create a topic.

Governance must still determine whether the proposed topic is:

* cross-company reusable
* durable over time
* distinct from existing topics
* suitable for Topic Evolution
* correctly scoped as universal or sector
* correctly granular

---

# Admission Governance Workflow

Topic admission follows this governed sequence:

```text
Unassigned Theme Evidence
        ↓
Topic Proposal
        ↓
Uniqueness Analysis
        ↓
Cross-Company Evidence Review
        ↓
Topic Evolution Utility Review
        ↓
Provisional Topic
        ↓
Deterministic Assignment Evaluation
        ↓
Active Topic
```

## Step 1 — Proposal

A proposal records:

* proposed name
* proposed tier
* proposed sector, when applicable
* normalized subject
* triggering Theme references
* companies observed
* periods observed

An eligible proposal enters lifecycle status `proposed`.

## Step 2 — Uniqueness Analysis

Governance must compare the proposal with active, provisional, deprecated, and
merged topics.

The proposal must be rejected or merged when an existing definition, alias, or
scope already owns the subject.

## Step 3 — Cross-Company Evidence Review

Universal topics require evidence that the subject is reusable across
companies and is not sector-bound.

Sector topics require evidence from multiple companies in the same governed
sector.

Single-company terminology is insufficient for admission.

## Step 4 — Topic Evolution Utility Review

Governance must verify that the topic can independently:

* emerge
* persist
* disappear
* support future longitudinal comparison

A subject that cannot produce meaningful temporal continuity is not eligible
for activation.

## Step 5 — Provisional

An approved candidate enters lifecycle status `provisional`.

Provisional topics:

* are not assignable in production
* may be evaluated through governed offline or shadow analysis
* must have complete definition, aliases, examples, exclusions, tier, and
  embedding version

## Step 6 — Active

A provisional topic becomes `active` only after governance confirms:

* deterministic assignment precision
* acceptable overlap with existing topics
* sufficient cross-company coverage
* Topic Evolution utility
* stable definition and exclusions

Only active topics may receive production Topic Assignments.

---

# Lifecycle Rules

Proposed topics are governance records and are not assignable.

Provisional topics are evaluation-only and are not assignable in production.

Only active topics may receive new Topic Assignments.

Deprecated topics remain historical references but receive no new assignments.

Merged topics redirect to the active canonical topic.

Rejected proposals never become assignable topics.

Allowed lifecycle transitions are:

```text
proposed → provisional
proposed → rejected
proposed → merged

provisional → active
provisional → rejected
provisional → merged

active → deprecated
active → merged
```

Lifecycle transitions require a governed decision record.

Topic IDs are immutable after creation.

Merged and deprecated topic IDs remain resolvable for historical replay.

---

# Topic Granularity Rules

## Too Broad

A topic is too broad when it combines independently evolving business
subjects.

Examples:

* growth
* operations
* competition
* strategy
* financial performance

Broad containers must be divided into durable subjects that can evolve
independently.

## Acceptable

A topic is acceptable when it represents one durable, independently observable
business subject.

Examples:

* recurring revenue
* infrastructure capacity
* pricing pressure
* customer concentration
* semiconductor supply dependency

## Too Specific

A topic is too specific when it encodes:

* one company
* one named product
* one executive
* one transaction
* one filing event
* one temporary management phrase
* one isolated metric value

Too-specific subjects remain Themes or evidence and must not enter Topic
Registry.

---

# Deterministic Assignment Direction

Topic Assignment must remain deterministic.

Runtime LLM topic classification is forbidden.

Long-term classification uses:

* exact matching against `topic_name` and `aliases`
* deterministic semantic similarity between Theme title and summary and the
  governed topic definition representation
* deterministic exclusion checks
* contract-owned thresholds
* a pinned embedding version

The topic definition representation is derived from:

* `topic_name`
* `definition`
* `aliases`
* `examples`

`exclusions` are deterministic negative constraints and must not be treated as
positive similarity examples.

---

# Registry Versioning And Stability

Every published Topic Registry artifact must record:

```typescript
type TopicRegistryArtifactContent = {
  registry_version: string;

  embedding_version: string;

  topics: TopicRegistryEntry[];
};
```

Every active or provisional entry in a published registry artifact must use the
artifact-level `embedding_version`.

Within a published registry version:

* topic IDs are immutable
* topic tier is immutable
* topic definitions are immutable
* examples and exclusions are immutable
* embedding version is immutable
* lifecycle status is immutable

Any governed change produces a new registry version.

Alias-only additions may preserve topic semantic identity.

Changes to definition, tier, sector, exclusions, merge target, or embedding
version are semantic canonicalization changes. They require invalidation and
rebuild of affected Topic Assignments and dependent future Topic Evolution
artifacts.

An active topic must not be redefined in place. Material scope change requires
a new topic or a governed merge.

---

# Architectural Invariants

1. Topic Registry is a governed ontology.
2. Topic Registry is not a Theme repository.
3. Topic IDs and definitions are cross-company and durable.
4. Topic creation requires governance.
5. Topic Assignment cannot modify Topic Registry.
6. Topic Evolution cannot modify Topic Registry.
7. Only active topics may receive new assignments.
8. Topic Registry contains universal and sector topics in one governed model.
9. Provisional topics are not assignable in production.
10. Runtime LLM topic classification is forbidden.
11. Material canonicalization changes require a new registry version and
    downstream rebuild.
12. Topic granularity must support independent Topic Evolution.

End of Specification.
