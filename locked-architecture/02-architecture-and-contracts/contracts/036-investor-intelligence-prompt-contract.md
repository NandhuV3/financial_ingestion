# Investor Intelligence Prompt Contract

Status: LOCKED

# 1. Purpose

This document defines the permanent contract governing every Investor Intelligence prompt.

It specifies

- what Investor Intelligence must produce
- what it must never produce
- which reasoning is permitted
- which reasoning is forbidden
- which architectural boundaries must never be crossed

Prompt wording may evolve.

This contract must remain stable.

Every future Investor Intelligence prompt version must satisfy this specification.

---

# 2. Relationship To Other Documents

This document complements

- Investor Intelligence Specification
- investor-intelligence-prompt.ts

Relationship

```
Investor Intelligence Specification

↓

031 Prompt Contract

↓

investor-intelligence-prompt.ts
```

The specification defines the layer.

This contract governs reasoning.

The prompt implements both.

---

# 3. Primary Responsibility

Investor Intelligence answers one question.

> **Given everything the platform knows about this business, what should an informed long-term owner understand?**

Investor Intelligence is the platform's final synthesis layer.

It is the only layer permitted to answer the Ownership Questions.

---

# 4. Ownership Questions

Investor Intelligence exclusively owns

### Q1

What does this company actually sell?

### Q2

Where does the next rupee come from?

### Q3

Can the story be trusted?

### Q4

Is the story already too expensive?

### Q5

Why would I own this business, and what would make me change my mind?

No upstream layer may answer these questions.

---

# 5. Position In The Architecture

```
Quarter Understanding

+

Company Knowledge

+

Business Signals (enrichment)

+

Trust Signals (conditional)

+

Commitment Tracking (enrichment)

+

Topic Evolution (enrichment)

↓

Investor Intelligence

↓

Partner Domain
```

Investor Intelligence never performs upstream work.

Partner Domain never generates intelligence.

---

# 6. Required Inputs

Required

- Quarter Understanding
- Company Knowledge

Optional enrichment

- Business Signals
- Trust Signals (only when Quarter Understanding trust interpretation is unavailable)
- Commitment Tracking
- Topic Evolution
- Market Data (Q4)
- Prior Investor Intelligence

Every conclusion must originate from these structured artifacts.

---

# 7. Forbidden Inputs

Investor Intelligence must never consume

- Filing Artifact
- Evidence Identity
- Themes
- Topic Assignment
- Structured Intelligence
- Quarter Change

Investor Intelligence never reads SEC filings.

Investor Intelligence never extracts observations.

Investor Intelligence synthesizes structured intelligence only.

---

# 8. Input Boundary

Investor Intelligence consumes completed intelligence.

It never creates intelligence that should have been produced upstream.

Example

Business Signals

↓

Cloud revenue signal strengthened.

Quarter Understanding

↓

Cloud investment became more important this quarter.

Investor Intelligence

↓

The company's long-term growth thesis continues to rely primarily on cloud expansion supported by increasing AI investment.

Investor Intelligence synthesizes.

It does not regenerate.

---

# 9. Required Outputs

Investor Intelligence produces five independently versioned sections.

## Q1

Business Understanding

## Q2

Future Revenue Understanding

## Q3

Trust Assessment

## Q4

Valuation Assessment

## Q5

Ownership Thesis

Each section contains

- answer
- evidence package
- confidence
- depth indicator
- status
- lineage

---

# 10. Required Reasoning

Investor Intelligence may

- synthesize multiple intelligence artifacts
- resolve conflicting upstream evidence
- weigh business interpretation
- answer ownership questions
- explain ownership rationale
- identify thesis change conditions
- explain trust conclusions
- integrate longitudinal evidence
- produce owner-oriented language

Investor Intelligence is the only layer permitted to produce ownership conclusions.

---

# 11. Forbidden Reasoning

Investor Intelligence must never

- extract observations from filings
- identify Themes
- assign Topics
- generate Topic Evolution
- compare Structured Intelligence snapshots
- generate Quarter Change
- derive Business Signals
- derive Trust Signals
- update Company Knowledge
- promote Company Knowledge Candidates
- reinterpret filings directly

These responsibilities belong upstream.

---

# 12. Synthesis Rule

Investor Intelligence performs

```
Business Understanding

+

Business Interpretation

+

Trust Interpretation

+

Revenue Understanding

↓

Ownership Understanding
```

It performs no upstream processing.

---

# 13. Company Knowledge Rule

Company Knowledge provides

the durable understanding of the business.

Investor Intelligence may

reason from Company Knowledge.

Investor Intelligence may not

modify Company Knowledge.

Investor Intelligence may not

replace Company Knowledge.

---

# 14. Quarter Understanding Rule

Quarter Understanding explains

what happened.

Investor Intelligence explains

what that means for ownership.

Example

Quarter Understanding

↓

Commercial cloud demand became increasingly important during the quarter.

Investor Intelligence

↓

Cloud demand remains the primary driver supporting the ownership thesis because it reinforces the company's durable business model.

---

# 15. Business Signals Rule

Business Signals provide

observable facts.

Investor Intelligence

may use those facts.

Investor Intelligence

must never regenerate those facts.

---

# 16. Trust Rule

Quarter Understanding interprets trust observations.

Investor Intelligence owns the trust conclusion.

Example

Quarter Understanding

↓

Repeated commitment delays increase execution uncertainty.

Investor Intelligence

↓

Management credibility has weakened because repeated execution gaps have persisted across commitments.

Trust verdicts belong only here.

---

# 17. Q4 Rule

Q4 requires Market Data.

Without Market Data

Investor Intelligence must return

```
status = insufficient_data
```

Investor Intelligence must never infer valuation from filing information alone.

---

# 18. Ownership Thesis Rule

Only Investor Intelligence may answer

Why own this business?

Why avoid this business?

What strengthens the thesis?

What weakens the thesis?

What changes the thesis?

No other layer may answer these questions.

---

# 19. Language Rules

Investor Intelligence may use

- attractive
- compelling
- weakening
- strengthening
- durable
- ownership thesis
- investment case
- competitive advantage
- confidence
- concern
- conviction
- valuation
- trust

because this is the ownership layer.

Language must remain evidence-backed.

Unsupported opinions remain prohibited.

---

# 20. Evidence Rule

Every ownership conclusion must trace back to upstream artifacts.

Investor Intelligence never invents evidence.

Every statement must be explainable through

Company Knowledge

Quarter Understanding

Business Signals

Trust Signals

or other approved inputs.

---

# 21. Output Validation Rules

Every output must satisfy

✓ ownership question answered

✓ evidence-backed

✓ uses only approved inputs

✓ no filing extraction

✓ no signal generation

✓ no Company Knowledge modification

✓ no upstream reasoning

Failure of any rule invalidates the output.

---

# 22. Forbidden Questions For Other Layers

The following questions belong exclusively to Investor Intelligence.

- Should I own this business?
- What is the investment thesis?
- Is management trustworthy?
- What would change my mind?
- What strengthens the ownership case?
- What weakens the ownership case?
- Is this business attractive?
- Is this company worth holding?

No upstream layer may answer them.

---

# 23. Regression Requirements

Every future prompt version must preserve

- ownership synthesis
- evidence grounding
- Q1–Q5 ownership
- upstream boundary compliance

Prompt wording may evolve.

Responsibilities may not.

---

# 24. Relationship To Prompt Registry

Prompt Registry governs

- versioning
- lifecycle
- activation
- rollback

This contract governs

- reasoning
- synthesis
- ownership boundaries
- forbidden behavior

---

# 25. Relationship To Layer Ownership

Themes

↓

Observation

Structured Intelligence

↓

Business Description

Quarter Understanding

↓

Business Interpretation

Investor Intelligence

↓

Ownership Synthesis

Investor Intelligence never performs work belonging to earlier layers.

---

# 26. Final Principle

Investor Intelligence is the platform's final reasoning layer.

It never extracts.

It never clusters.

It never generates signals.

It never modifies knowledge.

It never reads filings.

It synthesizes everything the platform knows into owner-focused understanding.

It answers

> **Given everything the platform knows, what should an informed long-term owner understand?**

Nothing more.

Nothing less.