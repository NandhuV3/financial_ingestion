# Frontend Project Structure

## Purpose

This document defines the frontend folder structure and ownership boundaries for Partner Investing before React screens are built. The goal is to support Home, Explore, Company Detail, Portfolio, Learn, and Profile without creating component sprawl or leaking backend intelligence internals into the UI.

The frontend consumes only the Partner Intelligence API and Partner Domain concepts. It must not consume raw intelligence artifacts.

Long-term TurboRepo alignment is documented in [turborepo-alignment.md](./turborepo-alignment.md). When the monorepo is introduced, this structure should live under `apps/partner-web/src/`.

## 1. Frontend Folder Structure

Recommended Vite app structure. In the future TurboRepo layout, this lives at `apps/partner-web/src/`:

```text
src/
  app/
    App.tsx
    router.tsx
    providers.tsx

  routes/
    home.route.tsx
    explore.route.tsx
    portfolio.route.tsx
    learn.route.tsx
    profile.route.tsx
    company.route.tsx

  features/
    home/
      HomeScreen.tsx
      RecentCompanies.tsx
      PartnerPrompt.tsx
      home.types.ts

    explore/
      ExploreScreen.tsx
      CompanySearch.tsx
      CompanyDirectoryList.tsx
      explore.types.ts

    company/
      CompanyDetailScreen.tsx
      CompanyHeader.tsx
      StoryTab.tsx
      CustomersTab.tsx
      MoneyTab.tsx
      TrustTab.tsx
      ForensicsTab.tsx
      PartnerJournal.tsx
      company.types.ts

    portfolio/
      PortfolioScreen.tsx
      PortfolioCompanyCard.tsx
      portfolio.types.ts

    learn/
      LearnScreen.tsx
      LessonCard.tsx
      Glossary.tsx
      learn.types.ts

    profile/
      ProfileScreen.tsx
      Preferences.tsx
      Settings.tsx
      profile.types.ts

  components/
    ui/
      Button.tsx
      Card.tsx
      Badge.tsx
      Tabs.tsx
      Modal.tsx
      Skeleton.tsx
      EmptyState.tsx

  api/
    partner-api.ts
    partner-api.types.ts
    api-error.ts

  constants/
    routes.ts
    local-storage.ts
    feature-flags.ts

  hooks/
    usePartnerCompany.ts
    useSavedCompanies.ts
    useRecentCompanies.ts
    useUserPreferences.ts
    usePartnerJournal.ts
    useLocalStorageState.ts

  lib/
    storage/
      safe-parse-json.ts
      storage-version-check.ts
    formatting/
      format-currency.ts
      format-percentage.ts
    dates/
      format-date.ts
    validation/
      is-valid-ticker.ts

  layouts/
    AppLayout.tsx
    BottomNav.tsx
    PageContainer.tsx

  types/
    partner-domain.types.ts
    ui.types.ts

  assets/
    icons/
    images/

tests/
  unit/
  integration/
```

### Folder Ownership

`app/`: application wiring, providers, router creation, top-level shell.

`routes/`: route-to-screen mapping only. Route files should stay thin and delegate to feature screens.

`features/`: business-owned UI for each product area. Feature components may depend on shared UI, hooks, API types, and layouts.

`components/ui/`: reusable visual primitives only. No Partner Investing business logic.

`api/`: HTTP client and API response types for Partner Intelligence API.

`constants/`: application-wide constants such as route paths, LocalStorage keys, and feature flags.

`hooks/`: reusable state and persistence hooks.

`lib/`: framework-agnostic utilities. No React imports, rendering, API calls, or app state.

`layouts/`: app shell and responsive layout primitives.

`types/`: shared frontend types that cross feature boundaries.

`assets/`: static icons, images, and media.

`tests/`: frontend tests grouped by behavior level.

## 2. Feature Ownership

### Home

Owns:

```text
HomeScreen
RecentCompanies
PartnerPrompt
```

Responsibilities:

- Show saved or recent businesses.
- Present calm business summaries.
- Help users resume learning about companies.

Boundaries:

- May use `CompanyCard` only if it is local to Home or shared via a deliberate abstraction.
- Should not own search, company tabs, or portfolio persistence rules.

### Explore

Owns:

```text
CompanySearch
CompanyDirectoryList
```

Responsibilities:

- Search or browse companies.
- Route users into `/company/:ticker`.
- Present company identity using `CompanyProfile`.

Boundaries:

- Should not implement company detail tabs.
- Should not store portfolio state directly; use `useSavedCompanies`.

### Company

Owns:

```text
CompanyDetailScreen
StoryTab
CustomersTab
MoneyTab
TrustTab
ForensicsTab
PartnerJournal
```

Responsibilities:

- Present the full `PartnerCompanyIntelligence` aggregate.
- Own company tab state.
- Connect `PartnerJournal` to local journal persistence.

Boundaries:

- Should not fetch raw intelligence artifacts.
- Should not implement global portfolio card logic.
- Should not own app-level navigation.

### Portfolio

Owns:

```text
PortfolioScreen
PortfolioCompanyCard
```

Responsibilities:

- Show saved partner companies.
- Summarize business health across saved companies.
- Provide empty states and learning prompts.

Boundaries:

- Should not implement Explore search.
- Should not mutate API data.

### Learn

Owns:

```text
LessonCard
Glossary
```

Responsibilities:

- Teach plain-language investing concepts.
- Explain Partner Investing vocabulary such as Daily Sales and Money In The Drawer.

Boundaries:

- Should not depend on a specific company unless future lessons intentionally become contextual.

### Profile

Owns:

```text
Preferences
Settings
```

Responsibilities:

- Manage user preferences.
- Display data and product settings.

Boundaries:

- Should not own saved companies or journal data directly; use hooks.

## 3. Shared Component Strategy

`src/components/ui/` is for reusable UI primitives only:

```text
Button
Card
Badge
Tabs
Modal
Skeleton
EmptyState
```

Rules:

- UI components must not know about Partner Domain business fields.
- UI components accept generic props.
- Business components stay inside `features/`.
- Do not create `components/CompanyCard.tsx` globally until at least two features need the same exact component and ownership is clear.

Avoid a giant global components folder. If a component says something specific about companies, investing, trust, forensics, or money, it probably belongs in a feature.

## 4. API Layer Design

Structure:

```text
src/api/
  partner-api.ts
  partner-api.types.ts
  api-error.ts
```

Responsibilities:

- Own HTTP requests to the Partner Intelligence API.
- Decode success and error responses.
- Normalize API errors into frontend-friendly messages.
- Return Partner Domain objects only.

Initial API:

```text
getPartnerCompany(ticker, filingDate?)
```

Rules:

- Do not expose raw artifact paths to feature components.
- Do not fetch `themes.json`, topic evolution reports, or quarter change reports from the frontend.
- Do not duplicate Partner Domain interfaces in feature folders.
- Add a batch endpoint only when Home or Portfolio performance requires it.

Error handling:

- `Ticker not found`: show a clear not-found state.
- `Filing not found`: show latest available company context or an unavailable filing message.
- `Internal server error`: show retry affordance without technical details.

## 5. Constants Strategy

Structure:

```text
src/constants/
  routes.ts
  local-storage.ts
  feature-flags.ts
```

`routes.ts` owns route paths:

```ts
HOME_ROUTE
EXPLORE_ROUTE
PORTFOLIO_ROUTE
LEARN_ROUTE
PROFILE_ROUTE
COMPANY_ROUTE
```

`local-storage.ts` owns persistence keys:

```ts
SAVED_COMPANIES_KEY
RECENT_COMPANIES_KEY
USER_PREFERENCES_KEY
PARTNER_JOURNAL_KEY
```

`feature-flags.ts` owns frontend-only feature gates:

```ts
ENABLE_ASSISTANT
ENABLE_NOTIFICATIONS
ENABLE_COMPARISON
```

Rules:

- Route paths should not be duplicated across screens.
- LocalStorage keys should not be hardcoded inside hooks.
- Feature flags should not be scattered through feature files as string literals.
- Constants must not import from features, hooks, or components.

## 6. Lib Strategy

Structure:

```text
src/lib/
  storage/
  formatting/
  dates/
  validation/
```

Examples:

```text
formatCurrency()
formatPercentage()
safeParseJson()
storageVersionCheck()
isValidTicker()
```

Ownership rules:

- `lib/` contains pure reusable utilities only.
- No React imports.
- No JSX.
- No component rendering.
- No API calls.
- No LocalStorage key ownership. Keys live in `constants/local-storage.ts`.
- No Partner API request logic. API calls live in `api/`.

Expected usage:

- Hooks can use `lib/storage`.
- API client can use `lib/validation`.
- Features can use `lib/formatting` and `lib/dates`.
- UI components can use formatting utilities only when they remain generic.

## 7. Hook Strategy

Structure:

```text
src/hooks/
  usePartnerCompany
  useSavedCompanies
  useRecentCompanies
  useUserPreferences
  usePartnerJournal
  useLocalStorageState
```

Ownership:

`usePartnerCompany`: API state for one company aggregate.

`useSavedCompanies`: saved tickers and portfolio membership.

`useRecentCompanies`: recently viewed ticker history.

`useUserPreferences`: learning level, theme preference, dismissed education.

`usePartnerJournal`: local company notes keyed by ticker.

`useLocalStorageState`: low-level persistence primitive used by other hooks.

Rules:

- Hooks own persistence mechanics.
- Features own presentation.
- API hooks should not write LocalStorage except through explicit product hooks.
- LocalStorage hooks should not call the API.
- LocalStorage hooks must import keys from `src/constants/local-storage.ts`.
- Hooks should use `src/lib/storage/` for safe parsing and version checks.

## 8. LocalStorage Design

Keys:

```text
partner.savedCompanies
partner.recentCompanies
partner.preferences
partner.journalDrafts
```

The actual string values must be centralized in:

```text
src/constants/local-storage.ts
```

All LocalStorage values should be versioned:

```json
{
  "version": 1,
  "data": {}
}
```

Suggested shapes:

```ts
type SavedCompaniesStorage = {
  version: 1;
  data: {
    tickers: string[];
  };
};

type RecentCompaniesStorage = {
  version: 1;
  data: {
    tickers: string[];
  };
};

type PreferencesStorage = {
  version: 1;
  data: {
    learningLevel: "beginner" | "comfortable";
    colorTheme: "system" | "light" | "dark";
    dismissedCards: string[];
  };
};

type JournalDraftsStorage = {
  version: 1;
  data: Record<string, string>;
};
```

Migration strategy:

- Every hook reads `version`.
- Unknown versions fall back safely.
- Future migrations should be centralized near the hook that owns the key.
- JSON parsing should go through `src/lib/storage/safe-parse-json`.
- Version checks should go through `src/lib/storage/storage-version-check`.

## 9. Type Ownership

Structure:

```text
src/types/
  partner-domain.types.ts
  ui.types.ts
```

Rules:

- Partner Domain types are shared across features.
- Feature-specific UI state types live beside the feature.
- API response types live in `src/api/`.
- Do not copy backend interfaces manually in multiple places.
- If generated API types are introduced later, they should become the source of truth.

Feature type examples:

```text
features/company/company.types.ts
features/profile/profile.types.ts
```

Feature types should not leak into unrelated features.

## 10. Layout Architecture

Structure:

```text
src/layouts/
  AppLayout
  BottomNav
  PageContainer
```

`AppLayout`:

- Owns app shell.
- Places `BottomNav`.
- Handles safe-area padding.
- Defines the mobile-first app frame.

`BottomNav`:

- Owns primary mobile navigation.
- Routes to Home, Explore, Portfolio, Learn, Profile.
- Uses clear labels and familiar icons.

`PageContainer`:

- Provides consistent page width, spacing, and responsive constraints.
- Prevents screens from inventing their own outer layout rules.

Mobile behavior:

- Bottom nav fixed to the safe area.
- Content gets bottom padding so nav does not cover controls.
- Company detail tabs should remain reachable without horizontal precision.

Desktop behavior:

- Center content with max-width.
- Allow wider company detail layouts later.
- Do not create a separate desktop-only architecture.

## 11. Testing Strategy

Future structure:

```text
tests/
  unit/
    hooks/
    api/
    components/

  integration/
    routes/
    company-detail/
```

Component tests:

- UI primitives render expected states.
- Feature components render Partner Domain data without internal fields.
- Empty/loading/error states are visible.

Hook tests:

- LocalStorage hooks read/write versioned data.
- API hooks handle loading, success, and error states.
- Journal and saved company hooks do not mutate unrelated keys.

Route tests:

- `/company/:ticker` loads company detail.
- bad ticker shows not-found state.
- bottom nav routes correctly.

API client tests:

- `getPartnerCompany` calls the correct endpoint.
- standardized API errors map to product messages.
- no raw intelligence endpoints are called.

Lib and constants tests:

- formatting utilities are deterministic.
- storage helpers safely handle invalid JSON and unknown versions.
- ticker validation accepts supported ticker shapes and rejects malformed input.
- route constants match router paths.
- LocalStorage hooks use centralized keys.

## 12. Future Scalability

### AI Assistant

Add as:

```text
features/assistant/
```

The assistant should consume Partner Domain data first. It should not directly fetch raw filings or intelligence artifacts.

### Watchlists

Start inside `portfolio/` with `useSavedCompanies`. If watchlists become multi-list or account-backed, add:

```text
features/watchlists/
```

### Notifications

Add as:

```text
features/notifications/
```

Notification state should be separate from Portfolio. Triggers should remain business-oriented, not trading-oriented.

### Multi-Company Comparison

Add as:

```text
features/comparison/
```

Comparison should consume Partner Domain summaries, not internal topic IDs.

### Authentication

Add auth wiring under:

```text
app/providers
features/profile
api/auth-api.ts
```

LocalStorage hooks should be replaceable by account-backed persistence later.

## Dependency Flow

Preferred dependency direction:

```text
Routes
  -> Features
  -> Hooks
  -> API
  -> Partner Intelligence API

Features
  -> components/ui
  -> layouts
  -> types
  -> lib
  -> constants

Hooks
  -> lib
  -> constants

API
  -> lib
  -> constants
```

Disallowed dependency direction:

```text
components/ui -> features
api -> features
hooks -> routes
features/home -> features/company internals
lib -> React
lib -> api
lib -> features
constants -> features
constants -> hooks
```

## Anti-Patterns To Avoid

- God components that own fetching, persistence, layout, and rendering.
- A global business components folder with every company-specific component.
- Feature leakage, such as Explore importing Company tab internals.
- Duplicate Partner Domain types across features.
- Frontend calls to raw intelligence artifacts.
- Storing API responses in LocalStorage without versioning or invalidation.
- Price-trading language in component names or user-facing text.
- Styling each screen independently instead of using layout and UI primitives.
- Utility functions defined inside React components.
- Random constants inside feature files.
- LocalStorage keys hardcoded in hooks.
- Route paths duplicated across screens.
- Feature flags embedded as magic strings.

## Recommendations

1. Keep routes thin.
2. Keep business components inside feature folders.
3. Keep `components/ui` boring and generic.
4. Use hooks to own persistence and API state.
5. Treat `PartnerCompanyIntelligence` as the only company intelligence contract.
6. Add frontend contract tests before building many screens.
7. Delay global state management until actual cross-feature complexity appears.
8. Preserve the product philosophy in naming: partner, business, story, trust, money, forensics.
9. Put reusable pure functions in `src/lib/` before they spread across components.
10. Put route paths, storage keys, and feature flags in `src/constants/` from the first UI implementation.
