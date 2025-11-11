package com.example.obediowear.data.mqtt

import android.content.Context
import android.util.Log
import com.example.obediowear.data.model.ServiceRequest
import com.example.obediowear.utils.DeviceInfoHelper
import com.example.obediowear.utils.NotificationHelper
import com.google.gson.Gson
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import info.mqtt.android.service.MqttAndroidClient
import org.eclipse.paho.client.mqttv3.*

/**
 * Manages MQTT connection using Eclipse Paho for receiving service request notifications.
 * Replaces Socket.IO with MQTT for unified IoT architecture.
 */
object MqttManager {

    private const val TAG = "MqttManager"

    // MQTT Broker configuration
    private const val BROKER_URL = "tcp://192.168.5.150:1883"

    // CLIENT_ID is dynamically generated from Android ID (set on first connect)
    private var CLIENT_ID: String = "WEAR-UNKNOWN"
    private var appContext: Context? = null

    // MQTT Topics (dynamically generated based on CLIENT_ID)
    private fun getNotificationTopic() = "obedio/watch/$CLIENT_ID/notification"
    private fun getServiceUpdatesTopic() = "obedio/service/update"
    private fun getDeviceRegisterTopic() = "obedio/device/register"
    private fun getAcknowledgeTopic() = "obedio/watch/$CLIENT_ID/acknowledge"

    enum class ConnectionStatus { CONNECTING, CONNECTED, DISCONNECTED }

    private var mqttClient: MqttAndroidClient? = null
    private val gson = Gson()

    // Connection status flow
    private val _connectionStatus = MutableStateFlow(ConnectionStatus.DISCONNECTED)
    val connectionStatus: StateFlow<ConnectionStatus> = _connectionStatus.asStateFlow()

    // Flow for newly created service requests
    // replay=1 ensures late subscribers receive the last event
    // extraBufferCapacity=64 allows buffering events if collector is busy
    private val _newRequestFlow = MutableSharedFlow<ServiceRequest>(
        replay = 1,
        extraBufferCapacity = 64
    )
    val newRequestFlow = _newRequestFlow.asSharedFlow()

    // Flow for updated service requests
    private val _updatedRequestFlow = MutableSharedFlow<ServiceRequest>(
        replay = 1,
        extraBufferCapacity = 64
    )
    val updatedRequestFlow = _updatedRequestFlow.asSharedFlow()

    /**
     * Initialize and connect to MQTT broker.
     */
    fun connect(context: Context) {
        // Store context for device info extraction
        appContext = context.applicationContext

        // Create notification channel for full-screen notifications
        NotificationHelper.createNotificationChannel(context)

        // Set CLIENT_ID from Android device ID
        CLIENT_ID = DeviceInfoHelper.getDeviceId(context)
        Log.d(TAG, "Watch Device ID: $CLIENT_ID")

        if (mqttClient?.isConnected == true) {
            Log.d(TAG, "Already connected to MQTT broker")
            _connectionStatus.value = ConnectionStatus.CONNECTED
            return
        }

        try {
            // Create MQTT client
            mqttClient = MqttAndroidClient(context, BROKER_URL, CLIENT_ID)

            // Set callback for connection events
            mqttClient?.setCallback(object : MqttCallback {
                override fun connectionLost(cause: Throwable?) {
                    Log.w(TAG, "MQTT Connection Lost: ${cause?.message}")
                    _connectionStatus.value = ConnectionStatus.DISCONNECTED
                }

                override fun messageArrived(topic: String?, message: MqttMessage?) {
                    handleIncomingMessage(topic, message)
                }

                override fun deliveryComplete(token: IMqttDeliveryToken?) {
                    // Not used for receiving messages
                }
            })

            // Configure connection options
            val options = MqttConnectOptions().apply {
                isCleanSession = true
                connectionTimeout = 30
                keepAliveInterval = 60
                isAutomaticReconnect = true
            }

            // Connect to broker
            _connectionStatus.value = ConnectionStatus.CONNECTING
            Log.d(TAG, "Connecting to MQTT broker: $BROKER_URL")

            mqttClient?.connect(options, null, object : IMqttActionListener {
                override fun onSuccess(asyncActionToken: IMqttToken?) {
                    Log.i(TAG, "MQTT Connected successfully!")
                    _connectionStatus.value = ConnectionStatus.CONNECTED

                    // Register device with backend (auto-creates or updates device record)
                    registerDevice()

                    // Subscribe to topics after successful connection
                    subscribeToTopics()
                }

                override fun onFailure(asyncActionToken: IMqttToken?, exception: Throwable?) {
                    Log.e(TAG, "MQTT Connection failed: ${exception?.message}", exception)
                    _connectionStatus.value = ConnectionStatus.DISCONNECTED
                }
            })

        } catch (e: Exception) {
            Log.e(TAG, "MQTT connection error: ${e.message}", e)
            _connectionStatus.value = ConnectionStatus.DISCONNECTED
        }
    }

    /**
     * Register device with backend via MQTT.
     * Sends device info to obedio/device/register topic.
     * Backend will auto-create or update device record in database.
     */
    private fun registerDevice() {
        appContext?.let { context ->
            try {
                val registrationData = mapOf(
                    "deviceId" to CLIENT_ID,
                    "type" to "watch",
                    "name" to DeviceInfoHelper.generateFriendlyName(context),
                    "firmwareVersion" to "Wear OS ${DeviceInfoHelper.getAndroidVersion()}",
                    "hardwareVersion" to DeviceInfoHelper.getDeviceModel(),
                    "macAddress" to CLIENT_ID  // Using Android ID as unique identifier
                )

                val payload = gson.toJson(registrationData)
                val message = MqttMessage(payload.toByteArray())
                message.qos = 1

                mqttClient?.publish(getDeviceRegisterTopic(), message, null, object : IMqttActionListener {
                    override fun onSuccess(asyncActionToken: IMqttToken?) {
                        Log.i(TAG, "✅ Device registered: ${DeviceInfoHelper.getDeviceModel()} ($CLIENT_ID)")
                    }

                    override fun onFailure(asyncActionToken: IMqttToken?, exception: Throwable?) {
                        Log.e(TAG, "❌ Device registration failed: ${exception?.message}")
                    }
                })

            } catch (e: Exception) {
                Log.e(TAG, "Error registering device: ${e.message}", e)
            }
        }
    }

    /**
     * Subscribe to relevant MQTT topics.
     */
    private fun subscribeToTopics() {
        try {
            // Subscribe to watch-specific notifications
            val notificationTopic = getNotificationTopic()
            mqttClient?.subscribe(notificationTopic, 1, null, object : IMqttActionListener {
                override fun onSuccess(asyncActionToken: IMqttToken?) {
                    Log.i(TAG, "✅ Subscribed to: $notificationTopic")
                }

                override fun onFailure(asyncActionToken: IMqttToken?, exception: Throwable?) {
                    Log.e(TAG, "❌ Failed to subscribe to $notificationTopic: ${exception?.message}")
                }
            })

            // Subscribe to service request updates
            val serviceUpdatesTopic = getServiceUpdatesTopic()
            mqttClient?.subscribe(serviceUpdatesTopic, 1, null, object : IMqttActionListener {
                override fun onSuccess(asyncActionToken: IMqttToken?) {
                    Log.i(TAG, "✅ Subscribed to: $serviceUpdatesTopic")
                }

                override fun onFailure(asyncActionToken: IMqttToken?, exception: Throwable?) {
                    Log.e(TAG, "❌ Failed to subscribe to $serviceUpdatesTopic: ${exception?.message}")
                }
            })

        } catch (e: Exception) {
            Log.e(TAG, "MQTT subscription error: ${e.message}", e)
        }
    }

    /**
     * Handle incoming MQTT messages.
     */
    private fun handleIncomingMessage(topic: String?, message: MqttMessage?) {
        if (topic == null || message == null) return

        try {
            val payload = message.toString()
            Log.d(TAG, "📥 MQTT message received on $topic: $payload")

            when {
                // Watch-specific notification (new service request created)
                topic == getNotificationTopic() -> {
                    val notification = gson.fromJson(payload, WatchNotification::class.java)
                    Log.i(TAG, "🔔 New service request notification: ${notification.requestId}")

                    // Convert notification to ServiceRequest and emit
                    val serviceRequest = notification.toServiceRequest()
                    _newRequestFlow.tryEmit(serviceRequest)

                    // Show full-screen notification + launch activity
                    appContext?.let { context ->
                        // Show notification (for background/locked screen scenarios)
                        NotificationHelper.showFullScreenNotification(context, serviceRequest)
                        Log.i(TAG, "📲 Notification created for request: ${serviceRequest.id}")

                        // ALSO launch activity DIRECTLY (for foreground scenarios - more reliable on Wear OS)
                        val intent = android.content.Intent(context, com.example.obediowear.presentation.FullScreenIncomingRequestActivity::class.java).apply {
                            flags = android.content.Intent.FLAG_ACTIVITY_NEW_TASK or android.content.Intent.FLAG_ACTIVITY_CLEAR_TOP
                            putExtra("service_request", gson.toJson(serviceRequest))
                        }
                        context.startActivity(intent)
                        Log.i(TAG, "📲 Full-screen activity launched directly for request: ${serviceRequest.id}")
                    }
                }

                // Service request update (status changed, assigned, completed)
                topic == getServiceUpdatesTopic() -> {
                    val update = gson.fromJson(payload, ServiceUpdate::class.java)
                    Log.i(TAG, "🔄 Service request update: ${update.requestId} -> ${update.status}")

                    // Emit update (ViewModel will handle closing notification if needed)
                    // For now, we'll use a simplified approach
                    // TODO: Fetch full ServiceRequest from API if needed
                }
            }

        } catch (e: Exception) {
            Log.e(TAG, "Error parsing MQTT message: ${e.message}", e)
        }
    }

    /**
     * Send acknowledgment back to server when crew accepts request.
     */
    fun acknowledgeRequest(requestId: String, action: String = "accept") {
        try {
            val ackTopic = getAcknowledgeTopic()
            val ackPayload = gson.toJson(mapOf(
                "requestId" to requestId,
                "action" to action,
                "status" to "acknowledged",
                "timestamp" to System.currentTimeMillis()
            ))

            val message = MqttMessage(ackPayload.toByteArray())
            message.qos = 1

            mqttClient?.publish(ackTopic, message, null, object : IMqttActionListener {
                override fun onSuccess(asyncActionToken: IMqttToken?) {
                    Log.i(TAG, "✅ Acknowledgment sent for request: $requestId")
                }

                override fun onFailure(asyncActionToken: IMqttToken?, exception: Throwable?) {
                    Log.e(TAG, "❌ Failed to send acknowledgment: ${exception?.message}")
                }
            })

        } catch (e: Exception) {
            Log.e(TAG, "Error sending acknowledgment: ${e.message}", e)
        }
    }

    /**
     * Disconnect from MQTT broker.
     */
    fun disconnect() {
        try {
            mqttClient?.disconnect()
            Log.d(TAG, "Disconnecting from MQTT broker...")
            _connectionStatus.value = ConnectionStatus.DISCONNECTED
        } catch (e: Exception) {
            Log.e(TAG, "Error disconnecting: ${e.message}", e)
        }
    }

    /**
     * Data class for watch notifications from backend.
     */
    private data class WatchNotification(
        val requestId: String,
        val type: String,
        val title: String,
        val message: String,
        val location: String,
        val guest: String,
        val priority: String,
        val timestamp: String,
        val voiceTranscript: String? = null
    ) {
        fun toServiceRequest(): ServiceRequest {
            // Parse guest name into first/last name
            val guestParts = guest.split(" ", limit = 2)
            val guestFirstName = guestParts.getOrNull(0) ?: "Guest"
            val guestLastName = guestParts.getOrNull(1) ?: ""

            // Create Guest object from notification data
            val guestObj = com.example.obediowear.data.model.Guest(
                id = "unknown",
                firstName = guestFirstName,
                lastName = guestLastName,
                preferredName = null,
                photo = null
            )

            // Create Location object from notification data
            val locationObj = com.example.obediowear.data.model.Location(
                id = "unknown",
                name = location,
                type = "cabin",
                floor = null,
                image = null
            )

            return ServiceRequest(
                id = requestId,
                status = com.example.obediowear.data.model.Status.PENDING,
                priority = when (priority.lowercase()) {
                    "emergency" -> com.example.obediowear.data.model.Priority.EMERGENCY
                    "urgent" -> com.example.obediowear.data.model.Priority.URGENT
                    else -> com.example.obediowear.data.model.Priority.NORMAL
                },
                requestType = when (type.lowercase()) {
                    "emergency" -> com.example.obediowear.data.model.RequestType.EMERGENCY
                    "voice" -> com.example.obediowear.data.model.RequestType.VOICE
                    "dnd" -> com.example.obediowear.data.model.RequestType.DND
                    "lights" -> com.example.obediowear.data.model.RequestType.LIGHTS
                    "prepare_food" -> com.example.obediowear.data.model.RequestType.PREPARE_FOOD
                    "bring_drinks" -> com.example.obediowear.data.model.RequestType.BRING_DRINKS
                    "service" -> com.example.obediowear.data.model.RequestType.SERVICE
                    else -> com.example.obediowear.data.model.RequestType.CALL
                },
                notes = message,
                voiceTranscript = voiceTranscript,
                createdAt = timestamp,
                guest = guestObj,
                location = locationObj,
                assignedCrew = null
            )
        }
    }

    /**
     * Data class for service request updates.
     */
    private data class ServiceUpdate(
        val requestId: String,
        val status: String,
        val assignedTo: String?,
        val acknowledgedAt: String?
    )
}
