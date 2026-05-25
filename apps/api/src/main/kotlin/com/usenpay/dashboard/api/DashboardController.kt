package com.usenpay.dashboard.api

import com.usenpay.dashboard.application.DashboardQueryService
import com.usenpay.dashboard.domain.DashboardView
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

@RestController
class DashboardController(
    private val dashboardQueryService: DashboardQueryService,
) {
    @GetMapping("/dashboard")
    fun dashboard(): DashboardView = dashboardQueryService.getDashboard()
}
