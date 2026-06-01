# Financial Ingestion

A financial document intelligence pipeline for ingesting, processing, and analyzing SEC filings.

---

## Purpose

The goal of this project is to transform raw SEC filings into structured, evidence-backed financial intelligence.

The pipeline focuses on:

- SEC filing ingestion
- document extraction
- text normalization
- semantic chunking
- theme extraction
- evidence attribution

---

## Current Scope

Current implementation supports:

- Apple (AAPL)
- SEC 10-Q filings
- narrative section extraction
- evidence-backed theme generation

This repository is currently a prototype focused on validating the financial intelligence pipeline before expanding to multiple companies and filing types.

---

## Pipeline

```text
SEC Filing
    ↓
Ingestion
    ↓
Extraction
    ↓
Normalization
    ↓
Chunking
    ↓
Theme Extraction
    ↓
Evidence Attribution
    ↓
Financial Intelligence
```
---

## Repository Structure

```text
src/
├── ingestion/
├── extraction/
├── processing/
├── ai/
└── storage/

docs/
tests/
data/
```

---

## Commands

### Install dependencies:
```bash
npm install
```

### Type check:
```bash
npm run typecheck
```

### Run SEC ingestion:
```bash
npm run ingest:sec
```

### Extract sections:
```bash
npm run extract:sections
```

### Extract boundaries:
```bash
npm run extract:boundaries
```

### Normalize sections:
```bash
npm run normalize:sections
```

### Chunk sections:
```bash
npm run chunk:sections
```

### Generate intelligence:
```bash
npm run generate:intelligence
```

### Generate themes:
```bash
npm run generate:themes
```

### Run tests:
```bash
npm test
```

---

## Engineering Principles

- evidence over assumptions
- traceability over convenience
- deterministic processing
- explicit contracts
- testability first
- architecture before features

---

## Current Status

### Implemented:

- SEC ingestion
- filing extraction
- section discovery
- normalization
- chunking
- theme extraction
- evidence attribution
- contract testing

### Planned:

- embeddings
- retrieval
- RAG
- multi-company support
- comparative intelligence