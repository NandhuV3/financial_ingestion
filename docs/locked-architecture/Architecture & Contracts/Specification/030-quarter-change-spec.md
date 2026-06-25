# Quarter Change Specification

Status: LOCKED

## 1. Purpose

Quarter Change exists to answer:

> What changed between the previous filing's business understanding and the current filing's business understanding?

Quarter Change compares two consecutive Structured Intelligence snapshots and produces business-level delta observations.

Quarter Change does not explain why changes occurred.

Quarter Change does not determine whether changes are positive or negative.

Quarter Change does not determine whether changes matter for investors.

Quarter Change only identifies and classifies changes.

Quarter Change is the business delta layer.

---

## 2. Position In Architecture

```text
Structured Intelligence (Previous Period)
                +
Structured Intelligence (Current Period)
                ↓
         Quarter Change
                ↓
         Business Signals
```

Structured Intelligence describes how the business works according to a filing.

Quarter Change identifies what changed between filings.

Business Signals later classify and organize those changes into deterministic signal structures.

Quarter Change is not a signal layer.

Quarter Change is not an interpretation layer.

Quarter Change is not an investor layer.

---

## 3. Inputs

### Required Inputs

* Structured Intelligence (Current Period)
* Structured Intelligence (Previous Period)

Quarter Change compares two consecutive Structured Intelligence snapshots.

---

### Enrichment Inputs

* Topic Evolution

Topic Evolution may provide context regarding persistence, emergence, disappearance, strengthening, weakening, or narrative drift.

Topic Evolution may enrich change classification.

Topic Evolution does not replace Structured Intelligence comparison.

---

## 4. Forbidden Inputs

* Company Knowledge
* Business Signals
* Trust Signals
* Quarter Understanding
* Investor Intelligence
* Market Data

### Why Company Knowledge Is Forbidden

Quarter Change compares filing snapshots.

It does not compare filing understanding against durable truth.

Durability belongs to Company Knowledge.

### Why Business Signals Are Forbidden

Business Signals are downstream outputs.

Quarter Change must not consume its own derived observations.

### Why Trust Signals Are Forbidden

Trust evaluation belongs to Trust Architecture.

Quarter Change only identifies business changes.

### Why Quarter Understanding Is Forbidden

Quarter Understanding interprets business meaning.

Quarter Change only identifies change.

### Why Investor Intelligence Is Forbidden

Investor Intelligence owns ownership reasoning.

Quarter Change owns delta detection.

### Why Market Data Is Forbidden

Quarter Change does not perform valuation analysis.

---

## 5. Outputs

Quarter Change produces typed business deltas.

Every change must be supported by evidence from both periods.

Every change must be traceable to Structured Intelligence fields.

---

### Revenue Driver Changes

Purpose:

Identify changes in revenue driver characterization.

Examples:

* Azure consumption appeared as a revenue driver.
* Gaming hardware revenue driver weakened.
* Commercial cloud revenue driver expanded.
* Subscription revenue emphasis increased.

---

### Product Changes

Purpose:

Identify changes in product or service descriptions.

Examples:

* New AI product category appeared.
* Product line expanded.
* Product category disappeared.

---

### Customer Changes

Purpose:

Identify changes in customer segment characterization.

Examples:

* Public sector customer emphasis increased.
* Consumer segment emphasis weakened.
* New customer segment appeared.

---

### Competitive Positioning Changes

Purpose:

Identify changes in management's competitive positioning descriptions.

Examples:

* AI differentiation narrative appeared.
* Security positioning expanded.
* Competitive framing was reframed.

Quarter Change does not determine whether positioning improved.

Quarter Change only identifies change.

---

### Strategic Priority Changes

Purpose:

Identify changes in management priorities.

Examples:

* AI infrastructure priority appeared.
* Datacenter expansion priority strengthened.
* Cost discipline priority weakened.

---

### Risk Changes

Purpose:

Identify changes in risk descriptions.

Examples:

* New regulatory risk appeared.
* Supply chain risk weakened.
* Cybersecurity risk expanded.
* Risk description reframed.

---

### Dependency Changes

Purpose:

Identify changes in operational dependencies.

Examples:

* GPU availability dependency appeared.
* Semiconductor dependency weakened.
* Datacenter capacity dependency expanded.

---

### Management Focus Changes

Purpose:

Identify changes in management emphasis.

Examples:

* Capacity constraints became a management focus.
* Expense discipline emphasis weakened.
* Commercial execution focus expanded.

---

## 6. Allowed Delta Classifications

Quarter Change may use only the following classifications:

### appeared

Not present previously.

Present currently.

### disappeared

Present previously.

Not present currently.

### strengthened

Present in both periods.

Receives greater emphasis currently.

### weakened

Present in both periods.

Receives less emphasis currently.

### expanded

Present in both periods.

Scope increased.

### contracted

Present in both periods.

Scope reduced.

### reframed

Present in both periods.

Described differently.

### stable

Present in both periods.

No meaningful change detected.

---

## 7. Allowed Reasoning

Quarter Change may:

* Compare Structured Intelligence fields.
* Detect additions.
* Detect removals.
* Detect emphasis shifts.
* Detect scope changes.
* Detect narrative reframing.
* Detect classification changes.
* Generate typed delta records.
* Attach supporting evidence.

Quarter Change may organize changes.

Quarter Change may classify changes.

Quarter Change may not interpret changes.

---

## 8. Forbidden Reasoning

Quarter Change must not explain causes.

Invalid:

"AI infrastructure investment increased because management expects stronger demand."

Reason:

Cause attribution belongs downstream.

---

Quarter Change must not evaluate changes.

Invalid:

"AI infrastructure investment is a positive development."

Reason:

Evaluation belongs downstream.

---

Quarter Change must not produce investor conclusions.

Invalid:

"This strengthens the ownership thesis."

Reason:

Investor Intelligence owns ownership conclusions.

---

Quarter Change must not assess trust.

Invalid:

"Management appears more credible."

Reason:

Trust Architecture owns trust evidence.

---

Quarter Change must not assess business quality.

Invalid:

"The company has improved its competitive position."

Reason:

Competitive improvement is an interpretation.

Quarter Change may only identify that positioning changed.

---

Quarter Change must not predict outcomes.

Invalid:

"This will accelerate revenue growth."

Reason:

Forecasting belongs downstream.

---

Quarter Change must not perform valuation reasoning.

Invalid:

"The stock should trade at a higher multiple."

Reason:

Valuation belongs to Investor Intelligence Q4.

---

## 9. Ownership Boundaries

### Structured Intelligence vs Quarter Change

| Dimension | Structured Intelligence                                | Quarter Change                          |
| --------- | ------------------------------------------------------ | --------------------------------------- |
| Question  | How does the business work according to this filing?   | What changed versus the prior filing?   |
| Scope     | Single filing                                          | Two consecutive filings                 |
| Output    | Business understanding                                 | Business deltas                         |
| Example   | AI infrastructure is described as a strategic priority | AI infrastructure priority strengthened |

---

### Quarter Change vs Business Signals

| Dimension      | Quarter Change                          | Business Signals                          |
| -------------- | --------------------------------------- | ----------------------------------------- |
| Purpose        | Detect changes                          | Classify observations                     |
| Output         | Delta records                           | Typed signals                             |
| Interpretation | None                                    | None                                      |
| Example        | AI infrastructure priority strengthened | Strategic investment signal strengthening |

Quarter Change produces raw business changes.

Business Signals organize those changes into reusable signal structures.

---

### Quarter Change vs Quarter Understanding

| Dimension | Quarter Change                         | Quarter Understanding                                                   |
| --------- | -------------------------------------- | ----------------------------------------------------------------------- |
| Purpose   | Detect change                          | Interpret change                                                        |
| Question  | What changed?                          | Why does it matter?                                                     |
| Output    | Delta records                          | Business interpretation                                                 |
| Example   | Commercial cloud emphasis strengthened | Cloud demand became more important in this quarter's business narrative |

Quarter Change never answers why.

Quarter Understanding owns why.

---

## 10. Relationship To Ownership Questions

### Q1 Ownership

What does this company actually sell?

Quarter Change does not answer Q1.

Quarter Change only identifies changes in business descriptions.

---

### Q2 Ownership

Where does the next rupee come from?

Quarter Change contributes evidence by identifying revenue-driver changes.

Investor Intelligence owns the answer.

---

### Q3 Ownership

Can the story be trusted?

Quarter Change may identify narrative changes.

Trust Architecture determines whether those changes become trust evidence.

Quarter Change does not assess credibility.

---

### Q4 Ownership

Is the story already too expensive?

Quarter Change contributes nothing.

---

### Q5 Ownership

Why would I hold it and what would change that?

Quarter Change contributes change evidence only.

Investor Intelligence determines whether a change affects the ownership thesis.

---

## 11. Golden Rule

Quarter Change does not explain.

Quarter Change does not evaluate.

Quarter Change does not interpret.

Quarter Change only identifies and classifies business-level deltas between two consecutive Structured Intelligence snapshots.
