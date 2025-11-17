package com.obedio.minimal.services

import android.content.Context
import android.util.Log
import com.obedio.minimal.data.AppConfig
import com.obedio.minimal.data.ConnectionState
import com.obedio.minimal.data.ServiceStatus
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import org.eclipse.paho.android.service.MqttAndroidClient
import org.eclipse.paho.client.mqttv3.*

/**
 * Manages MQTT connection using Eclipse Paho
 */
class MqttService(private val context: Context) {

    private var mqttClient: MqttAndroidClient? = null
    private val _status = MutableStateFlow(ServiceStatus())
    val status: StateFlow<ServiceStatus> = _status.asStateFlow()

    private val TAG = "MqttService"

    /**
     * Connect to MQTT broker
     */
    fun connect() {
        try {
            _status.value = ServiceStatus(
                state = ConnectionState.CONNECTING,
                message = "Connecting to MQTT broker..."
            )

            mqttClient = MqttAndroidClient(
                context,
                AppConfig.MQTT_BROKER_URL,
                AppConfig.MQTT_CLIENT_ID
            )

            mqttClient?.setCallback(object : MqttCallback {
                override fun connectionLost(cause: Throwable?) {
                    Log.d(TAG, "MQTT connection lost: ${cause?.message}")
                    _status.value = ServiceStatus(
                        state = ConnectionState.DISCONNECTED,
                        message = "Connection lost",
                        errorDetails = cause?.message
                    )
                }

                override fun messageArrived(topic: String?, message: MqttMessage?) {
                    Log.d(TAG, "MQTT message arrived on topic: $topic")
                }

                override fun deliveryComplete(token: IMqttDeliveryToken?) {
                    Log.d(TAG, "MQTT delivery complete")
                }
            })

            val options = MqttConnectOptions().apply {
                isAutomaticReconnect = true
                isCleanSession = true
                connectionTimeout = (AppConfig.CONNECTION_TIMEOUT_MS / 1000).toInt()
                keepAliveInterval = 60
            }

            mqttClient?.connect(options, null, object : IMqttActionListener {
                override fun onSuccess(asyncActionToken: IMqttToken?) {
                    Log.d(TAG, "MQTT connected successfully")
                    _status.value = ServiceStatus(
                        state = ConnectionState.CONNECTED,
                        message = "MQTT connected",
                        lastConnected = System.currentTimeMillis()
                    )

                    // Subscribe to test topics
                    subscribeToTopics()
                }

                override fun onFailure(asyncActionToken: IMqttToken?, exception: Throwable?) {
                    Log.e(TAG, "MQTT connection failed", exception)
                    _status.value = ServiceStatus(
                        state = ConnectionState.ERROR,
                        message = "Connection failed",
                        errorDetails = exception?.message ?: "Unknown error"
                    )
                }
            })

        } catch (e: Exception) {
            Log.e(TAG, "Failed to connect MQTT", e)
            _status.value = ServiceStatus(
                state = ConnectionState.ERROR,
                message = "Failed to connect",
                errorDetails = e.message ?: "Unknown error"
            )
        }
    }

    /**
     * Subscribe to MQTT topics
     */
    private fun subscribeToTopics() {
        try {
            mqttClient?.subscribe("obedio/service/+", 1, null, object : IMqttActionListener {
                override fun onSuccess(asyncActionToken: IMqttToken?) {
                    Log.d(TAG, "Subscribed to service topics")
                }

                override fun onFailure(asyncActionToken: IMqttToken?, exception: Throwable?) {
                    Log.e(TAG, "Failed to subscribe", exception)
                }
            })

            mqttClient?.subscribe("obedio/emergency/alert", 1)
            Log.d(TAG, "Subscribed to emergency alerts")

        } catch (e: Exception) {
            Log.e(TAG, "Failed to subscribe to topics", e)
        }
    }

    /**
     * Disconnect from MQTT broker
     */
    fun disconnect() {
        try {
            mqttClient?.disconnect(null, object : IMqttActionListener {
                override fun onSuccess(asyncActionToken: IMqttToken?) {
                    Log.d(TAG, "MQTT disconnected")
                    _status.value = ServiceStatus(
                        state = ConnectionState.DISCONNECTED,
                        message = "Disconnected"
                    )
                }

                override fun onFailure(asyncActionToken: IMqttToken?, exception: Throwable?) {
                    Log.e(TAG, "Failed to disconnect", exception)
                }
            })
        } catch (e: Exception) {
            Log.e(TAG, "Error during disconnect", e)
        }
    }

    /**
     * Check if currently connected
     */
    fun isConnected(): Boolean = mqttClient?.isConnected == true
}
