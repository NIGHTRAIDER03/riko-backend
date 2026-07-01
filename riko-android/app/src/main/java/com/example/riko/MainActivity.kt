package com.example.riko

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import com.example.riko.theme.RikoTheme

class MainActivity : ComponentActivity() {

    private lateinit var voiceManager: VoiceManager
    private var uiStateText by mutableStateOf("Ready to talk to Riko")

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted: Boolean ->
        if (!isGranted) {
            uiStateText = "Microphone permission denied"
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Request audio permissions
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            requestPermissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
        }

        voiceManager = VoiceManager(this) { spokenText ->
            uiStateText = "You: $spokenText\nThinking..."
            
            ApiClient.sendMessage(spokenText) { reply ->
                runOnUiThread {
                    uiStateText = "Riko: $reply"
                    voiceManager.speak(reply)
                }
            }
        }

        enableEdgeToEdge()
        setContent {
            RikoTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    RikoScreen(
                        statusText = uiStateText,
                        onSpeakClick = {
                            uiStateText = "Listening..."
                            voiceManager.startListening()
                        }
                    )
                }
            }
        }
    }
}

@Composable
fun RikoScreen(statusText: String, onSpeakClick: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = statusText,
            style = MaterialTheme.typography.bodyLarge,
            modifier = Modifier.padding(bottom = 32.dp)
        )
        Button(onClick = onSpeakClick) {
            Text("Tap to Speak")
        }
    }
}
