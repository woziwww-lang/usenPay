package com.usenpay.settings.domain

data class DiscountRule(
    val name: String,
    val target: String,
    val value: String,
)

data class ReviewRule(
    val channel: String,
    val state: String,
    val score: String,
)

data class StoreSettings(
    val language: String,
    val currency: String,
    val approvalLimit: String,
    val notifications: Map<String, Boolean>,
    val discountRules: List<DiscountRule>,
    val reviewRules: List<ReviewRule>,
)
