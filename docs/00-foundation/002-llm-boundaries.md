# 002-llm-boundaries.md

# Purpose

This document defines where LLMs are allowed to operate and where deterministic systems are mandatory.

This is a governance document.

Any violation of these boundaries must be treated as an architectural defect.

---

# Core Principle

LLMs are used for:

- Understanding
- Interpretation
- Synthesis
- Reasoning

Deterministic systems are used for:

- Classification
- Mapping
- Computation
- Comparison
- Promotion
- Governance
- Signal Generation
- Invalidation

If deterministic logic can reliably solve the problem, deterministic logic owns the problem.

---

# Layer Boundaries

## Themes

### Business Question

What topics is management discussing?

### Inputs

- Filing Text

### Outputs

- Raw Themes

### LLM Usage

MANDATORY

### Reason

Unstructured text understanding.

---

## Topic Assignment

### Business Question

Which canonical topics are being discussed?

### Inputs

- Themes
- Topic Registry

### Outputs

- Topic IDs

### LLM Usage

DETERMINISTIC PRIMARY

LLM FALLBACK ONLY

### Rules

1. Deterministic matching first
2. Registry lookup first
3. LLM only for ambiguity
4. Every fallback logged
5. Human review supported

---

## Topic Evolution

### Business Question

How has a topic evolved across periods?

### Inputs

- Topic Assignments

### Outputs

- Emerging
- Growing
- Stable
- Declining

### LLM Usage

FORBIDDEN

### Reason

Trend computation is deterministic.

---

## Quarter Change

### Business Question

What changed from the prior period?

### Inputs

- Current Assignment
- Prior Assignment

### Outputs

- Appeared
- Disappeared
- Strengthened
- Weakened

### LLM Usage

FORBIDDEN

### Reason

Delta computation.

---

## Structured Intelligence

### Business Question

How does this business work?

### Inputs

- Filing Text
- Themes

### Outputs

- Business Model
- Revenue Drivers
- Competition
- Risks
- Opportunities

### LLM Usage

MANDATORY

### Reason

Business understanding requires synthesis.

---

## Company Knowledge

### Business Question

What is durably true about this company?

### Inputs

- Structured Intelligence
- Prior Company Knowledge

### Outputs

- Canonical Knowledge

### LLM Usage

FORBIDDEN

### Reason

Promotion must be deterministic.

---

## Business Signals

### Business Question

What is observably true right now?

### Inputs

- Company Knowledge
- Quarter Change
- Topic Evolution
- Trust Artifacts

### Outputs

- Typed Signals

### LLM Usage

FORBIDDEN

### Reason

Signals must be replayable.

---

## Quarter Understanding

### Business Question

What happened this period and why does it matter?

### Inputs

- Business Signals
- Company Knowledge

### Outputs

- Period Understanding
- Trust Interpretation
- Business Interpretation

### LLM Usage

MANDATORY

### Reason

Investor interpretation requires judgment.

---

## Investor Intelligence

### Business Question

What should an owner understand?

### Inputs

- Quarter Understanding
- Company Knowledge
- Topic Evolution
- Trust Artifacts

### Outputs

- Q1
- Q2
- Q3
- Q4
- Q5

### LLM Usage

MANDATORY

### Reason

Cross-period synthesis.

---

## Partner Domain

### Business Question

How should intelligence be presented?

### Inputs

- Investor Intelligence
- Company Knowledge

### Outputs

- Presentation

### LLM Usage

AVOID

### Allowed

- Tone adjustment
- Language simplification

### Forbidden

- New conclusions
- New intelligence
- New reasoning

---

# Hard Architectural Rules

## Rule 1

Business Signals never use LLMs.

LOCKED.

---

## Rule 2

Company Knowledge promotion never uses LLMs.

LOCKED.

---

## Rule 3

Quarter Understanding never reads filing text.

LOCKED.

---

## Rule 4

Investor Intelligence never reads filing text.

LOCKED.

---

## Rule 5

Partner Domain cannot generate intelligence.

LOCKED.

---

## Rule 6

All LLM artifacts must carry:

- Prompt Version
- Prompt Snapshot
- Model Provider
- Model Version
- Lineage

LOCKED.

---

# Production LLM Layers

Only three layers are allowed to generate intelligence.

1. Themes
2. Structured Intelligence
3. Quarter Understanding
4. Investor Intelligence

Everything else remains deterministic.

LOCKED.

---

# Final Principle

LLMs create understanding.

Deterministic systems create truth.

The platform depends on both.

Never confuse their responsibilities.

LOCKED.