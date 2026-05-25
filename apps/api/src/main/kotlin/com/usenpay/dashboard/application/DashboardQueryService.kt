package com.usenpay.dashboard.application

import com.usenpay.dashboard.domain.DashboardView
import com.usenpay.infrastructure.store.OperationsStore
import org.springframework.stereotype.Service

@Service
class DashboardQueryService(
    private val store: OperationsStore,
) {
    fun getDashboard(): DashboardView = store.dashboard()
}
