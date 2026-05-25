CREATE TABLE merchants (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    plan VARCHAR(32) NOT NULL,
    terminal_health INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE store_tables (
    id VARCHAR(32) PRIMARY KEY,
    merchant_id VARCHAR(64) NOT NULL REFERENCES merchants(id),
    zone VARCHAR(64) NOT NULL,
    seats INTEGER NOT NULL,
    status VARCHAR(32) NOT NULL,
    customer_no VARCHAR(64),
    opened_at VARCHAR(16),
    last_action VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE orders (
    id VARCHAR(64) PRIMARY KEY,
    merchant_id VARCHAR(64) NOT NULL REFERENCES merchants(id),
    table_id VARCHAR(32),
    guests INTEGER NOT NULL,
    status VARCHAR(32) NOT NULL,
    amount INTEGER NOT NULL,
    opened_at VARCHAR(16) NOT NULL,
    eta_minutes INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sort_order INTEGER NOT NULL
);

CREATE TABLE checkouts (
    id VARCHAR(64) PRIMARY KEY,
    merchant_id VARCHAR(64) NOT NULL REFERENCES merchants(id),
    order_id VARCHAR(64),
    table_id VARCHAR(32),
    customer_no VARCHAR(64) NOT NULL,
    subtotal INTEGER NOT NULL,
    tax INTEGER NOT NULL,
    discount INTEGER NOT NULL,
    total INTEGER NOT NULL,
    method VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL,
    requested_at VARCHAR(16) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE payment_transactions (
    id VARCHAR(64) PRIMARY KEY,
    merchant_id VARCHAR(64) NOT NULL REFERENCES merchants(id),
    checkout_id VARCHAR(64),
    order_id VARCHAR(64),
    method VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL,
    amount INTEGER NOT NULL,
    brand VARCHAR(64) NOT NULL,
    captured_at VARCHAR(16) NOT NULL,
    risk_score INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE store_settings (
    merchant_id VARCHAR(64) PRIMARY KEY REFERENCES merchants(id),
    language VARCHAR(32) NOT NULL,
    currency VARCHAR(64) NOT NULL,
    approval_limit VARCHAR(128) NOT NULL,
    notifications JSONB NOT NULL,
    discount_rules JSONB NOT NULL,
    review_rules JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE outbox_events (
    id UUID PRIMARY KEY,
    aggregate_type VARCHAR(64) NOT NULL,
    aggregate_id VARCHAR(64) NOT NULL,
    event_type VARCHAR(128) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    published_at TIMESTAMPTZ
);

CREATE INDEX idx_store_tables_merchant_status ON store_tables(merchant_id, status);
CREATE INDEX idx_orders_merchant_status ON orders(merchant_id, status);
CREATE INDEX idx_checkouts_merchant_status ON checkouts(merchant_id, status);
CREATE INDEX idx_transactions_merchant_created ON payment_transactions(merchant_id, created_at);
CREATE INDEX idx_outbox_status_created ON outbox_events(status, created_at);
