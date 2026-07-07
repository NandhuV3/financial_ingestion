# 026 - Platform Intelligence and Company Intelligence Boundary

**Status:** LOCKED  
**Layer:** Platform Architecture  
**Owner:** Platform Architecture  
**Last Updated:** 2026-07-07

---

# Purpose

This document explains how Platform Intelligence and Company Intelligence interact.

Although both operate on the same filing, they solve different problems, own different responsibilities, and evolve independently.

This document defines their architectural boundary.

---

# Why Two Intelligence Systems Exist

The platform answers two fundamentally different questions.

## Platform Intelligence

Platform Intelligence asks:

> What reusable business concepts exist across all companies?

Examples:

- AI Investment
- Cloud Infrastructure
- Supply Chain Optimization
- Capital Allocation

These concepts become governed Platform Knowledge.

---

## Company Intelligence

Company Intelligence asks:

> What do those concepts mean for one specific company?

Examples:

- Microsoft's AI strategy strengthened.
- Apple's Services revenue became a persistent strategic focus.
- Tesla's Manufacturing topic weakened.
- Nvidia's AI narrative shifted from research to commercialization.

These are company-specific observations.

---

# High-Level Architecture

```text
                    SEC Filing
                         │
                         ▼
                 Filing Processing
                         │
                         ▼
                     Themes
                         │
                         ▼
                 Topic Assignment
         (Boundary Between Two Systems)
                /                    \
               /                      \
              ▼                        ▼
Platform Intelligence        Company Intelligence
```

Topic Assignment is the shared architectural boundary.

Everything before Topic Assignment is common.

Everything after Topic Assignment belongs to exactly one subsystem.

---

# Platform Intelligence

Platform Intelligence owns reusable knowledge.

Its purpose is to improve the Platform Registry.

Pipeline:

```text
Topic Assignment
        │
        ▼
Topic Signals
        │
        ▼
Cross-Company Aggregation
        │
        ▼
Aggregation Result
        │
        ▼
Candidate Discovery
        │
        ▼
Governance Decision
        │
        ▼
Platform Registry Evolution
        │
        ▼
Platform Registry
```

Platform Intelligence never explains one company's business.

Its responsibility ends with the Platform Registry.

---

# Company Intelligence

Company Intelligence owns company understanding.

Pipeline:

```text
Topic Assignment
        │
        ▼
Topic Evolution
        │
        ▼
Structured Intelligence
        │
        ▼
Company Knowledge Candidate
        │
        ▼
Governance Promotion
        │
        ▼
Company Knowledge
        │
        ▼
Quarter Change
        │
        ▼
Business Signals
        │
        ▼
Quarter Understanding
        │
        ▼
Investor Intelligence
```

Company Intelligence never governs Platform Knowledge.

Its responsibility is understanding one company.

---

# The Shared Boundary

Topic Assignment is intentionally shared.

It performs one responsibility:

> Map filing observations to governed Platform Topics.

To perform this mapping it consumes:

- Themes
- Governed Platform Registry

It produces:

- Topic Assignment Artifact

This artifact becomes the public contract between Platform Intelligence and Company Intelligence.

---

# Why Topic Evolution Does Not Consume Platform Intelligence

A common question is:

> Why doesn't Topic Evolution consume Topic Signals, Aggregation Results, Topic Candidates, or Governance Decisions?

The answer is ownership.

Topic Assignment has already resolved filing observations into governed Topics.

Example:

```text
Theme

↓

"AI Product Investment"

↓

Topic Assignment

↓

topic_ai_strategy
```

Topic Evolution no longer needs to determine what Topic exists.

It asks a different question:

> How has `topic_ai_strategy` changed over time for this company?

Platform Intelligence has already completed its responsibility.

---

# Why Platform Intelligence Was Built First

Originally, Company Intelligence continued directly after Topic Assignment.

During implementation, one architectural problem became clear:

Who owns the canonical Topic Registry?

Allowing Company Intelligence to create or modify Topics would mix company understanding with platform governance.

To preserve ownership boundaries, Platform Intelligence was extracted as an independent subsystem responsible for:

- discovering reusable Topics
- governing reusable knowledge
- evolving the Platform Registry

Once the Platform Registry became a governed platform artifact, Company Intelligence could safely resume.

---

# Current Filing vs Future Filings

Platform Intelligence serves two purposes.

## Current Filing

The current Platform Registry is required by Topic Assignment.

Without the Platform Registry, Topic Assignment cannot classify Themes into canonical Topics.

Example:

```text
Platform Registry v25

↓

Topic Assignment

↓

2026-Q2 Topic Assignment
```

---

## Future Filings

Platform Intelligence continuously improves the Platform Registry.

Approved Topics discovered from many companies become available for future Topic Assignment executions.

Example:

```text
Many Companies

↓

Platform Intelligence

↓

Platform Registry v26

↓

Future Topic Assignment executions
```

Platform Intelligence therefore supports both:

- today's classification
- tomorrow's improved classification

---

# Why Company Intelligence Does Not Reopen the Platform Registry

Topic Assignment records the Platform Registry version used during classification.

Example:

```json
{
  "topic_id": "topic_ai_strategy",
  "topic_registry_version": "25"
}
```

Topic Evolution consumes this information from the Topic Assignment artifact.

It does not reload the Platform Registry.

This preserves deterministic replay and clean ownership boundaries.

---

# Ownership Summary

## Platform Intelligence Owns

- reusable Topics
- Topic discovery
- Topic governance
- Platform Registry evolution

It never explains one company.

---

## Company Intelligence Owns

- Topic behavior
- business understanding
- company knowledge
- business signals
- investor understanding

It never governs Platform Knowledge.

---

# Design Principles

Platform Intelligence and Company Intelligence are independent subsystems.

They communicate only through governed Platform artifacts.

Neither subsystem reaches inside the implementation of the other.

Topic Assignment is the shared boundary where reusable Platform Knowledge becomes company-specific understanding.

---

# Architecture Summary

The platform deliberately separates reusable knowledge from company-specific understanding.

Platform Intelligence continuously discovers and governs reusable business concepts across all companies.

Company Intelligence applies those governed concepts to understand one company's behavior over time.

This separation enables:

- deterministic execution
- independent subsystem evolution
- clean ownership boundaries
- replayable architecture
- governed Platform Knowledge
- scalable Company Intelligence