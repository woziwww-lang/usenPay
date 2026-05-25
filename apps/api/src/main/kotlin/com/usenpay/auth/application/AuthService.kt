package com.usenpay.auth.application

import com.usenpay.auth.domain.Manager
import com.usenpay.auth.domain.ManagerRole
import com.usenpay.auth.domain.Permission
import com.usenpay.common.error.ApiException
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service

@Service
class AuthService {
    private val managers =
        mapOf(
            "owner.meguro" to
                Manager(
                    managerId = "owner.meguro",
                    name = "Owner Meguro",
                    role = ManagerRole.OWNER,
                    permissions = Permission.entries.toSet(),
                ),
            "manager.meguro" to
                Manager(
                    managerId = "manager.meguro",
                    name = "Manager Meguro",
                    role = ManagerRole.MANAGER,
                    permissions =
                        setOf(
                            Permission.CHECKOUT_SETTLE,
                            Permission.CHECKOUT_DISCOUNT,
                            Permission.RECEIPT_ISSUE,
                            Permission.SETTINGS_WRITE,
                        ),
                ),
            "cashier.meguro" to
                Manager(
                    managerId = "cashier.meguro",
                    name = "Cashier Meguro",
                    role = ManagerRole.CASHIER,
                    permissions = setOf(Permission.CHECKOUT_SETTLE, Permission.RECEIPT_ISSUE),
                ),
        )

    fun login(managerId: String): Manager =
        managers[managerId] ?: throw ApiException(HttpStatus.UNAUTHORIZED, "Invalid manager account")
}
