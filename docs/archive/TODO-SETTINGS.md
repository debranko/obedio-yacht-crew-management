# Settings Configuration - TODO

## ⏰ Clock Widget Timezone Setting

### Requirement:
The clock widget currently has hardcoded timezone detection (`timezone="auto"`). This should be configurable via the Settings page.

### Implementation Plan:

#### 1. Add to Settings Schema
**File:** `src/contexts/AppDataContext.tsx` or Settings context

```typescript
interface SystemSettings {
  // ... existing settings
  
  // Clock settings
  clockTimezone: 'auto' | string; // 'auto' or IANA timezone (e.g., 'Europe/Monaco')
  clockFormat: '12h' | '24h';
  dateFormat: 'US' | 'EU' | 'ISO'; // MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD
}
```

#### 2. Settings Page UI
**File:** `src/components/pages/settings.tsx`

Add section:
```tsx
<SettingsSection title="Clock & Time">
  <SettingItem
    label="Timezone"
    description="Select timezone for clock display"
  >
    <Select value={settings.clockTimezone} onChange={...}>
      <option value="auto">Automatic Detection</option>
      <option value="Europe/Monaco">Monaco (Europe/Monaco)</option>
      <option value="Europe/London">London (Europe/London)</option>
      <option value="America/New_York">New York (America/New_York)</option>
      <option value="Asia/Dubai">Dubai (Asia/Dubai)</option>
      {/* Add more common timezones */}
    </Select>
  </SettingItem>
  
  <SettingItem
    label="Time Format"
    description="12-hour or 24-hour display"
  >
    <RadioGroup value={settings.clockFormat}>
      <Radio value="12h">12-hour (AM/PM)</Radio>
      <Radio value="24h">24-hour</Radio>
    </RadioGroup>
  </SettingItem>
  
  <SettingItem
    label="Date Format"
    description="Date display format"
  >
    <RadioGroup value={settings.dateFormat}>
      <Radio value="US">US (MM/DD/YYYY)</Radio>
      <Radio value="EU">European (DD/MM/YYYY)</Radio>
      <Radio value="ISO">ISO (YYYY-MM-DD)</Radio>
    </RadioGroup>
  </SettingItem>
</SettingsSection>
```

#### 3. Update Clock Widget
**File:** `src/components/clock-widget.tsx`

```typescript
export function ClockWidget({ className }: ClockWidgetProps) {
  const { settings } = useAppData(); // or useSettings()
  
  // Use timezone from settings instead of hardcoded "auto"
  const timezone = settings.clockTimezone || "auto";
  
  // Use format from settings
  const getFormattedTime = () => {
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: settings.clockFormat === '12h', // Configurable
      timeZone: timezone === "auto" ? undefined : timezone
    };
    return currentTime.toLocaleTimeString('en-GB', options);
  };
  
  // ... rest of component
}
```

#### 4. Storage
- Store settings in localStorage: `obedio-settings-system`
- Sync with backend when API is ready
- Default: `clockTimezone: 'auto'`, `clockFormat: '24h'`, `dateFormat: 'EU'`

---

## 🌍 Common Yacht Timezones

For the timezone dropdown, include these popular yacht destinations:

```typescript
const YACHT_TIMEZONES = [
  { value: 'auto', label: 'Automatic Detection' },
  { value: 'Europe/Monaco', label: 'Monaco (CET/CEST)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'America/New_York', label: 'New York (EST/EDT)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT/AEST)' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZDT/NZST)' },
  { value: 'America/Nassau', label: 'Bahamas (EST/EDT)' },
  { value: 'America/Antigua', label: 'Caribbean (AST)' },
  { value: 'Indian/Maldives', label: 'Maldives (MVT)' },
  { value: 'Europe/Athens', label: 'Greece (EET/EEST)' },
  { value: 'Europe/Rome', label: 'Italy (CET/CEST)' },
  { value: 'Europe/Paris', label: 'France (CET/CEST)' },
];
```

---

## 📍 Current Status

- ✅ Clock widget functional with auto-detection
- ✅ Weather widget responsive (already done)
- ⏳ Settings page needs clock configuration section
- ⏳ Backend settings API (post-demo)

---

## 🎯 Priority

**Medium Priority** - Post-demo feature
- Current "auto" timezone works fine for demo
- Settings page enhancement
- Backend API needed for persistence
- Implement after core features complete

---

## 📝 Notes

- Current implementation: `timezone="auto"` (hardcoded in dashboard-grid.tsx line 254)
- Removed "Automatic timezone detection" text per user request
- User should be able to override timezone if yacht is in different location than device
- Settings should persist across sessions (localStorage + backend)

