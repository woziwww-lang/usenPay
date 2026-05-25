package com.usenpay.common.error

import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.validation.FieldError
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice

data class ErrorResponse(
    val error: String,
    val status: Int,
    val path: String,
    val details: Map<String, String> = emptyMap(),
)

@RestControllerAdvice
class GlobalExceptionHandler {
    @ExceptionHandler(ApiException::class)
    fun handleApiException(
        exception: ApiException,
        request: HttpServletRequest,
    ): ResponseEntity<ErrorResponse> =
        ResponseEntity
            .status(exception.status)
            .body(
                ErrorResponse(
                    error = exception.message,
                    status = exception.status.value(),
                    path = request.requestURI,
                ),
            )

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidation(
        exception: MethodArgumentNotValidException,
        request: HttpServletRequest,
    ): ResponseEntity<ErrorResponse> {
        val details =
            exception.bindingResult.fieldErrors.associate { error: FieldError ->
                error.field to (error.defaultMessage ?: "Invalid value")
            }

        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(
                ErrorResponse(
                    error = "Validation failed",
                    status = HttpStatus.BAD_REQUEST.value(),
                    path = request.requestURI,
                    details = details,
                ),
            )
    }

    @ExceptionHandler(Exception::class)
    fun handleUnexpected(
        exception: Exception,
        request: HttpServletRequest,
    ): ResponseEntity<ErrorResponse> =
        ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(
                ErrorResponse(
                    error = exception.message ?: "Unexpected server error",
                    status = HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    path = request.requestURI,
                ),
            )
}
