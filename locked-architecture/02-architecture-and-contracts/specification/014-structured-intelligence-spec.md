# Structured Intelligence Specification

Status: LOCKED

## 1. Purpose

Structured Intelligence exists to answer:

> Based on what this filing states, how does this business work?

Themes describe what management discussed in a filing. Structured Intelligence organizes those filing-scoped observations into structured business understanding. Company Knowledge describes what has become durable and canonical across filings.

Structured Intelligence is the bridge between Themes and Company Knowledge. It converts filing-supported observations into business fields that can later be evaluated for durability by the Company Knowledge Candidate and Governance Promotion layers.

Structured Intelligence is filing-scoped. Everything it produces is anchored to this filing and this period. It does not produce durable truth, investor conclusions, ownership reasoning, or cross-period interpretation.

## Golden Rule

Structured Intelligence does not determine whether management is correct.

Structured Intelligence captures how management describes the business in this filing.

Structured Intelligence may organize, normalize, and structure filing-supported claims.

Structured Intelligence does not validate those claims.

Structured Intelligence does not determine whether management's descriptions are accurate.

Structured Intelligence does not determine whether management's strategy is effective.

Structured Intelligence does not determine whether management is credible.

Those responsibilities belong to downstream layers.

Examples:

Valid:

* This filing describes Azure consumption as a revenue driver.

Valid:

* Management states that AI infrastructure investment supports future capacity.

Invalid:

* Azure is the company's most important revenue driver.

Invalid:

* Management's AI strategy is likely to succeed.

Invalid:

* Management appears credible.

Invalid:

* The company has a strong competitive advantage.

## 2. Position In Architecture

```text
Themes
↓
Structured Intelligence
↓
Company Knowledge Candidate
```

Themes own filing-specific observation clusters.

Structured Intelligence owns structured business understanding derived from the filing and Themes.

Company Knowledge owns durable governed business understanding after candidate generation and governance promotion.

Structured Intelligence is not a Company Knowledge layer. It is not an Investor Intelligence layer. It is not a Quarter Understanding layer.

## 3. Inputs

### Required Inputs

* Filing Artifact
* Themes

The Filing Artifact provides filing-scoped source content. Themes provide filing-scoped observation clusters. Structured Intelligence uses these inputs to describe how the business works according to this filing.

### Forbidden Inputs

* Company Knowledge
* Topic Evolution
* Quarter Change
* Business Signals
* Trust Signals
* Quarter Understanding
* Investor Intelligence
* Market Data

Company Knowledge is forbidden because it represents durable canonical understanding. Consuming it would allow Structured Intelligence to import durable truth into a filing-scoped layer.

Topic Evolution is forbidden because it owns topic-level temporal behavior. Structured Intelligence does not perform longitudinal topic analysis.

Quarter Change is forbidden because it owns business-level delta across periods. Structured Intelligence describes this filing only.

Business Signals are forbidden because they are deterministic observations derived after Company Knowledge and enrichment inputs. Structured Intelligence must not depend on downstream signal generation.

Trust Signals are forbidden because they belong to Trust Architecture. Structured Intelligence may describe management claims, but it does not evaluate trust.

Quarter Understanding is forbidden because it owns period interpretation. Structured Intelligence provides filing-scoped business structure, not quarter-level interpretation.

Investor Intelligence is forbidden because it owns investor-facing synthesis and Q1-Q5 reasoning. Structured Intelligence must not consume investor conclusions.

Market Data is forbidden because Structured Intelligence does not perform valuation or market-aware reasoning.

## 4. Outputs

All Structured Intelligence outputs remain filing-scoped.

### business_model

Purpose: Describe how the business works according to this filing.

Scope: Filing-scoped description of the business model, value creation, and operating structure.

Examples:

* This filing describes a subscription and cloud-consumption business model.
* Management states that cloud services and productivity software are key parts of the operating model.

### products

Purpose: Identify products, services, or offerings discussed in the filing.

Scope: Products or services stated or clearly described in this filing.

Examples:

* Microsoft 365
* Azure
* Xbox hardware

### customers

Purpose: Describe customer groups or end markets discussed in the filing.

Scope: Filing-supported customer segments only.

Examples:

* Enterprise customers
* Public sector customers
* Consumers

### revenue_model

Purpose: Describe how revenue is generated according to this filing.

Scope: Filing-scoped revenue structure, including recurring and transactional components when supported.

Examples:

* Subscription revenue
* Cloud consumption revenue
* Hardware sales

### revenue_drivers

Purpose: Identify filing-supported drivers of revenue performance.

Scope: Drivers discussed in this filing for this period.

Examples:

* Azure consumption growth
* Microsoft 365 seat expansion
* Gaming hardware decline

### competitive_positioning

Purpose: Capture how the filing describes the company's market or competitive position.

Scope: Filing-stated positioning only. Structured Intelligence may record management's stated competitive positioning or competitive claims.

Structured Intelligence does not validate those claims.

Structured Intelligence does not compare the company against competitors.

Structured Intelligence does not determine whether the claimed position is accurate, differentiated, defensible, superior, weaker, or stronger.

Those assessments belong to downstream layers.

Examples:

* Management describes competition in cloud infrastructure.
* This filing identifies productivity software as a competitive market.
* Management states that integrated cloud and productivity offerings differentiate the company.

Invalid examples:

* The company has a superior competitive position.
* The company has a stronger competitive moat than competitors.

### strategic_priorities

Purpose: Capture what management identifies as strategic priorities for the business.

Scope: Filing-stated strategic focus areas for this period.

These describe where management states the business is being directed.

Examples:

* AI infrastructure expansion
* Security platform investment
* Datacenter capacity expansion

### management_focus

Purpose: Capture what management emphasized, monitored, discussed, or repeatedly highlighted during the period.

Scope: Filing-scoped management emphasis and stated focus areas.

Management focus may include operational attention areas that are not themselves strategic priorities.

A strategic priority is not automatically a management focus.

A management focus is not automatically a strategic priority.

The two fields may overlap when explicitly supported by filing evidence, but they are not interchangeable.

Examples:

* Operating expense discipline
* Capacity constraints
* Supply availability
* Commercial execution

### risks

Purpose: Identify business risks discussed in the filing.

Scope: Risks stated in this filing. Structured Intelligence does not judge probability, credibility, or trustworthiness.

Examples:

* Supply chain constraints
* Cybersecurity incidents
* Foreign exchange exposure

### dependencies

Purpose: Identify operational or business dependencies described in the filing.

Scope: Filing-supported dependencies only.

Examples:

* Datacenter availability
* Semiconductor supply
* Partner ecosystem participation

## 5. Allowed Reasoning

Structured Intelligence may synthesize filing content when the synthesis remains anchored to this filing.

Structured Intelligence may organize business understanding into structured fields.

Structured Intelligence may convert narrative observations into structured business fields.

Structured Intelligence may describe business mechanics, including how products, customers, and revenue sources relate when supported by the filing.

Structured Intelligence may describe management claims as claims made in the filing.

Structured Intelligence may describe revenue generation mechanisms stated or supported by the filing.

Structured Intelligence may describe customer and product structure discussed in the filing.

## 6. Forbidden Reasoning

Structured Intelligence must not produce durable business facts.

Invalid: Microsoft is primarily a cloud company.

Reason: This asserts durable canonical truth. Company Knowledge owns durable business truth.

Structured Intelligence must not produce canonical truth.

Invalid: Cloud is Microsoft's core business.

Reason: This converts filing-scoped evidence into canonical company identity.

Structured Intelligence must not perform cross-period analysis.

Invalid: Azure growth is accelerating compared with prior quarters.

Reason: Quarter Change and Topic Evolution own temporal comparison.

Structured Intelligence must not produce investor conclusions.

Invalid: This strengthens the investment case.

Reason: Investor Intelligence owns investor-facing synthesis.

Structured Intelligence must not produce valuation reasoning.

Invalid: The company is attractively valued relative to growth.

Reason: Valuation requires downstream market data and Q4 ownership.

Structured Intelligence must not produce trust assessments.

Invalid: Management appears credible.

Reason: Trust Architecture owns trust evidence and Investor Intelligence owns final trust synthesis.

Structured Intelligence must not produce management credibility assessments.

Invalid: Management's AI strategy appears reliable.

Reason: Credibility is a trust interpretation, not filing-scoped business structure.

Structured Intelligence must not produce ownership conclusions.

Invalid: This is a business worth holding long term.

Reason: Investor Intelligence owns ownership reasoning.

Structured Intelligence must not produce buy or sell reasoning.

Invalid: Investors should buy because cloud growth remains strong.

Reason: Investor Intelligence owns investment reasoning.

Structured Intelligence must not produce competitive strength judgments.

Invalid: Microsoft has a strong competitive advantage.

Reason: Structured Intelligence may describe competitive claims in the filing but cannot judge competitive strength.

Structured Intelligence must not produce business quality judgments.

Invalid: This is a high-quality recurring revenue business.

Reason: Business quality is downstream synthesis, not filing-scoped structure.

## 7. Ownership Boundaries

### Themes vs Structured Intelligence

| Dimension | Themes | Structured Intelligence |
|---|---|---|
| Unit of output | Observation cluster | Structured business field |
| Purpose | Identify what management discussed | Describe how the business works according to the filing |
| Time horizon | Filing-scoped | Filing-scoped |
| Reasoning type | Observation extraction | Filing-supported business organization |
| Example outputs | AI infrastructure investment, Azure growth | Revenue drivers, products, management focus |

### Structured Intelligence vs Company Knowledge

| Dimension | Structured Intelligence | Company Knowledge |
|---|---|---|
| Scope | Filing-scoped understanding | Durable canonical understanding |
| Truth status | What this filing states | What governance accepts as durable |
| Time horizon | This filing and this period | Cross-filing company knowledge |
| Promotion authority | None | Governance-controlled |
| Example | This filing describes Azure as a revenue driver | Azure is a durable part of the company's revenue structure |

### Structured Intelligence vs Quarter Understanding

| Dimension | Structured Intelligence | Quarter Understanding |
|---|---|---|
| Primary role | Business description | Business interpretation |
| Question answered | How does this business work according to this filing? | What happened this period and why does it matter? |
| Inputs | Filing Artifact and Themes | Company Knowledge and Business Signals, with approved enrichments |
| Output type | Filing-scoped structured understanding | Period-scoped interpretation |
| Example | This filing identifies cloud consumption as a revenue driver | Cloud demand mattered this quarter because it changed business momentum |

## 8. Examples Of Correct Outputs

1. This filing describes Azure consumption as a driver of cloud revenue.
2. Management states that Microsoft 365 subscriptions contribute recurring revenue.
3. This filing identifies datacenter capacity as an operational dependency.
4. This filing describes AI infrastructure investment as a management priority.
5. Management states that gaming hardware revenue declined during the period.
6. This filing identifies commercial remaining performance obligation as a backlog-related measure.
7. This filing describes cybersecurity incidents as a business risk.
8. Management states that operating expense growth remains an area of focus.
9. This filing identifies enterprise customers as an important customer group.
10. This filing describes cloud and productivity offerings as major product areas.
11. Management states that supply chain availability can affect infrastructure expansion.
12. This filing identifies foreign exchange as a factor affecting reported results.

## 9. Examples Of Invalid Outputs

### Microsoft is primarily a cloud company.

Why it violates ownership: It asserts durable company identity.

Owning layer: Company Knowledge.

### Management appears credible.

Why it violates ownership: It evaluates trust and credibility.

Owning layer: Trust Architecture and Investor Intelligence Q3.

### This strengthens the investment case.

Why it violates ownership: It produces investor-facing reasoning.

Owning layer: Investor Intelligence.

### Cloud is Microsoft's core business.

Why it violates ownership: It converts filing evidence into canonical truth.

Owning layer: Company Knowledge.

### Microsoft has a strong competitive advantage.

Why it violates ownership: It judges competitive strength.

Owning layer: Investor Intelligence, using upstream evidence.

### Azure growth is accelerating versus prior quarters.

Why it violates ownership: It performs cross-period comparison.

Owning layer: Quarter Change and Topic Evolution, depending on comparison type.

### Management's AI strategy is trustworthy.

Why it violates ownership: It evaluates management credibility.

Owning layer: Trust Architecture and Investor Intelligence Q3.

### The stock is too expensive.

Why it violates ownership: It requires valuation and market data.

Owning layer: Investor Intelligence Q4.

### Investors should hold the company for cloud growth.

Why it violates ownership: It answers ownership and holding rationale.

Owning layer: Investor Intelligence Q5.

### The company has a superior business model.

Why it violates ownership: It judges business quality.

Owning layer: Investor Intelligence.

## 10. Relationship To Company Knowledge

Structured Intelligence does not create Company Knowledge. It proposes filing-scoped understanding.

Company Knowledge Candidate evaluates whether Structured Intelligence outputs should become proposed updates. Governance Promotion decides whether those proposed updates are accepted. Company Knowledge becomes canonical only after governance promotion.

```text
Themes
↓
Structured Intelligence
↓
Company Knowledge Candidate
↓
Governance Promotion
↓
Company Knowledge
```

Structured Intelligence may supply evidence for future durable knowledge, but it does not determine durability.

## 11. Relationship To Ownership Questions

### Q1 Ownership

What does this company actually sell?

Structured Intelligence contributes filing-scoped evidence about products, customers, revenue model, and business mechanics. Company Knowledge owns the canonical answer.

### Q2 Ownership

Where does the next rupee come from?

Structured Intelligence contributes filing-scoped revenue understanding. Investor Intelligence owns the final answer.

### Q3 Ownership

Can the story be trusted?

Structured Intelligence provides management claims only. Trust Architecture owns trust evidence. Investor Intelligence owns the final trust conclusion.

### Q4 Ownership

Is the story already too expensive?

Structured Intelligence contributes nothing. Ownership belongs downstream and requires market data.

### Q5 Ownership

Why would I hold it and what would change that?

Structured Intelligence contributes business understanding only. Investor Intelligence owns the answer.
