package com.example.obediowear.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.wear.compose.material.Button
import androidx.wear.compose.material.ButtonDefaults
import androidx.wear.compose.material.Text
import com.example.obediowear.utils.ServerConfig

/**
 * Dialog for configuring server IP address.
 * Triggered by long-pressing the home screen.
 */
@Composable
fun IpConfigDialog(
    onDismiss: () -> Unit,
    onSave: (String) -> Unit
) {
    var ipText by remember { mutableStateOf(TextFieldValue(ServerConfig.getServerIp())) }
    var error by remember { mutableStateOf<String?>(null) }

    Dialog(onDismissRequest = onDismiss) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0xFF1E1E1E)),
            contentAlignment = Alignment.Center
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth(0.95f)
                    .padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Title
                Text(
                    text = "Server IP",
                    color = Color(0xFFD4AF37), // Gold
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Current IP display
                Text(
                    text = "Current: ${ServerConfig.getServerIp()}",
                    color = Color.White.copy(alpha = 0.7f),
                    fontSize = 10.sp,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(12.dp))

                // IP Input field
                BasicTextField(
                    value = ipText,
                    onValueChange = {
                        ipText = it
                        error = null
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0xFF2E2E2E))
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    textStyle = TextStyle(
                        color = Color.White,
                        fontSize = 12.sp,
                        textAlign = TextAlign.Center
                    ),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(8.dp))

                // Error message
                if (error != null) {
                    Text(
                        text = error!!,
                        color = Color(0xFFEF4444), // Red
                        fontSize = 9.sp,
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                }

                // Example hint
                Text(
                    text = "Example: 192.168.1.100",
                    color = Color.White.copy(alpha = 0.4f),
                    fontSize = 9.sp,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // Cancel button
                    Button(
                        onClick = onDismiss,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(
                            backgroundColor = Color(0xFF757575) // Gray
                        )
                    ) {
                        Text(
                            text = "Cancel",
                            fontSize = 11.sp,
                            color = Color.White
                        )
                    }

                    // Save button
                    Button(
                        onClick = {
                            val newIp = ipText.text.trim()

                            // Basic IP validation
                            if (newIp.isEmpty()) {
                                error = "IP cannot be empty"
                                return@Button
                            }

                            val ipRegex = Regex("^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}$")
                            if (!ipRegex.matches(newIp)) {
                                error = "Invalid IP format"
                                return@Button
                            }

                            // Check octets are in valid range
                            val octets = newIp.split(".")
                            if (octets.any { it.toIntOrNull()?.let { n -> n < 0 || n > 255 } == true }) {
                                error = "Octets must be 0-255"
                                return@Button
                            }

                            // Save and close
                            onSave(newIp)
                        },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(
                            backgroundColor = Color(0xFF10B981) // Green
                        )
                    ) {
                        Text(
                            text = "Save",
                            fontSize = 11.sp,
                            color = Color.White,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                // Reset to default button
                Button(
                    onClick = {
                        ServerConfig.resetToDefault()
                        ipText = TextFieldValue(ServerConfig.getServerIp())
                        error = null
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(
                        backgroundColor = Color(0xFF6366F1) // Indigo
                    )
                ) {
                    Text(
                        text = "Reset to Default",
                        fontSize = 10.sp,
                        color = Color.White
                    )
                }
            }
        }
    }
}
