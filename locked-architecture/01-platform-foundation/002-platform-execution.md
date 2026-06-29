# Platform Execution

Status: LOCKED

---

# 1. Purpose

This document defines the execution flow of the intelligence platform.

It answers one question:

> **How does a single SEC filing move through the platform from raw HTML to investor intelligence?**

This document describes execution order only.

It does not redefine layer ownership.

Layer responsibilities belong to **001-layer-ownership.md** and the individual layer specifications.

---

# 2. Execution Principles

The platform executes as a pipeline.

Every layer has a single responsibility.

A layer consumes only approved upstream artifacts.

A layer never reaches downstream.

A layer never skips ownership boundaries.

Each layer produces artifacts for downstream consumers.

No layer mutates upstream artifacts.

---

# 3. High-Level Execution Flow

```text
SEC Filing
    │
    ▼
Extraction
    │
    ▼
Normalization
    │
    ▼
Filing Artifact 
    │
    ▼
Evidence Identity 
    │
    ▼
Themes Quality 
    │
    ▼
Themes 
    │
    ├─────────────────────────────┐
    │                             │
    ▼                             ▼
Topic Assignment          Structured Intelligence 
    │                             │
    ▼                             ▼
Topic Evolution           Company Knowledge Candidate
                                  │
                                  ▼
                         Governance Promotion
                                  │
                                  ▼
                         Company Knowledge 
                                  │
                ┌─────────────────┴──────────────────┐
                │                                    │
                ▼                                    ▼
        Quarter Change                        Business Signals 
                │                                    ▲
                │                                    │
                └────────────────────────────────────┘
                             Enrichment
                                  │
                                  ▼

        ─────────────────────────────────────────────

                 Trust Architecture (Parallel)

Commitment Tracking 
Narrative Consistency 
Accounting Stability 
Capital Allocation Tracking 

                 │
                 ▼

         Trust Signals 

        ─────────────────────────────────────────────

                    Quarter Understanding

Required
• Company Knowledge
• Business Signals

Enrichment
• Trust Signals
• Topic Evolution

                │
                ▼

              Investor Intelligence

Required
• Quarter Understanding
• Company Knowledge

Enrichment
• Business Signals
• Topic Evolution
• Trust Signals
• Commitment Tracking
• Market Data (future)

                │
                ▼

             Partner Domain
```

---

# 4. Stage 1 — Filing Preparation

Purpose

Convert raw SEC HTML into stable platform artifacts.

Execution

```text
SEC Filing
    │
Extraction
    │
Normalization
    │
Filing Artifact
    │
Evidence Identity
    │
Themes Quality
```

Produces

- Filing Artifact
- Evidence Identity
- Themes Quality

No intelligence is generated.

Everything remains deterministic.

---

# 5. Stage 2 — Theme Generation

Purpose

Identify filing-scoped business narratives.

Execution

```text
Themes
```

Produces

- Theme clusters

Execution Model

LLM

Themes become the common upstream dependency for both intelligence branches.

---

# 6. Stage 3 — Parallel Intelligence Branches

After Themes completes, the pipeline splits into two independent branches.

---

## Branch A — Topic Pipeline

Purpose

Create longitudinal Topic understanding.

Execution

```text
Themes
    │
Topic Assignment
    │
Topic Evolution
```

Produces

- Topic Assignments
- Topic Evolution

Execution Model

Deterministic

This branch is completely independent from Company Knowledge generation.

---

## Branch B — Business Understanding Pipeline

Purpose

Generate filing-scoped business understanding and durable Company Knowledge.

Execution

```text
Themes
    │
Structured Intelligence
    │
Company Knowledge Candidate
    │
Governance Promotion
    │
Company Knowledge
```

Produces

- Structured Intelligence
- Company Knowledge Candidate
- Governance Decisions
- Company Knowledge

Execution Models

Structured Intelligence

LLM

Everything else

Deterministic / Governance

---

# 7. Stage 4 — Quarter Change

Purpose

Detect business-level changes between consecutive filings.

Execution

```text
Structured Intelligence (Previous)
              │
              ▼
Structured Intelligence (Current)
              │
              ▼
        Quarter Change
```

Inputs

- Previous Structured Intelligence
- Current Structured Intelligence

Quarter Change **does not consume Company Knowledge**.

Company Knowledge is intentionally excluded to prevent governance timing from affecting delta computation.

Execution Model

Deterministic

---

# 8. Stage 5 — Business Signals

Purpose

Produce deterministic business observations.

Execution

Required Input

```text
Company Knowledge
```

Enrichment Inputs

```text
Quarter Change

Topic Evolution
```

Produces

Business Signals

Execution Model

Deterministic

Business Signals describe what is observably true.

They do not interpret significance.

---

# 9. Stage 6 — Trust Architecture

Trust processing executes independently from the main intelligence pipeline.

Execution

```text
Commitment Tracking
Narrative Consistency
Accounting Stability
Capital Allocation Tracking

            │
            ▼

       Trust Signals
```

Produces

Trust Signals

Execution Model

Deterministic

Trust Signals produce observations only.

Trust verdicts are intentionally forbidden.

---

# 10. Stage 7 — Quarter Understanding

Purpose

Interpret the current quarter in business context.

Execution

Required Inputs

```text
Company Knowledge

Business Signals
```

Enrichment Inputs

```text
Trust Signals

Topic Evolution
```

Produces

Quarter Understanding

Execution Model

LLM

Quarter Understanding is the first layer allowed to answer:

> What happened this quarter, and why does it matter to the business?

It must not answer ownership questions.

---

# 11. Stage 8 — Investor Intelligence

Purpose

Produce owner-facing intelligence.

Execution

Required Inputs

```text
Quarter Understanding

Company Knowledge
```

Enrichment Inputs

```text
Business Signals

Topic Evolution

Trust Signals

Commitment Tracking

Market Data (future)
```

Produces

Investor Intelligence

Execution Model

LLM

Investor Intelligence is the only layer permitted to answer the five ownership questions.

---

# 12. Stage 9 — Partner Domain

Purpose

Present intelligence.

Execution

```text
Investor Intelligence
        │
        ▼
Partner Domain
```

Produces

User-facing experiences only.

Partner Domain never generates intelligence.

---

# 13. Parallel Execution Model

The platform contains two independent execution branches after Themes.

```text
                    Themes
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
Topic Assignment            Structured Intelligence
        │                             │
        ▼                             ▼
Topic Evolution          Company Knowledge Pipeline
        │                             │
        └──────────────┬──────────────┘
                       ▼
               Business Signals
```

These branches may execute in parallel.

They synchronize only through Business Signals.

---

# 14. Trust Execution Model

Trust processing executes independently from the business intelligence pipeline.

```text
Commitment Tracking
Narrative Consistency
Accounting Stability
Capital Allocation Tracking

            │
            ▼

       Trust Signals

            │
            ▼

   Quarter Understanding
```

This architecture allows trust evidence to evolve independently from business understanding.

---

# 15. Execution Summary

| Stage | Purpose | Execution |
|--------|---------|-----------|
| Filing Preparation | Prepare filing artifacts | Deterministic |
| Themes | Generate business narratives | LLM |
| Topic Pipeline | Topic classification and evolution | Deterministic |
| Business Pipeline | Business understanding and Company Knowledge | Mixed |
| Quarter Change | Detect filing-to-filing changes | Deterministic |
| Business Signals | Produce observable business signals | Deterministic |
| Trust Pipeline | Produce trust observations | Deterministic |
| Quarter Understanding | Interpret the current quarter | LLM |
| Investor Intelligence | Answer ownership questions | LLM |
| Partner Domain | Present intelligence | Deterministic |

---

# 16. Architectural Guarantees

The platform guarantees that:

- Every layer has a single owner.
- Every artifact has a single producer.
- No downstream layer modifies upstream artifacts.
- Governance is isolated from intelligence generation.
- Trust is isolated from business understanding.
- Investor reasoning exists only in Investor Intelligence.
- Every conclusion remains traceable to filing evidence.
- Execution order preserves architectural ownership boundaries.