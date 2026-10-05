package com.anonymous.receiptcyclemobile.ui.components

import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import java.io.File

@Composable
fun ReceiptCameraPreview(
    modifier: Modifier = Modifier,
    onReady: (captureTo: (onFile: (File) -> Unit) -> Unit) -> Unit,
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val previewView = remember { PreviewView(context) }
    val imageCapture = remember { ImageCapture.Builder().build() }
    val executor = remember { ContextCompat.getMainExecutor(context) }

    DisposableEffect(lifecycleOwner) {
        val future = ProcessCameraProvider.getInstance(context)
        future.addListener({
            val provider = future.get()
            val preview = Preview.Builder().build().also {
                it.surfaceProvider = previewView.surfaceProvider
            }
            provider.unbindAll()
            provider.bindToLifecycle(lifecycleOwner, CameraSelector.DEFAULT_BACK_CAMERA, preview, imageCapture)
            onReady { onFile ->
                val file = File(context.cacheDir, "receipt_${System.currentTimeMillis()}.jpg")
                val opts = ImageCapture.OutputFileOptions.Builder(file).build()
                imageCapture.takePicture(
                    opts,
                    executor,
                    object : ImageCapture.OnImageSavedCallback {
                        override fun onImageSaved(output: ImageCapture.OutputFileResults) = onFile(file)
                        override fun onError(exception: ImageCaptureException) = Unit
                    },
                )
            }
        }, executor)
        onDispose { runCatching { future.get().unbindAll() } }
    }

    AndroidView(factory = { previewView }, modifier = modifier)
}
