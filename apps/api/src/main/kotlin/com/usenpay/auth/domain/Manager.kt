package com.usenpay.auth.domain

enum class ManagerRole {
    OWNER,
    MANAGER,
    CASHIER,
}

enum class Permission(val value: String) {
    CHECKOUT_SETTLE("checkout:settle"),
    CHECKOUT_DISCOUNT("checkout:discount"),
    RECEIPT_ISSUE("receipt:issue"),
    SETTINGS_WRITE("settings:write"),
}

data class Manager(
    val managerId: String,
    val name: String,
    val role: ManagerRole,
    val permissions: Set<Permission>,
)
