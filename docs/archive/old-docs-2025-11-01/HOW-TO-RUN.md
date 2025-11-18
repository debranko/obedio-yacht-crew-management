# 🚀 OBEDIO - Quick Start Guide

## ⚡ Quick Commands

### **Start the System**
Double-click: `START-OBEDIO.bat`

This will:
- ✅ Check if ports are available
- ✅ Start Backend API (Port 3001)
- ✅ Start Frontend App (Port 5173)
- ✅ Open browser automatically
- ✅ Show login credentials

**Login:** admin / password

---

### **Stop the System**
Double-click: `STOP-OBEDIO.bat`

This will:
- ✅ Close Backend server
- ✅ Close Frontend server
- ✅ Stop all Node.js processes

---

### **Restart the System**
Double-click: `RESTART-OBEDIO.bat`

This will:
- ✅ Stop all servers
- ✅ Wait a few seconds
- ✅ Start everything fresh

---

## 🔧 Database Management

### **Reset & Seed Database**
Run: `backend\FIX-DATABASE.bat`

This will:
- ✅ Generate Prisma Client
- ✅ Create database tables
- ✅ Seed celebrity guests (Leonardo DiCaprio, George Clooney, etc.)
- ✅ Open Prisma Studio to verify data

---

### **Seed Database Only**
Run: `backend\RUN-SEED-ONLY.bat`

Use this if tables already exist and you just want to add guests.

---

## 🌟 Celebrity Guests in System

The demo database includes:
- **Leonardo DiCaprio** & Scarlett Johansson (Master Suite)
- **George & Amal Clooney** (VIP Suite 1)
- **Chris Hemsworth** & Elsa Pataky (VIP Suite 2)
- **Ed Sheeran** & Cherry Seaborn (Guest Cabin 1)
- **Timothée Chalamet** & Zendaya (Guest Cabin 2)
- **Dwayne "The Rock" Johnson** & Lauren Hashian (Guest Cabin 3)
- **Ryan Reynolds** & Blake Lively (Guest Cabin 4)

---

## 📱 Web App URLs

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001/api
- **Prisma Studio:** http://localhost:5555 (when running)

---

## 🎯 Demo Features

1. **Dashboard** - Real-time yacht status
2. **Guests** - Celebrity guest list with photos
3. **Crew** - 19 crew members (Interior, Deck, Engineering, Galley)
4. **Locations** - 24 yacht locations (8 cabins, 7 common areas, 5 decks, 4 service areas)
5. **Service Requests** - Butler call system
6. **Widgets** - Weather, Clock, Guest status, DND status

---

## 💡 Troubleshooting

**Problem:** Port already in use
**Solution:** Run `STOP-OBEDIO.bat` first

**Problem:** Database error
**Solution:** Run `backend\FIX-DATABASE.bat`

**Problem:** Old data showing
**Solution:** Clear browser cache (Ctrl+Shift+R)

---

## 📞 Login Credentials

**Username:** admin
**Password:** password

---

**Ready for demo presentation! 🎬**
