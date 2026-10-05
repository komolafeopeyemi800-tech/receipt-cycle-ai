package com.anonymous.receiptcyclemobile.ui

import androidx.compose.runtime.staticCompositionLocalOf
import com.anonymous.receiptcyclemobile.AppContainer

val LocalAppContainer = staticCompositionLocalOf<AppContainer> {
    error("AppContainer not provided")
}
