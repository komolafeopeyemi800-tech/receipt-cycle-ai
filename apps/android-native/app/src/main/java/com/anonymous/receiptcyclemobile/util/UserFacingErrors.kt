package com.anonymous.receiptcyclemobile.util

fun userFacingErrorFromUnknown(e: Throwable?): String {
    val msg = e?.message?.trim().orEmpty()
    if (msg.isNotEmpty()) return msg
    return "Something went wrong. Please try again."
}
