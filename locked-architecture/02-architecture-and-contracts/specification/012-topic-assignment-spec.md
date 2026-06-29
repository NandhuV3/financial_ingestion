# Topic Assignment Specification

Status: LOCKED

## 1. Purpose

Topic Assignment exists to map filing-specific Themes into a canonical Topic Registry.

Themes contain filing-specific language.

Topic Assignment normalizes that language into a stable concept space.

Topic Assignment answers:

> Which canonical Topics are represented by this Theme?

Topic Assignment does not explain meaning.

Topic Assignment does not interpret significance.

Topic Assignment does not create Topics.

Topic Assignment performs classification only.

---

## 2. Position In Architecture

```text
Themes
↓
Topic Assignment
↓
Topic Evolution
```

Themes produce filing-scoped observations.

Topic Assignment maps observations to canonical Topics.

Topic Evolution tracks Topic behavior across periods.

---

## 3. Inputs

### Required Inputs

* Themes
* Topic Registry

The Topic Registry contains:

* Topic ID
* Topic Name
* Topic Definition
* Topic Examples
* Topic Status

---

## 4. Forbidden Inputs

* Company Knowledge
* Quarter Change
* Business Signals
* Trust Signals
* Quarter Understanding
* Investor Intelligence
* Market Data

Topic Assignment performs classification only.

It must not consume downstream interpretation.

---

## 5. Outputs

Topic Assignment produces Theme-to-Topic mappings.

Example:

```json
{
  "theme_id": "theme_001",
  "topic_ids": [
    "topic_cloud_infrastructure",
    "topic_ai_investment"
  ]
}
```

---

## 6. Allowed Reasoning

Topic Assignment may:

* Compare Theme meaning to Topic definitions
* Compare Theme meaning to Topic examples
* Assign one Theme to multiple Topics
* Assign multiple Themes to the same Topic

Topic Assignment may determine:

```text
Theme → Topic
```

matching.

---

## 7. Forbidden Reasoning

Topic Assignment must not:

* Create Topics
* Merge Topics
* Delete Topics
* Assess importance
* Assess significance
* Assess investor relevance
* Produce business conclusions
* Produce trust conclusions
* Produce ownership conclusions

Invalid:

"This Topic appears important."

Invalid:

"This Topic strengthens the investment case."

Invalid:

"This Topic indicates future growth."

---

## 8. Assignment Rules

A Topic may receive:

* Zero Themes
* One Theme
* Many Themes

A Theme may map to:

* One Topic
* Many Topics

Assignment must be based on Topic definition fit.

Not perceived importance.

---

## 9. Ownership Boundaries

### Themes vs Topic Assignment

| Themes          | Topic Assignment |
| --------------- | ---------------- |
| Observation     | Classification   |
| Filing language | Canonical Topic  |
| Narrative       | Registry mapping |

Example:

Theme:

```text
AI Infrastructure Expansion
```

Topic Assignment:

```text
topic_ai_investment
```

---

### Topic Assignment vs Topic Evolution

| Topic Assignment       | Topic Evolution              |
| ---------------------- | ---------------------------- |
| What Topic is present? | How Topic behaves over time? |
| Single filing          | Multiple periods             |
| Classification         | Pattern detection            |

Topic Assignment does not perform temporal analysis.

---

## 10. Relationship To Ownership Questions

Topic Assignment contributes indirectly.

It enables:

* Q2 longitudinal analysis
* Q3 narrative consistency analysis
* Q5 ownership thesis evolution

Topic Assignment never answers Q1–Q5 directly.

---

## 11. Execution Model

Execution Type:

```text
Deterministic
```

Given:

* Theme
* Topic Registry

the same assignment should be reproducible.

Topic Assignment is not an interpretation layer.

It is a classification layer.
