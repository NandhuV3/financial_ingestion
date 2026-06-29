# Quarter Understanding Artifact Specification

Status: LOCKED

## 1. Purpose

Quarter Understanding explains:

> What happened this period and why does it matter in the context of this business?

Quarter Understanding is the first interpretation layer.

It consumes observations and signals produced by upstream layers and produces period-scoped business interpretation.

Quarter Understanding does not answer ownership questions.

Quarter Understanding does not produce investment conclusions.

Quarter Understanding does not produce trust verdicts.

Quarter Understanding explains business meaning.

Investor Intelligence explains ownership meaning.

---

## 2. Position In Architecture

```text
Company Knowledge
      +
Business Signals
      +
Trust Signals
      +
Topic Evolution
      ↓
Quarter Understanding
      ↓
Investor Intelligence
```

---

## 3. Artifact Identity

```json
{
  "artifact_type": "quarter_understanding"
}
```

---

## 4. Artifact Structure

```json
{
  "company_id": "string",
  "period_id": "string",

  "understandings": [
    {
      "understanding_id": "string",

      "title": "string",

      "summary": "string",

      "importance": "high | medium | low",

      "business_area":
        "revenue |
         competition |
         operations |
         customers |
         products |
         capital_allocation |
         trust |
         management |
         strategy |
         other",

      "signal_direction":
        "strengthening |
         weakening |
         stable |
         mixed |
         unknown",

      "evidence_refs": ["signal-id"],

      "confidence": 0.0
    }
  ]
}
```

---

## 5. Purpose Of An Understanding

An Understanding explains:

```text
Observation
     +
Context
     =
Interpretation
```

Example:

Business Signal:

"Cloud demand strengthening"

Quarter Understanding:

"Cloud demand strengthening was discussed across multiple revenue and capacity signals during the period."

NOT:

"Cloud demand strengthening makes the stock attractive."

---

## 6. Allowed Reasoning

Quarter Understanding may:

* Explain business significance
* Explain operational significance
* Explain revenue significance
* Explain customer significance
* Explain trust-signal significance
* Explain interactions between signals

Quarter Understanding may answer:

```text
Why did this matter to the business?
```

---

## 7. Forbidden Reasoning

Quarter Understanding must not:

* Produce ownership conclusions
* Produce buy/sell language
* Produce valuation language
* Produce trust verdicts
* Produce investment recommendations
* Produce holding rationale

Invalid:

"Management remains trustworthy."

Invalid:

"The stock remains attractive."

Invalid:

"This strengthens the ownership thesis."

---

## 8. Trust Boundary

Quarter Understanding may interpret trust evidence.

Example:

Valid:

"Multiple commitment failures were identified during the period."

Valid:

"Trust signals weakened relative to prior observations."

Invalid:

"The story cannot be trusted."

That conclusion belongs to Investor Intelligence Q3.

---

## 9. Relationship To Investor Intelligence

Quarter Understanding provides interpretation.

Investor Intelligence provides ownership conclusions.

Quarter Understanding:

```text
What happened?
Why did it matter?
```

Investor Intelligence:

```text
What should an owner conclude?
```
