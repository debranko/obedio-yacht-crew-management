# Sound Files for Obedio Yacht Crew Management

This directory contains audio files for notifications and alerts.

## Required Sound Files

Place the following audio files in this directory:

### 1. `notification.mp3`
- **Used for:** New service request notifications
- **Triggered when:** Guest presses smart button (normal priority)
- **Recommended:** Pleasant notification chime (1-2 seconds)
- **Free sources:**
  - https://notificationsounds.com/
  - https://mixkit.co/free-sound-effects/notification/

### 2. `emergency-alert.mp3`
- **Used for:** Emergency/shake detection alerts
- **Triggered when:** Shake-to-call feature activated (emergency)
- **Recommended:** Urgent alarm sound (2-3 seconds, repeating tone)
- **Free sources:**
  - https://freesound.org/search/?q=emergency+alert
  - https://www.zapsplat.com/sound-effect-category/alarms/

## Format Requirements

- **Format:** MP3 or WAV
- **Size:** < 500KB recommended
- **Duration:** 1-3 seconds
- **Sample Rate:** 44.1kHz or 48kHz
- **Bit Rate:** 128kbps or higher

## Testing

After adding sound files, test them by:
1. Going to Service Requests page
2. Using the Button Simulator
3. Pressing the physical ESP32 button (if assigned to location)

## Current Status

✅ `/public/sounds/` directory created
❌ No audio files present yet

To enable audio notifications, add the required MP3/WAV files to this directory.
