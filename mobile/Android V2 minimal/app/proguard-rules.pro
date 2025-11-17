# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.kts.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Keep source file names, line numbers, and enclosing method names
-keepattributes SourceFile,LineNumberTable

# Keep Socket.IO
-keep class io.socket.** { *; }
-dontwarn io.socket.**

# Keep MQTT
-keep class org.eclipse.paho.** { *; }
-dontwarn org.eclipse.paho.**

# Keep OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**
