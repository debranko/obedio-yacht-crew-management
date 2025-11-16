package com.obedio.app.data.service

import android.content.Context
import com.obedio.app.BuildConfig
import com.obedio.app.data.local.TokenManager
import org.eclipse.paho.android.service.MqttAndroidClient
import org.eclipse.paho.client.mqttv3.*
import timber.log.Timber
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.channels.ProducerScope
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import org.json.JSONObject

@Singleton
class MqttService @Inject constructor(
    private val context: Context,
    private val tokenManager: TokenManager
) {
    private var mqttClient: MqttAndroidClient? = null
    private val clientId = "obedio-android-${UUID.randomUUID()}"
    
    companion object {
        private const val QOS_AT_MOST_ONCE = 0
        private const val QOS_AT_LEAST_ONCE = 1
        private const val QOS_EXACTLY_ONCE = 2
        
        // Topics matching backend MQTT setup
        private const val TOPIC_SERVICE_REQUEST = "obedio/service/+"
        private const val TOPIC_EMERGENCY_ALERT = "obedio/emergency/alert"
        private const val TOPIC_BUTTON_STATUS = "obedio/button/+/status"
        private const val TOPIC_BUTTON_BATTERY = "obedio/button/+/battery"
        private const val TOPIC_WATCH_STATUS = "obedio/watch/+/status"
        private const val TOPIC_DEVICE_LOGS = "obedio/logs/+"
    }
    
    sealed class MqttEvent {
        data class Connected(val serverUri: String) : MqttEvent()
        data class Disconnected(val cause: Throwable?) : MqttEvent()
        data class ServiceRequest(
            val buttonId: String,
            val requestType: String,
            val locationId: String?,
            val message: String?
        ) : MqttEvent()
        data class EmergencyAlert(
            val deviceId: String,
            val location: String?,
            val message: String
        ) : MqttEvent()
        data class ButtonStatus(
            val buttonId: String,
            val online: Boolean,
            val batteryLevel: Int?
        ) : MqttEvent()
        data class WatchStatus(
            val watchId: String,
            val online: Boolean,
            val crewId: String?
        ) : MqttEvent()
        data class Error(val message: String, val throwable: Throwable?) : MqttEvent()
    }
    
    fun connect(): Flow<MqttEvent> = callbackFlow {
        try {
            val serverUri = BuildConfig.MQTT_URL
            val userName = tokenManager.getUserId()
            val password = tokenManager.getAccessToken()?.toCharArray() ?: charArrayOf()
            
            mqttClient = MqttAndroidClient(context, serverUri, clientId).apply {
                setCallback(object : MqttCallback {
                    override fun connectionLost(cause: Throwable?) {
                        Timber.e(cause, "MQTT connection lost")
                        trySend(MqttEvent.Disconnected(cause))
                    }
                    
                    override fun messageArrived(topic: String, message: MqttMessage) {
                        this@callbackFlow.handleMessage(topic, message)
                    }
                    
                    override fun deliveryComplete(token: IMqttDeliveryToken?) {
                        Timber.d("MQTT delivery complete")
                    }
                })
            }
            
            val connOptions = MqttConnectOptions().apply {
                isCleanSession = true
                isAutomaticReconnect = true
                this.userName = userName
                this.password = password
                connectionTimeout = 30
                keepAliveInterval = 60
            }
            
            mqttClient?.connect(connOptions, null, object : IMqttActionListener {
                override fun onSuccess(asyncActionToken: IMqttToken?) {
                    Timber.d("MQTT connected successfully")
                    trySend(MqttEvent.Connected(serverUri))
                    subscribeToTopics()
                }
                
                override fun onFailure(asyncActionToken: IMqttToken?, exception: Throwable?) {
                    Timber.e(exception, "MQTT connection failed")
                    trySend(MqttEvent.Error("Connection failed", exception))
                }
            })
            
            awaitClose {
                disconnect()
            }
        } catch (e: Exception) {
            Timber.e(e, "MQTT setup failed")
            trySend(MqttEvent.Error("Setup failed", e))
            close()
        }
    }
    
    private fun ProducerScope<MqttEvent>.handleMessage(topic: String, message: MqttMessage) {
        try {
            val payload = String(message.payload)
            Timber.d("MQTT message received - Topic: $topic, Payload: $payload")
            
            when {
                topic.matches(Regex("obedio/service/.*")) -> {
                    handleServiceRequest(topic, payload)
                }
                topic == TOPIC_EMERGENCY_ALERT -> {
                    handleEmergencyAlert(payload)
                }
                topic.matches(Regex("obedio/button/.*/status")) -> {
                    handleButtonStatus(topic, payload)
                }
                topic.matches(Regex("obedio/button/.*/battery")) -> {
                    handleButtonBattery(topic, payload)
                }
                topic.matches(Regex("obedio/watch/.*/status")) -> {
                    handleWatchStatus(topic, payload)
                }
            }
        } catch (e: Exception) {
            Timber.e(e, "Error handling MQTT message")
        }
    }
    
    private fun ProducerScope<MqttEvent>.handleServiceRequest(topic: String, payload: String) {
        try {
            val buttonId = topic.split("/").getOrNull(2) ?: return
            val data = JSONObject(payload)
            
            trySend(MqttEvent.ServiceRequest(
                buttonId = buttonId,
                requestType = data.optString("type", "service"),
                locationId = data.optString("locationId"),
                message = data.optString("message")
            ))
        } catch (e: Exception) {
            Timber.e(e, "Error parsing service request")
        }
    }
    
    private fun ProducerScope<MqttEvent>.handleEmergencyAlert(payload: String) {
        try {
            val data = JSONObject(payload)
            
            trySend(MqttEvent.EmergencyAlert(
                deviceId = data.getString("deviceId"),
                location = data.optString("location"),
                message = data.optString("message", "Emergency assistance needed!")
            ))
        } catch (e: Exception) {
            Timber.e(e, "Error parsing emergency alert")
        }
    }
    
    private fun ProducerScope<MqttEvent>.handleButtonStatus(topic: String, payload: String) {
        try {
            val buttonId = topic.split("/").getOrNull(2) ?: return
            val data = JSONObject(payload)
            
            trySend(MqttEvent.ButtonStatus(
                buttonId = buttonId,
                online = data.optBoolean("online", false),
                batteryLevel = if (data.has("battery")) data.getInt("battery") else null
            ))
        } catch (e: Exception) {
            Timber.e(e, "Error parsing button status")
        }
    }
    
    private fun ProducerScope<MqttEvent>.handleButtonBattery(topic: String, payload: String) {
        try {
            val buttonId = topic.split("/").getOrNull(2) ?: return
            val batteryLevel = payload.toIntOrNull() ?: return
            
            trySend(MqttEvent.ButtonStatus(
                buttonId = buttonId,
                online = true,
                batteryLevel = batteryLevel
            ))
        } catch (e: Exception) {
            Timber.e(e, "Error parsing button battery")
        }
    }
    
    private fun ProducerScope<MqttEvent>.handleWatchStatus(topic: String, payload: String) {
        try {
            val watchId = topic.split("/").getOrNull(2) ?: return
            val data = JSONObject(payload)
            
            trySend(MqttEvent.WatchStatus(
                watchId = watchId,
                online = data.optBoolean("online", false),
                crewId = data.optString("crewId")
            ))
        } catch (e: Exception) {
            Timber.e(e, "Error parsing watch status")
        }
    }
    
    private fun subscribeToTopics() {
        val topics = arrayOf(
            TOPIC_SERVICE_REQUEST,
            TOPIC_EMERGENCY_ALERT,
            TOPIC_BUTTON_STATUS,
            TOPIC_BUTTON_BATTERY,
            TOPIC_WATCH_STATUS,
            TOPIC_DEVICE_LOGS
        )
        
        val qos = intArrayOf(
            QOS_AT_LEAST_ONCE,
            QOS_EXACTLY_ONCE, // Emergency must be delivered
            QOS_AT_MOST_ONCE,
            QOS_AT_MOST_ONCE,
            QOS_AT_MOST_ONCE,
            QOS_AT_MOST_ONCE
        )
        
        mqttClient?.subscribe(topics, qos, null, object : IMqttActionListener {
            override fun onSuccess(asyncActionToken: IMqttToken?) {
                Timber.d("MQTT subscribed to topics successfully")
            }
            
            override fun onFailure(asyncActionToken: IMqttToken?, exception: Throwable?) {
                Timber.e(exception, "MQTT subscription failed")
            }
        })
    }
    
    fun publishMessage(topic: String, message: String, qos: Int = QOS_AT_LEAST_ONCE) {
        try {
            if (mqttClient?.isConnected == true) {
                mqttClient?.publish(
                    topic,
                    message.toByteArray(),
                    qos,
                    false,
                    null,
                    object : IMqttActionListener {
                        override fun onSuccess(asyncActionToken: IMqttToken?) {
                            Timber.d("MQTT message published successfully")
                        }
                        
                        override fun onFailure(asyncActionToken: IMqttToken?, exception: Throwable?) {
                            Timber.e(exception, "MQTT publish failed")
                        }
                    }
                )
            } else {
                Timber.w("MQTT client not connected, cannot publish")
            }
        } catch (e: Exception) {
            Timber.e(e, "Error publishing MQTT message")
        }
    }
    
    fun publishCrewStatus(crewId: String, status: String) {
        val topic = "obedio/crew/$crewId/status"
        val message = JSONObject().apply {
            put("status", status)
            put("timestamp", System.currentTimeMillis())
        }.toString()
        
        publishMessage(topic, message)
    }
    
    fun publishWatchAcknowledgment(requestId: String, crewId: String) {
        val topic = "obedio/watch/ack"
        val message = JSONObject().apply {
            put("requestId", requestId)
            put("crewId", crewId)
            put("action", "accepted")
            put("timestamp", System.currentTimeMillis())
        }.toString()
        
        publishMessage(topic, message, QOS_EXACTLY_ONCE)
    }
    
    fun disconnect() {
        try {
            mqttClient?.disconnect()
            mqttClient = null
            Timber.d("MQTT disconnected")
        } catch (e: Exception) {
            Timber.e(e, "Error disconnecting MQTT")
        }
    }
    
    fun isConnected(): Boolean = mqttClient?.isConnected ?: false
}