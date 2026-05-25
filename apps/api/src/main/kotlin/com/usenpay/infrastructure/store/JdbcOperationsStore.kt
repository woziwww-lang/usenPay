package com.usenpay.infrastructure.store

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.usenpay.dashboard.domain.Checkout
import com.usenpay.dashboard.domain.DashboardView
import com.usenpay.dashboard.domain.Merchant
import com.usenpay.dashboard.domain.OpsInsight
import com.usenpay.dashboard.domain.Order
import com.usenpay.dashboard.domain.StoreTable
import com.usenpay.dashboard.domain.Transaction
import com.usenpay.dashboard.domain.VisitorPoint
import com.usenpay.settings.domain.DiscountRule
import com.usenpay.settings.domain.ReviewRule
import com.usenpay.settings.domain.StoreSettings
import java.sql.ResultSet
import java.time.Instant
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import org.springframework.context.annotation.Profile
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional

@Component
@Profile("local-db", "prod")
class JdbcOperationsStore(
    private val jdbc: JdbcTemplate,
    private val objectMapper: ObjectMapper,
) : OperationsStore {
    override fun dashboard(): DashboardView {
        val merchant = merchant()

        return DashboardView(
            merchant = merchant,
            orders = orders(merchant.id),
            tables = tables(merchant.id),
            checkouts = checkouts(merchant.id),
            transactions = transactions(merchant.id),
            visitors = visitors(merchant.id),
            insights = buildInsights(),
            generatedAt = Instant.now().toString(),
        )
    }

    override fun settings(): StoreSettings {
        val merchantId = merchant().id
        return jdbc.queryForObject(
            """
            SELECT language, currency, approval_limit, notifications, discount_rules, review_rules
            FROM store_settings
            WHERE merchant_id = ?
            """.trimIndent(),
            { rs, _ -> rs.toStoreSettings() },
            merchantId,
        ) ?: error("Store settings not found")
    }

    @Transactional
    override fun updateSettings(nextSettings: StoreSettings): StoreSettings {
        val merchantId = merchant().id
        jdbc.update(
            """
            INSERT INTO store_settings (
                merchant_id, language, currency, approval_limit, notifications, discount_rules, review_rules, updated_at
            )
            VALUES (?, ?, ?, ?, ?::jsonb, ?::jsonb, ?::jsonb, now())
            ON CONFLICT (merchant_id) DO UPDATE SET
                language = EXCLUDED.language,
                currency = EXCLUDED.currency,
                approval_limit = EXCLUDED.approval_limit,
                notifications = EXCLUDED.notifications,
                discount_rules = EXCLUDED.discount_rules,
                review_rules = EXCLUDED.review_rules,
                updated_at = now()
            """.trimIndent(),
            merchantId,
            nextSettings.language,
            nextSettings.currency,
            nextSettings.approvalLimit,
            objectMapper.writeValueAsString(nextSettings.notifications),
            objectMapper.writeValueAsString(nextSettings.discountRules),
            objectMapper.writeValueAsString(nextSettings.reviewRules),
        )

        return settings()
    }

    override fun findCheckout(checkoutId: String): Checkout? =
        jdbc
            .query(
                """
                SELECT id, table_id, customer_no, subtotal, tax, discount, total, method, status, requested_at
                FROM checkouts
                WHERE id = ?
                """.trimIndent(),
                { rs, _ -> rs.toCheckout() },
                checkoutId,
            ).firstOrNull()

    @Transactional
    override fun settle(checkoutId: String): Checkout {
        val checkout = findCheckout(checkoutId) ?: error("Checkout not found")
        if (checkout.status == "paid") {
            return checkout
        }

        jdbc.update(
            """
            UPDATE checkouts
            SET status = 'paid', updated_at = now()
            WHERE id = ?
            """.trimIndent(),
            checkoutId,
        )
        jdbc.update(
            """
            UPDATE orders
            SET status = 'paid', updated_at = now()
            WHERE table_id = ? OR id = (
                SELECT order_id FROM checkouts WHERE id = ?
            )
            """.trimIndent(),
            checkout.table,
            checkoutId,
        )
        jdbc.update(
            """
            UPDATE store_tables
            SET status = 'cleaning',
                amount = 0,
                customer_no = NULL,
                order_id = NULL,
                last_action = 'Payment settled',
                updated_at = now()
            WHERE id = ?
            """.trimIndent(),
            checkout.table,
        )
        jdbc.update(
            """
            INSERT INTO payment_transactions (
                id, merchant_id, checkout_id, order_id, method, status, amount, brand, captured_at, risk_score
            )
            SELECT ?, merchant_id, id, order_id, method, 'settled', total,
                   CASE WHEN method = 'card' THEN 'Visa' ELSE method END,
                   ?, 6
            FROM checkouts
            WHERE id = ?
            """.trimIndent(),
            "PAY-${System.currentTimeMillis().toString().takeLast(5)}",
            LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm")),
            checkoutId,
        )

        return findCheckout(checkoutId) ?: error("Checkout not found")
    }

    @Transactional
    override fun discount(
        checkoutId: String,
        amount: Int,
    ): Checkout {
        val checkout = findCheckout(checkoutId) ?: error("Checkout not found")
        val normalizedAmount = amount.coerceAtLeast(0)
        val nextDiscount = checkout.discount + normalizedAmount
        val nextTotal = (checkout.subtotal + checkout.tax - nextDiscount).coerceAtLeast(0)

        jdbc.update(
            """
            UPDATE checkouts
            SET discount = ?, total = ?, updated_at = now()
            WHERE id = ?
            """.trimIndent(),
            nextDiscount,
            nextTotal,
            checkoutId,
        )
        jdbc.update(
            """
            UPDATE store_tables
            SET amount = ?, last_action = 'Discount applied', updated_at = now()
            WHERE id = ?
            """.trimIndent(),
            nextTotal,
            checkout.table,
        )

        return findCheckout(checkoutId) ?: error("Checkout not found")
    }

    private fun merchant(): Merchant =
        jdbc.queryForObject(
            """
            SELECT id, name, plan, terminal_health, today_sales, yesterday_sales,
                   active_tables, queue_length, visitor_count
            FROM merchants
            ORDER BY created_at ASC
            LIMIT 1
            """.trimIndent(),
        ) { rs, _ ->
            Merchant(
                id = rs.getString("id"),
                name = rs.getString("name"),
                plan = rs.getString("plan"),
                terminalHealth = rs.getInt("terminal_health"),
                todaySales = rs.getInt("today_sales"),
                yesterdaySales = rs.getInt("yesterday_sales"),
                activeTables = rs.getInt("active_tables"),
                queueLength = rs.getInt("queue_length"),
                visitorCount = rs.getInt("visitor_count"),
            )
        } ?: error("Merchant not found")

    private fun orders(merchantId: String): List<Order> =
        jdbc.query(
            """
            SELECT id, table_id, guests, status, amount, opened_at, eta_minutes
            FROM orders
            WHERE merchant_id = ?
            ORDER BY opened_at ASC, id ASC
            """.trimIndent(),
            { rs, _ ->
                val orderId = rs.getString("id")
                Order(
                    id = orderId,
                    table = rs.getString("table_id"),
                    guests = rs.getInt("guests"),
                    items = orderItems(orderId),
                    status = rs.getString("status"),
                    amount = rs.getInt("amount"),
                    openedAt = rs.getString("opened_at"),
                    etaMinutes = rs.getInt("eta_minutes"),
                )
            },
            merchantId,
        )

    private fun orderItems(orderId: String): List<String> =
        jdbc.queryForList(
            """
            SELECT name
            FROM order_items
            WHERE order_id = ?
            ORDER BY sort_order ASC
            """.trimIndent(),
            String::class.java,
            orderId,
        )

    private fun tables(merchantId: String): List<StoreTable> =
        jdbc.query(
            """
            SELECT id, zone, seats, status, customer_no, order_id, amount, opened_at, last_action
            FROM store_tables
            WHERE merchant_id = ?
            ORDER BY id ASC
            """.trimIndent(),
            { rs, _ -> rs.toStoreTable() },
            merchantId,
        )

    private fun checkouts(merchantId: String): List<Checkout> =
        jdbc.query(
            """
            SELECT id, table_id, customer_no, subtotal, tax, discount, total, method, status, requested_at
            FROM checkouts
            WHERE merchant_id = ?
            ORDER BY requested_at ASC, id ASC
            """.trimIndent(),
            { rs, _ -> rs.toCheckout() },
            merchantId,
        )

    private fun transactions(merchantId: String): List<Transaction> =
        jdbc.query(
            """
            SELECT id, COALESCE(order_id, checkout_id) AS order_ref, method, status, amount, brand, captured_at, risk_score
            FROM payment_transactions
            WHERE merchant_id = ?
            ORDER BY created_at DESC, id DESC
            """.trimIndent(),
            { rs, _ ->
                Transaction(
                    id = rs.getString("id"),
                    orderId = rs.getString("order_ref"),
                    method = rs.getString("method"),
                    status = rs.getString("status"),
                    amount = rs.getInt("amount"),
                    brand = rs.getString("brand"),
                    capturedAt = rs.getString("captured_at"),
                    riskScore = rs.getInt("risk_score"),
                )
            },
            merchantId,
        )

    private fun visitors(merchantId: String): List<VisitorPoint> =
        jdbc.query(
            """
            SELECT time_label, visitors, seats, checkout_wait
            FROM visitor_points
            WHERE merchant_id = ?
            ORDER BY sort_order ASC
            """.trimIndent(),
            { rs, _ ->
                VisitorPoint(
                    time = rs.getString("time_label"),
                    visitors = rs.getInt("visitors"),
                    seats = rs.getInt("seats"),
                    checkoutWait = rs.getInt("checkout_wait"),
                )
            },
            merchantId,
        )

    private fun ResultSet.toCheckout(): Checkout =
        Checkout(
            id = getString("id"),
            table = getString("table_id") ?: "TAKEOUT",
            customerNo = getString("customer_no"),
            subtotal = getInt("subtotal"),
            tax = getInt("tax"),
            discount = getInt("discount"),
            total = getInt("total"),
            method = getString("method"),
            status = getString("status"),
            requestedAt = getString("requested_at"),
        )

    private fun ResultSet.toStoreTable(): StoreTable =
        StoreTable(
            id = getString("id"),
            zone = getString("zone"),
            seats = getInt("seats"),
            status = getString("status"),
            customerNo = getString("customer_no"),
            orderId = getString("order_id"),
            amount = getInt("amount"),
            openedAt = getString("opened_at"),
            lastAction = getString("last_action"),
        )

    private fun ResultSet.toStoreSettings(): StoreSettings =
        StoreSettings(
            language = getString("language"),
            currency = getString("currency"),
            approvalLimit = getString("approval_limit"),
            notifications = objectMapper.readValue(getString("notifications")),
            discountRules = objectMapper.readValue<List<DiscountRule>>(getString("discount_rules")),
            reviewRules = objectMapper.readValue<List<ReviewRule>>(getString("review_rules")),
        )

    private fun buildInsights(): List<OpsInsight> =
        listOf(
            OpsInsight("payment-risk", "critical", "Payment retry needed", "1件の決済失敗があります。端末・ブランド別の再試行導線を確認してください。"),
            OpsInsight("kitchen-latency", "warning", "Kitchen queue is heating up", "1件の注文が10分超の待ち時間です。キッチン優先度を調整してください。"),
            OpsInsight("visitor-peak", "info", "Visitor peak window", "12:00 が客流ピークです。会計待ち 7 分を基準にレジ人員を調整できます。"),
        )
}
