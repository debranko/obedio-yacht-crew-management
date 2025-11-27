package com.example.obediowear2.data.mqtt

import android.content.Context
import android.os.PowerManager
import android.util.Log
import com.example.obediowear2.data.model.DndUpdate
import com.example.obediowear2.data.model.Guest
import com.example.obediowear2.data.model.Location
import com.example.obediowear2.data.model.Priority
import com.example.obediowear2.data.model.RequestType
import com.example.obediowear2.data.model.ServiceRequest
import com.example.obediowear2.data.model.ServiceUpdate
import com.example.obediowear2.data.model.Status
import com.example.obediowear2.presentation.screens.request.FullScreenRequestActivity
import com.example.obediowear2.utils.DeviceInfoHelper
import com.example.obediowear2.utils.NotificationHelper
import com.example.obediowear2.utils.ServerConfig
import com.google.gson.Gson
import info.mqtt.android.service.MqttAndroidClient
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import org.eclipse.paho.client.mqttv3.IMqttActionListener
import org.eclipse.paho.client.mqttv3.IMqttDeliveryToken
import org.eclipse.paho.client.mqttv3.IMqttToken
import org.eclipse.paho.client.mqttv3.MqttCallback
import org.eclipse.paho.client.mqttv3.MqttConnectOptions
import org.eclipse.paho.client.mqttv3.MqttMessage

/**
 * MQTT Manager for ObedioWear2.
 * Handles real-time notifications, service updates, and DND alerts.
 */
object MqttManager {

    private const val TAG = "MqttManager2"

    private var CLIENT_ID: String = "WEAR2-UNKNOWN"
    private var appContext: Context? = null
    private var currentCrewMemberName: String? = null

    // Wake lock management
    private var screenWakeLock: PowerManager.WakeLock? = null
    private val wakeLockScope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    // MQTT Topics
    private fun getNotificationTopic() = "obedio/watch/$CLIENT_ID/notification"
    private fun getServiceUpdatesTopic() = "obedio/service/update"
    private fun getDndTopic() = "obedio/location/+/dnd"  // Wildcard for all locations
    private fun getDeviceRegisterTopic() = "obedio/device/register"
    private fun getAcknowledgeTopic() = "obedio/watch/$CLIENT_ID/acknowledge"
    private fun getTelemetryTopic() = "obedio/device/$CLIENT_ID/telemetry"

    enum class ConnectionStatus { CONNECTING, CONNECTED, DISCONNECTED }

    private var mqttClient: MqttAndroidClient? = null
    private val gson = Gson()

    // Connection status
    private val _connectionStatus = MutableStateFlow(ConnectionStatus.DISCONNECTED)
    val connectionStatus: StateFlow<ConnectionStatus> = _connectionStatus.asStateFlow()

    // New service request notifications
    private val _newRequestFlow = MutableSharedFlow<ServiceRequest>(
        replay = 1,
        extraBufferCapacity = 64
    )
    val newRequestFlow = _newRequestFlow.asSharedFlow()

    // Request dismissed (another device accepted)
    private val _requestDismissedFlow = MutableSharedFlow<String>(
        replay = 1,
        extraBufferCapacity = 64
    )
    val requestDismissedFlow = _requestDismissedFlow.asSharedFlow()

    // Currently serving (this device accepted)
    private val _currentlyServingFlow = MutableSharedFlow<ServiceUpdate>(
        replay = 1,
        extraBufferCapacity = 64
    )
    val currentlyServingFlow = _currentlyServingFlow.asSharedFlow()

    // Request completed
    private val _requestCompletedFlow = MutableSharedFlow<String>(
        replay = 1,
        extraBufferCapacity = 64
    )
    val requestCompletedFlow = _requestCompletedFlow.asSharedFlow()

    // DND updates
    private val _dndUpdateFlow = MutableSharedFlow<DndUpdate>(
        replay = 1,
        extraBufferCapacity = 64
    )
    val dndUpdateFlow = _dndUpdateFlow.asSharedFlow()

    /**
     * Set the current crew member name for cross-device dismissal logic.
     */
    fun setCurrentCrewMember(name: String?) {
        currentCrewMemberName = name
    }

    /**
     * Connect to MQTT broker.
     */
    fun connect(context: Context) {
        appContext = context.applicationContext

        NotificationHelper.createNotificationChannels(context)

        CLIENT_ID = DeviceInfoHelper.getDeviceId(context)
        Log.d(TAG, "Watch Device ID: $CLIENT_ID")

        if (mqttClient?.isConnected == true) {
            Log.d(TAG, "Already connected to MQTT broker")
            _connectionStatus.value = ConnectionStatus.CONNECTED
            return
        }

        try {
            val brokerUrl = ServerConfig.getMqttUrl()
            Log.d(TAG, "Connecting to MQTT broker: $brokerUrl")

            mqttClient = MqttAndroidClient(context, brokerUrl, CLIENT_ID)

            mqttClient?.setCallback(object : MqttCallback {
                override fun connectionLost(cause: Throwable?) {
                    Log.w(TAG, "MQTT Connection Lost: ${cause?.message}")
                    _connectionStatus.value = ConnectionStatus.DISCONNECTED
                }

                override fun messageArrived(topic: String?, message: MqttMessage?) {
                    handleIncomingMessage(topic, message)
                }

                override fun deliveryComplete(token: IMqttDeliveryToken?) {}
            })

            val options = MqttConnectOptions().apply {
                isCleanSession = true
                connectionTimeout = 30
                keepAliveInterval = 60
                isAutomaticReconnect = true
            }

            _connectionStatus.value = ConnectionStatus.CONNECTING

            mqttClient?.connect(options, null, object : IMqttActionListener {
                override fun onSuccess(asyncActionToken: IMqttToken?) {
                    Log.i(TAG, "MQTT Connected successfully!")
                    _connectionStatus.value = ConnectionStatus.CONNECTED
                    registerDevice()
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

    private fun registerDevice() {
        appContext?.let { context ->
            try {
                val registrationData = mapOf(
                    "deviceId" to CLIENT_ID,
                    "type" to "watch",
                    "name" to DeviceInfoHelper.generateFriendlyName(context),
                    "firmwareVersion" to "Wear OS ${DeviceInfoHelper.getAndroidVersion()}",
                    "hardwareVersion" to DeviceInfoHelper.getDeviceModel(),
                    "macAddress" to CLIENT_ID
                )

                val message = MqttMessage(gson.toJson(registrationData).toByteArray())
                message.qos = 1

                mqttClient?.publish(getDeviceRegisterTopic(), message, null, object : IMqttActionListener {
                    override fun onSuccess(asyncActionToken: IMqttToken?) {
                        Log.i(TAG, "Device registered: ${DeviceInfoHelper.getDeviceModel()}")
                    }

                    override fun onFailure(asyncActionToken: IMqttToken?, exception: Throwable?) {
                        Log.e(TAG, "Device registration failed: ${exception?.message}")
                    }
                })
            } catch (e: Exception) {
                Log.e(TAG, "Error registering device: ${e.message}", e)
            }
        }
    }

    private fun subscribeToTopics() {
        try {
            // Watch-specific notifications
            subscribeToTopic(getNotificationTopic())

            // Service request status updates (for cross-device dismissal)
            subscribeToTopic(getServiceUpdatesTopic())

            // DND status changes
            subscribeToTopic(getDndTopic())

        } catch (e: Exception) {
            Log.e(TAG, "MQTT subscription error: ${e.message}", e)
        }
    }

    private fun subscribeToTopic(topic: String) {
        mqttClient?.subscribe(topic, 1, null, object : IMqttActionListener {
            override fun onSuccess(asyncActionToken: IMqttToken?) {
                Log.i(TAG, "Subscribed to: $topic")
            }

            override fun onFailure(asyncActionToken: IMqttToken?, exception: Throwable?) {
                Log.e(TAG, "Failed to subscribe to $topic: ${exception?.message}")
            }
        })
    }

    private fun handleIncomingMessage(topic: String?, message: MqttMessage?) {
        if (topic == null || message == null) return

        try {
            val payload = message.toString()
            Log.d(TAG, "MQTT message on $topic: $payload")

            when {
                // New service request notification
                topic == getNotificationTopic() -> {
                    handleNewRequest(payload)
                }

                // Service status update (cross-device dismissal)
                topic == getServiceUpdatesTopic() -> {
                    handleServiceUpdate(payload)
                }

                // DND status change
                topic.startsWith("obedio/location/") && topic.endsWith("/dnd") -> {
                    handleDndUpdate(payload)
                }
            }

        } catch (e: Exception) {
            Log.e(TAG, "Error parsing MQTT message: ${e.message}", e)
        }
    }

    private fun handleNewRequest(payload: String) {
        try {
            Log.i(TAG, ">>> handleNewRequest called!")
            Log.d(TAG, ">>> Payload: $payload")

            val notification = gson.fromJson(payload, WatchNotification::class.java)
            Log.i(TAG, ">>> Parsed notification - requestId: ${notification.requestId}, location: ${notification.location}, guest: ${notification.guest}")

            val serviceRequest = notification.toServiceRequest()
            _newRequestFlow.tryEmit(serviceRequest)
            Log.d(TAG, ">>> Emitted to newRequestFlow")

            if (appContext == null) {
                Log.e(TAG, "!!! CRITICAL: appContext is NULL - cannot show notification!")
                Log.e(TAG, "!!! Call MqttManager.connect(context) first to set appContext")
                return
            }

            appContext?.let { context ->
                Log.d(TAG, ">>> Acquiring wake lock...")
                acquireScreenWakeLock(context)

                Log.d(TAG, ">>> Showing full-screen notification...")
                NotificationHelper.showFullScreenNotification(context, serviceRequest)

                Log.d(TAG, ">>> Launching FullScreenRequestActivity...")
                // Launch full-screen activity
                val intent = android.content.Intent(context, FullScreenRequestActivity::class.java).apply {
                    flags = android.content.Intent.FLAG_ACTIVITY_NEW_TASK or android.content.Intent.FLAG_ACTIVITY_CLEAR_TOP
                    putExtra("service_request", gson.toJson(serviceRequest))
                }
                context.startActivity(intent)
                Log.d(TAG, ">>> Activity started!")

                scheduleWakeLockRelease(10000L)
            }
        } catch (e: Exception) {
            Log.e(TAG, "!!! Error handling new request: ${e.message}", e)
            e.printStackTrace()
        }
    }

    // Clear all blips flow (for clear-all action)
    private val _clearAllFlow = MutableSharedFlow<Unit>(
        replay = 1,
        extraBufferCapacity = 64
    )
    val clearAllFlow = _clearAllFlow.asSharedFlow()

    /**
     * Handle service update - CRITICAL for cross-device dismissal.
     */
    private fun handleServiceUpdate(payload: String) {
        try {
            val update = gson.fromJson(payload, ServiceUpdate::class.java)
            Log.i(TAG, "Service update: ${update.requestId ?: "N/A"} -> ${update.status}, action: ${update.action ?: "N/A"}")

            // Handle clear-all action
            if (update.action == "clear-all") {
                Log.i(TAG, "Clear all requests received - dismissing all blips")
                _clearAllFlow.tryEmit(Unit)
                // Cancel all notifications
                appContext?.let { context ->
                    NotificationHelper.cancelAllNotifications(context)
                }
                return
            }

            when (update.status) {
                "serving" -> {
                    // Another device accepted this request
                    appContext?.let { context ->
                        NotificationHelper.cancelNotificationForRequest(context, update.requestId)
                    }

                    // Emit to ViewModel to remove blip
                    _requestDismissedFlow.tryEmit(update.requestId)

                    // If we accepted, update Serving Now
                    if (update.assignedTo == currentCrewMemberName) {
                        _currentlyServingFlow.tryEmit(update)
                    }
                }

                "completed" -> {
                    _requestCompletedFlow.tryEmit(update.requestId)
                }

                "deleted" -> {
                    // Request was deleted from web app
                    Log.i(TAG, "Request deleted: ${update.requestId}")
                    appContext?.let { context ->
                        NotificationHelper.cancelNotificationForRequest(context, update.requestId)
                    }
                    _requestDismissedFlow.tryEmit(update.requestId)
                }

                "delegated" -> {
                    // Request was delegated to another crew member
                    Log.i(TAG, "Request delegated: ${update.requestId}")
                    appContext?.let { context ->
                        NotificationHelper.cancelNotificationForRequest(context, update.requestId)
                    }
                    _requestDismissedFlow.tryEmit(update.requestId)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error handling service update: ${e.message}", e)
        }
    }

    private fun handleDndUpdate(payload: String) {
        try {
            val dndUpdate = gson.fromJson(payload, DndUpdate::class.java)
            Log.i(TAG, "DND update: ${dndUpdate.locationName} -> ${dndUpdate.doNotDisturb}")
            _dndUpdateFlow.tryEmit(dndUpdate)
        } catch (e: Exception) {
            Log.e(TAG, "Error handling DND update: ${e.message}", e)
        }
    }

    /**
     * Send acknowledgment when crew accepts request.
     */
    fun acknowledgeRequest(requestId: String, action: String = "accept") {
        try {
            val ackPayload = gson.toJson(mapOf(
                "requestId" to requestId,
                "action" to action,
                "status" to "acknowledged",
                "timestamp" to System.currentTimeMillis()
            ))

            val message = MqttMessage(ackPayload.toByteArray())
            message.qos = 1

            mqttClient?.publish(getAcknowledgeTopic(), message, null, object : IMqttActionListener {
                override fun onSuccess(asyncActionToken: IMqttToken?) {
                    Log.i(TAG, "Acknowledgment sent for: $requestId")
                }

                override fun onFailure(asyncActionToken: IMqttToken?, exception: Throwable?) {
                    Log.e(TAG, "Failed to send acknowledgment: ${exception?.message}")
                }
            })
        } catch (e: Exception) {
            Log.e(TAG, "Error sending acknowledgment: ${e.message}", e)
        }
    }

    /**
     * Publish device telemetry.
     */
    fun publishTelemetry(telemetry: Map<String, Any>) {
        try {
            val message = MqttMessage(gson.toJson(telemetry).toByteArray())
            message.qos = 0  // QoS 0 for telemetry (fire and forget)

            mqttClient?.publish(getTelemetryTopic(), message, null, null)
        } catch (e: Exception) {
            Log.e(TAG, "Error publishing telemetry: ${e.message}", e)
        }
    }

    fun disconnect() {
        try {
            mqttClient?.disconnect()
            _connectionStatus.value = ConnectionStatus.DISCONNECTED
        } catch (e: Exception) {
            Log.e(TAG, "Error disconnecting: ${e.message}", e)
        }
    }

    fun isConnected(): Boolean = mqttClient?.isConnected == true

    private fun acquireScreenWakeLock(context: Context) {
        try {
            releaseScreenWakeLock()
            val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
            screenWakeLock = powerManager.newWakeLock(
                PowerManager.SCREEN_BRIGHT_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP,
                "ObedioWear2:NotificationWake"
            )
            screenWakeLock?.acquire(15000L)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to acquire wake lock: ${e.message}", e)
        }
    }

    private fun scheduleWakeLockRelease(delayMs: Long) {
        wakeLockScope.launch {
            delay(delayMs)
            releaseScreenWakeLock()
        }
    }

    private fun releaseScreenWakeLock() {
        try {
            screenWakeLock?.let {
                if (it.isHeld) it.release()
            }
            screenWakeLock = null
        } catch (e: Exception) {
            Log.e(TAG, "Failed to release wake lock: ${e.message}", e)
        }
    }

    /**
     * Watch notification data class.
     */
    private data class WatchNotification(
        val requestId: String,
        val type: String,
        val title: String,
        val message: String,
        val location: String,
        val locationImage: String? = null,
        val guest: String,
        val priority: String,
        val timestamp: String,
        val voiceTranscript: String? = null,
        val audioUrl: String? = null
    ) {
        fun toServiceRequest(): ServiceRequest {
            val guestParts = guest.split(" ", limit = 2)

            return ServiceRequest(
                id = requestId,
                status = Status.PENDING,
                priority = when (priority.lowercase()) {
                    "emergency" -> Priority.EMERGENCY
                    "urgent" -> Priority.URGENT
                    else -> Priority.NORMAL
                },
                requestType = when (type.lowercase()) {
                    "emergency" -> RequestType.EMERGENCY
                    "voice" -> RequestType.VOICE
                    "dnd" -> RequestType.DND
                    "lights" -> RequestType.LIGHTS
                    "prepare_food" -> RequestType.PREPARE_FOOD
                    "bring_drinks" -> RequestType.BRING_DRINKS
                    "service" -> RequestType.SERVICE
                    else -> RequestType.CALL
                },
                notes = message,
                voiceTranscript = voiceTranscript,
                audioUrl = audioUrl,
                createdAt = timestamp,
                acknowledgedAt = null,
                completedAt = null,
                guest = Guest(
                    id = "unknown",
                    firstName = guestParts.getOrNull(0) ?: "Guest",
                    lastName = guestParts.getOrNull(1) ?: "",
                    preferredName = null,
                    photo = null
                ),
                location = Location(
                    id = "unknown",
                    name = location,
                    type = "cabin",
                    floor = null,
                    image = locationImage
                ),
                assignedCrew = null
            )
        }
    }
}
