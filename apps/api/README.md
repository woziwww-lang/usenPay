# USEN PAY API

Kotlin Spring Boot backend for the USEN PAY restaurant operations console.

The service supports both fast local development and PostgreSQL-backed validation. The default profile is `local-memory`; `local-db` and `prod` use the JDBC/PostgreSQL operations store and Flyway migrations.

## Stack

- Kotlin
- Spring Boot
- Spring Web
- Spring Validation
- Spring Actuator
- Spring JDBC
- Flyway
- PostgreSQL
- Spring Data Redis dependency for future cache/session/idempotency integration
- Spring AMQP dependency for future RabbitMQ event integration
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
    store/           OperationsStore plus memory and JDBC adapters
    event/           logging publisher, future RabbitMQ/outbox integration
  common/
    error/           global error model and exception handler
    web/             shared web response helpers
  config/            cross-cutting Spring configuration
src/main/resources
  db/migration/      Flyway schema and seed migrations
```

## API Contract

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

Frontend integration:

```bash
API_BASE_URL=http://localhost:8080 pnpm dev:web
```

Default app integration through the BFF:

```bash
pnpm dev:app
```

## Prerequisites

- JDK 21
- Docker, only when running PostgreSQL/Redis/RabbitMQ locally

You do not need to install Gradle globally. Use the committed Gradle Wrapper or the root `pnpm` scripts, which set `JAVA_HOME` to `/opt/homebrew/opt/openjdk@21` when `JAVA_HOME` is not already set.

## Run

Default local memory mode:

```bash
pnpm dev:api
```

Equivalent direct command:

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
cd ../..
pnpm dev:api:db
```

`pnpm dev:api:db` runs with `SPRING_PROFILES_ACTIVE=local-db`. It applies Flyway migrations and uses the JDBC `OperationsStore` adapter. Redis and RabbitMQ health indicators are disabled by default for this profile.

Stop PostgreSQL when finished:

```bash
cd apps/api
docker compose stop postgres
```

## Profiles

- `local-memory`: default profile, excludes datasource/JPA/Flyway auto-configuration, uses `InMemoryOperationsStore`.
- `local-db`: local PostgreSQL profile, runs Flyway migrations and uses `JdbcOperationsStore`.
- `prod`: production PostgreSQL profile, uses explicit environment variables.

Production environment variables:

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

## Checks and Build

From the repo root:

```bash
pnpm check:api
pnpm build:api
```

From `apps/api` directly:

```bash
./gradlew test
./gradlew build
```

## Architecture Rules

- Controllers only translate HTTP DTOs to use-case calls.
- Application services own orchestration and transaction-facing use cases.
- Domain models keep business vocabulary independent from persistence.
- Infrastructure adapters own DB, Redis, RabbitMQ, and third-party details.
- `OperationsStore` is the current persistence boundary for dashboard, checkout, auth seed users, and settings.
- Checkout settlement must stay strongly consistent and DB-transactional in JDBC/prod profiles.
- RabbitMQ is for async side effects after checkout success, not for core transaction consistency.
- Redis is for cache, idempotency keys, locks, and session-related hot data, not the source of truth.
- PostgreSQL is the source of truth for `local-db` and `prod`.

## Persistence Notes

- Flyway migrations live under `src/main/resources/db/migration`.
- `V1__init_core_schema.sql` creates the core schema.
- `V2__seed_pos_demo_data.sql` seeds the local POS demo data and fills dashboard metrics used by the UI.
- `InMemoryOperationsStore` is active only in `local-memory`.
- `JdbcOperationsStore` is active in `local-db` and `prod`.

Next persistence work should add focused integration tests around Flyway, checkout settlement idempotency, and settings updates against PostgreSQL.
