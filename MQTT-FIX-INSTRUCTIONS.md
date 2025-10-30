# 🚨 MQTT FIX - MANUAL STEPS 🚨

The MQTT messages are NOT being sent because the frontend hasn't loaded the new environment variable.

## DO THIS NOW:

### 1. STOP Frontend (Ctrl+C)
Find the terminal window showing Vite logs and press **Ctrl+C** to stop it completely.

### 2. Verify .env file has MQTT URL
Open `.env` file and make sure it contains:
```
VITE_MQTT_BROKER=ws://localhost:9001
```

### 3. Start Frontend Fresh
In the terminal, run:
```
npm run dev
```

### 4. Open Browser Console (F12)
After opening http://localhost:5173, press **F12** and look for these messages:

You SHOULD see:
```
🔧 MQTT connect() called
📍 Environment variables check:
  - VITE_MQTT_BROKER: ws://localhost:9001
  - Using broker URL: ws://localhost:9001
✅ Button Simulator: MQTT connected successfully
```

If you see "VITE_MQTT_BROKER: NOT SET", the environment variable is not loaded!

### 5. Test Button Press
1. Select "Lazzaret" in ESP32 Simulator
2. Press the main button
3. Check MQTT Monitor at http://localhost:8888

## If Still Not Working:

Run this command to force restart:
```
FORCE-FRONTEND-RESTART.bat
```

This will:
- Kill all Node processes
- Clear Vite cache
- Verify .env file
- Start fresh

## The Problem Explained:
Vite only loads environment variables at startup. Adding `VITE_MQTT_BROKER=ws://localhost:9001` to .env AFTER Vite started means it won't see it until a full restart.