# Google Sheets Integration - Quick Start Guide

## 🎉 What You Can Do Now

Import timesheet data directly from Google Sheets with **multi-developer tab support**!

## 🚀 Quick Setup (5 Minutes)

### Step 1: Create Google Cloud Project (2 min)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable "Google Sheets API"
4. Create an API key (copy it - you'll need it)

### Step 2: Create Google Spreadsheet (2 min)
1. Create a new Google Sheets spreadsheet
2. Create one tab per developer (name tabs after developers)
3. Add headers to each tab:
   ```
   Date | ID | HRS SPENT | Related Portal(s) | Environment(s) | TITLE (Hrs) | Description
   ```
4. Share the spreadsheet: "Anyone with the link can view"
5. Copy the Spreadsheet ID from the URL

### Step 3: Import Data (1 min)
1. Go to "Timesheet Dashboard" tab
2. Click "📊 Import from Google Sheets"
3. Enter Spreadsheet ID and API Key
4. Click "Connect"
5. Click "Import All Sheets"
6. Done! ✅

## 📊 Example Spreadsheet Structure

**Spreadsheet: "Team Timesheets"**

**Tab 1: "John Doe"**
| Date | ID | HRS SPENT | Related Portal(s) | Environment(s) | TITLE (Hrs) | Description |
|------|-----|-----------|-------------------|----------------|-------------|-------------|
| 2026-01-05 | TASK-001 | 4 | Tres Health | DEV | Requirements | Morning session |
| 2026-01-05 | TASK-001 | 3 | Tres Health | DEV | Requirements | Afternoon session |
| 2026-01-06 | TASK-002 | 6 | Shopmool | UAT | Backend Dev | API work |

**Tab 2: "Jane Smith"**
| Date | ID | HRS SPENT | Related Portal(s) | Environment(s) | TITLE (Hrs) | Description |
|------|-----|-----------|-------------------|----------------|-------------|-------------|
| 2026-01-05 | TASK-001 | 5 | Tres Health | UAT | Requirements | Testing |
| 2026-01-05 | TASK-003 | 4 | Hamsarjo | PROD | Bug Fix | Production issue |

**Result:** 5 entries imported from 2 developers

## ✅ Key Features

- ✅ **Multi-developer tabs** - Each sheet = one developer
- ✅ **Duplicate task IDs** - Same task, multiple entries allowed
- ✅ **Same-day entries** - Log morning/afternoon sessions separately
- ✅ **Real-time import** - Fetch latest data from Google Sheets
- ✅ **Data validation** - Automatic error checking
- ✅ **Preview before import** - See what will be imported

## 🔑 Getting Your API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" → "Credentials"
3. Click "Create Credentials" → "API key"
4. Copy the generated key
5. (Optional) Restrict the key to your domain for security

## 📋 Required Columns

| Column | Required | Example |
|--------|----------|---------|
| Date | ✅ Yes | 2026-01-05 |
| ID | ✅ Yes | TASK-001 |
| HRS SPENT | ✅ Yes | 6.5 |
| Related Portal(s) | ❌ No | Tres Health |
| Environment(s) | ❌ No | DEV |
| TITLE (Hrs) | ❌ No | Requirements Analysis |
| Description | ❌ No | Morning session |

## 🎯 Supported Scenarios

### Scenario 1: Split Work Sessions
```
2026-01-05 | TASK-001 | 4h | Morning session
2026-01-05 | TASK-001 | 3h | Afternoon session
```
✅ Both entries imported (Total: 7 hours)

### Scenario 2: Multi-Day Task
```
2026-01-05 | TASK-001 | 6h | Day 1
2026-01-06 | TASK-001 | 7h | Day 2
2026-01-07 | TASK-001 | 5h | Day 3
```
✅ All entries imported (Total: 18 hours)

### Scenario 3: Team Collaboration
```
John Doe:   2026-01-05 | TASK-001 | 6h | Backend
Jane Smith: 2026-01-05 | TASK-001 | 4h | Frontend
Bob Wilson: 2026-01-05 | TASK-001 | 2h | Testing
```
✅ All entries imported (Total: 12 hours by 3 developers)

## 📖 Full Documentation

- **Setup Guide**: [GOOGLE_SHEETS_SETUP.md](./GOOGLE_SHEETS_SETUP.md)
- **Technical Details**: [GOOGLE_SHEETS_IMPLEMENTATION.md](./GOOGLE_SHEETS_IMPLEMENTATION.md)

## 🆘 Troubleshooting

**"Failed to connect"**
- Check API key is correct
- Verify Spreadsheet ID
- Ensure Google Sheets API is enabled

**"No sheets found"**
- Check spreadsheet has sheets
- Ensure sheet names don't start with "System"

**"Missing required columns"**
- Add required columns: Date, ID, HRS SPENT
- Check headers are in row 1

## 🎉 You're Ready!

Your Google Sheets integration is complete and ready to use. Start importing timesheets from Google Sheets now!

**Build Status:** ✅ Successful  
**Ready for Production:** ✅ Yes
