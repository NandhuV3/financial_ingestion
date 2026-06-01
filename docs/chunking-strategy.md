# Chunking Strategy

## Purpose

This document explains the chunking approach used by the financial intelligence pipeline.

The goal of chunking is to transform normalized filing text into traceable semantic units that can be used for:

- evidence attribution
- intelligence generation
- retrieval
- embeddings
- semantic search
- RAG

---

# Why Chunking Exists

Large filing sections cannot be processed effectively as a single block.

Problems:

- context becomes too large
- retrieval becomes inaccurate
- evidence attribution becomes difficult
- important topics become mixed together

Chunking creates smaller, meaningful units of information.

---

# Current Strategy

The system uses:

```text
Paragraph-Based Semantic Chunking
```

This strategy was selected because SEC narrative sections naturally contain topic-oriented paragraphs.

Examples:

- business performance
- regulatory risks
- cybersecurity risks
- margin discussion
- liquidity discussion

Paragraph boundaries preserve meaning better than arbitrary character limits.

---

# Chunk Creation Process

```text
Normalized Text
        ↓
Paragraph Detection
        ↓
Paragraph Grouping
        ↓
Chunk Generation
        ↓
Metadata Enrichment
```

---

# Chunk Design Principles

Each chunk should:

- contain a coherent topic
- preserve semantic meaning
- remain understandable in isolation
- support evidence attribution
- remain traceable to source documents

Each chunk should avoid:

- unrelated topic mixing
- extremely small fragments
- excessively large sections
- broken sentences

---

# Current Chunk Schema

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

---

# Metadata Fields

## chunk_id

Unique deterministic identifier.

Examples:

```text
mgmt_001
mgmt_002
risk_001
risk_002
```

Purpose:

- evidence attribution
- retrieval references
- debugging

---

## company

Company name.

Example:

```text
Apple
```

---

## ticker

Public market ticker.

Example:

```text
AAPL
```

---

## filing_date

SEC filing date.

Example:

```text
2026-05-01
```

---

## form_type

SEC filing type.

Example:

```text
10-Q
```

---

## section

Source filing section.

Examples:

```text
management_discussion
risk_factors
```

---

# Evidence Attribution

Chunk IDs are the foundation of evidence attribution.

Example:

```json
{
  "theme": "AI Risk",
  "evidence": [
    "risk_014",
    "risk_015"
  ]
}
```

This allows every intelligence output to be traced back to source material.

---

# Current Limitations

The current implementation:

- uses paragraph boundaries only
- does not perform topic modeling
- does not perform semantic clustering
- does not use embeddings
- does not perform adaptive chunk sizing

These may be added in future versions.

---

# Future Improvements

Potential future enhancements:

- semantic chunking
- adaptive chunk sizing
- topic-aware chunking
- embedding-aware chunking
- cross-document chunk linking

The current strategy is intentionally simple and deterministic while validating the financial intelligence pipeline.