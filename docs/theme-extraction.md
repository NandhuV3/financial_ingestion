# Theme Extraction

## Purpose

This document describes how the system transforms semantic chunks into evidence-backed financial intelligence.

The goal is to identify meaningful business themes while maintaining traceability to source filings.

---

# Why Theme Extraction Exists

Raw filing text is difficult to consume.

Investors typically want answers to questions such as:

- What changed this quarter?
- What are the major risks?
- What is driving growth?
- What is management focused on?
- What regulatory concerns exist?
- What competitive pressures exist?

Theme extraction converts filing content into structured intelligence.

---

# High Level Flow

```text
Semantic Chunks
        ↓
Theme Discovery
        ↓
Evidence Attribution
        ↓
Financial Intelligence
```

---

# Inputs

Theme extraction operates on chunked filing data.

Input Schema:

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

Source:

```text
data/chunks/
```

---

# Outputs

Theme extraction produces structured intelligence.

Output Schema:

```json
{
  "company": "",
  "ticker": "",
  "filing_date": "",
  "themes": [
    {
      "theme": "",
      "category": "",
      "importance": "",
      "summary": "",
      "evidence": []
    }
  ]
}
```

Source:

```text
data/intelligence/
```

---

# Theme Categories

Examples:

```text
growth
margins
liquidity
competition
supply_chain
regulation
antitrust
privacy
cybersecurity
artificial_intelligence
product_quality
macroeconomic
investments
taxation
```

The system may identify additional categories if supported by evidence.

---

# Evidence Attribution

Every theme must contain evidence.

Example:

```json
{
  "theme": "AI Risk",
  "category": "artificial_intelligence",
  "importance": "high",
  "summary": "The company highlights increasing risks related to AI deployment and regulation.",
  "evidence": [
    "risk_014",
    "risk_015"
  ]
}
```

This ensures:

- traceability
- explainability
- auditability
- confidence validation

---

# Intelligence Principles

The system follows:

- evidence before conclusions
- no unsupported claims
- no hallucinated themes
- traceable outputs
- source-backed intelligence

Every generated theme must be grounded in filing content.

---

# Validation Rules

Theme outputs must satisfy:

- theme exists
- category exists
- importance exists
- summary exists
- evidence exists
- evidence is not empty
- evidence IDs reference valid chunks

These rules are enforced by contract tests.

---

# Current Limitations

Current implementation:

- analyzes a single filing
- does not compare quarters
- does not compare companies
- does not verify semantic entailment
- relies on LLM theme discovery

Evidence IDs are validated structurally but not yet semantically verified.

---

# Future Improvements

Potential future enhancements:

- semantic evidence validation
- confidence scoring
- theme ranking
- multi-quarter comparisons
- multi-company comparisons
- trend detection
- portfolio intelligence
- retrieval-augmented generation (RAG)

The current implementation prioritizes simplicity, traceability, and evidence-backed intelligence.