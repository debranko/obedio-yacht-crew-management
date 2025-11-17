# 🚀 BUILD & TEST INSTRUCTIONS
## OBEDIO Wear OS App - TicWatch Pro 5

**Datum**: October 27, 2025
**Status**: ✅ CODE COMPLETE - Ready to build and test!

---

## 📦 ŠTA JE IMPLEMENTIRANO

### **✅ Backend Communication**
1. **Data Models** (4 fajla):
   - `ServiceRequest.kt` - Service request sa priority, status, nested relations
   - `Location.kt` - Location sa image URL za background
   - `Guest.kt` - Guest sa photo
   - `CrewMember.kt` - Crew member info

2. **API Layer** (2 fajla):
   - `ApiService.kt` - Retrofit interface sa 3 endpoints
   - `ApiClient.kt` - Retrofit singleton sa OkHttp logging

3. **WebSocket Layer** (1 fajl):
   - `WebSocketManager.kt` - Socket.IO client sa auto-reconnect

### **✅ Business Logic**
4. **ViewModel** (1 fajl):
   - `ServiceRequestViewModel.kt` - State management, Accept/Delegate logic

5. **Utils** (1 fajl):
   - `VibrationHelper.kt` - Priority-based vibration patterns

### **✅ UI Layer**
6. **Components** (1 fajl):
   - `IncomingRequestScreen.kt` - Full-screen notification UI

7. **Main Activity** (1 fajl):
   - `MainActivity.kt` - Integration sa ViewModel, WebSocket

8. **Manifest** (updated):
   - `AndroidManifest.xml` - INTERNET, VIBRATE permissions

---

## 🔧 BUILD PROJEKAT

### **Korak 1: Sync Gradle (ako nije već)**

U Android Studio:
1. **File → Sync Project with Gradle Files**
2. Čekaj 1-2 minuta

Ako ima grešaka, javi mi screenshot!

---

### **Korak 2: Build APK**

1. **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. Čekaj 2-3 minuta (prvi build je duži)
3. Dole desno videćeš: **"BUILD SUCCESSFUL"**

Ili preko terminala (brže):
```cmd
cd C:\Users\debra\AndroidStudioProjects\ObedioWear
gradlew assembleDebug
```

---

## 📱 DEPLOY NA TICWATCH PRO 5

### **Proveri ADB konekciju**

```cmd
cd C:\Users\debra\AppData\Local\Android\Sdk\platform-tools
adb devices
```

Trebao bi videti:
```
192.168.5.172:xxxxx    device
```

Ako ne vidiš, reconnect:
```cmd
adb connect 192.168.5.172:xxxxx
```

---

### **Install na TicWatch**

**Opcija A: Iz Android Studio (preporučeno)**
1. Toolbar → Device dropdown → Select **"Mobvoi TicWatch Pro 5"**
2. Klikni **zeleni Play button** (Run)
3. App će se build-ovati i automatski install-ovati
4. Čekaj 2-3 minuta
5. App će se automatski pokrenuti na satu!

**Opcija B: Manuelno preko ADB**
```cmd
cd C:\Users\debra\AndroidStudioProjects\ObedioWear\app\build\outputs\apk\debug
adb install -r app-debug.apk
```

---

## 🧪 TESTIRANJE

### **Test 1: App Pokrenut ✅**

Na TicWatch-u vidi:
- Screen sa "OBEDIO" naslovom
- "Crew Watch" subtitle
- Connection status (Connecting... / Connected / Disconnected)
- "Waiting for service requests..."

---

### **Test 2: WebSocket Connection ✅**

**Proveri u Logcat-u** (Android Studio → Logcat dole):

```
WebSocketManager: Connecting to WebSocket server...
WebSocketManager: WebSocket Connected!
```

Ako vidiš **"WebSocket Connection Error"**:
- Proveri da li backend radi (`http://192.168.5.172:8080`)
- Proveri firewall na backend-u
- Proveri da li TicWatch i backend su na istoj WiFi mreži

Status indicator na satu će biti:
- 🟢 **Green dot** = Connected
- 🟡 **Yellow dot** = Connecting
- 🔴 **Red dot** = Disconnected

---

### **Test 3: Incoming Request Notification 🎯 GLAVNI TEST**

**Trigger service request iz backend-a ili frontend-a:**

1. **Otvori OBEDIO web app** u browser-u
2. **Simulate button press** ili koristi test button
3. **Backend će emit-ovati WebSocket event**: `service-request:created`

**Očekivano ponašanje na TicWatch-u:**

1. **Vibration** (3 bursta za urgent/emergency)
2. **Full-screen notification** se pojavi:
   - Location background image (dimmed)
   - Priority badge (🔔 URGENT ili 🚨 EMERGENCY)
   - Location name (veliki font): "Master Bedroom"
   - Guest name: "Leonardo DiCaprio"
   - Message (ako postoji): "Extra towels please"
   - **ACCEPT** button (colored by priority)
   - **DELEGATE** button

---

### **Test 4: Accept Request ✅**

1. **Tap ACCEPT button** na notifikaciji
2. **Očekivano**:
   - API call: `POST /api/service-requests/:id/accept`
   - Backend update-uje status → `accepted`
   - WebSocket broadcast: `service-request:updated`
   - Notification **automatically closes** (nakon što primi WebSocket update)
   - Web app vidi update u real-time

**Proveri u Logcat-u**:
```
ApiService: Accepting request...
WebSocketManager: Received 'service-request:updated' event
ServiceRequestViewModel: Request accepted, closing notification
```

---

### **Test 5: Delegate Request ✅**

1. **Tap DELEGATE button** na notifikaciji
2. **Lista crew members** se prikaže (scrollable)
   - On-duty crew members sa positions
   - "← Back" button na dnu
3. **Tap na crew member** (npr. "Sarah Johnson")
4. **Očekivano**:
   - API call: `POST /api/service-requests/:id/accept` sa `crewMemberId`
   - Backend update-uje `assignedToId` + status → `accepted`
   - WebSocket broadcast: `service-request:updated`
   - Notification **automatically closes**

---

### **Test 6: Multiple Requests 🎯**

Šta se dešava ako stignu **2+ requesta istovremeno**?

**Ponašanje**:
- ViewModel drži **samo jedan request** u `currentRequest` state
- Prikazuje se **prvi pending request**
- Kada korisnik accept-uje/delegate-uje prvi, ViewModel automatski load-uje sledeći pending

**To test**:
1. Trigger 3 requesta brzo (jedan za drugim)
2. Accept prvi → drugi se automatski prikaže
3. Accept drugi → treći se automatski prikaže

---

## 🐛 TROUBLESHOOTING

### **Problem 1: Build Error - Missing dependency**

**Error**: `Unresolved reference: Coil / Socket / Retrofit`

**Rešenje**:
1. Check `app/build.gradle.kts` ima sve dependencies
2. **File → Invalidate Caches → Invalidate and Restart**
3. **File → Sync Project with Gradle Files**

---

### **Problem 2: WebSocket ne connect-uje**

**Symptom**: Status ostaje "Connecting..." ili "Disconnected"

**Debug**:
1. **Proveri backend IP adresu** u:
   - `ApiClient.kt`: `BASE_URL = "http://192.168.5.172:8080/"`
   - `WebSocketManager.kt`: `SERVER_URL = "http://192.168.5.172:8080"`

2. **Proveri da li backend radi**:
   ```cmd
   curl http://192.168.5.172:8080/api/service-requests
   ```

3. **Proveri firewall na backend machine-u**

4. **Proveri Logcat** za error messages:
   ```
   WebSocketManager: WebSocket Connection Error: [details]
   ```

---

### **Problem 3: Notifikacija ne pojavljuje se**

**Checklist**:
1. ✅ WebSocket connected? (vidi green dot na home screen)
2. ✅ Service request kreiran sa `status: "pending"`?
3. ✅ Backend emituje `service-request:created` event?

**Debug Logcat**:
```
WebSocketManager: Received 'service-request:created' event
ServiceRequestViewModel: New request received: [request details]
```

---

### **Problem 4: Accept ne radi**

**Symptom**: Klikneš Accept ali notification ne zatvara se

**Debug**:
1. **Proveri Logcat** za API error:
   ```
   ApiService: Error accepting request: [details]
   ```

2. **Proveri backend response**:
   - Backend mora vratiti `{ success: true, data: {...} }`
   - Backend mora emit-ovati `service-request:updated` event

3. **Proveri network connectivity**:
   - TicWatch mora imati WiFi pristup backend-u
   - Firewall ne sme blokirati requests

---

### **Problem 5: Delegate lista prazna**

**Symptom**: Tap Delegate → "No crew available"

**Uzrok**: API endpoint ne vraća crew members

**Debug**:
```
GET /api/crew/members?status=on-duty&department=Interior
```

**Rešenje**:
- Proveri da li backend ima crew members sa `status: "on-duty"`
- Proveri da li endpoint `/api/crew/members` postoji

---

## 🎯 SUCCESS CRITERIA

✅ **App je uspešno testiran kada:**

1. ✅ App se pokreće na TicWatch-u
2. ✅ Home screen prikazuje "OBEDIO Crew Watch"
3. ✅ WebSocket status pokazuje "Connected" (green dot)
4. ✅ Backend može trigger-ovati novi service request
5. ✅ Notification se pojavljuje full-screen sa vibracijom
6. ✅ Accept button poziva API i zatvara notification
7. ✅ Delegate button prikazuje crew listu
8. ✅ Delegate na crew member-a poziva API i zatvara notification
9. ✅ Web app vidi updates u real-time (WebSocket broadcast radi)
10. ✅ Multiple requests se queue-uju i prikazuju jedan po jedan

---

## 📝 KNOWN LIMITATIONS (MVP)

1. **No login system** - Hardcoded `crewMemberId = "test-crew-123"`
2. **No request history** - Samo current pending request
3. **No home screen duty timer** - Samo connection status
4. **No crew roster view** - Samo delegate list
5. **No settings** - Sve je hardcoded
6. **No offline support** - Requires active WiFi connection

**Sve ovo može biti dodato kasnije!**

---

## 🚀 SLEDEĆE FAZE (Post-MVP)

### **Faza 2: Login & Authentication**
- QR code login screen
- JWT token storage
- Device registration sa crew member ID

### **Faza 3: Home Screen Enhancements**
- Duty timer countdown (kao na web app-u)
- Today's stats (requests served, pending)
- Crew online count

### **Faza 4: Request History**
- View completed requests
- Filter by date/status
- Performance metrics

### **Faza 5: Crew Roster**
- View all on-duty crew
- See who's assigned where
- Real-time crew status updates

### **Faza 6: Watch Face**
- Custom complications (pending requests count, duty timer)
- Always-on display sa FSTN low-power screen

---

## ✅ READY TO TEST!

**Javi mi:**
1. Screenshot home screen-a kada app startuje
2. Screenshot Logcat-a kada WebSocket connect-uje
3. Screenshot incoming request notifikacije
4. Da li Accept/Delegate radi

**I'm here to help if anything doesn't work!** 🚀
