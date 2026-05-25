package com.usenpay.settings.application

import com.usenpay.infrastructure.store.InMemoryOperationsStore
import com.usenpay.settings.domain.StoreSettings
import org.springframework.stereotype.Service

@Service
class SettingsService(
    private val store: InMemoryOperationsStore,
) {
    fun getSettings(): StoreSettings = store.settings()

    fun saveSettings(settings: StoreSettings): StoreSettings = store.updateSettings(settings)
}
