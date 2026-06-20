# Topic Registry Specification

Version: 1.0
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
* topic definitions
* aliases
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
type TopicRegistryEntry = {
  topic_id: string;

  topic_name: string;

  definition: string;

  aliases: string[];

  status:
    | "active"
    | "deprecated"
    | "merged"
    | "rejected";

  merged_into_topic_id?: string;
};
```

Topic definitions must be reusable across companies and periods.

Aliases normalize terminology. They do not create company-specific topic
variants.

---

# Governance Boundary

Topic creation is governed.

Topic Assignment:

* may read active Topic Registry entries
* may emit Topic Proposals for governance review
* may not create, activate, merge, deprecate, or reject topics

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

---

# Lifecycle Rules

Only active topics may receive new Topic Assignments.

Deprecated topics remain historical references but receive no new assignments.

Merged topics redirect to the active canonical topic.

Rejected proposals never become assignable topics.

---

# Architectural Invariants

1. Topic Registry is a governed ontology.
2. Topic Registry is not a Theme repository.
3. Topic IDs and definitions are cross-company and durable.
4. Topic creation requires governance.
5. Topic Assignment cannot modify Topic Registry.
6. Topic Evolution cannot modify Topic Registry.
7. Only active topics may receive new assignments.

End of Specification.
