# Structured Intelligence Prompt Contract.md

Status: LOCKED

# 1. Purpose

This document defines the permanent contract governing every Structured Intelligence prompt.

It specifies:

- what Structured Intelligence must produce
- what it must never produce
- which reasoning is permitted
- which reasoning is forbidden
- which architectural boundaries must never be crossed

Prompt wording may evolve.

This contract must remain stable.

Every future Structured Intelligence prompt version must satisfy this specification.

---

# 2. Relationship To Other Documents

This document complements

- 014-structured-intelligence-spec.md
- structured-intelligence-prompt.ts

Relationship

```
014 Structured Intelligence Specification

↓

031 Prompt Contract

↓

structured-intelligence-prompt.ts
```

The specification defines the layer.

This contract defines LLM reasoning.

The prompt implements both.

---

# 3. Primary Responsibility

Structured Intelligence answers exactly one question.

> **Based on what this filing states, how does this business work?**

Every output must contribute toward answering this question.

Nothing else.

---

# 4. Golden Rule

Structured Intelligence does not determine whether management is correct.

Structured Intelligence organizes how management describes the business.

It structures filing-supported business understanding.

It never validates it.

---

# 5. Required Inputs

Structured Intelligence may consume

- Filing Artifact
- Themes

These inputs have different responsibilities.

### Filing Artifact provides

- structured filing sections
- financial disclosures
- segment disclosures
- tables
- products
- customers
- explicit business descriptions

### Themes provides

- business narrative clusters
- management emphasis
- narrative organization
- evidence-backed observations

Structured Intelligence combines these inputs into structured business understanding.

---

# 6. Input Boundary

Structured Intelligence must never use the Filing Artifact to perform Themes work.

Examples of prohibited behavior

- identifying business narratives
- clustering paragraphs
- discovering new Themes
- reorganizing evidence into Theme-like outputs

Those responsibilities belong exclusively to Themes.

The Filing Artifact exists to provide structured business facts.

Themes exist to provide narrative organization.

Both inputs are required.

Neither replaces the other.

---

# 7. Forbidden Inputs

Structured Intelligence must never consume

- Company Knowledge
- Topic Assignment
- Topic Evolution
- Quarter Change
- Business Signals
- Trust Signals
- Quarter Understanding
- Investor Intelligence
- Market Data

Structured Intelligence is filing-scoped.

It has no historical awareness.

---

# 8. Required Outputs

Structured Intelligence produces structured business understanding.

Examples include

- business model
- products
- services
- customers
- revenue model
- revenue drivers
- competitive positioning (as described)
- strategic priorities
- management focus
- risks
- operational dependencies

Outputs describe the business according to this filing.

Nothing more.

---

# 9. Required Reasoning

Structured Intelligence may

- organize filing-supported business fields
- normalize terminology
- connect related business mechanics
- describe relationships between products, customers and revenue
- summarize management's business descriptions
- structure operational understanding

This reasoning remains filing-scoped.

---

# 10. Forbidden Reasoning

Structured Intelligence must never

- determine whether management is correct
- validate management claims
- assess credibility
- assess trust
- assess execution quality
- assess business quality
- assess competitive strength
- compare competitors
- compare previous filings
- compare historical periods
- identify trends
- determine future outcomes
- recommend investments
- answer ownership questions
- interpret business implications
- evaluate strategic success
- evaluate capital allocation quality
- evaluate management quality

---

# 11. Filing Scope Rule

Every output must remain anchored to this filing.

Valid

> This filing describes Azure consumption as a revenue driver.

Invalid

> Azure is Microsoft's primary revenue driver.

The first is filing-scoped.

The second is durable Company Knowledge.

---

# 12. Structured Business Rule

Structured Intelligence converts

```
Narratives

↓

Business Structure
```

It never converts

```
Business Structure

↓

Business Judgment
```

That belongs downstream.

---

# 13. Company Knowledge Boundary

Structured Intelligence never produces durable truth.

Examples

Valid

> This filing describes enterprise customers as the primary customer segment.

Invalid

> Microsoft's primary customers are enterprises.

Valid

> Management describes cloud consumption as a major revenue source.

Invalid

> Cloud is Microsoft's core revenue model.

Durable truth belongs only to Company Knowledge.

---

# 14. Quarter Understanding Boundary

Structured Intelligence never explains

why something matters.

Examples

Valid

> Management identifies AI infrastructure investment as a strategic priority.

Invalid

> AI infrastructure investment strengthens Microsoft's future growth.

The first describes.

The second interprets.

Interpretation belongs to Quarter Understanding.

---

# 15. Investor Intelligence Boundary

Structured Intelligence never answers investor questions.

Examples

Invalid

- Is this bullish?
- Is this a competitive advantage?
- Does this improve the investment thesis?
- Is management making good decisions?
- Should investors care?

Those questions belong downstream.

---

# 16. Trust Boundary

Structured Intelligence records management claims.

It never evaluates them.

Valid

> Management states that security investment remains a priority.

Invalid

> Management appears committed to security.

Invalid

> Management is executing successfully.

Trust belongs to Trust Architecture.

---

# 17. Competitive Position Boundary

Structured Intelligence records

management's stated positioning.

It never evaluates positioning.

Valid

> Management describes integrated productivity software as a differentiator.

Invalid

> Microsoft has a superior competitive moat.

---

# 18. Strategic Priority Boundary

Strategic priorities describe

where management states the business is being directed.

They do not imply

- effectiveness
- success
- probability
- future performance

Structured Intelligence records priorities.

It never judges them.

---

# 19. Language Rules

Structured Intelligence uses

- neutral
- descriptive
- filing-supported
- business-focused language

It avoids

- superior
- strong
- weak
- impressive
- attractive
- high quality
- poor
- credible
- trustworthy
- likely
- expected to succeed
- bullish
- bearish

unless directly quoted from filing evidence.

---

# 20. Output Validation Rules

Every Structured Intelligence output must satisfy

✓ filing-scoped

✓ evidence-supported

✓ structured business understanding

✓ neutral language

✓ no historical reasoning

✓ no investor reasoning

✓ no trust reasoning

✓ no durable claims

✓ no ownership conclusions

Failure of any rule invalidates the output.

---

# 21. Forbidden Questions

The prompt must never answer

- Is management correct?
- Is management credible?
- Is this strategy working?
- Is this a competitive advantage?
- Is this bullish?
- Is the business high quality?
- Is the company well managed?
- Is revenue likely to accelerate?
- Should investors own this company?
- Is the valuation attractive?
- What changed from last quarter?
- Can the story be trusted?

Those questions belong to downstream layers.

---

# 22. Regression Requirements

Every future prompt version must preserve

- filing scope
- structured business understanding
- neutral language
- evidence grounding
- ownership boundaries

Prompt wording may improve.

Responsibilities may not change.

---

# 23. Relationship To Prompt Registry

Prompt Registry governs

- versions
- activation
- rollback
- lifecycle

This contract governs

- reasoning
- boundaries
- permitted outputs
- forbidden outputs

---

# 24. Relationship To Layer Ownership

Themes answers

> What business narratives does management discuss?

Structured Intelligence answers

> Based on this filing, how does the business work?

Company Knowledge answers

> What is durably true about this business?

Quarter Understanding answers

> What happened this period and why does it matter?

Investor Intelligence answers

> What should an owner conclude?

Structured Intelligence never performs work owned by any other layer.

---

# 25. Final Principle

Structured Intelligence is the platform's business description layer.

It transforms filing-supported narrative observations into structured business understanding.

It does not validate.

It does not compare.

It does not interpret.

It does not judge.

It does not conclude.

It simply answers

> **Based on what this filing states, how does this business work?**

Nothing more.

Nothing less.