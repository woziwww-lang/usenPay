ALTER TABLE merchants
    ADD COLUMN IF NOT EXISTS today_sales INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS yesterday_sales INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS active_tables INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS queue_length INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS visitor_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE store_tables
    ADD COLUMN IF NOT EXISTS order_id VARCHAR(64),
    ADD COLUMN IF NOT EXISTS amount INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS visitor_points (
    id BIGSERIAL PRIMARY KEY,
    merchant_id VARCHAR(64) NOT NULL REFERENCES merchants(id),
    time_label VARCHAR(16) NOT NULL,
    visitors INTEGER NOT NULL,
    seats INTEGER NOT NULL,
    checkout_wait INTEGER NOT NULL,
    sort_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO merchants (
    id, name, plan, terminal_health, today_sales, yesterday_sales, active_tables, queue_length, visitor_count
)
VALUES ('m_1007', 'MEGURO KITCHEN LAB', 'Growth', 98, 742800, 681400, 18, 7, 386)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    plan = EXCLUDED.plan,
    terminal_health = EXCLUDED.terminal_health,
    today_sales = EXCLUDED.today_sales,
    yesterday_sales = EXCLUDED.yesterday_sales,
    active_tables = EXCLUDED.active_tables,
    queue_length = EXCLUDED.queue_length,
    visitor_count = EXCLUDED.visitor_count,
    updated_at = now();

INSERT INTO store_tables (
    id, merchant_id, zone, seats, status, customer_no, order_id, amount, opened_at, last_action
)
VALUES
    ('A01', 'm_1007', 'Main', 2, 'available', NULL, NULL, 0, NULL, 'Sanitized 3 min ago'),
    ('A12', 'm_1007', 'Main', 4, 'ordering', 'G-238', 'ORD-1048', 8420, '11:42', '追加注文 2 min ago'),
    ('B03', 'm_1007', 'Window', 2, 'checkout', 'G-241', 'ORD-1049', 3960, '11:49', '会計呼出中'),
    ('B08', 'm_1007', 'Window', 4, 'reserved', 'R-119', NULL, 0, '12:30', 'Reservation hold'),
    ('C07', 'm_1007', 'Terrace', 6, 'seated', 'G-245', 'ORD-1050', 6210, '12:02', 'Water served'),
    ('C11', 'm_1007', 'Terrace', 2, 'cleaning', NULL, NULL, 0, NULL, 'Clear down')
ON CONFLICT (id) DO UPDATE SET
    zone = EXCLUDED.zone,
    seats = EXCLUDED.seats,
    status = EXCLUDED.status,
    customer_no = EXCLUDED.customer_no,
    order_id = EXCLUDED.order_id,
    amount = EXCLUDED.amount,
    opened_at = EXCLUDED.opened_at,
    last_action = EXCLUDED.last_action,
    updated_at = now();

INSERT INTO orders (id, merchant_id, table_id, guests, status, amount, opened_at, eta_minutes)
VALUES
    ('ORD-1048', 'm_1007', 'A12', 4, 'cooking', 8420, '11:42', 8),
    ('ORD-1049', 'm_1007', 'B03', 2, 'ready', 3960, '11:49', 0),
    ('ORD-1050', 'm_1007', 'C07', 3, 'served', 6210, '12:02', 0),
    ('ORD-1051', 'm_1007', 'TAKEOUT', 1, 'new', 1780, '12:06', 12)
ON CONFLICT (id) DO UPDATE SET
    table_id = EXCLUDED.table_id,
    guests = EXCLUDED.guests,
    status = EXCLUDED.status,
    amount = EXCLUDED.amount,
    opened_at = EXCLUDED.opened_at,
    eta_minutes = EXCLUDED.eta_minutes,
    updated_at = now();

DELETE FROM order_items WHERE order_id IN ('ORD-1048', 'ORD-1049', 'ORD-1050', 'ORD-1051');
INSERT INTO order_items (order_id, name, sort_order)
VALUES
    ('ORD-1048', 'Seasonal lunch set', 1),
    ('ORD-1048', 'Iced coffee', 2),
    ('ORD-1048', 'Kids plate', 3),
    ('ORD-1049', 'USEN burger', 1),
    ('ORD-1049', 'Craft cola', 2),
    ('ORD-1050', 'Pasta set', 1),
    ('ORD-1050', 'Dessert plate', 2),
    ('ORD-1050', 'Hot tea', 3),
    ('ORD-1051', 'Salad bowl', 1),
    ('ORD-1051', 'Sparkling water', 2);

INSERT INTO checkouts (
    id, merchant_id, order_id, table_id, customer_no, subtotal, tax, discount, total, method, status, requested_at
)
VALUES
    ('CHK-5103', 'm_1007', 'ORD-1049', 'B03', 'G-241', 3600, 360, 0, 3960, 'qr', 'ready', '12:08'),
    ('CHK-5104', 'm_1007', 'ORD-1048', 'A12', 'G-238', 7900, 790, 270, 8420, 'card', 'processing', '12:10'),
    ('CHK-5105', 'm_1007', 'ORD-1051', 'TAKEOUT', 'T-078', 1650, 165, 35, 1780, 'cash', 'draft', '12:12')
ON CONFLICT (id) DO UPDATE SET
    order_id = EXCLUDED.order_id,
    table_id = EXCLUDED.table_id,
    customer_no = EXCLUDED.customer_no,
    subtotal = EXCLUDED.subtotal,
    tax = EXCLUDED.tax,
    discount = EXCLUDED.discount,
    total = EXCLUDED.total,
    method = EXCLUDED.method,
    status = EXCLUDED.status,
    requested_at = EXCLUDED.requested_at,
    updated_at = now();

INSERT INTO payment_transactions (
    id, merchant_id, checkout_id, order_id, method, status, amount, brand, captured_at, risk_score
)
VALUES
    ('PAY-92031', 'm_1007', NULL, 'ORD-1045', 'card', 'settled', 12890, 'Visa', '12:01', 8),
    ('PAY-92032', 'm_1007', NULL, 'ORD-1047', 'qr', 'authorized', 5840, 'PayPay', '12:04', 12),
    ('PAY-92033', 'm_1007', NULL, 'ORD-1048', 'transport', 'failed', 8420, 'Suica', '12:07', 61),
    ('PAY-92034', 'm_1007', NULL, 'ORD-1044', 'card', 'refunding', 2190, 'Mastercard', '12:09', 24)
ON CONFLICT (id) DO UPDATE SET
    method = EXCLUDED.method,
    status = EXCLUDED.status,
    amount = EXCLUDED.amount,
    brand = EXCLUDED.brand,
    captured_at = EXCLUDED.captured_at,
    risk_score = EXCLUDED.risk_score;

INSERT INTO store_settings (
    merchant_id, language, currency, approval_limit, notifications, discount_rules, review_rules
)
VALUES (
    'm_1007',
    '日本語',
    'JPY - Japanese Yen',
    'Discounts over 15%',
    '{"Payment failures": true, "Review below 3 stars": true, "Cash drawer variance": true}'::jsonb,
    '[{"name":"Lunch repeat coupon","target":"Weekday 11:00-14:00","value":"5%"},{"name":"Student QR campaign","target":"QR payment","value":"8%"},{"name":"Staff approval limit","target":"Manual discount","value":"15%"}]'::jsonb,
    '[{"channel":"Google Business","state":"Auto request after settled payment","score":"4.6"},{"channel":"In-store survey","state":"Show QR on receipt","score":"4.3"},{"channel":"Complaint routing","state":"Manager notification enabled","score":"SLA 15m"}]'::jsonb
)
ON CONFLICT (merchant_id) DO UPDATE SET
    language = EXCLUDED.language,
    currency = EXCLUDED.currency,
    approval_limit = EXCLUDED.approval_limit,
    notifications = EXCLUDED.notifications,
    discount_rules = EXCLUDED.discount_rules,
    review_rules = EXCLUDED.review_rules,
    updated_at = now();

DELETE FROM visitor_points WHERE merchant_id = 'm_1007';
INSERT INTO visitor_points (merchant_id, time_label, visitors, seats, checkout_wait, sort_order)
VALUES
    ('m_1007', '09:00', 28, 12, 1, 1),
    ('m_1007', '10:00', 46, 18, 2, 2),
    ('m_1007', '11:00', 89, 41, 4, 3),
    ('m_1007', '12:00', 137, 62, 7, 4),
    ('m_1007', '13:00', 96, 48, 5, 5),
    ('m_1007', '14:00', 54, 21, 2, 6);
