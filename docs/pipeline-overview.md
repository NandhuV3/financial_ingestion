# Pipeline Overview

## Purpose

This document describes the end-to-end financial intelligence pipeline.

The goal of the pipeline is to transform raw SEC filings into structured, evidence-backed financial intelligence.

---

# High Level Flow

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

# Stage 1: Ingestion

Purpose:

Retrieve filings from SEC EDGAR.

Responsibilities:

- company discovery
- filing discovery
- filing download
- raw document storage

Input:

```text
Company
```

Output:

```text
Raw SEC Filing HTML
```

Source:

```text
src/ingestion/
```

---

# Stage 2: Extraction

Purpose:

Identify meaningful filing sections.

Responsibilities:

- section discovery
- boundary detection
- narrative extraction

Examples:

- Management Discussion and Analysis
- Risk Factors

Input:

```text
Raw SEC Filing HTML
```

Output:

```text
Raw Section Text
```

Source:

```text
src/extraction/
```

---

# Stage 3: Normalization

Purpose:

Convert noisy filing text into AI-ready narrative text.

Responsibilities:

- whitespace cleanup
- duplicate removal
- artifact cleanup
- formatting normalization

Input:

```text
Raw Section Text
```

Output:

```text
Normalized Narrative Text
```

Source:

```text
src/processing/normalize-sections.ts
```

---

# Stage 4: Chunking

Purpose:

Create traceable semantic units.

Responsibilities:

- paragraph grouping
- chunk generation
- metadata enrichment
- stable chunk identifiers

Chunk Schema:

```json
{
  "chunk_id": "",
  "company": "",
  "ticker": "",
  "form_type": "",
  "filing_date": "",
  "section": "",
  "text": ""
}
```

Input:

```text
Normalized Narrative Text
```

Output:

```text
Semantic Chunks
```

Source:

```text
src/processing/chunk-sections.ts
```

---

# Stage 5: Theme Extraction

Purpose:

Generate evidence-backed financial intelligence.

Responsibilities:

- theme discovery
- risk identification
- growth identification
- evidence attribution

Input:

```text
Semantic Chunks
```

Output:

```json
{
  "theme": "",
  "category": "",
  "importance": "",
  "summary": "",
  "evidence": []
}
```

Source:

```text
src/ai/generate-themes.ts
```

---

# Stage 6: Evidence Attribution

Purpose:

Ensure every intelligence output is traceable.

Principles:

- no unsupported claims
- evidence required
- chunk references required
- auditable output

Example:

```json
{
  "theme": "AI Risk",
  "importance": "high",
  "evidence": [
    "risk_014",
    "risk_015"
  ]
}
```

---

# Engineering Principles

The pipeline follows:

- evidence over assumptions
- traceability over convenience
- deterministic processing
- explicit contracts
- testability first
- architecture before features

---

# Future Stages

Planned future capabilities:

- embeddings
- retrieval
- semantic search
- RAG
- multi-company analysis
- comparative intelligence
- portfolio intelligence