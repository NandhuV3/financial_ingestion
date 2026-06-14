# prompt

Determine where LLM reasoning would create the highest value.

For each stage:

Topic Assignment
Topic Evolution
Quarter Change
Structured Intelligence
Company Knowledge
Business Signals
Quarter Understanding
Partner Domain

Classify:

- Must be deterministic
- Can be deterministic
- Benefits from LLM
- Should be LLM-driven

Justify each decision using the business meaning of the artifact.

Do not reference current implementation.
Reason from architecture.
---

# output

| Stage | Classification | Reason |
|---|---|---|
| Topic Assignment | Must be deterministic | This is identity resolution: a theme either maps to a canonical topic or it does not. The value is consistency, replayability, and stable longitudinal tracking. LLM judgment here would make topic history unstable unless used only upstream to propose new registry topics. |
| Topic Evolution | Must be deterministic | This is time-series state tracking: present, absent, recurring, persistent, strengthening, weakening. It should be computed from assigned topics, evidence counts, filing dates, and strength metrics. LLMs would add variability where auditability matters most. |
| Quarter Change | Must be deterministic | This is current-vs-prior delta detection. New/disappeared/intensified/weakened changes should be reproducible from two periods of evidence. LLMs may explain changes later, but should not decide whether the change happened. |
| Structured Intelligence | Should be LLM-driven | This is where raw filing intelligence becomes business understanding: products, customers, revenue drivers, risks, opportunities, operating model, strategic priorities. These require semantic extraction, abstraction, and cross-artifact interpretation. Deterministic rules are brittle here. |
| Company Knowledge | Must be deterministic | This is the durable normalized fact layer. It should not reason or invent. It should validate, normalize, version, hash, and preserve Structured Intelligence into a stable company-scoped artifact. |
| Business Signals | Can be deterministic | Signals can be produced deterministically from Company Knowledge, Quarter Change, and Topic Evolution. The artifact’s job is to expose observable signals, not explain them. LLM support could help later with richer signal phrasing or candidate discovery, but the core signal contract should remain evidence-based and reproducible. |
| Quarter Understanding | Benefits from LLM | This is the highest-value place for LLM reasoning after Structured Intelligence. It must synthesize facts, signals, changes, and trends into business-level quarter insight. Deterministic consolidation can group evidence, but LLM reasoning can explain why the combination matters, separate noise from material movement, and produce clearer business conclusions. |
| Partner Domain | Can be deterministic | This is a presentation/BFF layer. It should organize, simplify, and render intelligence for the frontend. LLM generation here risks creating a second intelligence layer and conflicting with Quarter Understanding. It may use fixed templates and owner-friendly language, but should not create canonical conclusions. |

**Highest LLM Value**

1. **Structured Intelligence**  
   Highest value for extracting business facts from messy filing-derived artifacts.

2. **Quarter Understanding**  
   Highest value for interpreting what the quarter means after deterministic signals, trends, and changes are available.

**Lowest LLM Value**

1. **Topic Evolution**
2. **Quarter Change**
3. **Company Knowledge**

These require determinism, auditability, and stable replay more than language reasoning.

**Recommended Split**

```text
LLM:
Structured Intelligence
Quarter Understanding

Deterministic:
Topic Assignment
Topic Evolution
Quarter Change
Company Knowledge
Business Signals
Partner Domain
```

Business Signals can later accept LLM-assisted candidate generation, but the persisted signal artifact should remain grounded, traceable, and deterministic unless there is a separate reviewed enrichment layer.