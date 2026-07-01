package com.example.riko

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class MainActivity : AppCompatActivity() {

    private lateinit var voiceManager: VoiceManager
    private lateinit var btnSpeak: Button
    private lateinit var tvStatus: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Note: You will need to create a layout file named 'activity_main.xml'
        // with a Button (id: btnSpeak) and a TextView (id: tvStatus)
        setContentView(R.layout.activity_main)

        btnSpeak = findViewById(R.id.btnSpeak)
        tvStatus = findViewById(R.id.tvStatus)

        // Request audio permissions for the microphone
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.RECORD_AUDIO), 1)
        }

        voiceManager = VoiceManager(this) { spokenText ->
            tvStatus.text = "You: $spokenText\nThinking..."
            
            // Send the transcribed text to Riko's Cloud Brain
            ApiClient.sendMessage(spokenText) { reply ->
                runOnUiThread {
                    tvStatus.text = "Riko: $reply"
                    voiceManager.speak(reply) // Read the response out loud
                }
            }
        }

        // Tap the button to start listening
        btnSpeak.setOnClickListener {
            tvStatus.text = "Listening..."
            voiceManager.startListening()
        }
    }
}
