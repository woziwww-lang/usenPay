package com.usenpay.infrastructure.store

import com.usenpay.dashboard.domain.Checkout
import com.usenpay.dashboard.domain.DashboardView
import com.usenpay.settings.domain.StoreSettings

interface OperationsStore {
    fun dashboard(): DashboardView

    fun settings(): StoreSettings

    fun updateSettings(nextSettings: StoreSettings): StoreSettings

    fun findCheckout(checkoutId: String): Checkout?

    fun settle(checkoutId: String): Checkout

    fun discount(
        checkoutId: String,
        amount: Int,
    ): Checkout
}
