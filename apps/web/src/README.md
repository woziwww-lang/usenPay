# Web Source Layout

This app is a React + Vite SPA with feature-owned business modules.

- `app/`: SPA shell, React Router routes, app providers, and app-level error boundary.
- `app/_providers/`: Query provider and cross-cutting client providers.
- `features/`: Business capabilities. Each feature owns its UI, model state, API hooks, and test fixtures.
- `features/*/components/`: Feature-specific presentational and workflow components.
- `features/*/model/`: Feature-owned state, TanStack Query hooks, selectors, and mutations.
- `features/*/testing/`: Reusable fixtures and helpers for tests in that feature.
- `shared/`: Cross-feature infrastructure such as API clients, common test utilities, and generic adapters.

Server/API data belongs in TanStack Query hooks under `model/`. Local UI selections, filters, and modal/session UI state belong in Zustand stores under `model/`. Route files should import feature public APIs from each feature barrel instead of reaching into component internals.

## Runtime Boundary

The web app talks to backend services through relative SPA calls such as `/api/dashboard`, `/api/settings`, and `/api/checkout/:id/settle`.

Backend selection is controlled by Vite proxy configuration:

- default `dev` proxies `/api` to the BFF at `http://localhost:8787`.
- `dev:mock` sets `VITE_API_MODE=mock` and proxies `/api` to `http://localhost:8790`.
- `VITE_API_MODE=spring` proxies `/api` to Spring Boot at `http://localhost:8080`.
- `VITE_API_PROXY_TARGET` can override the proxy target for e2e or staging-like local tests.

Do not add mock fallback URLs inside source files. Mock mode must be explicit in scripts or environment variables.

## Data Ownership

Use TanStack Query for server state:

- dashboard payloads
- checkout actions
- settings fetch/save
- future Spring Boot resources

Use Zustand for client state:

- selected table
- order status filter
- manager session and permissions
- toast messages

Do not mirror API arrays in Zustand. Mutations should invalidate or update TanStack Query caches instead.

## API Proxy Pattern

Client component:

```txt
useMutation/useQuery
  -> /api/*
  -> Vite dev proxy or production edge/backend proxy
  -> BFF/mock/Spring backend
```

This keeps backend hostnames configurable and prevents fetch calls from being scattered through UI components.

## MyPage Routing

MyPage menu items are real routes:

- `/mypage/security`
- `/mypage/language`
- `/mypage/currency`
- `/mypage/discounts`
- `/mypage/reviews`
- `/mypage/notifications`
- `/mypage/payments`

When adding a new settings area, add a section name to `shared/config/routes.ts`, add a route-compatible panel in the feature, and keep save behavior routed through `features/admin-mypage/model/settings-query.ts`.

## Feedback and Errors

- Use `shared/model/toast-store.ts` for global popup messages.
- `shared/ui/toast-viewport.tsx` owns rendering and auto-dismiss.
- Query/mutation failures should surface through the global query client or local error states.
- Client rendering failures are caught by `app/error-boundary.tsx`.
