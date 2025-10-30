# OBEDIO Environment Variables Guide

This document explains all environment variables used in the OBEDIO Yacht Crew Management System.

---

## **BACKEND Environment Variables**

Location: `backend/.env`

### **Server Configuration**

```env
PORT=8080
```
**Description:** Port where the backend API server runs
**Default:** 8080
**Used by:** Express server
**Access URL:** http://localhost:8080

```env
NODE_ENV=development
```
**Description:** Application environment mode
**Values:** `development` | `production` | `test`
**Default:** development
**Note:** In production, set to `production` for optimizations

---

### **Database Configuration**

```env
DATABASE_URL="postgresql://postgres:obediobranko@localhost:5432/obedio_yacht_db?schema=public"
```
**Description:** PostgreSQL database connection string
**Format:** `postgresql://[user]:[password]@[host]:[port]/[database]?schema=[schema]`
**Components:**
- **User:** `postgres`
- **Password:** `obediobranko`
- **Host:** `localhost`
- **Port:** `5432`
- **Database:** `obedio_yacht_db`
- **Schema:** `public`

**Used by:** Prisma ORM for all database operations

---

### **Authentication**

```env
JWT_SECRET="af7bae6536b8a4d6a79139ebfaf48c0d22ca77b3a86837081391b7971fd436c4d6defa1037e571a3a94325a5f8e87ba139e4a94f021a903a69c1df43f1a2b27e"
```
**Description:** Secret key for signing JWT tokens
**Security:** MUST be a long, random string (128 characters recommended)
**Used by:** JWT authentication middleware
**⚠️ IMPORTANT:** Change this in production! Never commit to Git!

---

### **CORS Settings**

```env
CORS_ORIGIN="http://localhost:5173"
```
**Description:** Allowed origins for Cross-Origin Resource Sharing
**Default:** `http://localhost:5173` (Vite dev server)
**Production:** Set to your frontend domain (e.g., `https://obedio.yacht`)
**Multiple origins:** Use comma-separated list: `"http://localhost:5173,https://obedio.yacht"`

---

### **MQTT Configuration**

```env
MQTT_BROKER="mqtt://localhost:1883"
```
**Description:** MQTT broker URL for ESP32 device communication
**Default:** `mqtt://localhost:1883` (local Mosquitto)
**Docker:** `mqtt://obedio-mosquitto:1883`
**Used by:** ESP32 smart buttons and T-Watch devices

```env
MQTT_USERNAME=""
MQTT_PASSWORD=""
```
**Description:** MQTT broker authentication credentials
**Default:** Empty (no auth for local development)
**Production:** Set username/password for secure MQTT connection

```env
MQTT_MONITOR_PORT=8888
```
**Description:** Port for MQTT monitoring web interface
**Default:** 8888
**Access URL:** http://localhost:8888

---

### **OpenAI API (Optional)**

```env
OPENAI_API_KEY="sk-proj-..."
```
**Description:** OpenAI API key for AI features (voice transcription, etc.)
**Optional:** System works without this
**Used by:** Voice-to-text transcription for service requests
**⚠️ SECURITY:** Keep this secret! Never commit to Git!

---

## **FRONTEND Environment Variables**

Location: `.env` (root directory)

### **API Configuration**

```env
VITE_API_URL=http://localhost:8080
```
**Description:** Backend API base URL
**Default:** `http://localhost:8080`
**Production:** Set to production API URL (e.g., `https://api.obedio.yacht`)
**Used by:** All API calls from frontend

---

### **WebSocket Configuration**

```env
VITE_WEBSOCKET_URL=ws://localhost:8080
```
**Description:** WebSocket server URL for real-time updates
**Default:** `ws://localhost:8080`
**Production:** `wss://api.obedio.yacht` (secure WebSocket)
**Used by:** Real-time service requests, crew updates, notifications

---

### **MQTT Configuration (Frontend)**

```env
VITE_MQTT_BROKER=ws://localhost:9001
```
**Description:** MQTT broker WebSocket URL for browser connections
**Default:** `ws://localhost:9001`
**Note:** Mosquitto WebSocket listener (port 9001, not 1883)
**Used by:** Virtual button simulator, device status monitoring

---

## **How to Check Your Environment Variables**

### **Backend:**
```bash
cd backend
cat .env
```

### **Frontend:**
```bash
cat .env
```

### **Verify Backend is Using Correct Variables:**
```bash
# Start backend and check logs
cd backend
npm run dev

# You should see:
# ✅ Database connected successfully
# 🔌 Connecting to MQTT broker: mqtt://localhost:1883
# 🚀 Server listening on port 8080
```

### **Verify Frontend is Using Correct Variables:**
1. Open browser console (F12)
2. Go to Console tab
3. Look for:
   - `VITE_API_URL: http://localhost:8080`
   - `VITE_WEBSOCKET_URL: ws://localhost:8080`
   - `VITE_MQTT_BROKER: ws://localhost:9001`

---

## **Common Issues**

### **"Cannot connect to database"**
**Solution:** Check `DATABASE_URL` is correct and PostgreSQL is running

### **"CORS error"**
**Solution:** Check `CORS_ORIGIN` matches your frontend URL

### **"MQTT connection failed"**
**Solution:**
1. Check Mosquitto Docker container is running: `docker ps`
2. Verify `MQTT_BROKER` URL is correct
3. Check `MQTT_MONITOR_PORT` is not blocked

### **"JWT token invalid"**
**Solution:** Backend and frontend must use the same `JWT_SECRET`

---

## **Production Deployment Checklist**

- [ ] Change `JWT_SECRET` to a new random string
- [ ] Set `NODE_ENV=production`
- [ ] Update `DATABASE_URL` to production database
- [ ] Update `CORS_ORIGIN` to production frontend domain
- [ ] Set `VITE_API_URL` to production API URL
- [ ] Set `VITE_WEBSOCKET_URL` to production WebSocket URL (wss://)
- [ ] Remove or secure `OPENAI_API_KEY`
- [ ] Set MQTT username/password if using external broker
- [ ] Never commit `.env` files to Git!

---

## **Example Production Configuration**

### **Backend (.env)**
```env
PORT=8080
NODE_ENV=production
DATABASE_URL="postgresql://obedio_user:SECURE_PASSWORD@db.obedio.yacht:5432/obedio_prod?schema=public"
JWT_SECRET="GENERATE_NEW_RANDOM_128_CHAR_STRING_HERE"
CORS_ORIGIN="https://app.obedio.yacht"
MQTT_BROKER="mqtts://mqtt.obedio.yacht:8883"
MQTT_USERNAME="obedio_mqtt"
MQTT_PASSWORD="SECURE_MQTT_PASSWORD"
MQTT_MONITOR_PORT=8888
```

### **Frontend (.env)**
```env
VITE_API_URL=https://api.obedio.yacht
VITE_WEBSOCKET_URL=wss://api.obedio.yacht
VITE_MQTT_BROKER=wss://mqtt.obedio.yacht:9001
```

---

## **Current Configuration**

Your current setup:
- **Backend:** http://localhost:8080
- **Frontend:** http://localhost:5173
- **Database:** PostgreSQL on localhost:5432
- **MQTT:** Mosquitto Docker on localhost:1883 (WebSocket on 9001)
- **WebSocket:** ws://localhost:8080

All services are running locally for development.
