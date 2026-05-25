package com.usenpay.checkout.api

import com.usenpay.checkout.application.CheckoutService
import com.usenpay.checkout.application.ReceiptResult
import com.usenpay.checkout.application.SplitResult
import com.usenpay.dashboard.domain.Checkout
import jakarta.validation.Valid
import jakarta.validation.constraints.Min
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RestController

data class SplitRequest(
    @field:Min(2) val parts: Int = 2,
)

data class DiscountRequest(
    @field:Min(0) val amount: Int = 500,
)

data class CheckoutMutationResponse(
    val checkout: Checkout,
    val message: String,
)

data class SplitCheckoutResponse(
    val checkout: Checkout,
    val parts: Int,
    val splitAmount: Int,
    val message: String,
)

data class ReceiptResponse(
    val receipt: ReceiptResult,
    val message: String,
)

@RestController
class CheckoutController(
    private val checkoutService: CheckoutService,
) {
    @PostMapping("/checkout/{checkoutId}/settle")
    fun settle(
        @PathVariable checkoutId: String,
    ): CheckoutMutationResponse =
        CheckoutMutationResponse(
            checkout = checkoutService.settle(checkoutId),
            message = "Checkout $checkoutId settled",
        )

    @PostMapping("/checkout/{checkoutId}/split")
    fun split(
        @PathVariable checkoutId: String,
        @Valid @RequestBody request: SplitRequest,
    ): SplitCheckoutResponse = checkoutService.split(checkoutId, request.parts).toResponse()

    @PostMapping("/checkout/{checkoutId}/discount")
    fun discount(
        @PathVariable checkoutId: String,
        @Valid @RequestBody request: DiscountRequest,
    ): CheckoutMutationResponse =
        CheckoutMutationResponse(
            checkout = checkoutService.discount(checkoutId, request.amount),
            message = "Discount applied to $checkoutId",
        )

    @PostMapping("/checkout/{checkoutId}/receipt")
    fun receipt(
        @PathVariable checkoutId: String,
    ): ReceiptResponse {
        val receipt = checkoutService.receipt(checkoutId)
        return ReceiptResponse(
            receipt = receipt,
            message = "Receipt ${receipt.receiptNo} issued",
        )
    }
}

private fun SplitResult.toResponse() =
    SplitCheckoutResponse(
        checkout = checkout,
        parts = parts,
        splitAmount = splitAmount,
        message = "Split into $parts payments",
    )
