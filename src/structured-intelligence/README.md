# Structured Intelligence

## Purpose

Structured Intelligence is the first business-understanding artifact in the intelligence pipeline.

It converts filing-derived intelligence into a normalized business understanding that can be consumed by downstream deterministic layers.

---

## Ownership

Structured Intelligence owns:

- business_description
- products
- customers
- revenue_drivers
- competitive_positioning
- operating_model
- key_dependencies
- strategic_priorities
- risks
- opportunities

Structured Intelligence is responsible for synthesizing business understanding.

It is not responsible for signal generation, quarter explanations, investment recommendations, or storage logic.

---

## Inputs

Structured Intelligence is generated from:

- Filing Metadata
- Themes
- Topic Assignments
- Topic Evolution
- Quarter Change Report

These inputs provide business context, historical trends, and filing-level changes.

---

## Outputs

Structured Intelligence produces:

- StructuredIntelligence

The artifact contains normalized business understanding with metadata, confidence, and lineage.

---

## Downstream Consumers

Structured Intelligence is consumed by:

- Company Knowledge
- Business Signals
- Quarter Understanding

---

## Ownership Boundaries

Structured Intelligence:

- Synthesizes business understanding
- Produces structured outputs
- Tracks lineage and metadata

Company Knowledge:

- Normalizes durable company facts
- Owns versioned business knowledge

Business Signals:

- Generates observations from Company Knowledge

Quarter Understanding:

- Explains quarter-specific developments using signals and reasoning

---

## High-Level Flow

SEC Filing
↓
Chunking
↓
Theme Extraction
↓
Topic Assignment
↓
Topic Evolution
↓
Quarter Change Report
↓
Structured Intelligence
↓
Company Knowledge
↓
Business Signals
↓
Quarter Understanding