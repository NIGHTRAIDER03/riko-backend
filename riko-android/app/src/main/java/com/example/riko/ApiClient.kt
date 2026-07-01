package com.example.riko

import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import org.json.JSONObject
import android.util.Log

object ApiClient {
    // Note: Replace this with your actual Render.com URL later
    private const val BACKEND_URL = "https://your-riko-backend.onrender.com/api/chat"

    fun sendMessage(message: String, callback: (String) -> Unit) {
        Thread {
            try {
                val url = URL(BACKEND_URL)
                val connection = url.openConnection() as HttpURLConnection
                connection.requestMethod = "POST"
                connection.setRequestProperty("Content-Type", "application/json")
                connection.doOutput = true

                val jsonInput = JSONObject()
                jsonInput.put("message", message)
                jsonInput.put("userId", "default_user")

                val writer = OutputStreamWriter(connection.outputStream)
                writer.write(jsonInput.toString())
                writer.flush()

                if (connection.responseCode == HttpURLConnection.HTTP_OK) {
                    val response = connection.inputStream.bufferedReader().use { it.readText() }
                    val jsonResponse = JSONObject(response)
                    val reply = jsonResponse.getString("reply")
                    callback(reply)
                } else {
                    Log.e("ApiClient", "Server error: ${connection.responseCode}")
                    callback("Sorry, I couldn't reach the server.")
                }
            } catch (e: Exception) {
                e.printStackTrace()
                callback("Sorry, there was a network error.")
            }
        }.start()
    }
}
