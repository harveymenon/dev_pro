# Task Import Feature - Complete Guide

## 🎯 Overview

The bulk import feature allows you to import multiple tasks at once from an Excel file (.xlsx or .xls). This is especially useful when:
- Migrating tasks from other project management tools
- Creating multiple tasks at once
- Updating task lists in bulk

## 📥 How to Use

### Step 1: Open Import Modal

Click the **"📥 Import Tasks"** button in either:
- **Backlog tab** - to import tasks to the backlog
- **Developer tab** - to import tasks (can be assigned to developers via Excel)

### Step 2: Download Template (Optional)

Click **"Download Template"** to get a sample Excel file with the correct format. This helps ensure your data is structured correctly.

### Step 3: Prepare Your Excel File

Your Excel file should have the following columns (header row required):

| Column | Required | Description | Example |
|--------|----------|-------------|---------|
| **Task ID** | Optional | Unique identifier (auto-generated if empty) | TASK-001 |
| **Task Title** | **Required** | Task name/description | Requirements Analysis |
| **Project** | Optional | Project name | Tres Health |
| **Jira URL** | Optional | Link to Jira ticket | https://jira.company.com/browse/TH-101 |
| **Hours** | Optional | Estimated hours (defaults to 0) | 40 |
| **Start Date** | **Required** | Task start date (YYYY-MM-DD format) | 2026-01-05 |
| **End Date** | **Required** | Task end date (YYYY-MM-DD format) | 2026-01-09 |
| **Assigned Developer ID** | Optional | Developer ID (e.g., DEV-001) or leave empty for backlog | DEV-001 |

### Step 4: Upload File

1. Click **"Select File"** in the import modal
2. Choose your Excel file (.xlsx or .xls)
3. The system will parse and validate the file

### Step 5: Review Preview

The import modal will show:
- **Total Rows**: Number of data rows in the file
- **Valid Tasks**: Number of tasks that can be imported
- **Errors**: Any validation errors that prevent import
- **Warnings**: Non-critical issues (e.g., invalid Jira URL format)
- **Task Preview**: Table showing all valid tasks to be imported

### Step 6: Import

Click **"Import X Tasks"** to add all valid tasks to your project.

## 📋 Excel Format Examples

### Example 1: Basic Import
```
Task Title | Start Date | End Date
-----------|------------|----------
Design UI  | 2026-01-05 | 2026-01-10
Code Backend | 2026-01-11 | 2026-01-20
```

### Example 2: Full Import with All Fields
```
Task ID | Task Title | Project | Jira URL | Hours | Start Date | End Date | Assigned Developer ID
--------|------------|---------|----------|-------|------------|----------|----------------------
TASK-001 | Requirements | Tres Health | https://jira.company.com/browse/TH-101 | 40 | 2026-01-05 | 2026-01-09 | DEV-001
TASK-002 | UI Design | Tres Health | https://jira.company.com/browse/TH-102 | 80 | 2026-01-10 | 2026-01-20 | DEV-001
| Backend API | Shopmool | | 120 | 2026-02-01 | 2026-02-15 | DEV-002
```

### Example 3: Mixed Assignment
```
Task Title | Start Date | End Date | Assigned Developer ID
-------------|------------|----------|----------------------
Task 1 | 2026-01-05 | 2026-01-10 | DEV-001
Task 2 | 2026-01-11 | 2026-01-15 | (empty = backlog)
Task 3 | 2026-01-16 | 2026-01-20 | DEV-002
```

## 🔍 Validation Rules

### Required Fields
- **Task Title**: Must not be empty
- **Start Date**: Must be a valid date
- **End Date**: Must be a valid date and after start date

### Optional Fields
- **Task ID**: Auto-generated if empty (format: TASK-001, TASK-002, etc.)
- **Project**: Can be empty
- **Jira URL**: Validated for URL format (warning if invalid)
- **Hours**: Defaults to 0 if empty or invalid
- **Assigned Developer ID**: If invalid developer ID, task goes to backlog with warning

### Date Formats Supported
- `YYYY-MM-DD` (recommended): 2026-01-05
- `MM/DD/YYYY`: 01/05/2026
- `DD-MM-YYYY`: 05-01-2026
- Excel date numbers: Automatically converted

## ⚠️ Common Errors

### Error: "Task title is required"
**Cause**: The Task Title column is empty for a row  
**Solution**: Fill in the task title for all rows

### Error: "Start date is required"
**Cause**: The Start Date column is empty  
**Solution**: Provide a start date for all tasks

### Error: "End date is required"
**Cause**: The End Date column is empty  
**Solution**: Provide an end date for all tasks

### Error: "Invalid date format"
**Cause**: Date value cannot be parsed  
**Solution**: Use YYYY-MM-DD format (e.g., 2026-01-05)

### Error: "End date must be after start date"
**Cause**: End date is before start date  
**Solution**: Ensure end date is chronologically after start date

### Warning: "Invalid Jira URL format"
**Cause**: Jira URL doesn't match expected format  
**Solution**: Task will still be imported, but URL may not work correctly

### Warning: "Developer ID not found, task will be added to backlog"
**Cause**: Assigned Developer ID doesn't match any existing developer  
**Solution**: Task will be imported to backlog. You can assign it later.

## 🎨 Features

### Smart Column Detection
The import system automatically detects column headers, supporting variations like:
- "Task ID", "ID", "Task_ID"
- "Task Title", "Title", "Name", "Task_Name"
- "Start Date", "Start", "Start_Date"
- "Assigned Developer ID", "Developer", "Assignee", "Assigned_To"

### Duplicate ID Handling
If a Task ID already exists in the system:
- A new unique ID is automatically generated
- The original ID from Excel is ignored
- No data is lost

### Developer Validation
- If Assigned Developer ID is provided but doesn't exist, task goes to backlog
- Warning is shown for invalid developer IDs
- You can reassign tasks after import

### Date Flexibility
- Multiple date formats supported
- Excel date numbers automatically converted
- Invalid dates show clear error messages

## 📊 Import Statistics

After importing, you'll see:
- **Total Rows**: Number of data rows processed
- **Valid Tasks**: Number of tasks successfully imported
- **Errors**: Number of rows that couldn't be imported
- **Warnings**: Number of non-critical issues

## 🔄 Workflow

1. **Prepare Excel file** with task data
2. **Click "📥 Import Tasks"** button
3. **Upload file** and wait for parsing
4. **Review preview** - check for errors/warnings
5. **Click "Import"** to add tasks
6. **Tasks are saved** to Supabase automatically
7. **View imported tasks** in Backlog or Developer tabs

## 💡 Tips

### Tip 1: Use the Template
Download the template first to see the exact format expected.

### Tip 2: Validate Before Import
Review the preview carefully before clicking Import. Check for:
- Correct dates
- Valid developer IDs
- Proper task titles

### Tip 3: Batch Imports
You can import multiple times:
- Import backlog tasks first
- Then import developer-assigned tasks
- Each import adds to existing tasks

### Tip 4: Date Format
Use YYYY-MM-DD format for dates to avoid ambiguity:
- ✅ 2026-01-05 (clear)
- ⚠️ 01/05/2026 (ambiguous - is it Jan 5 or May 1?)

### Tip 5: Developer IDs
To find developer IDs:
- Look at the developer tabs (DEV-001, DEV-002, etc.)
- Or check the URL when viewing a developer's tasks
- Use exact IDs in the Excel file

## 🐛 Troubleshooting

### Issue: No tasks imported
**Check**:
- File is .xlsx or .xls format
- Header row is present
- Required fields are filled
- Dates are in valid format

### Issue: Wrong dates imported
**Check**:
- Date format in Excel
- Excel might be interpreting dates differently
- Use text format for date cells in Excel

### Issue: Tasks assigned to wrong developer
**Check**:
- Developer ID matches exactly (case-sensitive)
- Developer exists in the system
- No typos in the ID

### Issue: File won't upload
**Check**:
- File size (should be reasonable)
- File format (.xlsx or .xls only)
- File is not corrupted

## 📚 Technical Details

### File Parsing
- Uses SheetJS (xlsx) library
- Reads first sheet only
- Supports .xlsx and .xls formats
- Handles large files efficiently

### Data Validation
- Client-side validation before import
- Server-side validation on save
- Comprehensive error reporting
- Graceful handling of edge cases

### ID Generation
- Auto-generates IDs if not provided
- Ensures uniqueness across all tasks
- Format: TASK-001, TASK-002, etc.
- Handles conflicts with existing IDs

### Date Handling
- Multiple format support
- Timezone-safe parsing
- ISO 8601 output format
- Preserves date accuracy

## 🎯 Use Cases

### Use Case 1: Initial Project Setup
Import all tasks at once when starting a new project:
1. Create Excel with all tasks
2. Assign developers in Excel
3. Import once
4. Project is ready to go

### Use Case 2: Migration from Other Tools
Migrate from Jira, Asana, Trello, etc.:
1. Export tasks from source tool
2. Format to match import template
3. Import into Gantt Chart Planner
4. Verify and adjust as needed

### Use Case 3: Bulk Task Creation
Create many tasks quickly:
1. Prepare Excel with task list
2. Leave developer assignments empty
3. Import to backlog
4. Assign developers manually later

### Use Case 4: Template-Based Planning
Use templates for recurring projects:
1. Create template Excel file
2. Copy and modify for each project
3. Import when ready to start
4. Consistent task structure

## ✅ Success Criteria

After successful import:
- ✅ All valid tasks appear in the task list
- ✅ Tasks are saved to Supabase
- ✅ Gantt chart updates automatically
- ✅ Summary statistics update
- ✅ Tasks can be edited/deleted normally
- ✅ Tasks appear in correct tabs (Backlog/Developer)

## 🚀 Next Steps

After importing:
1. **Review imported tasks** - Check dates and assignments
2. **Adjust as needed** - Edit any tasks that need changes
3. **Assign developers** - If tasks are in backlog, assign them
4. **Update Gantt chart** - Verify timeline looks correct
5. **Share with team** - Export and share the updated plan

---

**Status:** ✅ Feature Complete  
**Build:** ✅ Successful  
**Ready to Use:** ✅ Yes
