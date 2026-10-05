package com.anonymous.receiptcyclemobile

import android.app.Application

class ReceiptCycleApplication : Application() {
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
    }
}
