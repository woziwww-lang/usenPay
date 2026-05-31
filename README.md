# USEN PAY Operations

Restaurant POS and merchant operations console for table status, checkout, payment monitoring, and store administration.

The app now has three runnable backend modes: the Spring Boot API in local-memory mode, the Spring Boot API backed by PostgreSQL/Flyway, and the Hono mock API used for frontend-only work. The BFF is the default app entrypoint for local full-stack development.

## Tech Stack

- Package manager and workspace: `pnpm`, `pnpm-workspace.yaml`
- Monorepo orchestration: Turborepo
- Web app: React 19 SPA, Vite, React Router, TypeScript
- Styling: Tailwind CSS v4, shared theme tokens in `apps/web/src/app/globals.css`
- API boundary: browser calls `/api/*`, Vite/local edge proxy routes to BFF/mock/Spring
- BFF: Hono on Node, `apps/bff`
- Backend API: Kotlin Spring Boot, Java 21, Flyway, JDBC/PostgreSQL adapter
- Mock API: Hono on Node, `apps/mock-server`
- Server/API state: TanStack Query
- UI/session state: Zustand
- Runtime validation/contracts: Zod in `packages/domain`
- Shared UI primitives: `packages/ui`
- Unit tests: Vitest
- E2E tests: Playwright
- Formatting/linting: Biome

## Workspace Layout

```txt
apps/
  web/             React + Vite frontend SPA
  api/             Kotlin Spring Boot backend service
  mock-server/     Stateful mock API used by mock development mode
  bff/             Hono BFF for local app aggregation and fallback data
packages/
  domain/          Zod contracts, shared types, fixtures, metrics
  ui/              Shared React dashboard primitives
  config/          Shared TypeScript configuration
```

## Quick Start

Install dependencies:

```bash
pnpm install
```

Run the default local app:

```bash
pnpm dev:app
```

This starts:

- BFF: `http://localhost:8787`
- Web: `http://localhost:3000`

The web app calls relative `/api/*` routes. In local development, Vite proxies those requests to the BFF. The BFF can serve local fallback data by itself, or proxy to Spring Boot when `CORE_API_BASE_URL` is configured in the BFF environment.

## Runtime Modes

### Default App: Web + BFF

```bash
pnpm dev:app
```

Use this for normal frontend/product work. It does not require Docker or PostgreSQL.

### Spring Boot API: Local Memory

```bash
pnpm dev:api
```

This runs Spring Boot on `http://localhost:8080` with the default `local-memory` profile. It uses an in-memory operations store and does not require PostgreSQL, Redis, or RabbitMQ.

Health check:

```bash
curl http://localhost:8080/actuator/health
```

To point the web app directly at Spring Boot:

```bash
VITE_API_MODE=spring pnpm dev:web
```

### Spring Boot API: PostgreSQL/Flyway

Start PostgreSQL:

```bash
cd apps/api
docker compose up -d postgres
```

Run the API with the database profile:

```bash
pnpm dev:api:db
```

This uses `SPRING_PROFILES_ACTIVE=local-db`, applies Flyway migrations, and uses the JDBC `OperationsStore` implementation. Redis and RabbitMQ health indicators are disabled by default in this profile so PostgreSQL-only local validation stays healthy.

Stop the local PostgreSQL container when finished:

```bash
cd apps/api
docker compose stop postgres
```

### Mock Web + Mock API

```bash
pnpm dev:mock:all
```

This starts:

- Mock API: `http://localhost:8790`
- Web: `http://localhost:3000`

The dashboard header shows the active data source so accidental mock/API confusion is visible.

### Production Build

Production must route `/api/*` to the BFF/API boundary and provide explicit environment variables for the API.

```bash
pnpm --filter @usen-pay/web build
pnpm --filter @usen-pay/web preview
```

For the Spring Boot API, use `SPRING_PROFILES_ACTIVE=prod` with database credentials. See `apps/api/README.md`.

## Backend API

The Spring Boot service lives in `apps/api` and exposes the same HTTP contract consumed by the web app and BFF:

```txt
GET    /dashboard
POST   /auth/login
GET    /settings
PATCH  /settings
POST   /checkout/{checkoutId}/settle
POST   /checkout/{checkoutId}/split
POST   /checkout/{checkoutId}/discount
POST   /checkout/{checkoutId}/receipt
GET    /actuator/health
```

Persistence is selected by Spring profile:

- `local-memory`: in-memory `OperationsStore`, default for `pnpm dev:api`
- `local-db`: JDBC/PostgreSQL `OperationsStore`, Flyway migrations, `pnpm dev:api:db`
- `prod`: JDBC/PostgreSQL `OperationsStore` with explicit environment variables

Keep payloads aligned with `packages/domain/src/contracts.ts`. Update Zod contracts first when changing API shapes, then update Spring DTOs and frontend query/mutation types.

## Web Architecture

`apps/web/src` follows a route shell plus feature modules:

```txt
app/
  _providers/      App-level providers, error boundary, query client
  app/             SPA shell, React Router, providers, error boundary
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
  api/             Browser API client, proxy-mode helpers, error normalization
  auth/            Manager session store, login mutation, permission gate
  config/          Routes and server environment helpers
  model/           Cross-feature stores such as toast messages
  test/            Shared test rendering helpers
  ui/              Cross-feature UI such as toast viewport
```

Route files should import feature public APIs from feature `index.ts` files. Feature internals should stay inside the feature folder unless they are deliberately promoted to `shared`.

## Data Flow

Initial dashboard render:

```txt
Browser request
  -> React Router route `/` or `/dashboard`
  -> useDashboardQuery()
  -> /api/dashboard
  -> Vite/local edge proxy
  -> Zod validation via dashboardViewSchema
  -> DashboardClient initialDashboard prop
```

After hydration, dashboard server state is owned by TanStack Query:

```txt
DashboardClient
  -> useDashboardQuery(initialDashboard)
  -> GET /api/dashboard
  -> Vite/local edge proxy
  -> BFF/mock/Spring /dashboard
  -> Zod validation
  -> query cache update
```

Checkout actions go through the shared API client and invalidate the dashboard query on success:

```txt
Checkout button
  -> permission check in auth store
  -> useCheckoutActionMutation()
  -> POST /api/checkout/:checkoutId/:action
  -> Vite/local edge proxy
  -> BFF/mock/Spring /checkout/:checkoutId/:action
  -> mutation success toast
  -> invalidate dashboard query
```

Supported actions:

- `POST /api/checkout/:checkoutId/settle`
- `POST /api/checkout/:checkoutId/split`
- `POST /api/checkout/:checkoutId/discount`
- `POST /api/checkout/:checkoutId/receipt`

## MyPage Settings Flow

```txt
MyPage route
  -> PermissionGate checks `settings:write`
  -> useStoreSettingsQuery()
  -> GET /api/settings
  -> Vite/local edge proxy
  -> BFF/mock/Spring /settings
  -> settings form state
  -> Save settings
  -> PATCH /api/settings
  -> success toast
```

MyPage routes:

- `/mypage/security`
- `/mypage/language`
- `/mypage/currency`
- `/mypage/discounts`
- `/mypage/reviews`
- `/mypage/notifications`
- `/mypage/payments`

## State Management Policy

Use TanStack Query for server/API state:

- Dashboard data
- Store settings
- Checkout mutations
- Future Spring Boot resources

Use Zustand for UI/session state:

- Current selected table
- Order status filter
- Manager session and permissions
- Toast messages
- Local UI state that should not be fetched from the backend

Do not copy API lists into Zustand. If the data comes from Spring Boot, BFF, or mock API, keep it in TanStack Query.

## Permissions

Mock/local users:

- `owner.meguro`: all permissions
- `manager.meguro`: checkout, discount, settings, receipt
- `cashier.meguro`: checkout and receipt only

Permissions enforced in the UI:

- `checkout:settle`
- `checkout:discount`
- `receipt:issue`
- `settings:write`

The manager session is persisted in browser `localStorage` by the auth Zustand store. Tests use an in-memory storage fallback.

## Commands

Install:

```bash
pnpm install
```

Local app:

```bash
pnpm dev:app
```

Individual services:

```bash
pnpm dev:web
pnpm dev:bff
pnpm dev:api
pnpm dev:api:db
pnpm dev:mock
pnpm dev:mock:all
```

Checks and tests:

```bash
pnpm lint
pnpm check
pnpm check:api
pnpm test
pnpm test:e2e
```

Builds:

```bash
pnpm build
pnpm build:api
pnpm build:all
```

Playwright browsers must be installed locally before E2E tests can run:

```bash
pnpm exec playwright install
```

## Local Middleware

From `apps/api`:

```bash
docker compose up -d postgres
```

Optional services:

```bash
docker compose up -d redis rabbitmq
```

Ports:

- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- RabbitMQ AMQP: `localhost:5672`
- RabbitMQ management UI: `http://localhost:15672`

## References

- `apps/api/README.md`
- `docs/adr/0001-api-service-architecture.md`
