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

Required:

- Company Knowledge

Enrichment:

- Quarter Change
- Topic Evolution

### Outputs

- Typed Signals

### LLM Usage

FORBIDDEN

### Reason

Signals must be replayable.

---

## Trust Pillars

### Business Question

What trust evidence is observable within each owned trust dimension?

### Inputs

- Structured source artifacts owned by each Trust Pillar

### Outputs

- Commitment Tracking
- Narrative Consistency
- Accounting Stability
- Capital Allocation Tracking

### LLM Usage

FORBIDDEN

### Reason

Trust Pillars collect, compare, and preserve evidence deterministically.

Trust Pillars do not interpret trust meaning.

---

## Trust Signals

### Business Question

What deterministic trust observations are present?

### Inputs

- Commitment Tracking
- Narrative Consistency
- Accounting Stability
- Capital Allocation Tracking

### Outputs

- Typed Trust Signals

### LLM Usage

FORBIDDEN

### Reason

Trust Signals transform Trust Pillar evidence into deterministic observations.

Trust Signals do not perform interpretation.

---

## Quarter Understanding

### Business Question

What happened this period and why does it matter?

### Inputs

Required:

- Company Knowledge
- Business Signals

Enrichment:

- Trust Signals
- Topic Evolution
- Concept Registry

### Outputs

- Period Understanding
- Trust Interpretation
- Business Interpretation

### LLM Usage

LLM-ASSISTED

### Reason

Investor interpretation requires judgment.

Quarter Understanding is the platform interpretation layer.

This is a locked architecture decision.

---

## Investor Intelligence

### Business Question

What should an owner understand?

### Inputs

Required:

- Company Knowledge
- Quarter Understanding

Enrichment:

- Business Signals
- Topic Evolution
- Prior Investor Intelligence
- Market Data

Trust input:

- Quarter Understanding trust interpretation

### Outputs

- Q1
- Q2
- Q3
- Q4
- Q5

### LLM Usage

LLM-ASSISTED

### Reason

Cross-period synthesis.

Investor Intelligence is the platform synthesis layer.

---

## Partner Domain

### Business Question

How should intelligence be presented?

### Inputs

- Investor Intelligence

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

Only four layers are LLM-assisted:

1. Themes
2. Structured Intelligence
3. Quarter Understanding
4. Investor Intelligence

The deterministic layers are:

1. Topic Assignment
2. Topic Evolution
3. Quarter Change
4. Company Knowledge promotion and governance logic
5. Business Signals
6. Trust Pillars
7. Trust Signals

Topic Assignment remains deterministic-primary with its existing governed
ambiguity fallback.

LOCKED.

---

# Final Principle

LLMs create understanding.

Deterministic systems create truth.

The platform depends on both.

Never confuse their responsibilities.

LOCKED.
