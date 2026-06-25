# Quarter Understanding Prompt Contract

Status: LOCKED

# 1. Purpose

This document defines the permanent contract governing every Quarter Understanding prompt.

It specifies

- what Quarter Understanding must produce
- what it must never produce
- which reasoning is permitted
- which reasoning is forbidden
- which architectural boundaries must never be crossed

Prompt wording may evolve.

This contract must remain stable.

Every future Quarter Understanding prompt version must satisfy this specification.

---

# 2. Relationship To Other Documents

This document complements

- Quarter Understanding Specification
- quarter-understanding-prompt.ts

Relationship

```
Quarter Understanding Specification

↓

042 Prompt Contract

↓

quarter-understanding-prompt.ts
```

The specification defines the layer.

This contract governs reasoning.

The prompt implements both.

---

# 3. Primary Responsibility

Quarter Understanding answers exactly one question.

> **Given what we know about this business, what happened this period and why does it matter to understanding the business?**

Quarter Understanding is the platform's first interpretation layer.

It interprets.

It does not conclude.

---

# 4. Position In The Architecture

Quarter Understanding exists after observation.

It consumes structured intelligence produced by upstream layers.

```
Company Knowledge

+

Business Signals

+

Trust Signals (optional)

+

Topic Evolution (optional)

↓

Quarter Understanding

↓

Investor Intelligence
```

Quarter Understanding never performs upstream work.

Investor Intelligence never repeats Quarter Understanding.

---

# 5. Required Inputs

Quarter Understanding may consume

Required

- Company Knowledge
- Business Signals

Optional enrichment

- Trust Signals
- Topic Evolution
- Concept Registry

Every interpretation must originate from these structured inputs.

---

# 6. Input Boundary

Quarter Understanding consumes interpretations' inputs only.

It never performs extraction.

It never performs signal generation.

It never derives observations.

Examples

Business Signals

↓

Cloud revenue signal strengthened.

Quarter Understanding

↓

Cloud demand became more important to this business during this quarter because cloud is a major revenue driver recorded in Company Knowledge.

Interpretation begins only after signals exist.

---

# 7. Forbidden Inputs

Quarter Understanding must never consume

- Filing Artifact
- Evidence Identity
- Themes
- Topic Assignment
- Structured Intelligence
- Quarter Change

Quarter Understanding does not read filings.

Quarter Understanding interprets upstream intelligence only.

---

# 8. Required Outputs

Quarter Understanding produces

- period understanding
- business interpretation
- importance assessment
- signal relationships
- business context
- narrative weight
- Company Knowledge alignment
- trust interpretation (when Trust Signals exist)

Outputs remain business-focused.

---

# 9. Required Reasoning

Quarter Understanding may

- interpret business signals
- explain why signals matter to understanding the business
- connect multiple signals
- relate signals to Company Knowledge
- assess consistency between signals
- describe business implications
- identify meaningful developments during the quarter
- interpret trust observations within business context

Interpretation must remain grounded in upstream artifacts.

---

# 10. Forbidden Reasoning

Quarter Understanding must never

- answer ownership questions
- recommend investment actions
- recommend buying
- recommend selling
- produce valuation conclusions
- determine intrinsic value
- produce ownership thesis
- determine long-term investment quality
- determine whether investors should care
- determine future stock performance
- generate investment recommendations
- introduce new business facts
- regenerate Business Signals
- regenerate Trust Signals

---

# 11. Business Interpretation Rule

Quarter Understanding explains

why observed business changes matter.

It never explains

why investors should act.

Example

Valid

> Increased AI infrastructure investment indicates management devoted more operational attention to expanding future capacity during this period.

Invalid

> Increased AI infrastructure investment strengthens Microsoft's long-term investment thesis.

The first explains the business.

The second explains ownership.

---

# 12. Company Knowledge Rule

Company Knowledge provides business context.

Quarter Understanding never modifies Company Knowledge.

Example

Company Knowledge

↓

Enterprise customers are the primary customer base.

Business Signals

↓

Commercial cloud demand strengthened.

Quarter Understanding

↓

Commercial cloud demand strengthened within Microsoft's established enterprise customer model.

Quarter Understanding interprets.

It never updates knowledge.

---

# 13. Business Signals Boundary

Business Signals answer

"What is observably true?"

Quarter Understanding answers

"What does that mean for understanding this business?"

Quarter Understanding never regenerates signals.

---

# 14. Trust Boundary

Trust Signals produce observations.

Quarter Understanding interprets trust observations.

Example

Trust Signal

↓

Repeated commitment delays.

Quarter Understanding

↓

Repeated commitment delays increase uncertainty around management's execution consistency during this period.

Valid.

Quarter Understanding still does not conclude

Management cannot be trusted.

That belongs downstream.

---

# 15. Investor Intelligence Boundary

Quarter Understanding must never answer

- Should investors own this business?
- Is management trustworthy?
- Is this business attractive?
- Is the company undervalued?
- Is the investment thesis stronger?
- Should an owner buy more?
- What changes the ownership thesis?

Those belong exclusively to Investor Intelligence.

---

# 16. Language Rules

Quarter Understanding may use

- meaningful
- important
- increased
- reduced
- strengthened
- weakened
- aligned
- inconsistent
- reinforces
- indicates
- suggests
- reflects

when describing business interpretation.

Quarter Understanding must not use

- attractive investment
- bullish
- bearish
- buy
- sell
- outperform
- undervalued
- overvalued
- superior business
- high quality company
- compelling investment
- ownership opportunity

Those are investor-facing language.

---

# 17. Interpretation Rule

Quarter Understanding performs

```
Signals

↓

Business Interpretation
```

It never performs

```
Business Interpretation

↓

Ownership Conclusion
```

That second transformation belongs only to Investor Intelligence.

---

# 18. Trust Interpretation Rule

Quarter Understanding may explain

how trust observations affect business understanding.

It may not explain

whether management deserves investor trust.

Example

Valid

> Reduced commitment consistency increases uncertainty around management execution.

Invalid

> Investors should question management credibility.

---

# 19. Output Validation Rules

Every output must satisfy

✓ based on upstream artifacts

✓ business interpretation

✓ Company Knowledge context

✓ signal grounded

✓ no extraction

✓ no ownership reasoning

✓ no investment recommendations

✓ no valuation reasoning

✓ no new business facts

Failure of any rule invalidates the output.

---

# 20. Forbidden Questions

Quarter Understanding must never answer

- Should I buy this company?
- Should I hold this company?
- Is the business attractive?
- Is management trustworthy?
- Is this company worth owning?
- Is the stock too expensive?
- What is the ownership thesis?
- What would make me sell?

Those belong exclusively to Investor Intelligence.

---

# 21. Regression Requirements

Every future prompt version must preserve

- interpretation-only reasoning
- business context
- Company Knowledge grounding
- signal grounding
- ownership boundaries

Prompt wording may improve.

Responsibilities must never change.

---

# 22. Relationship To Prompt Registry

Prompt Registry governs

- versions
- activation
- rollback
- lifecycle

This contract governs

- reasoning
- boundaries
- interpretation
- forbidden outputs

---

# 23. Relationship To Layer Ownership

Business Signals answer

> What is happening?

Quarter Understanding answers

> Why does it matter for understanding this business?

Investor Intelligence answers

> What should an owner conclude?

Quarter Understanding never performs Investor Intelligence work.

---

# 24. Final Principle

Quarter Understanding is the platform's interpretation layer.

It transforms structured observations into business understanding for the current period.

It does not extract.

It does not compare filings.

It does not generate signals.

It does not determine ownership.

It does not recommend investments.

It simply answers

> **Given what we know about this business, what happened this period and why does it matter to understanding the business?**

Nothing more.

Nothing less.