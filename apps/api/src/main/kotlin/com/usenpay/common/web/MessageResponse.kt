package com.usenpay.common.web

data class MessageResponse<T>(
    val message: String,
    val data: T,
)
