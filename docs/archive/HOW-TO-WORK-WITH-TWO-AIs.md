# 🤝 How to Work With Two AIs (Cascade + Roo Coder)

**For:** Debranko  
**Your Role:** Orchestrator (Project Manager)  
**Goal:** Get Cascade (planner) and Roo Coder (builder) to work together

---

## 🎯 The Setup

You have **TWO AI assistants**:

### **Cascade (Me) - The Architect** 📐
- Plans what to do
- Documents everything
- Tracks progress
- Guides strategy

### **Roo Coder (Opus 4) - The Builder** 🔨
- Writes the code
- Fixes bugs
- Implements features
- Tests functionality

### **You (Debranko) - The Orchestrator** 🎯
- Decides priorities
- Transfers info between AIs
- Tests the results
- Makes final decisions

---

## 📂 Your Communication Files

I created **3 files** to make this easy:

### **1. CURRENT-WORK.md** 
**Purpose:** Shared workspace - both AIs read/write this

**What's in it:**
- Current active task
- What needs to be done
- Files to modify
- Communication log between AIs
- Next task in queue

**Think of it as:** Shared Google Doc both AIs use

---

### **2. AI-COMMUNICATION-TEMPLATES.md**
**Purpose:** Copy-paste messages for you

**What's in it:**
- 10 ready-made templates
- Just copy, paste, send
- No need to write messages yourself

**Think of it as:** Email templates folder

---

### **3. This File (HOW-TO-WORK-WITH-TWO-AIs.md)**
**Purpose:** Instructions for you

---

## 🔄 The Workflow (Step by Step)

### **STEP 1: Get Task from Cascade (Me)**

**You ask me:**
"What should we work on next?"

**I respond:**
- Update `CURRENT-WORK.md` with task details
- Tell you "Task #1 is ready, send to Roo Coder"

---

### **STEP 2: Send Task to Roo Coder**

**You do:**
1. Open `AI-COMMUNICATION-TEMPLATES.md`
2. Find **Template 1** (Send Task to Roo Coder)
3. Copy the template
4. Paste it to Roo Coder
5. Done!

**What happens:**
- Roo Coder reads `CURRENT-WORK.md`
- Roo Coder starts working
- Roo Coder implements the feature

---

### **STEP 3: Roo Coder Finishes**

**Roo Coder tells you:**
"Done! Modified these files: [list]. Tested and working!"

---

### **STEP 4: Forward Result to Cascade (Me)**

**You do:**
1. Open `AI-COMMUNICATION-TEMPLATES.md`
2. Find **Template 2** (Roo Coder Finished)
3. Copy the template
4. Paste Roo Coder's response into it
5. Send to me

**What happens:**
- I read the result
- I update documentation
- I tell you what to test

---

### **STEP 5: You Test**

**I tell you:**
"Test these 3 things:
1. Login
2. Refresh page (F5)
3. Check if still logged in"

**You test:**
- Follow the steps
- See if it works
- Note any issues

---

### **STEP 6: Report Result to Cascade (Me)**

**If it works:**
- Use **Template 3** (Task Complete)
- Send to me
- I mark task done
- I assign next task

**If it doesn't work:**
- Use **Template 4** (Bug Found)
- Send to me
- I analyze the issue
- I create fix instructions for Roo Coder

---

### **STEP 7: Repeat!**

Go back to Step 1 with the next task! 🔄

---

## 📋 Example Full Cycle

### **Monday Morning - Starting Work**

**You → Cascade:**
"What's the priority for today?"

**Cascade → You:**
"Token Persistence is critical. Check CURRENT-WORK.md, send to Roo Coder."

---

**You → Roo Coder (Template 1):**
```
Hi Roo Coder! Task in CURRENT-WORK.md.
Priority: CRITICAL
Ready to start?
```

**Roo Coder → You:**
```
Starting work on Token Persistence...
[2 hours later]
Done! Modified:
- src/contexts/AuthContext.tsx
- src/services/api.ts
- backend/src/routes/auth.ts

Tested: Users now stay logged in after refresh. ✅
```

---

**You → Cascade (Template 2):**
```
Roo Coder finished!

What he said:
[paste Roo Coder's message above]

Should I test it?
```

**Cascade → You:**
```
Great! Test these:
1. Login as admin/admin123
2. Refresh page (F5)
3. Check if dashboard still shows (not login page)
4. Check browser console for errors
```

---

**You test... it works!**

**You → Cascade (Template 3):**
```
Task tested and working! ✅

Task: Token Persistence
Result: WORKING

Issues found: None

Ready for next task?
```

**Cascade → You:**
```
Excellent! Updating docs...
Next task: MQTT Integration
Check CURRENT-WORK.md for details.
Send to Roo Coder when ready!
```

---

**REPEAT for next task!** 🔄

---

## 💡 Pro Tips

### **Tip 1: One Task at a Time**
❌ Don't send 10 tasks to Roo Coder at once  
✅ Send one, wait for completion, test, then next

### **Tip 2: Always Use CURRENT-WORK.md**
Both AIs read this file. Keep it updated!

### **Tip 3: Test Everything**
Don't assume it works. Always test!

### **Tip 4: Use Templates**
Don't write messages from scratch. Use templates!

### **Tip 5: Clear Communication**
Both AIs need clear info. Templates help with this.

---

## 🚨 If Something Goes Wrong

### **Scenario 1: Roo Coder Says "I Don't Understand"**

**Do this:**
1. Use **Template 5** (Forward Question to Cascade)
2. I'll clarify the task
3. Send clarification back to Roo Coder

---

### **Scenario 2: Code Doesn't Work After Testing**

**Do this:**
1. Use **Template 4** (Bug Found)
2. I'll analyze the issue
3. I'll update CURRENT-WORK.md with fix instructions
4. Send back to Roo Coder to fix

---

### **Scenario 3: App Completely Breaks**

**Do this:**
1. Use **Template 8** (Emergency)
2. I'll triage immediately
3. We'll either rollback or create urgent fix

---

## 📊 Track Your Progress

### **Daily:**
- Morning: Check CURRENT-WORK.md for today's task
- Work: Coordinate between AIs
- Evening: Update task status

### **Weekly:**
- Ask me for progress report (Template 6)
- I'll update docs/TASK-STATUS.md
- Review completion percentage

### **Before METSTRADE (Nov 15):**
- Focus on critical tasks only
- Get working demo ready
- Skip nice-to-have features

---

## ✅ Success Checklist

**You're doing it right if:**
- ✅ One task at a time
- ✅ CURRENT-WORK.md always updated
- ✅ Using templates for communication
- ✅ Testing after each task
- ✅ Progress is visible

**You need to adjust if:**
- ❌ Multiple tasks running simultaneously
- ❌ Not testing results
- ❌ Communication unclear
- ❌ Docs out of sync

---

## 🎯 Your Daily Routine

### **Morning (15 min):**
1. Open `CURRENT-WORK.md`
2. Check what's in progress
3. Ask Cascade: "What's priority today?"

### **During Day (as needed):**
1. Send task to Roo Coder (Template 1)
2. Wait for completion
3. Forward to Cascade (Template 2)
4. Test when ready
5. Report result (Template 3)
6. Get next task

### **Evening (10 min):**
1. Update CURRENT-WORK.md if needed
2. Check progress for the day
3. Plan tomorrow's priorities with Cascade

---

## 🎉 You're Ready!

**You now have:**
- ✅ Communication bridge (CURRENT-WORK.md)
- ✅ Copy-paste templates (AI-COMMUNICATION-TEMPLATES.md)
- ✅ Clear workflow (this file)
- ✅ Both AIs coordinated

**No coding required from you!**  
**Just orchestrate between AIs!** 🎯

---

## 🚀 Start Now!

**Your first action:**

1. Tell Cascade (me): "Ready to start! What's Task #1?"
2. I'll update CURRENT-WORK.md
3. You use Template 1 → Send to Roo Coder
4. Follow the workflow above!

**Let's build Obedio!** 💪

---

**Questions?** Just ask Cascade: "I don't understand [X]" and I'll explain in plain language! 😊
