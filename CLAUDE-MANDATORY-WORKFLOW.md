# 🔴 CLAUDE'S MANDATORY WORKFLOW - FOLLOW THIS EVERY TIME!

**OVAJ WORKFLOW JE OBAVEZAN BEZ IZUZETKA!!!**

## Mermaid Flowchart - Visual Workflow

```mermaid
flowchart TD
    START([👤 User Requests Change]) --> STOP1{🚫 STOP!<br/>Have I checked<br/>COMPLETE code?}

    STOP1 -->|NO| READ_ALL[📖 Read ENTIRE file<br/>from line 1 to end]
    STOP1 -->|YES| BROWSER

    READ_ALL --> CHECK_IMPORTS[✅ Check all imports]
    CHECK_IMPORTS --> CHECK_API[✅ Check API endpoints used]
    CHECK_API --> CHECK_HOOKS[✅ Check hooks/components]
    CHECK_HOOKS --> CHECK_PATTERNS[✅ Check existing patterns]
    CHECK_PATTERNS --> BROWSER

    BROWSER{🌐 Have I opened<br/>browser and SEEN<br/>the application?}

    BROWSER -->|NO| OPEN_BROWSER[🔍 Open http://localhost:5174<br/>Navigate to the page<br/>SEE what exists]
    BROWSER -->|YES| ASK_USER

    OPEN_BROWSER --> DESCRIBE[📝 Describe what I see:<br/>- Which page/tab<br/>- What buttons/cards exist<br/>- What is missing]

    DESCRIBE --> ASK_USER{❓ Have I asked user<br/>WHERE EXACTLY<br/>to add feature?}

    ASK_USER -->|NO| ASK[💬 Ask user:<br/>"I see [description].<br/>Where exactly should I add this?"]
    ASK_USER -->|YES| CONFIRMED

    ASK --> WAIT[⏳ WAIT for user confirmation]
    WAIT --> CONFIRMED

    CONFIRMED{✅ User confirmed<br/>location and<br/>functionality?}

    CONFIRMED -->|NO| ASK
    CONFIRMED -->|YES| CHECK_BACKEND

    CHECK_BACKEND{🔌 Does backend<br/>API endpoint<br/>exist?}

    CHECK_BACKEND -->|Don't know| GREP_API[🔍 Grep/Read backend routes<br/>Check diagnostics/api-backend.md]
    GREP_API --> CHECK_BACKEND

    CHECK_BACKEND -->|NO| ASK_BACKEND[❓ Ask user:<br/>"Endpoint doesn't exist.<br/>Should I create it first?"]
    ASK_BACKEND --> WAIT_BACKEND[⏳ Wait for answer]
    WAIT_BACKEND --> CHECK_BACKEND

    CHECK_BACKEND -->|YES| CHECK_EXISTING

    CHECK_EXISTING{🔍 Does similar<br/>component/pattern<br/>already exist?}

    CHECK_EXISTING -->|Don't know| GREP_PATTERN[🔍 Grep for similar patterns<br/>Check other components<br/>Read existing code]
    GREP_PATTERN --> CHECK_EXISTING

    CHECK_EXISTING -->|YES| USE_EXISTING[♻️ Use existing pattern<br/>DON'T recreate!<br/>Copy existing approach]
    CHECK_EXISTING -->|NO| PLAN

    USE_EXISTING --> PLAN

    PLAN[📋 Plan changes:<br/>- Which files to edit?<br/>- Which hooks to use?<br/>- Will it break anything?]

    PLAN --> IMPLEMENT{💻 Ready to implement?}

    IMPLEMENT -->|Not sure| ASK_CLARIFY[❓ Ask user to clarify]
    ASK_CLARIFY --> IMPLEMENT

    IMPLEMENT -->|YES| CODE[✍️ Write code using:<br/>- Existing patterns<br/>- Existing hooks<br/>- Edit tool not Write!]

    CODE --> TEST{🧪 Does it work?}

    TEST -->|NO| DEBUG[🐛 Debug and fix]
    DEBUG --> TEST

    TEST -->|YES| TODO_COMPLETE[✅ Mark TODO as completed]
    TODO_COMPLETE --> DOCUMENT[📝 Update PROTECTED-CODE]
    DOCUMENT --> DONE([✅ DONE!])

    style START fill:#e1f5e1
    style STOP1 fill:#ffcccc
    style READ_ALL fill:#ffe6cc
    style BROWSER fill:#ffcccc
    style ASK_USER fill:#ffcccc
    style CONFIRMED fill:#ccffcc
    style CHECK_BACKEND fill:#cce5ff
    style TEST fill:#ffcccc
    style DONE fill:#e1f5e1
```

---

## 🔴 KRITIČNA PRAVILA - READ THIS FIRST!

### Rule #1: CHECK COMPLETE CODE FIRST
```
❌ NEVER change ANY file until:
   1. Read ENTIRE file from line 1 to end
   2. Check ALL imports
   3. Check what API endpoints are used
   4. Check what hooks/components exist
   5. Check similar patterns in codebase

✅ Complete code check = No fuck-ups
❌ No code check = BIG PROBLEM
```

### Rule #2: SEE APPLICATION FIRST
```
❌ NEVER code until:
   1. Open browser at http://localhost:5174
   2. Navigate to the exact page
   3. SEE what currently exists
   4. Describe it to user
   5. Get confirmation

✅ See app first = Know what to do
❌ Code blindly = Wrong place, wrong thing
```

### Rule #3: ASK USER BEFORE CODING
```
❌ NEVER assume:
   - Where to add feature
   - What exactly it should do
   - Which file to modify

✅ ALWAYS ask:
   "I see [description]. Where exactly should I add this?"
   "Should it work like [similar feature]?"
   "Is this the right approach?"
```

### Rule #4: USE EXISTING CODE
```
❌ NEVER recreate:
   - Existing hooks (useDevices, useLocations, etc.)
   - Existing components (SmartButtonConfigDialog, etc.)
   - Existing patterns (React Query mutations)

✅ ALWAYS reuse:
   - Grep for existing patterns
   - Copy existing approach
   - Use existing hooks
```

---

## 📋 MANDATORY CHECKLIST

Before changing ANY file, I MUST answer YES to ALL:

- [ ] Have I read the ENTIRE file from start to end?
- [ ] Have I checked all imports in the file?
- [ ] Have I checked what API endpoints are used?
- [ ] Have I checked what hooks/components exist?
- [ ] Have I opened the application in browser?
- [ ] Have I SEEN the exact page/component?
- [ ] Have I described to user what I see?
- [ ] Have I asked user WHERE EXACTLY to add feature?
- [ ] Have I received user confirmation?
- [ ] Have I checked if backend API exists?
- [ ] Have I checked for similar existing patterns?
- [ ] Do I know EXACTLY what to do and where?

**If ANY answer is NO → STOP and complete that step first!**

---

## 🚨 COMMON MISTAKES TO AVOID

### Mistake #1: Editing wrong file
```
❌ I edited device-manager.tsx
✅ Application uses device-manager-full.tsx
RESULT: Code not used, wasted time

FIX: Check which file is ACTUALLY imported in routes!
```

### Mistake #2: Coding before seeing app
```
❌ User said "add watch features"
❌ I immediately started coding
✅ Should have opened browser first
✅ Should have seen current UI
✅ Should have asked WHERE to add

FIX: ALWAYS open browser and SEE first!
```

### Mistake #3: Not checking API compatibility
```
❌ Created frontend function
❌ Backend endpoint doesn't exist
RESULT: Feature doesn't work

FIX: Check backend routes first!
```

### Mistake #4: Recreating existing code
```
❌ Created new device assignment dialog
✅ SmartButtonConfigDialog already exists
RESULT: Duplicate code, inconsistency

FIX: Grep for existing patterns first!
```

---

## ✅ SUCCESS CRITERIA

### I followed the workflow correctly when:
1. ✅ I read complete code before changing
2. ✅ I opened browser and saw application
3. ✅ I asked user for confirmation
4. ✅ I used existing patterns
5. ✅ Feature works on first try
6. ✅ No fuck-ups, no rework needed

### I FAILED the workflow when:
1. ❌ Changed file without reading it completely
2. ❌ Coded without seeing application
3. ❌ Assumed where to add feature
4. ❌ Recreated existing code
5. ❌ Feature doesn't work
6. ❌ User says "you didn't check!"

---

## 📊 WORKFLOW IN SIMPLE STEPS

```
1. User requests change
   ↓
2. 🛑 STOP! Read COMPLETE code first
   ↓
3. Open browser, SEE application
   ↓
4. Ask user: "I see X. Where exactly to add Y?"
   ↓
5. Wait for user confirmation
   ↓
6. Check backend API exists
   ↓
7. Check for existing patterns
   ↓
8. Use existing patterns/hooks
   ↓
9. Implement carefully
   ↓
10. Test it works
   ↓
11. Mark TODO complete
   ↓
12. DONE! ✅
```

---

**Last Updated**: 2025-01-30
**Reason**: User insisted - "Without checking complete code, you're doing a big fuck-up"
**Mandatory**: YES - NO EXCEPTIONS!

