package com.usenpay.infrastructure.store

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
import java.time.Instant
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.util.concurrent.locks.ReentrantReadWriteLock
import kotlin.concurrent.read
import kotlin.concurrent.write
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Component

@Component
@Profile("local-memory")
class InMemoryOperationsStore : OperationsStore {
    private val lock = ReentrantReadWriteLock()

    private val merchant =
        Merchant(
            id = "m_1007",
            name = "MEGURO KITCHEN LAB",
            plan = "Growth",
            terminalHealth = 98,
            todaySales = 742800,
            yesterdaySales = 681400,
            activeTables = 18,
            queueLength = 7,
            visitorCount = 386,
        )

    private val orders =
        mutableListOf(
            Order("ORD-1048", "A12", 4, listOf("Seasonal lunch set", "Iced coffee", "Kids plate"), "cooking", 8420, "11:42", 8),
            Order("ORD-1049", "B03", 2, listOf("USEN burger", "Craft cola"), "ready", 3960, "11:49", 0),
            Order("ORD-1050", "C07", 3, listOf("Pasta set", "Dessert plate", "Hot tea"), "served", 6210, "12:02", 0),
            Order("ORD-1051", "TAKEOUT", 1, listOf("Salad bowl", "Sparkling water"), "new", 1780, "12:06", 12),
        )

    private val tables =
        mutableListOf(
            StoreTable("A01", "Main", 2, "available", null, null, 0, null, "Sanitized 3 min ago"),
            StoreTable("A12", "Main", 4, "ordering", "G-238", "ORD-1048", 8420, "11:42", "追加注文 2 min ago"),
            StoreTable("B03", "Window", 2, "checkout", "G-241", "ORD-1049", 3960, "11:49", "会計呼出中"),
            StoreTable("B08", "Window", 4, "reserved", "R-119", null, 0, "12:30", "Reservation hold"),
            StoreTable("C07", "Terrace", 6, "seated", "G-245", "ORD-1050", 6210, "12:02", "Water served"),
            StoreTable("C11", "Terrace", 2, "cleaning", null, null, 0, null, "Clear down"),
        )

    private val checkouts =
        mutableListOf(
            Checkout("CHK-5103", "B03", "G-241", 3600, 360, 0, 3960, "qr", "ready", "12:08"),
            Checkout("CHK-5104", "A12", "G-238", 7900, 790, 270, 8420, "card", "processing", "12:10"),
            Checkout("CHK-5105", "TAKEOUT", "T-078", 1650, 165, 35, 1780, "cash", "draft", "12:12"),
        )

    private val transactions =
        mutableListOf(
            Transaction("PAY-92031", "ORD-1045", "card", "settled", 12890, "Visa", "12:01", 8),
            Transaction("PAY-92032", "ORD-1047", "qr", "authorized", 5840, "PayPay", "12:04", 12),
            Transaction("PAY-92033", "ORD-1048", "transport", "failed", 8420, "Suica", "12:07", 61),
            Transaction("PAY-92034", "ORD-1044", "card", "refunding", 2190, "Mastercard", "12:09", 24),
        )

    private val visitors =
        listOf(
            VisitorPoint("09:00", 28, 12, 1),
            VisitorPoint("10:00", 46, 18, 2),
            VisitorPoint("11:00", 89, 41, 4),
            VisitorPoint("12:00", 137, 62, 7),
            VisitorPoint("13:00", 96, 48, 5),
            VisitorPoint("14:00", 54, 21, 2),
        )

    private var settings =
        StoreSettings(
            language = "日本語",
            currency = "JPY - Japanese Yen",
            approvalLimit = "Discounts over 15%",
            notifications =
                mapOf(
                    "Payment failures" to true,
                    "Review below 3 stars" to true,
                    "Cash drawer variance" to true,
                ),
            discountRules =
                listOf(
                    DiscountRule("Lunch repeat coupon", "Weekday 11:00-14:00", "5%"),
                    DiscountRule("Student QR campaign", "QR payment", "8%"),
                    DiscountRule("Staff approval limit", "Manual discount", "15%"),
                ),
            reviewRules =
                listOf(
                    ReviewRule("Google Business", "Auto request after settled payment", "4.6"),
                    ReviewRule("In-store survey", "Show QR on receipt", "4.3"),
                    ReviewRule("Complaint routing", "Manager notification enabled", "SLA 15m"),
                ),
        )

    override fun dashboard(): DashboardView =
        lock.read {
            DashboardView(
                merchant = merchant,
                orders = orders.map { it.copy() },
                tables = tables.map { it.copy() },
                checkouts = checkouts.map { it.copy() },
                transactions = transactions.map { it.copy() },
                visitors = visitors,
                insights = buildInsights(),
                generatedAt = Instant.now().toString(),
            )
        }

    override fun settings(): StoreSettings = lock.read { settings }

    override fun updateSettings(nextSettings: StoreSettings): StoreSettings =
        lock.write {
            settings = nextSettings
            settings
        }

    override fun findCheckout(checkoutId: String): Checkout? = lock.read { checkouts.firstOrNull { it.id == checkoutId }?.copy() }

    override fun settle(checkoutId: String): Checkout =
        lock.write {
            val checkout = checkouts.firstOrNull { it.id == checkoutId } ?: error("Checkout not found")
            checkout.status = "paid"
            orders.filter { it.table == checkout.table }.forEach { it.status = "paid" }
            tables.firstOrNull { it.id == checkout.table }?.apply {
                status = "cleaning"
                amount = 0
                customerNo = null
                orderId = null
                lastAction = "Payment settled"
            }
            transactions.add(
                0,
                Transaction(
                    id = "PAY-${System.currentTimeMillis().toString().takeLast(5)}",
                    orderId = checkout.id,
                    method = checkout.method,
                    status = "settled",
                    amount = checkout.total,
                    brand = if (checkout.method == "card") "Visa" else checkout.method,
                    capturedAt = LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm")),
                    riskScore = 6,
                ),
            )
            checkout.copy()
        }

    override fun discount(
        checkoutId: String,
        amount: Int,
    ): Checkout =
        lock.write {
            val checkout = checkouts.firstOrNull { it.id == checkoutId } ?: error("Checkout not found")
            checkout.discount += amount
            checkout.total = (checkout.subtotal + checkout.tax - checkout.discount).coerceAtLeast(0)
            tables.firstOrNull { it.id == checkout.table }?.apply {
                this.amount = checkout.total
                lastAction = "Discount applied"
            }
            checkout.copy()
        }

    private fun buildInsights(): List<OpsInsight> =
        listOf(
            OpsInsight("payment-risk", "critical", "Payment retry needed", "1件の決済失敗があります。端末・ブランド別の再試行導線を確認してください。"),
            OpsInsight("kitchen-latency", "warning", "Kitchen queue is heating up", "1件の注文が10分超の待ち時間です。キッチン優先度を調整してください。"),
            OpsInsight("visitor-peak", "info", "Visitor peak window", "12:00 が客流ピークです。会計待ち 7 分を基準にレジ人員を調整できます。"),
        )
}
