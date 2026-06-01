# System Architecture

## Purpose

This document describes the high-level architecture of the Financial Ingestion platform.

The system transforms raw SEC filings into evidence-backed financial intelligence.

The architecture is designed to prioritize:

- traceability
- maintainability
- testability
- explainability
- future scalability

---

# High-Level Architecture

```text
SEC EDGAR
     ↓
Ingestion Layer
     ↓
Extraction Layer
     ↓
Processing Layer
     ↓
Intelligence Layer
     ↓
Financial Intelligence Output
```

---

# Layer Overview

```text
┌─────────────────────────────┐
│ SEC EDGAR                   │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│ Ingestion Layer             │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│ Extraction Layer            │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│ Processing Layer            │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│ Intelligence Layer          │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│ Financial Intelligence      │
└─────────────────────────────┘
```

---

# Layer 1: Ingestion

Purpose:

Acquire filings from SEC EDGAR.

Responsibilities:

- company discovery
- filing discovery
- filing metadata retrieval
- filing download

Source:

```text
src/ingestion/
```

Output:

```text
Raw Filing HTML
```

---

# Layer 2: Extraction

Purpose:

Extract meaningful sections from filings.

Responsibilities:

- section discovery
- boundary detection
- narrative extraction

Examples:

- Management Discussion and Analysis
- Risk Factors

Source:

```text
src/extraction/
```

Output:

```text
Raw Narrative Sections
```

---

# Layer 3: Processing

Purpose:

Prepare filing content for intelligence generation.

Responsibilities:

- normalization
- chunk generation
- metadata enrichment

Source:

```text
src/processing/
```

Output:

```text
Semantic Chunks
```

Chunk Example:

```json
{
  "chunk_id": "risk_014",
  "company": "Apple",
  "ticker": "AAPL",
  "form_type": "10-Q",
  "filing_date": "2026-05-01",
  "section": "risk_factors",
  "text": "..."
}
```

---

# Layer 4: Intelligence

Purpose:

Generate evidence-backed financial insights.

Responsibilities:

- theme extraction
- evidence attribution
- intelligence generation

Source:

```text
src/ai/
```

Output Example:

```json
{
  "theme": "AI Risk",
  "category": "artificial_intelligence",
  "importance": "high",
  "summary": "...",
  "evidence": [
    "risk_014",
    "risk_015"
  ]
}
```

---

# Evidence Attribution Model

The system follows an evidence-first architecture.

```text
Chunk
    ↓
Theme
    ↓
Evidence Reference
    ↓
Financial Intelligence
```

Principles:

- every insight requires evidence
- every theme references source chunks
- intelligence remains traceable
- unsupported claims are rejected

---

# Engineering Principles

The architecture follows:

- evidence over assumptions
- traceability over convenience
- deterministic processing
- explicit contracts
- architecture before features
- testability first

---

# Current Scope

Implemented:

- SEC ingestion
- filing extraction
- normalization
- chunking
- metadata enrichment
- theme extraction
- evidence attribution
- contract testing

Current Support:

- Apple (AAPL)
- SEC 10-Q filings

---

# Future Architecture

Planned capabilities:

```text
Financial Intelligence
         ↓
Embeddings
         ↓
Semantic Search
         ↓
Retrieval
         ↓
RAG
         ↓
Multi-Company Analysis
         ↓
Comparative Intelligence
         ↓
Portfolio Intelligence
```

Future layers may include:

- Retrieval Layer
- Embedding Layer
- Search Layer
- Portfolio Intelligence Layer

The current architecture intentionally focuses on building a trustworthy and evidence-backed intelligence foundation before introducing advanced AI retrieval systems.