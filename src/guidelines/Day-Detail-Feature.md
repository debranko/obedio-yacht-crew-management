# Day Detail View Feature Guide
**Obedio Yacht Crew Management System**

## Overview

The **Day Detail View** feature allows users to click on any day in the duty roster calendar to open a detailed, focused view of all shifts and crew assignments for that specific date.

---

## How to Use

### Opening Day Details

1. Navigate to **Crew** → **Duty Roster**
2. Choose any view mode (Month, Week, or Day)
3. **Click on the date header** of any calendar day
4. A detailed dialog window will open showing:
   - Full formatted date (e.g., "Monday, January 15, 2025")
   - All shifts configured for the yacht
   - Primary crew members assigned to each shift
   - Backup crew members for each shift
   - Total number of people assigned

### Navigation

Once the Day Detail dialog is open, you can:

- **Navigate to Previous Day**: Click the "Previous" button in the top-left
- **Navigate to Next Day**: Click the "Next" button
- **Close Dialog**: Click the "Close" button at the bottom, press ESC key, or click outside the dialog

### What You'll See

#### For Each Shift:
- **Shift Name** (e.g., "Day Shift", "Night Shift")
- **Time Range** (e.g., "08:00 - 20:00")
- **Color Indicator** - Visual dot matching shift color
- **Assignment Count** - Number of people assigned

#### For Each Crew Member:
- **Avatar** - Profile picture
- **Name** - Full crew member name
- **Position** - Job title (e.g., "Chief Steward")
- **Department Badge** - Department affiliation

#### Visual Distinction:
- **Primary Crew**: Highlighted with accent background and solid styling
- **Backup Crew**: Muted styling with reduced opacity
- **Empty Shifts**: Clear message indicating no assignments

---

## Use Cases

### 1. Quick Day Overview
**Scenario**: Captain wants to see who is scheduled for today  
**Action**: Click on today's date (highlighted with gold border)  
**Result**: Instant overview of all shifts and assignments

### 2. Planning Ahead
**Scenario**: Steward preparing for guest arrival next week  
**Action**: Click on the arrival date  
**Result**: See exactly who will be on duty that day

### 3. Checking Coverage
**Scenario**: Verifying backup crew for a specific date  
**Action**: Click on the date, scroll to see backup assignments  
**Result**: Confirm backup coverage is adequate

### 4. Daily Navigation
**Scenario**: Reviewing entire week's assignments day by day  
**Action**: Click a day, use "Next" button to move through dates  
**Result**: Sequential review without closing dialog

---

## Visual Design

### Dialog Layout
```
┌─────────────────────────────────────────────┐
│  [Calendar Icon]  Mon, 15                   │
│  January 2025                     [Today]   │
│  [< Previous]  [Next >]                     │
├─────────────────────────────────────────────┤
│                                             │
│  ● Day Shift                     2 people   │
│  08:00 - 20:00                              │
│                                             │
│  👤 Primary                                 │
│  ┌───────────────────────────────────────┐ │
│  │ [Avatar] Maria Lopez                  │ │
│  │          Chief Steward    [Interior]  │ │
│  └───────────────────────────────────────┘ │
│  ┌───────────────────────────────────────┐ │
│  │ [Avatar] John Smith                   │ │
│  │          Senior Steward   [Interior]  │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  👥 Backup                                  │
│  ┌───────────────────────────────────────┐ │
│  │ [Avatar] Sarah Johnson (muted)        │ │
│  │          Steward          [Interior]  │ │
│  └───────────────────────────────────────┘ │
│                                             │
├─────────────────────────────────────────────┤
│  3 assignments total           [X] Close    │
└─────────────────────────────────────────────┘
```

### Color Coding
- **Today Badge**: Gold background (`bg-primary/10`)
- **Shift Indicator**: Matches shift color from settings
- **Primary Crew**: Accent background (`bg-accent/30`)
- **Backup Crew**: Muted background (`bg-muted/50`)
- **Empty State**: Subtle gray with icon

---

## Technical Details

### Component Location
- **File**: `/components/duty-roster/day-detail-dialog.tsx`
- **Parent**: Used in `/components/pages/duty-roster-tab.tsx`
- **Dependencies**: Shadcn Dialog, ScrollArea, Badge, Avatar

### Props Interface
```typescript
interface DayDetailDialogProps {
  open: boolean;                    // Dialog visibility state
  onOpenChange: (open: boolean) => void;  // Toggle handler
  date: string;                     // ISO date string (YYYY-MM-DD)
  shifts: ShiftConfig[];            // Available shifts
  assignments: Assignment[];        // All crew assignments
  crewMembers: CrewMember[];        // Crew member details
  onNavigate?: (direction: 'prev' | 'next') => void;  // Day navigation
}
```

### State Management
The dialog state is managed in `duty-roster-tab.tsx`:
```typescript
const [dayDetailOpen, setDayDetailOpen] = useState(false);
const [selectedDate, setSelectedDate] = useState<string | null>(null);
```

### Click Handler
Calendar cells become clickable via the `onDayClick` prop:
```typescript
const handleDayClick = (date: string) => {
  setSelectedDate(date);
  setDayDetailOpen(true);
};
```

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `ESC` | Close dialog |
| `Click Outside` | Close dialog |

*Note: Arrow key navigation not currently implemented*

---

## Responsive Design

- **Desktop**: Large dialog (max-width: 672px / 2xl)
- **Tablet**: Responsive width with padding
- **Mobile**: Full-screen on small devices
- **Scrolling**: ScrollArea for long crew lists

---

## Future Enhancements

Potential improvements for this feature:

- [ ] **Edit Mode**: Allow adding/removing crew directly from day detail
- [ ] **Print View**: Generate printable daily roster
- [ ] **Export**: Download day details as PDF
- [ ] **Keyboard Navigation**: Use arrow keys to navigate between days
- [ ] **Quick Actions**: Jump to today, jump to specific date
- [ ] **Notes**: Add daily notes or special instructions
- [ ] **Notifications**: See who has been notified about changes
- [ ] **History**: View past changes for this day

---

## Accessibility

- **Focus Management**: Dialog traps focus when open
- **Screen Readers**: Proper ARIA labels and roles
- **Keyboard Navigation**: Full keyboard support
- **Color Contrast**: WCAG AA compliant
- **Visual Hierarchy**: Clear heading structure

---

## Examples

### Empty Day
When no crew is assigned to any shift:
```
● Day Shift
08:00 - 20:00

[Users Icon]
No crew assigned to this shift
```

### Fully Staffed Day
When all shifts have primary and backup:
```
● Day Shift               3 people
08:00 - 20:00

👤 Primary
[2 crew members listed]

👥 Backup
[1 crew member listed]
```

### Special Indicators
- **Today**: Gold "Today" badge next to date
- **Multiple Shifts**: Each shift in separate card
- **Assignment Count**: Shows total in dialog footer

---

## Troubleshooting

### Dialog Not Opening
**Issue**: Clicking on date doesn't open dialog  
**Solution**: Ensure clicking on the date header (top section with day number), not the shift area

### Wrong Date Shown
**Issue**: Dialog shows incorrect date  
**Solution**: State is managed correctly, check browser console for errors

### Navigation Buttons Not Working
**Issue**: Previous/Next buttons don't change date  
**Solution**: Ensure `onNavigate` prop is passed to dialog

---

## Integration with Other Features

### Works With:
- ✅ **Drag & Drop**: Can open day detail after assigning crew
- ✅ **Save Changes**: View saved assignments
- ✅ **All View Modes**: Month, Week, and Day views
- ✅ **Shift Settings**: Respects custom shift configurations
- ✅ **Crew Filters**: Shows all assigned crew regardless of filters

### Does Not Include:
- ❌ **Editing**: Read-only view (use calendar drag & drop to edit)
- ❌ **Notifications**: Use "Notify Crew" button in main roster
- ❌ **Settings**: Use gear icon for shift configuration

---

## Best Practices

1. **Use for Verification**: After making roster changes, click day to verify
2. **Quick Reference**: Use during shift handover meetings
3. **Planning**: Review upcoming days before guest arrivals
4. **Sequential Review**: Use Previous/Next to audit entire week
5. **Mobile Friendly**: Works well on tablets during crew briefings

---

**Document Version**: 1.0  
**Last Updated**: January 10, 2025  
**Feature Status**: ✅ Production Ready
