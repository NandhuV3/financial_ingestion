# Partner Intelligence Quality Review

Phase 5.2 upgraded Partner Domain builders so the API reads more like business understanding and less like filing analysis. The React UI, API routes, hooks, adapters, and frontend contracts were not changed.

## Review Criteria

The Partner Intelligence API should help a user understand a company as a business partner:

- What does the company actually do?
- Who pays the company?
- Why do customers choose it?
- What could realistically hurt the business?

The API should avoid:

- quarterly performance language in story fields
- investor or shareholder instructions
- implementation details such as pipeline limitations
- duplicate risk cards for the same underlying risk

## MSFT

Before:

- Story and summary could reuse filing-style text such as cloud revenue growth or quarterly performance observations.
- Why-they-win could duplicate cloud revenue and AI investment commentary.
- Trust and money sections could expose current pipeline limitations.
- Forensics could produce repeated competition signals.

After:

- Summary: "Microsoft helps organizations run software, cloud infrastructure, and productivity tools used every day."
- Story explains software, cloud infrastructure, security tools, developer platforms, and productivity applications.
- Customers are described as businesses, organizations, developers, schools, governments, and consumers.
- Forensics consolidates repeated risk language into categories such as Competition, Cybersecurity, Macroeconomic, Supply Chain, and Regulation.

Issues fixed:

- Removed revenue-growth phrasing from the business story.
- Replaced implementation-gap language in Trust and Money.
- Consolidated duplicate competition-style risk cards.

Remaining gaps:

- Trust remains a neutral qualitative assessment until long-term leadership and capital-allocation inputs become richer.

## AAPL

Before:

- Business description could be pulled from filing themes rather than a simple explanation of products and customers.
- Money and trust copy could expose missing-data language.
- Risk cards could include narrow filing phrasing, such as tariff-specific labels, instead of a stable business-risk category.

After:

- Summary: "Apple builds personal technology products and services that people use throughout daily life."
- Story explains phones, computers, tablets, wearables, accessories, services, and the ecosystem.
- Customers are described as consumers, families, creators, students, and organizations.
- Tariff/import/export risk language is consolidated under Supply Chain.

Issues fixed:

- Separated business description from filing signals.
- Replaced technical limitations with neutral business-review language.
- Improved risk-category consolidation.

Remaining gaps:

- More precise customer segmentation would benefit from a future product and services taxonomy.

## AMZN

Before:

- Summary could read like a filing observation rather than explaining Amazon's business engines.
- Money section could expose extraction limitations.
- Trust section used implementation-focused language.

After:

- Summary: "Amazon combines online commerce, logistics, advertising, memberships, and cloud infrastructure at large scale."
- Story explains online retail, marketplace services, logistics, advertising, subscriptions, and cloud infrastructure.
- Customers are grouped into shoppers, sellers, advertisers, developers, startups, and large organizations.
- Money language explains sales, costs, borrowing, and cash generation without exposing pipeline status.

Issues fixed:

- Business model language is now primary.
- Money and trust sections no longer disclose missing pipeline capabilities.

Remaining gaps:

- If no strong risk artifact is available, forensics still returns a conservative "No obvious risk signal" card.

## NVDA

Before:

- NVDA is not currently part of the configured backend company ingestion set, so no live Partner Intelligence API artifact is available in this repo.
- Future support risked falling back to generic filing descriptions.

After:

- Deterministic business-language profile added for future NVDA support.
- Future story output will explain chips, computing systems, software platforms, AI, graphics, and accelerated computing.
- Customer language covers cloud providers, AI builders, enterprises, researchers, gamers, and technology manufacturers.

Issues fixed:

- Prepared canonical business-language defaults before API support is added.

Remaining gaps:

- NVDA still needs backend company configuration and filing artifacts before live API review can be completed.

## V

Before:

- Visa is not currently part of the configured backend company ingestion set, so no live Partner Intelligence API artifact is available in this repo.
- Future support risked generic payment-sector language.

After:

- Deterministic business-language profile added for future Visa support.
- Future summary: "Visa operates the payment network that allows money to move between consumers, merchants, and banks."
- Story explains the electronic payment network and the roles of consumers, merchants, banks, and payment partners.

Issues fixed:

- Prepared canonical business-language defaults before API support is added.

Remaining gaps:

- Visa still needs backend company configuration and filing artifacts before live API review can be completed.

## Builder Changes

Updated builders now follow these rules:

- Company profile, partner summary, and company story use business-language profiles first.
- Story fields no longer use quarterly metrics as primary copy.
- Money fields never expose missing extraction or pipeline limitations.
- Trust fields use neutral long-term business-review language.
- Forensics signals are consolidated by deterministic business-risk category.

## Remaining Platform Gaps

- Business-language profiles are deterministic and intentionally simple. They should eventually be backed by a maintained company taxonomy.
- Trust quality will improve when multi-year leadership, capital allocation, and ownership signals are available.
- Money quality will improve when financial statement extraction becomes richer.
- Unsupported companies need backend configuration before live API quality review is possible.
