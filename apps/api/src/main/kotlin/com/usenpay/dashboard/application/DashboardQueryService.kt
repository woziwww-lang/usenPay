package com.usenpay.dashboard.application

import com.usenpay.dashboard.domain.DashboardView
import com.usenpay.infrastructure.store.InMemoryOperationsStore
import org.springframework.stereotype.Service

@Service
class DashboardQueryService(
    private val store: InMemoryOperationsStore,
) {
    fun getDashboard(): DashboardView = store.dashboard()
}
