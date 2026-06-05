# Partner Investing Frontend Architecture

## Purpose

Partner Investing helps users understand businesses as if they are becoming small partners, not trading price movements. The frontend should translate the Partner Domain contract into calm, plain-language product experiences.

The frontend consumes:

```text
Partner Intelligence API
  GET /partner-intelligence/:ticker
  GET /partner-intelligence/:ticker?filingDate=YYYY-MM-DD
```

It should not consume raw intelligence artifacts or internal concepts such as `topic_id`, `importance_score`, `evidence_count`, internal categories, or `trend_state`.

## 1. Application Architecture

### Stack

- React for UI composition.
- Vite for development, bundling, and fast iteration.
- React Router for page routing and company detail navigation.
- Tailwind for layout, spacing, typography, and visual tokens.
- LocalStorage for lightweight client persistence.
- Partner Intelligence API for company-facing business intelligence.

### Architecture Shape

```text
React App
  -> Routes
  -> Screens
  -> Feature Components
  -> Partner API Client
  -> Fastify Partner Intelligence API
```

### Mobile-First Strategy

The primary target is iPhone-sized screens. Layouts should start as one-column, scroll-friendly pages with large touch targets, then adapt to wider screens with constrained content widths and optional side panels.

### LocalStorage Strategy

LocalStorage owns only user-local preferences and lightweight product state:

- saved tickers
- recently viewed companies
- preferred learning level
- dismissed education cards
- UI theme preference
- partner journal drafts

LocalStorage must not store raw intelligence artifacts as the source of truth. API responses may be cached later, but that should be explicit and invalidated by filing date.

### API Integration Strategy

Create a small Partner API client:

```text
getPartnerCompany(ticker, filingDate?)
```

The client returns `PartnerCompanyIntelligence`.

Initial API state can use simple React hooks:

- `usePartnerCompany(ticker, filingDate?)`
- `useSavedCompanies()`
- `useRecentCompanies()`

Do not add a global state library until the app has enough cross-screen complexity to justify it.

## 2. Route Map

### Routes

```text
/                  Home
/explore           Explore companies
/portfolio         Saved partner companies
/learn             Educational content
/profile           User preferences and settings
/company/:ticker   Company detail
```

### Navigation Flow

Primary mobile navigation lives in `BottomNav`:

- Home
- Explore
- Portfolio
- Learn
- Profile

Company detail is entered from:

- Home company card
- Explore result
- Portfolio company card
- Recently viewed list

Company detail should preserve bottom navigation while using an in-page tab system for:

- Story
- Customers
- Money
- Trust
- Forensics
- Journal

## 3. Screen Mapping

### Home

Purpose: answer "What businesses should I understand today?"

Partner Domain mapping:

- `PartnerSummary.headline`
- `PartnerSummary.summary`
- `PartnerSummary.businessHealth`
- `PartnerSummary.conviction`
- `CompanyProfile.companyName`
- `CompanyProfile.ticker`

Primary components:

- `HomeScreen`
- `CompanyCard`
- `BusinessHealthBadge`
- `RecentCompanies`
- `PartnerPrompt`

### Explore

Purpose: browse and search companies by business identity, not price action.

Partner Domain mapping:

- `CompanyProfile`
- `PartnerSummary.businessHealth`

Primary components:

- `ExploreScreen`
- `CompanySearch`
- `CompanyDirectoryList`
- `CompanyProfilePreview`
- `BusinessHealthBadge`

### Company Detail

Purpose: help the user understand one business deeply.

Partner Domain mapping:

- `CompanyProfile`
- `PartnerSummary`
- `CompanyStory`
- `CustomerSegment[]`
- `MoneyProfile`
- `TrustProfile`
- `ForensicsSignal[]`

Primary components:

- `CompanyDetailScreen`
- `CompanyHeader`
- `CompanyTabs`
- `StoryTab`
- `CustomersTab`
- `MoneyTab`
- `TrustTab`
- `ForensicsTab`
- `PartnerJournal`

### Company Story

Purpose: power the Story tab.

Partner Domain mapping:

- `CompanyStory.whatTheyDo`
- `CompanyStory.whoBuys`
- `CompanyStory.whyTheyWin`
- `CompanyStory.whatCouldGoWrong`
- `CustomerSegment[]`
- `MoneyProfile`
- `TrustProfile`
- `ForensicsSignal[]`

Primary components:

- `StoryTab`
- `StorySection`
- `CustomerSegmentCard`
- `MoneyTiles`
- `TrustCard`
- `ForensicsCard`

### Portfolio

Purpose: show saved companies as businesses the user wants to follow.

Partner Domain mapping:

- `PartnerSummary`
- `BusinessHealth`
- `CompanyProfile`

Primary components:

- `PortfolioScreen`
- `PortfolioCompanyCard`
- `BusinessHealthBadge`
- `SavedCompaniesEmptyState`

### Learn

Purpose: teach investing concepts through business ownership language.

Partner Domain mapping:

- Educational content layer, not directly dependent on company intelligence.
- `MoneyProfile` language should inform educational modules.

Primary components:

- `LearnScreen`
- `LessonCard`
- `PlainLanguageGlossary`
- `OwnershipPrinciples`

### Profile

Purpose: manage local preferences and user settings.

Partner Domain mapping:

- No direct intelligence dependency.

Primary components:

- `ProfileScreen`
- `PreferencesPanel`
- `SettingsList`
- `DataDisclosure`

## 4. Component Hierarchy

```text
App
  AppProviders
    Router
      AppLayout
        Header
        Outlet
        BottomNav

Screens
  HomeScreen
    CompanyCard
      BusinessHealthBadge
      ConvictionIndicator
    RecentCompanies

  ExploreScreen
    CompanySearch
    CompanyDirectoryList
      CompanyProfilePreview

  PortfolioScreen
    PortfolioCompanyCard
      BusinessHealthBadge
    SavedCompaniesEmptyState

  CompanyDetailScreen
    CompanyHeader
      BusinessHealthBadge
    CompanyTabs
      StoryTab
        StorySection
      CustomersTab
        CustomerSegmentCard
      MoneyTab
        MoneyTiles
          MoneyTile
      TrustTab
        TrustCard
      ForensicsTab
        ForensicsCard
      PartnerJournal

  LearnScreen
    LessonCard
    PlainLanguageGlossary

  ProfileScreen
    PreferencesPanel
    SettingsList
```

### Key Components

`Layout`: page shell, max-width constraints, safe area handling.

`BottomNav`: five primary destinations with touch-friendly icons and labels.

`CompanyCard`: concise business card for Home and Portfolio.

`BusinessHealthBadge`: user-facing health indicator: improving, stable, weakening.

`StoryTab`: structured business explanation.

`TrustCard`: shows trust concepts with data availability messaging.

`ForensicsCard`: green/yellow/red business risk indicator.

`MoneyTiles`: translates revenue, margin, debt, and cashflow into plain language.

`PartnerJournal`: local note-taking surface for "why I understand this business."

## 5. State Management Strategy

### Local UI State

Owned by component state:

- selected company tab
- expanded/collapsed cards
- search input
- temporary filter selection
- modal visibility

### LocalStorage State

Owned by small persistence hooks:

- `useSavedCompanies`
- `useRecentCompanies`
- `useUserPreferences`
- `usePartnerJournal`

Suggested keys:

```text
partner.savedCompanies
partner.recentCompanies
partner.preferences
partner.journalDrafts
```

### API State

Owned by API hooks:

- `usePartnerCompany(ticker, filingDate?)`

Initial implementation can use `useEffect` plus loading/error state. If API state becomes more complex, introduce TanStack Query later for caching, stale state, retries, and background refresh.

### Ownership Rules

- API owns company intelligence.
- LocalStorage owns user preference and personal context.
- Components own temporary UI state.
- No component should parse internal intelligence artifacts.

## 6. Design System

Design principle: think like a business partner, not a trader.

### Typography

- Use clear, readable sans-serif type.
- Prefer calm headings over market-style dashboards.
- Avoid dense ticker-terminal typography.
- Use short section labels: Story, Customers, Money, Trust, Forensics.

### Spacing

- Mobile-first vertical rhythm.
- Generous spacing between conceptual sections.
- Compact but readable cards for repeated company lists.
- Use consistent 8px spacing increments.

### Cards

- Cards should explain one idea at a time.
- Border radius should be modest.
- Avoid nested cards.
- Avoid financial dashboard clutter.

### Colors

Use a restrained palette:

- neutral background
- high-contrast text
- one calm brand accent
- health colors used sparingly

Business health:

- improving: green accent
- stable: neutral/blue-gray accent
- weakening: amber accent

Forensics:

- green: no obvious concern
- yellow: worth understanding
- red: material concern

Do not make the product feel like a trading app with flashing red/green price movement language.

### Animations

- Use subtle transitions for tab changes, card expansion, and bottom nav.
- Avoid ticker-like motion.
- Avoid animations that imply urgency.

## 7. Mobile Experience

### iPhone-First Layout

- Bottom navigation fixed to safe area.
- Company detail uses top summary plus horizontal tabs.
- Cards are full-width with readable text.
- Primary content should be thumb-scroll friendly.

### Desktop Adaptation

Desktop should adapt, not become a separate product:

- centered max-width content
- optional two-column company detail layout
- sticky side navigation for company tabs
- portfolio grid instead of single-column cards

### Touch Interactions

- Minimum 44px touch targets.
- Swipeable tabs may be added later.
- Expandable cards should have clear hit areas.
- Avoid hover-only affordances.

## 8. Future Extension Points

### Watchlists

Start with LocalStorage saved companies. Later move to account-backed persistence.

Extension point:

```text
useSavedCompanies -> saved company service
```

### AI Assistant

Assistant should consume Partner Domain outputs first, not raw filings.

Initial scope:

- explain this business
- explain a risk
- explain Money tab concepts

Do not let assistant generate unsupported investment advice.

### Notifications

Future triggers:

- new filing available
- business health changed
- new forensics signal
- trust profile updated

Notifications should be educational, not trade prompts.

### Multi-Company Comparison

Future comparison should operate at Partner Domain level:

- business model
- customers
- money profile
- trust
- forensics

Avoid comparing raw topic IDs in the frontend.

## API Consumption Plan

### Company Detail

```text
GET /partner-intelligence/:ticker
```

or:

```text
GET /partner-intelligence/:ticker?filingDate=YYYY-MM-DD
```

Use latest filing by default. Company pages can optionally expose an "as of filing date" label using `asOfFilingDate`.

### Home and Portfolio

Initial implementation may call the same endpoint for each saved/recent company. If this becomes inefficient, add a backend batch endpoint later:

```text
GET /partner-intelligence?tickers=MSFT,AAPL,GOOGL
```

Do not introduce this endpoint until needed.

## Risks and Recommendations

### Risks

1. Overloading the first API endpoint: Home, Portfolio, and Company Detail may eventually need different payload sizes.
2. LocalStorage persistence can become messy if schemas are not versioned.
3. The Money and Trust tabs currently have partial backend intelligence.
4. Business health can be misread as investment advice if visual treatment is too strong.
5. Frontend shortcuts may be tempted to consume internal artifacts directly.

### Recommendations

1. Build the first frontend against `PartnerCompanyIntelligence` only.
2. Add LocalStorage schema versions from day one.
3. Clearly label partial Trust and Money data.
4. Keep health badges calm and explanatory.
5. Delay global state libraries until API and local state complexity justify them.
6. Add frontend contract tests that fail if internal fields appear in API responses.
