# Web Source Layout

This app follows a route-first shell with feature-owned business modules.

- `app/`: Next App Router entries only. Keep route files, layouts, route handlers, and app-level providers here.
- `app/_providers/`: Client providers mounted by the root layout.
- `features/`: Business capabilities. Each feature owns its UI, model state, API hooks, and test fixtures.
- `features/*/components/`: Feature-specific presentational and workflow components.
- `features/*/model/`: Feature-owned state, TanStack Query hooks, selectors, and mutations.
- `features/*/testing/`: Reusable fixtures and helpers for tests in that feature.
- `shared/`: Cross-feature infrastructure such as BFF clients, common test utilities, and generic adapters.

Server/API data belongs in TanStack Query hooks under `model/`. Local UI selections, filters, and modal/session UI state belong in Zustand stores under `model/`. Route files should import feature public APIs from each feature barrel instead of reaching into component internals.

## Runtime Boundary

The web app talks to backend services only from server-side route handlers or server components. Client components call relative Next APIs such as `/api/dashboard`, `/api/settings`, and `/api/checkout/:id/settle`.

Backend selection is controlled by `API_BASE_URL`:

- `dev:mock` sets `API_BASE_URL=http://localhost:8790` and `NEXT_PUBLIC_API_MODE=mock`.
- normal dev/production must set `API_BASE_URL` to the Spring Boot API.
- missing `API_BASE_URL` is a configuration error.

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
  -> route handler
  -> shared/api backend fetch helper
  -> API_BASE_URL backend
```

This keeps credentials, backend hostnames, and future Spring Boot migration concerns out of browser code.

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
- Client rendering failures are caught by `app/_providers/error-boundary.tsx`.
