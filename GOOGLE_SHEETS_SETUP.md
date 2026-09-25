# Google Sheets Integration Setup Guide

## Overview

The Gantt Chart Planner now supports importing timesheet data directly from Google Sheets. Each developer can have their own tab/sheet within a single spreadsheet, making it easy to manage timesheets collaboratively.

## Features

- ✅ Real-time import from Google Sheets
- ✅ Multi-developer support (each developer has their own sheet/tab)
- ✅ Automatic developer detection from sheet names
- ✅ Support for duplicate task IDs (same task, multiple entries)
- ✅ Same-day multiple entries support
- ✅ Automatic data validation and error reporting

## Setup Instructions

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click on the project dropdown at the top of the page
4. Click "NEW PROJECT"
5. Enter a project name (e.g., "Gantt Chart Planner")
6. Click "CREATE"

### Step 2: Enable Google Sheets API

1. In your new project, go to the navigation menu (☰) → "APIs & Services" → "Library"
2. Search for "Google Sheets API"
3. Click on "Google Sheets API" from the results
4. Click the "ENABLE" button

### Step 3: Create an API Key

1. Go to "APIs & Services" → "Credentials"
2. Click "+ CREATE CREDENTIALS" at the top
3. Select "API key"
4. Your API key will be generated and displayed
5. Click "RESTRICT KEY" to secure your API key:
   - Under "Application restrictions", select "HTTP referrers"
   - Add your application's domain (e.g., `https://your-domain.com/*`)
   - Under "API restrictions", select "Restrict key"
   - Select "Google Sheets API" from the dropdown
6. Click "SAVE"
7. Copy your API key (you'll need it for the application)

**Important:** Keep your API key secure! Don't commit it to version control.

### Step 4: Create Your Google Sheets Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it something like "Team Timesheets"

### Step 5: Set Up Developer Tabs

For each developer, create a separate sheet/tab:

1. Click the "+" icon at the bottom to add a new sheet
2. Rename the sheet to the developer's name (e.g., "John Doe", "Jane Smith")
3. Repeat for each developer

**Important:** The sheet name will be used as the developer name in the application.

### Step 6: Add Headers to Each Sheet

In each developer's sheet, add the following headers in row 1:

| Column | Header Name | Required | Description |
|--------|-------------|----------|-------------|
| A | Date | ✅ Yes | Date of work (YYYY-MM-DD format recommended) |
| B | ID | ✅ Yes | Task ID or Jira ticket ID |
| C | HRS SPENT | ✅ Yes | Hours spent (numeric, can be decimal) |
| D | Related Portal(s) | ❌ No | Project or portal name |
| E | Environment(s) | ❌ No | DEV, UAT, PROD, or Other |
| F | TITLE (Hrs) | ❌ No | Task title or description |
| G | Description | ❌ No | Detailed work description |

**Example:**

| Date | ID | HRS SPENT | Related Portal(s) | Environment(s) | TITLE (Hrs) | Description |
|------|-----|-----------|-------------------|----------------|-------------|-------------|
| 2026-01-05 | TASK-001 | 4 | Tres Health | DEV | Requirements Analysis | Morning session |
| 2026-01-05 | TASK-001 | 3 | Tres Health | DEV | Requirements Analysis | Afternoon session |
| 2026-01-06 | TASK-002 | 6 | Shopmool | UAT | Backend Development | API integration |

### Step 7: Share the Spreadsheet

1. Click the "Share" button in the top-right corner
2. Click "Get link" in the top-right
3. Change "Restricted" to "Anyone with the link"
4. Set the role to "Viewer"
5. Click "Done"

**Important:** The spreadsheet must be accessible via the API key, so it needs to be shared with "Anyone with the link".

### Step 8: Get the Spreadsheet ID

1. Look at the URL of your spreadsheet
2. The URL looks like: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
3. Copy the SPREADSHEET_ID part (the long string between `/d/` and `/edit`)

**Example:**
- URL: `https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/edit`
- Spreadsheet ID: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms`

### Step 9: Configure the Application

1. Open the Gantt Chart Planner application
2. Go to the "Timesheet Dashboard" tab
3. Click "Import from Google Sheets"
4. Enter your Spreadsheet ID (or paste the full URL)
5. Enter your API Key
6. Click "Connect to Google Sheets"
7. The application will show all available sheets (developers)
8. Click "Import All Sheets" to import data from all developers

## Usage Examples

### Example 1: Single Developer, Single Day

**Sheet: "John Doe"**

| Date | ID | HRS SPENT | Related Portal(s) | Environment(s) | TITLE (Hrs) | Description |
|------|-----|-----------|-------------------|----------------|-------------|-------------|
| 2026-01-05 | TASK-001 | 8 | Tres Health | DEV | Requirements Analysis | Full day work |

**Result:** 1 entry imported for John Doe

### Example 2: Single Developer, Multiple Entries Same Day

**Sheet: "John Doe"**

| Date | ID | HRS SPENT | Related Portal(s) | Environment(s) | TITLE (Hrs) | Description |
|------|-----|-----------|-------------------|----------------|-------------|-------------|
| 2026-01-05 | TASK-001 | 4 | Tres Health | DEV | Requirements Analysis | Morning session |
| 2026-01-05 | TASK-001 | 3 | Tres Health | DEV | Requirements Analysis | Afternoon session |
| 2026-01-05 | TASK-002 | 2 | Shopmool | UAT | Backend Development | Bug fix |

**Result:** 3 entries imported for John Doe (duplicate task IDs allowed)

### Example 3: Multiple Developers

**Sheet: "John Doe"**

| Date | ID | HRS SPENT | Related Portal(s) | Environment(s) | TITLE (Hrs) | Description |
|------|-----|-----------|-------------------|----------------|-------------|-------------|
| 2026-01-05 | TASK-001 | 6 | Tres Health | DEV | Requirements Analysis | Work on requirements |

**Sheet: "Jane Smith"**

| Date | ID | HRS SPENT | Related Portal(s) | Environment(s) | TITLE (Hrs) | Description |
|------|-----|-----------|-------------------|----------------|-------------|-------------|
| 2026-01-05 | TASK-001 | 4 | Tres Health | UAT | Requirements Analysis | Testing requirements |
| 2026-01-05 | TASK-003 | 5 | Shopmool | DEV | Backend Development | API development |

**Result:** 
- 1 entry imported for John Doe
- 2 entries imported for Jane Smith
- Total: 3 entries from 2 developers

### Example 4: Same Task, Multiple Days

**Sheet: "John Doe"**

| Date | ID | HRS SPENT | Related Portal(s) | Environment(s) | TITLE (Hrs) | Description |
|------|-----|-----------|-------------------|----------------|-------------|-------------|
| 2026-01-05 | TASK-001 | 6 | Tres Health | DEV | Requirements Analysis | Day 1 |
| 2026-01-06 | TASK-001 | 7 | Tres Health | DEV | Requirements Analysis | Day 2 |
| 2026-01-07 | TASK-001 | 5 | Tres Health | DEV | Requirements Analysis | Day 3 |

**Result:** 3 entries imported for John Doe (same task, different days)

## Date Format Support

The application supports multiple date formats:

- **YYYY-MM-DD** (recommended): `2026-01-05`
- **MM/DD/YYYY**: `01/05/2026`
- **DD-MM-YYYY**: `05-01-2026`
- **Excel date numbers**: Automatically converted

**Recommendation:** Use YYYY-MM-DD format for consistency.

## Environment Values

The application recognizes the following environment values (case-insensitive):

- **DEV** or **DEVELOPMENT** → DEV
- **UAT** or **TEST** → UAT
- **PROD** or **PRODUCTION** → PROD
- **Anything else** → Other

## Troubleshooting

### Error: "Failed to connect to Google Sheets"

**Possible causes:**
1. Invalid API key
2. Invalid Spreadsheet ID
3. Spreadsheet is not shared with "Anyone with the link"
4. Google Sheets API is not enabled

**Solutions:**
1. Verify your API key is correct
2. Verify the Spreadsheet ID is correct (copy from URL)
3. Check spreadsheet sharing settings
4. Ensure Google Sheets API is enabled in Google Cloud Console

### Error: "Sheet is empty"

**Cause:** The sheet has no data rows (only headers or completely empty)

**Solution:** Add data rows below the headers

### Error: "Missing required columns"

**Cause:** The sheet is missing required columns (Date, ID, HRS SPENT)

**Solution:** Add the required columns to the sheet

### Error: "Invalid date format"

**Cause:** The date value cannot be parsed

**Solution:** Use a supported date format (YYYY-MM-DD recommended)

### No sheets found

**Cause:** All sheets are named with "System" prefix or spreadsheet has no sheets

**Solution:** Rename your sheets to developer names (without "System" prefix)

## Best Practices

### 1. Sheet Naming
- Use full developer names (e.g., "John Doe" not "JD")
- Avoid special characters in sheet names
- Don't use "System" prefix (reserved for system sheets)

### 2. Data Entry
- Use consistent date formats across all sheets
- Fill in required columns (Date, ID, HRS SPENT)
- Use decimal hours for partial hours (e.g., 1.5, 0.25)
- Add descriptions for better tracking

### 3. Collaboration
- Share the spreadsheet with your team
- Give each developer edit access to their own sheet
- Consider using protected ranges to prevent accidental edits

### 4. Regular Imports
- Import timesheets regularly (daily or weekly)
- The application handles duplicate entries gracefully
- Each import adds new entries without removing existing ones

### 5. Data Validation
- Review import results for errors and warnings
- Fix any validation errors in the spreadsheet
- Re-import after fixing errors

## Security Considerations

### API Key Security
- Restrict your API key to specific domains
- Don't commit API keys to version control
- Use environment variables for API keys in production
- Rotate API keys periodically

### Spreadsheet Security
- Use "Viewer" access for the shared link
- Don't include sensitive information in sheet names
- Consider using a dedicated Google account for timesheets
- Regularly review who has access to the spreadsheet

### Data Privacy
- Timesheet data may contain sensitive information
- Ensure compliance with your organization's data policies
- Consider data retention policies
- Implement access controls in the application

## Advanced Features

### Real-time Updates

The application fetches data from Google Sheets on-demand. To see the latest data:
1. Click "Import from Google Sheets"
2. Re-enter your credentials (or they may be cached)
3. Click "Import All Sheets"

### Multiple Spreadsheets

You can use multiple spreadsheets for different purposes:
- One spreadsheet per project
- One spreadsheet per quarter
- One spreadsheet per team

Just use different Spreadsheet IDs for each import.

### Automated Imports

For automated imports, consider:
- Using Google Apps Script to trigger imports
- Setting up webhooks for real-time updates
- Creating a scheduled job to import data periodically

## API Reference

### Google Sheets API Endpoints Used

1. **List Sheets**
   - Endpoint: `GET /v4/spreadsheets/{spreadsheetId}`
   - Purpose: Get list of all sheets in the spreadsheet

2. **Get Sheet Data**
   - Endpoint: `GET /v4/spreadsheets/{spreadsheetId}/values/{range}`
   - Purpose: Get data from a specific sheet

### Rate Limits

Google Sheets API has rate limits:
- 100 requests per 100 seconds per user
- 500 requests per 100 seconds per project

For most use cases, these limits are sufficient. If you hit rate limits:
- Wait a few seconds before retrying
- Reduce the frequency of imports
- Consider caching data locally

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the Google Sheets API documentation
3. Check the application console for error messages
4. Contact your system administrator

## Changelog

### Version 1.0.0 (2026-01-XX)
- Initial release
- Google Sheets integration
- Multi-developer support
- Real-time import
- Duplicate task ID support

---

**Need help?** Check the application console for detailed error messages and logs.
