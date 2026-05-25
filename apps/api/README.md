# USEN PAY API

Kotlin Spring Boot backend for the USEN PAY restaurant operations console.

This service is scaffolded as the future production backend that will replace `apps/mock-server`. It defaults to an in-memory infrastructure adapter so frontend integration can switch from mock API to Spring Boot before PostgreSQL schemas are finalized. Use the `local-db` or `prod` Spring profile when validating PostgreSQL/Flyway wiring.

## Stack

- Kotlin
- Spring Boot
- Spring Web
- Spring Validation
- Spring Actuator
- Spring Data Redis dependency for cache/session/idempotency integration
- Spring AMQP dependency for RabbitMQ event integration
- Gradle Kotlin DSL
- Java 21 toolchain

## Module Layout

```txt
src/main/kotlin/com/usenpay
  ApiApplication.kt
  auth/
    api/             controllers and DTOs
    application/     use cases
    domain/          role and permission model
  checkout/
    api/
    application/
    domain/
  dashboard/
    api/
    application/
    domain/
  settings/
    api/
    application/
    domain/
  infrastructure/
    store/           current in-memory adapter, later DB repositories
    event/           current logging publisher, later RabbitMQ/outbox
  common/
    error/           global error model and exception handler
    web/             shared web response helpers
  config/            cross-cutting Spring configuration
```

## API Contract

The initial contract matches the mock server and the Next.js API proxy:

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

Frontend integration:

```bash
API_BASE_URL=http://localhost:8080 pnpm dev:web
```

Mock integration remains:

```bash
pnpm dev:mock:all
```

## Prerequisites

- JDK 21
- Docker, only when running PostgreSQL/Redis/RabbitMQ locally

You do not need to install Gradle globally. Use the committed Gradle Wrapper.

## Run

Default local memory mode:

```bash
cd apps/api
./gradlew bootRun
```

Service port:

```txt
http://localhost:8080
```

Health:

```bash
curl http://localhost:8080/actuator/health
```

Local PostgreSQL/Flyway mode:

```bash
cd apps/api
docker compose up -d postgres
SPRING_PROFILES_ACTIVE=local-db ./gradlew bootRun
```

Production mode requires explicit environment variables:

```bash
SPRING_PROFILES_ACTIVE=prod
DATABASE_URL=jdbc:postgresql://...
DATABASE_USERNAME=...
DATABASE_PASSWORD=...
REDIS_HOST=...
RABBITMQ_HOST=...
RABBITMQ_USERNAME=...
RABBITMQ_PASSWORD=...
```

## Local Middleware

```bash
cd apps/api
docker compose up -d
```

Ports:

- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- RabbitMQ AMQP: `localhost:5672`
- RabbitMQ management UI: `http://localhost:15672`

## Architecture Rules

- Controllers only translate HTTP DTOs to use-case calls.
- Application services own transaction boundaries and orchestration.
- Domain models keep business vocabulary independent from persistence.
- Infrastructure adapters own DB, Redis, RabbitMQ, and third-party details.
- Checkout settlement must be strongly consistent and DB-transactional when persistence is added.
- RabbitMQ is for async side effects after checkout success, not for core transaction consistency.
- Redis is for cache, idempotency keys, locks, and session-related hot data, not the source of truth.
- PostgreSQL will be the source of truth.

## Future Persistence Plan

1. Replace `InMemoryOperationsStore` with repository interfaces and PostgreSQL adapters.
2. Add JPA entities that map to the Flyway schema under `src/main/resources/db/migration`.
3. Publish RabbitMQ messages through an outbox worker after DB commit.
4. Add Redis cache for dashboard aggregation with explicit invalidation after checkout/settings mutations.
