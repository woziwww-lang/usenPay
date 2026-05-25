# ADR 0001: Kotlin Spring Boot API Inside The Monorepo

## Status

Accepted

## Context

The frontend currently uses a Hono mock server for checkout, dashboard, authentication, and settings workflows. The production backend must be implemented with Kotlin and Spring Boot, while keeping frontend development unblocked.

## Decision

Create the backend service under `apps/api` in the existing monorepo.

The service uses a layered module layout:

```txt
api -> application -> domain -> infrastructure
```

The first implementation keeps mutable state in memory and matches the mock API contract. PostgreSQL, Redis, and RabbitMQ are included in the architecture plan and local compose file, but persistence adapters will be added in a later iteration.

## Consequences

- Frontend can switch between mock API and Spring Boot via `API_BASE_URL`.
- API contracts stay close to frontend and shared documentation.
- Mock server remains useful for isolated frontend development.
- Backend can evolve toward database-backed microservice patterns without moving repositories.

## Integration Boundary

Frontend:

```bash
API_BASE_URL=http://localhost:8080 pnpm dev:web
```

Mock:

```bash
pnpm dev:mock:all
```

No production code should silently fall back to mock endpoints.

