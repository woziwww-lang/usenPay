package com.usenpay.infrastructure.event

import org.slf4j.LoggerFactory
import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.stereotype.Component

data class CheckoutEvent(
    val type: String,
    val checkoutId: String,
    val payload: Map<String, Any?> = emptyMap(),
)

interface DomainEventPublisher {
    fun publish(event: CheckoutEvent)
}

@ConfigurationProperties(prefix = "usenpay.integrations")
data class IntegrationProperties(
    val redisEnabled: Boolean = false,
    val rabbitmqEnabled: Boolean = false,
)

@Component
@EnableConfigurationProperties(IntegrationProperties::class)
class LoggingDomainEventPublisher(
    private val properties: IntegrationProperties,
) : DomainEventPublisher {
    private val logger = LoggerFactory.getLogger(javaClass)

    override fun publish(event: CheckoutEvent) {
        logger.info(
            "domain_event type={} checkoutId={} rabbitmqEnabled={} payload={}",
            event.type,
            event.checkoutId,
            properties.rabbitmqEnabled,
            event.payload,
        )
    }
}
