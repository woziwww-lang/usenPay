package com.usenpay.auth.api

import com.usenpay.auth.application.AuthService
import com.usenpay.auth.domain.Manager
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RestController

data class LoginRequest(
    @field:NotBlank val managerId: String,
)

data class ManagerResponse(
    val managerId: String,
    val name: String,
    val role: String,
    val permissions: List<String>,
)

@RestController
class AuthController(
    private val authService: AuthService,
) {
    @PostMapping("/auth/login")
    fun login(
        @Valid @RequestBody request: LoginRequest,
    ): ManagerResponse = authService.login(request.managerId).toResponse()
}

private fun Manager.toResponse() =
    ManagerResponse(
        managerId = managerId,
        name = name,
        role = role.name.lowercase(),
        permissions = permissions.map { it.value }.sorted(),
    )
