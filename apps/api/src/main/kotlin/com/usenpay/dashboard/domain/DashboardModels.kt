package com.usenpay.dashboard.domain

data class Merchant(
    val id: String,
    val name: String,
    val plan: String,
    val terminalHealth: Int,
    val todaySales: Int,
    val yesterdaySales: Int,
    val activeTables: Int,
    val queueLength: Int,
    val visitorCount: Int,
)

data class Order(
    val id: String,
    val table: String,
    val guests: Int,
    val items: List<String>,
    var status: String,
    val amount: Int,
    val openedAt: String,
    val etaMinutes: Int,
)

data class StoreTable(
    val id: String,
    val zone: String,
    val seats: Int,
    var status: String,
    var customerNo: String?,
    var orderId: String?,
    var amount: Int,
    var openedAt: String?,
    var lastAction: String,
)

data class Checkout(
    val id: String,
    val table: String,
    val customerNo: String,
    val subtotal: Int,
    val tax: Int,
    var discount: Int,
    var total: Int,
    val method: String,
    var status: String,
    val requestedAt: String,
)

data class Transaction(
    val id: String,
    val orderId: String,
    val method: String,
    val status: String,
    val amount: Int,
    val brand: String,
    val capturedAt: String,
    val riskScore: Int,
)

data class VisitorPoint(
    val time: String,
    val visitors: Int,
    val seats: Int,
    val checkoutWait: Int,
)

data class OpsInsight(
    val id: String,
    val severity: String,
    val title: String,
    val description: String,
)

data class DashboardView(
    val merchant: Merchant,
    val orders: List<Order>,
    val tables: List<StoreTable>,
    val checkouts: List<Checkout>,
    val transactions: List<Transaction>,
    val visitors: List<VisitorPoint>,
    val insights: List<OpsInsight>,
    val generatedAt: String,
)
