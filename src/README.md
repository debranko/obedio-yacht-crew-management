# Obedio - Yacht Crew Management System

![Version](https://img.shields.io/badge/version-1.0.0-gold) ![Status](https://img.shields.io/badge/status-production--ready-success)

## 🚢 Overview

**Obedio** is a luxury yacht crew management application built with React, TypeScript, and Tailwind CSS v4. It provides comprehensive tools for managing crew duty rosters, tracking guest preferences, monitoring devices, and logging all activities across the yacht.

### Core Features

- **Dashboard** - Real-time KPIs, crew status, and quick actions
- **Crew Management** - Complete crew roster with duty assignments, groups, and scheduling
- **Guests Management** - Track guest preferences, allergies, and special requests
- **Device Manager** - Monitor all onboard devices with status indicators
- **Activity Log** - Comprehensive logging for devices, calls, and crew changes
- **Duty Roster** - Advanced calendar with drag-and-drop, pattern detection, and autofill
- **Notify Crew** - Send notifications to crew members about roster changes

---

## 🎨 Design System

### Brand Colors
- **Primary Gold**: `#C8A96B` - Luxury accent color
- **Platinum**: `#B7BDC6` - Secondary accent
- **Neutral Background**: `#F7F7F5` - Clean, minimal base

### Typography
- **Font Family**: Inter (Google Fonts)
- **Font Weights**: 400 (Regular), 500 (Medium), 600 (Semibold)
- **Typographic Scale**: H1 (32px), H2 (24px), H3 (20px), Body (16px), Caption (12px)

### Spacing System
- Base unit: **8px**
- All spacing multiples of 8px for consistency

### Dark Mode
Full dark mode support with optimized color palette for luxury aesthetic.

---

## 📦 Project Structure

```
/
├── App.tsx                      # Main application entry
├── components/
│   ├── app-header.tsx           # Top navigation bar
│   ├── app-sidebar.tsx          # Collapsible sidebar navigation
│   ├── duty-roster/             # Duty roster calendar components
│   ├── pages/                   # Main page components
│   │   ├── dashboard.tsx
│   │   ├── crew.tsx
│   │   ├── duty-roster-tab.tsx
│   │   ├── activity-log.tsx
│   │   ├── guests-list.tsx
│   │   └── device-manager.tsx
│   ├── notify-crew-dialog.tsx   # Crew notification modal
│   └── ui/                      # Shadcn UI components
├── contexts/
│   └── AppDataContext.tsx       # Global state management
├── guidelines/
│   ├── Guidelines.md            # Feature documentation
│   └── API-Integration-Guide.md # Backend migration guide
└── styles/
    └── globals.css              # Tailwind v4 config + design tokens
```

---

## 🚀 Key Features

### 1. Duty Roster Management
- **Three view modes**: Month, Week, Day
- **Drag & drop**: Assign crew members to shifts
- **Day Detail View**: Click any day to see detailed shift breakdown
- **Pattern detection**: Auto-continue repeating patterns
- **Autofill**: Intelligent roster generation
- **Duplicate prevention**: Cannot assign same crew to multiple shifts
- **Save & track**: Persistent storage with change tracking

### 2. Activity Log System
Three separate log types:
- **Device Logs**: Track all device events (online, offline, alerts, maintenance)
- **Call Logs**: Monitor internal, external, and emergency calls with duration
- **Crew Change Logs**: Record all roster modifications with notification status

**Features**:
- Search across all logs
- Filter by user
- Pagination (20/50/100 entries)
- Real-time updates

### 3. Notify Crew Feature
After saving roster changes:
1. Click "Notify Crew" button
2. Review detected changes (added, removed, moved to primary/backup)
3. Confirm to send notifications
4. Crew change logs automatically created
5. Toast notifications show delivery status

### 4. Crew Management
- **Overview Tab**: Duty cards with current/next shift assignments
- **Duty Roster Tab**: Full calendar scheduling interface
- **Groups Tab**: Organize crew by departments

### 5. Device Manager
Real-time monitoring of:
- Tablets and displays
- Communication systems
- Navigation equipment
- Entertainment systems

Status indicators: Online, Offline, Needs Attention, Unknown

### 6. Guests Management
Track comprehensive guest information:
- Personal preferences
- Dietary restrictions
- Allergies
- Special requests
- Cabin assignments

---

## 💾 Data Persistence

### Current Implementation (Frontend Only)
- **localStorage** for all data persistence
- **Mock data generators** for devices and call logs
- **Context API** for global state management

### Production Migration
See [`/guidelines/API-Integration-Guide.md`](./guidelines/API-Integration-Guide.md) for complete backend integration instructions.

**Recommended Stack**:
- Backend: Node.js (Express/Nest.js) or Python (FastAPI)
- Database: PostgreSQL
- Auth: JWT with bcrypt
- Real-time: Socket.io or WebSockets
- **OR** use **Supabase** for managed backend

---

## 🛠️ Technologies

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling with design tokens
- **Shadcn UI** - Component library
- **React DnD** - Drag and drop
- **Lucide Icons** - Icon set
- **Sonner** - Toast notifications
- **localStorage** - Client-side persistence (temporary)

---

## 📝 Usage Guide

### Adding Crew to Roster
1. Navigate to **Crew** → **Duty Roster**
2. Select view mode (Month/Week/Day)
3. Drag crew member from left sidebar
4. Drop on desired date and shift
5. Click **Save** to persist changes

### Notifying Crew of Changes
1. Make roster changes
2. Click **Save** button
3. Click **Notify Crew** button
4. Review change summary
5. Click **Send Notifications**
6. Check **Activity Log** → **Crew Changes** for records

### Viewing Activity Logs
1. Navigate to **Activity Log** in sidebar
2. Choose tab: Devices, Calls, or Crew Changes
3. Use search bar to filter logs
4. Filter by specific user
5. Adjust pagination (20/50/100 entries)

### Using Autofill and Pattern Detection
**Autofill**: Randomly assigns available crew to empty shifts
**Continue Pattern**: Detects repeating patterns and extends them

Example: If Day Shift has Maria → John → Maria for 3 days, pattern continues with John → Maria → John

---

## 🔐 Security & Privacy

> **Important**: This application is designed for internal yacht operations only. It is **not meant for collecting PII or handling highly sensitive data** without proper backend security measures.

For production deployment:
- Implement proper authentication (JWT)
- Use HTTPS only
- Add role-based access control (RBAC)
- Encrypt sensitive data
- Regular security audits
- Follow GDPR/privacy regulations

---

## 📖 Documentation

- **Feature Guidelines**: [`/guidelines/Guidelines.md`](./guidelines/Guidelines.md)
- **API Integration**: [`/guidelines/API-Integration-Guide.md`](./guidelines/API-Integration-Guide.md)
- **Design Tokens**: [`/styles/globals.css`](./styles/globals.css)

---

## 🎯 Future Enhancements

- [ ] Real backend API integration
- [ ] WebSocket for real-time updates
- [ ] User authentication system
- [ ] Email/SMS notifications
- [ ] Mobile responsive improvements
- [ ] Reporting and analytics
- [ ] Calendar export (iCal)
- [ ] Multi-language support
- [ ] Offline mode with sync

---

## 📄 License

Proprietary - Obedio Yacht Management System  
© 2025 All Rights Reserved

---

## 👥 Support

For questions or support, please contact the development team.

**Version**: 1.0.0  
**Last Updated**: January 10, 2025  
**Status**: Production Ready (Frontend Complete)
