package com.usenpay.checkout.application

import com.usenpay.common.error.ApiException
import com.usenpay.dashboard.domain.Checkout
import com.usenpay.infrastructure.event.CheckoutEvent
import com.usenpay.infrastructure.event.DomainEventPublisher
import com.usenpay.infrastructure.store.OperationsStore
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service

data class SplitResult(
    val checkout: Checkout,
    val parts: Int,
    val splitAmount: Int,
)

data class ReceiptResult(
    val receiptNo: String,
    val checkoutId: String,
    val table: String,
    val total: Int,
    val issuedAt: String,
)

@Service
class CheckoutService(
    private val store: OperationsStore,
    private val eventPublisher: DomainEventPublisher,
) {
    fun settle(checkoutId: String): Checkout {
        val checkout = runCatching { store.settle(checkoutId) }.getOrElse { throw notFound() }
        eventPublisher.publish(CheckoutEvent("checkout.settled", checkoutId, mapOf("total" to checkout.total)))
        return checkout
    }

    fun split(
        checkoutId: String,
        parts: Int,
    ): SplitResult {
        val checkout = store.findCheckout(checkoutId) ?: throw notFound()
        val normalizedParts = parts.coerceAtLeast(2)
        eventPublisher.publish(CheckoutEvent("checkout.split_requested", checkoutId, mapOf("parts" to normalizedParts)))
        return SplitResult(
            checkout = checkout,
            parts = normalizedParts,
            splitAmount = (checkout.total + normalizedParts - 1) / normalizedParts,
        )
    }

    fun discount(
        checkoutId: String,
        amount: Int,
    ): Checkout {
        val normalizedAmount = amount.coerceAtLeast(0)
        val checkout = runCatching { store.discount(checkoutId, normalizedAmount) }.getOrElse { throw notFound() }
        eventPublisher.publish(CheckoutEvent("checkout.discount_applied", checkoutId, mapOf("amount" to normalizedAmount)))
        return checkout
    }

    fun receipt(checkoutId: String): ReceiptResult {
        val checkout = store.findCheckout(checkoutId) ?: throw notFound()
        val receipt =
            ReceiptResult(
                receiptNo = "RCT-${System.currentTimeMillis().toString().takeLast(6)}",
                checkoutId = checkoutId,
                table = checkout.table,
                total = checkout.total,
                issuedAt = java.time.Instant.now().toString(),
            )
        eventPublisher.publish(CheckoutEvent("receipt.issued", checkoutId, mapOf("receiptNo" to receipt.receiptNo)))
        return receipt
    }

    private fun notFound(): ApiException = ApiException(HttpStatus.NOT_FOUND, "Checkout not found")
}
