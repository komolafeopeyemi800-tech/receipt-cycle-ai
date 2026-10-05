package com.anonymous.receiptcyclemobile.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.FilterChip
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.anonymous.receiptcyclemobile.ui.auth.AuthViewModel
import com.anonymous.receiptcyclemobile.ui.components.RcCard
import com.anonymous.receiptcyclemobile.ui.components.ReceiptCycleGradientBackground
import com.anonymous.receiptcyclemobile.ui.components.ScreenHeader
import com.anonymous.receiptcyclemobile.ui.theme.RcColors

@Composable
fun SignInScreen(
    authViewModel: AuthViewModel,
    onSignUp: () -> Unit,
    onForgot: () -> Unit,
    onGoogle: () -> Unit,
    googleConfigured: Boolean,
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var busy by remember { mutableStateOf(false) }
    val error by authViewModel.error.collectAsState()

    LaunchedEffect(Unit) {
        authViewModel.rememberedEmail()?.let { email = it }
    }

    ReceiptCycleGradientBackground {
    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
        verticalArrangement = Arrangement.Center,
    ) {
        Text("Receipt Cycle", style = MaterialTheme.typography.headlineMedium, color = RcColors.Primary)
        Text("Sign in to sync with your production account.", color = RcColors.Gray600)
        RcCard {
            if (googleConfigured) {
                OutlinedButton(onClick = onGoogle, modifier = Modifier.fillMaxWidth()) {
                    Text("Continue with Google")
                }
                Spacer(Modifier.height(12.dp))
            }
            OutlinedTextField(email, { email = it }, label = { Text("Email") }, modifier = Modifier.fillMaxWidth())
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(password, { password = it }, label = { Text("Password") }, modifier = Modifier.fillMaxWidth())
            if (error != null) {
                Text(error!!, color = RcColors.Rose600, modifier = Modifier.padding(top = 8.dp))
            }
            Spacer(Modifier.height(12.dp))
            Button(
                onClick = {
                    busy = true
                    authViewModel.signIn(email, password) { busy = false }
                },
                enabled = !busy,
                modifier = Modifier.fillMaxWidth(),
            ) {
                if (busy) CircularProgressIndicator() else Text("Sign in")
            }
            TextButton(onClick = onForgot) { Text("Forgot password?") }
            TextButton(onClick = onSignUp) { Text("Create account") }
        }
    }
    }
}

@Composable
fun SignUpScreen(authViewModel: AuthViewModel, onBack: () -> Unit, onDone: () -> Unit) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var name by remember { mutableStateOf("") }
    val error by authViewModel.error.collectAsState()

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        ScreenHeader("Create account")
        RcCard {
            OutlinedTextField(name, { name = it }, label = { Text("Name") }, modifier = Modifier.fillMaxWidth())
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(email, { email = it }, label = { Text("Email") }, modifier = Modifier.fillMaxWidth())
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(password, { password = it }, label = { Text("Password") }, modifier = Modifier.fillMaxWidth())
            if (error != null) Text(error!!, color = RcColors.Rose600)
            Spacer(Modifier.height(12.dp))
            Button(
                onClick = { authViewModel.signUp(email, password, name.ifBlank { null }, onDone) },
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Sign up") }
            TextButton(onClick = onBack) { Text("Back to sign in") }
        }
    }
}

@Composable
fun ForgotPasswordScreen(authViewModel: AuthViewModel, onBack: () -> Unit) {
    var email by remember { mutableStateOf("") }
    var devToken by remember { mutableStateOf<String?>(null) }
    val error by authViewModel.error.collectAsState()

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        ScreenHeader("Reset password")
        RcCard {
            OutlinedTextField(email, { email = it }, label = { Text("Email") }, modifier = Modifier.fillMaxWidth())
            if (error != null) Text(error!!, color = RcColors.Rose600)
            devToken?.let { Text("Dev token: $it", modifier = Modifier.padding(top = 8.dp)) }
            Spacer(Modifier.height(12.dp))
            Button(
                onClick = { authViewModel.requestPasswordReset(email) { devToken = it } },
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Send reset link") }
            TextButton(onClick = onBack) { Text("Back") }
        }
    }
}

@Composable
fun ResetPasswordScreen(authViewModel: AuthViewModel, token: String, onDone: () -> Unit) {
    var password by remember { mutableStateOf("") }
    val error by authViewModel.error.collectAsState()

    Column(Modifier.fillMaxSize().padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        ScreenHeader("Choose new password")
        RcCard {
            OutlinedTextField(password, { password = it }, label = { Text("New password") }, modifier = Modifier.fillMaxWidth())
            if (error != null) Text(error!!, color = RcColors.Rose600)
            Spacer(Modifier.height(12.dp))
            Button(
                onClick = { authViewModel.resetPassword(token, password, onDone) },
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Update password") }
        }
    }
}

@Composable
fun OnboardingScreen(
    onDone: () -> Unit,
    onCurrencySelected: (String) -> Unit = {},
) {
    var step by remember { mutableStateOf(1) }
    var currency by remember { mutableStateOf("USD") }
    var goals by remember { mutableStateOf(setOf<String>()) }
    var usecases by remember { mutableStateOf(setOf<String>()) }
    var industry by remember { mutableStateOf("") }
    var country by remember { mutableStateOf("US") }
    var voiceLang by remember { mutableStateOf("auto") }

    val totalSteps = 7
    Column(
        Modifier
            .fillMaxSize()
            .padding(24.dp)
            .verticalScroll(rememberScrollState()),
    ) {
        Text("Receipt Cycle", style = MaterialTheme.typography.headlineMedium, color = RcColors.Primary)
        Text("Step $step of $totalSteps", color = RcColors.Gray600)
        Spacer(Modifier.height(16.dp))
        when (step) {
            1 -> {
                Text("What are your goals?", style = MaterialTheme.typography.titleMedium)
                listOf("track" to "Track income & expenses", "cut" to "Cut expenses", "saving" to "Save more").forEach { (id, label) ->
                    FilterChip(selected = id in goals, onClick = {
                        goals = if (id in goals) goals - id else goals + id
                    }, label = { Text(label) }, modifier = Modifier.padding(vertical = 4.dp))
                }
            }
            2 -> {
                Text("How will you use Receipt Cycle?")
                listOf("personal" to "Personal budget", "expense" to "Expense reports").forEach { (id, label) ->
                    FilterChip(selected = id in usecases, onClick = {
                        usecases = if (id in usecases) usecases - id else usecases + id
                    }, label = { Text(label) })
                }
            }
            3 -> {
                Text("Your industry")
                OutlinedTextField(industry, { industry = it }, label = { Text("Industry") }, modifier = Modifier.fillMaxWidth())
            }
            4 -> {
                Text("Country")
                OutlinedTextField(country, { country = it.uppercase() }, label = { Text("Country code") }, modifier = Modifier.fillMaxWidth())
            }
            5 -> {
                Text("Preferred currency")
                OutlinedTextField(currency, { currency = it.uppercase() }, label = { Text("Currency") }, modifier = Modifier.fillMaxWidth())
            }
            6 -> {
                Text("Voice input language")
                OutlinedTextField(voiceLang, { voiceLang = it }, label = { Text("auto or en, es, …") }, modifier = Modifier.fillMaxWidth())
            }
            7 -> {
                Text("You're all set", style = MaterialTheme.typography.titleLarge)
                Text("Start tracking receipts, budgets, and insights with the same account as the web app.")
            }
        }
        Spacer(Modifier.height(24.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            if (step > 1) {
                TextButton(onClick = { step-- }) { Text("Back") }
            } else {
                Spacer(Modifier.weight(1f))
            }
            Button(
                onClick = {
                    if (step < totalSteps) step++
                    else {
                        onCurrencySelected(currency)
                        onDone()
                    }
                },
                modifier = Modifier.weight(1f),
            ) {
                Text(if (step < totalSteps) "Continue" else "Get started")
            }
        }
    }
}
