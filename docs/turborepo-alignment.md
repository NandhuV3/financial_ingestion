# TurboRepo Alignment

## Purpose

Partner Investing is currently a single repository with backend intelligence, Partner Domain builders, and a Fastify Partner Intelligence API. Before React UI implementation begins, the frontend architecture should be aligned with the long-term TurboRepo direction.

This document is design-only. It does not create TurboRepo files, scaffold apps, move backend code, or generate UI.

## Recommended TurboRepo Structure

Future target:

```text
turbo/
  apps/
    partner-web/
    partner-api/

  packages/
    ui/
    partner-domain/
    api-client/
    shared-types/

  turbo.json
  pnpm-workspace.yaml
```

This structure supports:

- Partner Web App
- Partner Mobile App
- Partner API
- Future AI Assistant
- Future shared design system
- Shared Partner Domain contracts

## App Ownership Map

### apps/partner-web

Owns:

```text
React
Vite
React Router
Tailwind
Screens
Features
Layouts
Hooks
LocalStorage persistence
```

Contains:

```text
Home
Explore
Company
Portfolio
Learn
Profile
```

Responsibilities:

- Render Partner Investing web experience.
- Consume Partner Intelligence API through `packages/api-client` when that package exists.
- Own web-specific routing, layout, LocalStorage hooks, and feature composition.

Boundaries:

- No shared business logic.
- No raw intelligence artifact consumption.
- No direct imports from another app.
- No backend orchestration logic.

### apps/partner-api

Owns:

```text
Fastify
Partner Intelligence API
API routes
API orchestration
Runtime configuration
```

Consumes:

```text
packages/partner-domain
packages/shared-types
```

Responsibilities:

- Expose read-only Partner Intelligence API.
- Compose Partner Domain builders and source artifacts.
- Return frontend-safe Partner Domain payloads.

Boundaries:

- Does not render UI.
- Does not import from `apps/partner-web`.
- Does not expose raw internal intelligence artifacts to clients.

## Package Ownership Map

### packages/ui

Future shared UI system.

Owns:

```text
Button
Card
Badge
Modal
Tabs
Typography
Skeleton
```

Reusable by:

```text
partner-web
partner-mobile
```

Rules:

- UI primitives only.
- No feature components.
- No Partner Investing business logic.
- No API calls.
- No route awareness.

### packages/partner-domain

Future home for:

```text
Partner Domain types
Partner Domain contracts
Business Health models
Partner Intelligence aggregates
Partner Domain builders
```

Goal:

Single source of truth for Partner Domain models and transformations.

Reusable by:

```text
partner-api
partner-web
partner-mobile
partner-assistant
```

Rules:

- No React.
- No Fastify.
- No browser-only APIs.
- No raw SEC ingestion behavior.

### packages/api-client

Future shared API client.

Owns:

```text
getPartnerCompany()
getPortfolio()
standard API error mapping
request helpers
```

Reusable by:

```text
partner-web
partner-mobile
partner-assistant
```

Rules:

- Consumes Partner Intelligence API only.
- Does not know about backend file storage.
- Does not expose raw intelligence artifacts.

### packages/shared-types

Future shared cross-application types.

Examples:

```text
API request types
API response types
utility types
shared identifiers
```

Goal:

Avoid duplicate request and response interfaces across apps and packages.

Rules:

- Types only unless a utility is truly cross-platform and stable.
- Prefer moving stable types here after repeated usage proves they are shared.
- Do not turn this into a dumping ground.

## Migration Strategy

### Phase 6.x

Keep the frontend implementation inside:

```text
apps/partner-web
```

During early UI work, the app can keep these folders locally:

```text
apps/partner-web/src/
  app/
  routes/
  features/
  components/
  api/
  hooks/
  layouts/
  lib/
  constants/
  types/
```

Do not extract packages yet.

Reason:

- Feature boundaries are still being discovered.
- UI primitives are not stable.
- API client behavior may change as frontend needs become clear.
- Premature packages create friction and false stability.

### Future Package Extraction

Move only stable assets into packages:

```text
packages/ui
packages/partner-domain
packages/api-client
packages/shared-types
```

Extraction order recommendation:

1. `shared-types`: only after web and API both need the same stable type.
2. `partner-domain`: once Partner Domain builders/types are stable and needed by multiple apps.
3. `api-client`: once web/mobile/assistant need the same API access.
4. `ui`: once shared primitives have stabilized through real screens.

Do not move feature code into packages.

## Dependency Rules

Allowed dependency flow:

```text
apps
  -> packages

apps/partner-web
  -> packages/ui
  -> packages/api-client
  -> packages/partner-domain
  -> packages/shared-types

apps/partner-api
  -> packages/partner-domain
  -> packages/shared-types
```

Disallowed dependency flow:

```text
packages -> apps
app -> app imports
packages/ui -> packages/api-client
packages/ui -> partner-domain business logic
features -> other app internals
partner-web -> partner-api source files
```

Package rules:

- Packages must not import from apps.
- Apps must communicate through API contracts, not source imports.
- Shared packages should be stable, small, and intentionally owned.
- Avoid circular dependencies between packages.

## Future Platform Support

### partner-mobile

Can be added later as:

```text
apps/partner-mobile
```

Expected dependencies:

```text
packages/api-client
packages/partner-domain
packages/shared-types
packages/ui or mobile-specific UI package
```

The mobile app should reuse Partner Domain contracts but may need platform-specific UI primitives.

### partner-assistant

Can be added later as:

```text
apps/partner-assistant
```

or:

```text
packages/assistant-core
```

depending on whether it is a deployable runtime or shared logic.

It should consume Partner Domain data first, not raw filings.

### Watchlists

Initial implementation can live in:

```text
apps/partner-web/src/features/portfolio
```

If watchlists become account-backed and used across web/mobile, move stable request/response types to `packages/shared-types` and client functions to `packages/api-client`.

### Notifications

Initial UI can live in:

```text
apps/partner-web/src/features/notifications
```

Notification delivery services should be app/backend owned, not part of `packages/ui`.

### Authentication

Initial frontend auth integration can live in:

```text
apps/partner-web/src/app/providers
apps/partner-web/src/features/profile
```

Shared auth request types can later move to `packages/shared-types`. Avoid putting auth UI into `packages/ui` unless it becomes generic.

### Multi-Company Comparison

Initial implementation should live in:

```text
apps/partner-web/src/features/comparison
```

Comparison should consume Partner Domain summaries, not internal topic IDs.

## Anti-Patterns To Avoid

- Moving feature code into shared packages too early.
- Creating packages for every feature.
- Cross-app imports.
- Duplicating Partner Domain types across apps.
- Putting API calls in `packages/ui`.
- Putting web-only LocalStorage behavior into cross-platform packages.
- Creating a `packages/common` dumping ground.
- Extracting UI primitives before real screen usage proves the abstraction.
- Sharing backend internals with frontend apps through source imports.

## Risks

1. Premature package extraction can slow product iteration.
2. A shared UI package can become overgeneralized before product patterns stabilize.
3. `shared-types` can become a dumping ground if ownership is weak.
4. Direct app-to-app imports can bypass API boundaries and create hidden coupling.
5. Moving Partner Domain too early could freeze models before the product language matures.

## Recommendation

Phase 6.1 can be implemented immediately inside:

```text
apps/partner-web
```

without meaningful future rework if these rules are followed:

- Keep feature code local to `apps/partner-web/src/features`.
- Keep reusable primitives in `apps/partner-web/src/components/ui` until stable.
- Keep API access behind `apps/partner-web/src/api`.
- Keep Partner Domain types centralized in `apps/partner-web/src/types` or imported from a future package.
- Do not consume raw intelligence artifacts.
- Do not extract packages until two or more apps need the same stable code.

This gives the frontend a clear path to TurboRepo without forcing the team to pay monorepo abstraction costs before the product surface is proven.
