# USEN PAY Operations

Restaurant POS and merchant operations console for table status, checkout, payment monitoring, and store administration.

The current backend is a Hono mock API so frontend workflows can be tested before the Spring Boot service and database are implemented. The web app is already structured so that replacing the mock API with Spring Boot is an environment/configuration change plus contract alignment, not a UI rewrite.

## Tech Stack

- Package manager and workspace: `pnpm`, `pnpm-workspace.yaml`
- Monorepo orchestration: Turborepo
- Web app: Next.js App Router, React 19, TypeScript
- Styling: Tailwind CSS v4, shared theme tokens in `apps/web/src/app/globals.css`
- API proxy layer: Next Route Handlers under `apps/web/src/app/api`
- Mock API: Hono on Node, `apps/mock-server`
- BFF prototype: Hono on Node, `apps/bff`
- Server/API state: TanStack Query
- UI/session state: Zustand
- Runtime validation/contracts: Zod in `packages/domain`
- Shared UI primitives: `packages/ui`
- Icons: `lucide-react`
- Unit tests: Vitest
- E2E tests: Playwright
- Formatting/linting: Biome

## Workspace Layout

```txt
apps/
  web/             Next.js frontend and API proxy routes
  api/             Kotlin Spring Boot backend service
  mock-server/     Stateful mock API used by mock development mode
  bff/             Hono BFF prototype for future aggregation logic
packages/
  domain/          Zod contracts, shared types, fixtures, metrics
  ui/              Shared React dashboard primitives
  config/          Shared TypeScript configuration
```

## Web Architecture

`apps/web/src` follows a route shell plus feature modules:

```txt
app/
  _providers/      App-level providers, error boundary, query client
  api/             Next Route Handlers that proxy backend APIs
  dashboard/       Dashboard route alias
  mypage/          Store administration routes
features/
  merchant-dashboard/
    components/    POS dashboard components
    model/         TanStack Query hooks, mutations, Zustand UI store
    testing/       Feature fixtures
  admin-mypage/
    model/         Settings query and save mutation
shared/
  api/             Server-side backend fetch helpers
  auth/            Manager session store, login mutation, permission gate
  config/          Routes and server environment helpers
  model/           Cross-feature stores such as toast messages
  test/            Shared test rendering helpers
  ui/              Cross-feature UI such as toast viewport
```

Route files should import feature public APIs from feature `index.ts` files. Feature internals should stay inside the feature folder unless they are deliberately promoted to `shared`.

## Runtime Modes

The web app never silently falls back to mock APIs. Backend selection is explicit.

### Mock Web + Mock API

Use this while Spring Boot is not implemented:

```bash
pnpm dev:mock:all
```

This starts:

- Mock API: `http://localhost:8790`
- Web: `http://localhost:3000`

The web script sets:

```bash
API_BASE_URL=http://localhost:8790
NEXT_PUBLIC_API_MODE=mock
```

The dashboard header shows `Mock API` so the active data source is visible.

### Web Against Real API

Use this when the Spring Boot API exists:

```bash
API_BASE_URL=http://localhost:8080 pnpm dev:web
```

The dashboard header shows `Spring API`.

### Production

Production must provide `API_BASE_URL`.

```bash
API_BASE_URL=https://api.example.com pnpm --filter @usen-pay/web build
API_BASE_URL=https://api.example.com pnpm --filter @usen-pay/web start
```

If `API_BASE_URL` is missing, server-side API calls fail fast with a clear error. This prevents accidentally shipping mock data.

## Data Flow

### Initial Dashboard Render

```txt
Browser request
  -> Next Server Component route `/` or `/dashboard`
  -> getDashboardView()
  -> API_BASE_URL /dashboard
  -> Zod validation via dashboardViewSchema
  -> DashboardClient initialDashboard prop
```

The first screen gets validated server data. This keeps store identity, KPI values, table status, and checkout queue available at first paint.

### Client Refresh and API State

After hydration, dashboard server state is owned by TanStack Query:

```txt
DashboardClient
  -> useDashboardQuery(initialDashboard)
  -> GET /api/dashboard
  -> Next Route Handler
  -> API_BASE_URL /dashboard
  -> Zod validation
  -> query cache update
```

`useDashboardQuery` uses `initialData` from SSR and refetches every 10 seconds. API data such as orders, tables, checkouts, transactions, visitors, and insights should stay in TanStack Query rather than Zustand.

### Checkout Mutations

Checkout buttons call real mock endpoints through Next Route Handlers:

```txt
Settle / Split / Discount / Receipt button
  -> permission check in auth store
  -> useCheckoutActionMutation()
  -> POST /api/checkout/:checkoutId/:action
  -> Next Route Handler
  -> API_BASE_URL /checkout/:checkoutId/:action
  -> mock server mutates in-memory dashboard
  -> mutation success toast
  -> invalidate dashboard query
  -> dashboard refreshes
```

Supported actions:

- `POST /api/checkout/:checkoutId/settle`
- `POST /api/checkout/:checkoutId/split`
- `POST /api/checkout/:checkoutId/discount`
- `POST /api/checkout/:checkoutId/receipt`

### MyPage Settings Flow

```txt
MyPage route
  -> PermissionGate checks `settings:write`
  -> useStoreSettingsQuery()
  -> GET /api/settings
  -> Next Route Handler
  -> API_BASE_URL /settings
  -> settings form state
  -> Save settings
  -> PATCH /api/settings
  -> success toast
```

MyPage sections are real routes:

- `/mypage/security`
- `/mypage/language`
- `/mypage/currency`
- `/mypage/discounts`
- `/mypage/reviews`
- `/mypage/notifications`
- `/mypage/payments`

The left menu uses links, not placeholder buttons.

## State Management Policy

### TanStack Query

Use for server/API state:

- Dashboard data
- Store settings
- Checkout mutations
- Future Spring Boot resources

TanStack Query owns loading, error, cache, refetch, invalidation, and mutation lifecycle.

### Zustand

Use for UI/session state:

- Current selected table
- Order status filter
- Manager session and permissions
- Toast messages
- Local UI state that should not be fetched from the backend

Do not copy API lists into Zustand. If the data comes from Spring Boot or mock API, keep it in TanStack Query.

## Permissions

Mock users:

- `owner.meguro`: all permissions
- `manager.meguro`: checkout, discount, settings, receipt
- `cashier.meguro`: checkout and receipt only

Permissions are enforced in the UI before actions run:

- `checkout:settle`
- `checkout:discount`
- `receipt:issue`
- `settings:write`

The manager session is persisted in browser `localStorage` by the auth Zustand store. Tests use an in-memory storage fallback.

## Feedback and Error Handling

- Success and error messages use the global toast viewport.
- Toasts automatically dismiss after a short delay.
- TanStack Query mutation errors are captured by the global query client and shown as error toasts.
- A global React error boundary catches render-time client errors and shows a recoverable fallback.
- Server API configuration fails fast when `API_BASE_URL` is missing.

## Mock API

Run mock API only:

```bash
pnpm dev:mock
```

Mock API port:

```txt
http://localhost:8790
```

Endpoints:

- `GET /health`
- `GET /scenarios`
- `GET /dashboard`
- `GET /dashboard?scenario=payment-failure`
- `GET /dashboard/quiet-hours`
- `POST /auth/login`
- `GET /settings`
- `PATCH /settings`
- `POST /checkout/:checkoutId/settle`
- `POST /checkout/:checkoutId/split`
- `POST /checkout/:checkoutId/discount`
- `POST /checkout/:checkoutId/receipt`

The mock server stores mutable dashboard and settings state in memory. Restarting the mock server resets data.

## Spring Boot API

The Kotlin Spring Boot service lives in `apps/api`.

Run it with:

```bash
cd apps/api
./gradlew bootRun
```

Then point the web app to it:

```bash
API_BASE_URL=http://localhost:8080 pnpm dev:web
```

It implements the same resource semantics as the mock server:

```txt
GET    /dashboard
POST   /auth/login
GET    /settings
PATCH  /settings
POST   /checkout/{checkoutId}/settle
POST   /checkout/{checkoutId}/split
POST   /checkout/{checkoutId}/discount
POST   /checkout/{checkoutId}/receipt
```

Recommended backend layering:

```txt
Controller
  -> Application service
  -> Domain service
  -> Repository
  -> Database
```

Keep payloads aligned with `packages/domain/src/contracts.ts`. During integration, update or add Zod schemas first, then adjust Spring DTOs and frontend query/mutation types.

Local middleware for the backend:

```bash
cd apps/api
docker compose up -d
```

See [apps/api/README.md](apps/api/README.md) and [docs/adr/0001-api-service-architecture.md](docs/adr/0001-api-service-architecture.md).

## Commands

Install:

```bash
pnpm install
```

Mock development:

```bash
pnpm dev:mock:all
```

Real API development:

```bash
API_BASE_URL=http://localhost:8080 pnpm dev:web
```

Type checks:

```bash
pnpm --filter @usen-pay/web check
pnpm --filter @usen-pay/mock-server check
pnpm --filter @usen-pay/domain check
```

Unit tests:

```bash
pnpm --filter @usen-pay/web test
pnpm --filter @usen-pay/domain test
```

Build:

```bash
API_BASE_URL=http://localhost:8080 pnpm --filter @usen-pay/web build
```

E2E:

```bash
pnpm test:e2e
```

Playwright browsers must be installed locally before E2E tests can run:

```bash
pnpm exec playwright install
```
