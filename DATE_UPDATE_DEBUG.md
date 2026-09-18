# Date Update Issue - Debugging Guide

## Problem
When updating task start/end dates, they always revert to "Jan 5, 2026" and "Jan 9, 2026" instead of saving the new dates.

## Solution
Added comprehensive logging throughout the date update flow to identify where the issue occurs.

## 🔍 What Was Added

### 1. Edit Modal Opening (App.tsx)
Logs what dates are loaded when opening the edit modal:
```javascript
console.log('📝 Opening edit modal for task:', task.id, {
  startDate: task.startDate,
  endDate: task.endDate,
  startDate_type: typeof task.startDate,
  endDate_type: typeof task.endDate
});
```

### 2. Task Update Handler (App.tsx)
Logs what dates are being sent when updating:
```javascript
console.log('🔄 handleUpdateTask called with dates:', {
  startDate: taskForm.startDate,
  endDate: taskForm.endDate,
  startDate_type: typeof taskForm.startDate,
  endDate_type: typeof taskForm.endDate
});
```

### 3. Save to Supabase (storageUtils.ts)
Logs what dates are being sent to the database:
```javascript
console.log('🔄 Updating task', task.id, {
  start_date: task.startDate,
  end_date: task.endDate,
  start_date_type: typeof task.startDate,
  end_date_type: typeof task.endDate,
  full_update_data: updateData
});
```

### 4. Load from Supabase (storageUtils.ts)
Logs what dates are being received from the database:
```javascript
console.log('📥 Loading task from Supabase:', task.id, {
  start_date: task.start_date,
  end_date: task.end_date,
  start_date_type: typeof task.start_date,
  end_date_type: typeof task.end_date
});
```

## 📋 Testing Steps

### Step 1: Deploy the Updated Code
```bash
git add .
git commit -m "debug: add date update logging"
git push origin main
```

### Step 2: Test Date Updates
1. Open the app in browser
2. Open browser console (F12)
3. Clear console
4. Create or edit a task
5. Change the start and end dates
6. Save the task
7. Watch the console logs

### Step 3: Analyze the Logs

You should see a sequence like this:

#### When Opening Edit Modal:
```
📝 Opening edit modal for task: TASK-001 {
  startDate: "2026-01-05",
  endDate: "2026-01-09",
  startDate_type: "string",
  endDate_type: "string"
}
```

#### When Updating Task:
```
🔄 handleUpdateTask called with dates: {
  startDate: "2026-03-15",  ← Should show your new date
  endDate: "2026-03-20",    ← Should show your new date
  startDate_type: "string",
  endDate_type: "string"
}
```

#### When Saving to Supabase:
```
🔄 Updating task TASK-001 {
  start_date: "2026-03-15",  ← Should show your new date
  end_date: "2026-03-20",    ← Should show your new date
  start_date_type: "string",
  end_date_type: "string",
  full_update_data: { ... }
}
```

#### When Loading from Supabase (after refresh):
```
📥 Loading task from Supabase: TASK-001 {
  start_date: "2026-03-15",  ← Should show your saved date
  end_date: "2026-03-20",    ← Should show your saved date
  start_date_type: "string",
  end_date_type: "string"
}
```

## 🎯 What to Look For

### Scenario 1: Dates Correct in Form, Wrong in Supabase
**Symptoms:**
- ✅ Edit modal shows correct dates
- ✅ handleUpdateTask shows correct dates
- ❌ Save to Supabase shows wrong dates or empty

**Cause:** Issue in the save function
**Solution:** Check the updateData object being sent

### Scenario 2: Dates Saved Correctly, Wrong on Reload
**Symptoms:**
- ✅ Save to Supabase shows correct dates
- ❌ Load from Supabase shows wrong dates or defaults

**Cause:** Issue in database or load function
**Solution:** 
1. Check Supabase Table Editor directly
2. Verify dates are actually saved in database
3. Check if fallback logic is being triggered

### Scenario 3: Dates Wrong from the Start
**Symptoms:**
- ❌ Edit modal shows wrong dates (Jan 5, Jan 9)
- ❌ All subsequent logs show wrong dates

**Cause:** Issue in task state or data loading
**Solution:**
1. Check if tasks are being loaded correctly from Supabase
2. Verify the task object has correct dates
3. Check if there's a default value being applied

## 🔧 Common Issues

### Issue 1: Dates Saved as Empty Strings
**Log shows:**
```
start_date: "",
end_date: ""
```

**Solution:**
- Check if date input fields are properly bound
- Verify onChange handlers are updating state
- Check if there's a validation issue

### Issue 2: Dates Saved as Null
**Log shows:**
```
start_date: null,
end_date: null
```

**Solution:**
- Check if date inputs have proper value binding
- Verify taskForm state is being updated
- Check if there's a type conversion issue

### Issue 3: Dates Reverting to Defaults
**Log shows:**
```
📥 Loading task from Supabase: TASK-001 {
  start_date: null,
  end_date: null
}
```
Then fallback kicks in:
```
startDate: "2026-01-05",  ← Default from taskForm
endDate: "2026-01-09"     ← Default from taskForm
```

**Solution:**
- Check Supabase database directly
- Verify dates are actually being saved
- Check if there's a race condition in save/load

### Issue 4: Database Column Type Mismatch
**Symptoms:**
- Dates save correctly in logs
- But database shows wrong values

**Solution:**
Run this SQL to check column types:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tasks' 
AND column_name IN ('start_date', 'end_date');
```

Should be:
- `start_date`: date or text
- `end_date`: date or text

## 📊 Verify in Supabase Dashboard

### Check Database Directly
1. Go to Supabase Dashboard
2. Click **Table Editor**
3. Click **tasks** table
4. Look at the `start_date` and `end_date` columns
5. Verify the dates match what you saved

### Run SQL Query
```sql
SELECT 
  id,
  title,
  start_date,
  end_date,
  created_at,
  updated_at
FROM tasks
ORDER BY updated_at DESC
LIMIT 5;
```

## 🎯 Expected Behavior

After fixing, the flow should be:

1. **Open Edit Modal**
   - Logs show correct dates from task
   - Form displays correct dates

2. **Change Dates**
   - User selects new dates
   - Form state updates

3. **Save Task**
   - handleUpdateTask logs new dates
   - updateTask function receives new dates
   - Task state updates with new dates

4. **Save to Supabase**
   - saveTasks receives task with new dates
   - Update data includes new dates
   - Supabase receives and saves new dates

5. **Reload Page**
   - fetchAppState loads tasks
   - Tasks have new dates from database
   - UI displays new dates

## 📝 Next Steps

1. **Deploy** the updated code with logging
2. **Test** date updates
3. **Check** console logs at each step
4. **Identify** where dates are going wrong
5. **Share** the console logs if issue persists

## 🔍 Debug Checklist

- [ ] Console logs show correct dates when opening edit modal
- [ ] Console logs show correct dates when updating
- [ ] Console logs show correct dates when saving to Supabase
- [ ] Supabase Table Editor shows correct dates
- [ ] Console logs show correct dates when loading from Supabase
- [ ] UI displays correct dates after reload

---

**Status:** 🔍 Debugging logs added  
**Next Step:** Deploy and test with console logs  
**Expected Result:** Identify where date updates are failing
