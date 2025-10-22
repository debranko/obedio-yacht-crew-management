# 🚨 Emergency Shake Feature - CRITICAL SAFETY

## 🎯 Purpose
When a guest activates the **Emergency Shake** on the ESP32 smart button, the system immediately displays **CRITICAL MEDICAL INFORMATION** to responding crew members. This can **save lives** in medical emergencies!

---

## 🔧 How It Works

### **1. Guest Emergency Action**
Guest in cabin experiences medical emergency and **shakes the ESP32 button violently**.

### **2. System Response**
ESP32 detects shake motion → Sends emergency signal → System creates **EMERGENCY PRIORITY** service request

### **3. Critical Information Display**
Service request automatically includes:
- ⚠️ **Medical Conditions** (diabetes, heart condition, etc.)
- 🚨 **Allergies** (medications, foods that could be life-threatening)
- 🍽️ **Dietary Restrictions** (may be relevant to medical condition)
- 📞 **Emergency Contact** (family member to call immediately)
- 📋 **Preferences** (may contain important health info)

---

## 📋 Example Emergency Request

### **Scenario:** Leonardo DiCaprio in Master Suite activates emergency shake

**Service Request displays:**
```
🚨 EMERGENCY - Shake to Call
Master Suite - Owner's Deck

Guest: Leonardo DiCaprio

⚠️ MEDICAL CONDITIONS: Diabetes Type 2, Hypertension
🚨 ALLERGIES: Penicillin, Shellfish
🍽️ DIETARY: Low sodium, Sugar-free
📞 EMERGENCY CONTACT: Blake Lively (Spouse) +1 555 1234
📋 PREFERENCES: Insulin injections 8AM and 8PM, Keep glucose tablets nearby
```

**Crew immediately knows:**
- ✅ Don't give Penicillin if unconscious
- ✅ Check blood sugar (diabetes)
- ✅ Call Blake Lively
- ✅ Look for insulin/glucose tablets
- ✅ Monitor blood pressure

---

## 🎬 Demo Scenario

### **Setup:**
1. Edit Leonardo DiCaprio:
   - Medical Conditions: `Diabetes Type 2`, `Hypertension`
   - Allergies: `Penicillin`, `Shellfish`
   - Dietary: `Low sodium`, `Sugar-free`
   - Emergency Contact: `Blake Lively`, `+1 555 1234`, `Spouse`
   - Preferences: `Insulin injections 8AM and 8PM`
   - Save

### **Test Emergency Shake:**
1. Go to Dashboard → ESP32 Simulator
2. Select **Master Suite**
3. **Shake Button** (red emergency button in center)
4. **Emergency dialog appears** with ALL medical information!
5. Crew can immediately act with critical knowledge

---

## ✅ Safety Benefits

### **Before Emergency Shake:**
- ❌ Crew arrives, guest unconscious
- ❌ Don't know about diabetes
- ❌ Don't know about medication allergies
- ❌ Don't know who to call
- ❌ Waste precious time asking questions
- ❌ Could give wrong medication → FATAL

### **After Emergency Shake:**
- ✅ Crew sees medical conditions IMMEDIATELY
- ✅ Knows allergies - won't give dangerous drugs
- ✅ Can call emergency contact right away
- ✅ Can provide proper first aid
- ✅ Can brief paramedics/doctors
- ✅ **SAVES LIVES!**

---

## 📊 Technical Implementation

### **Code Location:** `button-simulator-widget.tsx`

```typescript
// CRITICAL: Add medical information for EMERGENCY priority requests
if (requestPriority === 'emergency' && guestAtLocation) {
  const medicalInfo: string[] = [];
  
  // Medical Conditions
  if (guestAtLocation.medicalConditions && guestAtLocation.medicalConditions.length > 0) {
    medicalInfo.push(`⚠️ MEDICAL CONDITIONS: ${guestAtLocation.medicalConditions.join(', ')}`);
  }
  
  // Allergies
  if (guestAtLocation.allergies && guestAtLocation.allergies.length > 0) {
    medicalInfo.push(`🚨 ALLERGIES: ${guestAtLocation.allergies.join(', ')}`);
  }
  
  // Emergency Contact
  if (guestAtLocation.emergencyContactName || guestAtLocation.emergencyContactPhone) {
    const contact = [];
    if (guestAtLocation.emergencyContactName) contact.push(guestAtLocation.emergencyContactName);
    if (guestAtLocation.emergencyContactRelation) contact.push(`(${guestAtLocation.emergencyContactRelation})`);
    if (guestAtLocation.emergencyContactPhone) contact.push(guestAtLocation.emergencyContactPhone);
    medicalInfo.push(`📞 EMERGENCY CONTACT: ${contact.join(' ')}`);
  }
}
```

---

## 🔄 Data Flow

1. **Database** stores guest medical info
2. **ESP32 Button** detects shake → emergency signal
3. **Button Simulator** receives emergency
4. **System queries database** for guest in that cabin
5. **Extracts medical data** from guest profile
6. **Creates service request** with embedded medical info
7. **Crew receives alert** with all critical information
8. **Crew can act immediately** with full knowledge

---

## 🎯 Priority System

### **Normal Request** (button tap)
```
Service Request Created
Master Suite
Leonardo DiCaprio
```

### **Emergency Request** (shake)
```
🚨 EMERGENCY - Shake to Call
Master Suite
Leonardo DiCaprio

⚠️ MEDICAL CONDITIONS: Diabetes Type 2
🚨 ALLERGIES: Penicillin
📞 EMERGENCY CONTACT: Blake Lively +1 555 1234
```

**Emergency requests:**
- ✅ Red color (destructive variant)
- ✅ Pulse animation
- ✅ Auto-priority to top of list
- ✅ Medical info embedded
- ✅ Cannot be ignored

---

## 📝 Required Guest Information

For emergency shake to be effective, guests should have:

### **CRITICAL (Life-Saving):**
- ✅ Medical Conditions
- ✅ Allergies (especially medications)
- ✅ Emergency Contact (name + phone + relation)

### **IMPORTANT (Medical Response):**
- ✅ Dietary Restrictions (often related to medical conditions)
- ✅ Preferences (may contain health info like "insulin injections")

### **OPTIONAL:**
- Regular preferences
- Staff notes

---

## 🚀 How to Use

### **For Crew Adding Guest:**
1. Go to **Guests** → **Add New Guest** or **Edit Guest**
2. Fill **Basic Info** tab
3. **CRITICAL:** Fill **Dietary** tab:
   - Medical Conditions
   - Allergies
   - Dietary Restrictions
4. **CRITICAL:** Fill **Notes** tab:
   - Emergency Contact (name, phone, relation)
   - Preferences (any medical notes)
5. Save

### **For Guest in Emergency:**
1. **Shake ESP32 button violently**
2. Button detects emergency motion
3. Sends emergency signal
4. Crew receives alert with medical info
5. Help arrives with full knowledge

### **For Crew Responding:**
1. Receive emergency alert
2. **READ MEDICAL INFO IMMEDIATELY**
3. Check for medical conditions
4. Check for allergies (don't give wrong medication!)
5. Call emergency contact
6. Provide proper first aid
7. Brief medical team

---

## 🎉 Production Ready

- ✅ **Database schema** includes all medical fields
- ✅ **Backend API** saves/retrieves medical data
- ✅ **Frontend** captures medical information
- ✅ **Emergency shake** embeds medical info in request
- ✅ **TypeScript types** aligned
- ✅ **No hardcode** - all from database

---

## 🔐 Safety & Privacy

- Medical information only shown in **EMERGENCY requests**
- Normal service requests don't expose medical data
- Only assigned crew sees emergency alerts
- Database securely stores sensitive information
- HIPAA/GDPR considerations for medical data

---

## 🎬 Demo Checklist

1. ✅ Edit guest with medical conditions
2. ✅ Add allergies (especially medication allergies)
3. ✅ Add emergency contact
4. ✅ Save guest
5. ✅ Open ESP32 Simulator
6. ✅ Select guest's cabin
7. ✅ Press shake button
8. ✅ Show emergency dialog with medical info
9. ✅ Explain life-saving importance to client!

---

**🚨 THIS FEATURE CAN SAVE LIVES! 🚨**

Every second counts in medical emergencies. Having instant access to medical conditions, allergies, and emergency contacts can mean the difference between life and death.

**Guests with medical conditions should ALWAYS have this information filled out!**
