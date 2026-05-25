package com.usenpay.settings.api

import com.usenpay.settings.application.SettingsService
import com.usenpay.settings.domain.StoreSettings
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RestController

data class SettingsSavedResponse(
    val settings: StoreSettings,
    val message: String,
)

@RestController
class SettingsController(
    private val settingsService: SettingsService,
) {
    @GetMapping("/settings")
    fun getSettings(): StoreSettings = settingsService.getSettings()

    @PatchMapping("/settings")
    fun saveSettings(
        @RequestBody settings: StoreSettings,
    ): SettingsSavedResponse =
        SettingsSavedResponse(
            settings = settingsService.saveSettings(settings),
            message = "Settings saved",
        )
}
