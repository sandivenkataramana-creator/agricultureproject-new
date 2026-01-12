# Quick Start Guide - Flagship Programmes System

## What's New?
✨ Replaced "Programs" with "Department-wise Flagship Programmes & Reports"
✨ Dynamic Excel ingestion - no schema changes needed
✨ Added Budget Breakdown cards to Dashboard

---

## Immediate Action Items

### 1️⃣ Setup Database (5 minutes)
```bash
# From project root
cd backend/database
mysql -u user -p database_name < create_flagship_programmes_table.sql
```

### 2️⃣ Restart Backend
```bash
# From backend directory
npm start
# or
node server.js
```

### 3️⃣ Start Frontend (if not running)
```bash
# From frontend directory
npm start
```

### 4️⃣ Navigate to New Feature
- Go to Dashboard
- Click "Flagship Programmes" tile (or /flagship-programmes in URL)
- You should see the new interface

---

## How to Use - User Guide

### Upload Programme Data
1. Click "Upload Excel" button
2. Select Excel/CSV file with programme data
3. Choose "Programmes" as import type
4. Enter department name (or leave blank for "General")
5. Click Upload
6. Data appears immediately in table

### Upload Report Data
1. Same as above, but choose "Reports" as import type
2. Excel should include "report_date" or similar date column

### View & Manage Data
- **Filter:** Select department from dropdown
- **Export:** Click "Export CSV" to download
- **View Imports:** Superadmins see "Import History" tab
- **Delete:** Superadmins can delete individual records

### View Budget Breakdown (Dashboard)
- Three new cards show:
  - Estimated Budget (Orange)
  - Budget Sanction (Green)
  - Pending Budget (Red)
- Each breaks down Central vs State allocation

---

## File Structure Changes

### New Files Created
```
backend/
  ├── database/
  │   └── create_flagship_programmes_table.sql  ← Database schema
  └── routes/
      └── flagshipProgrammes.js                  ← API endpoints

frontend/
  └── src/
      └── pages/
          └── FlagshipProgrammes.js              ← Main UI component
```

### Files Modified
```
backend/
  ├── server.js                                  ← Added route mounting
  └── routes/dashboard.js                        ← Added budget breakdown endpoint

frontend/
  ├── App.js                                     ← Added route
  ├── src/pages/Dashboard.js                     ← Added budget cards
  └── src/services/api.js                        ← Added API functions
```

---

## API Endpoints Summary

### Programmes Management
```
GET    /api/flagship-programmes                      # List all
GET    /api/flagship-programmes/:id                  # Get one
GET    /api/flagship-programmes?department=...       # Filter by department
POST   /api/flagship-programmes/upload               # Upload Excel
DELETE /api/flagship-programmes/:id                  # Delete (admin)
```

### Reporting
```
GET    /api/flagship-programmes/import-history       # View uploads (admin)
GET    /api/flagship-programmes/batch/:batchId       # Batch details (admin)
GET    /api/flagship-programmes/export/csv           # Export to CSV
```

### Dashboard
```
GET    /api/dashboard/budget-breakdown               # Budget metrics
```

---

## Accepted Excel Formats

### ✅ Any structure works!
- Any number of columns
- Any column names
- Any column order
- Multiple Excel sheets (first sheet used)

### 📌 Recommended Fields
**For Programmes:**
- Programme Name
- Department
- Status
- Fund Allocated
- Description

**For Reports:**
- Programme
- Department
- Report Date
- Achievement
- Challenges

---

## Troubleshooting

### "Page not found" when visiting /flagship-programmes
→ Clear browser cache, restart frontend dev server

### Excel upload fails
→ Check browser console (F12) for errors
→ Ensure file is .xlsx, .xls, or .csv format

### Budget cards show $0
→ Ensure budget table has data for current financial year
→ Check database connection is working

### Superadmin doesn't see Import History
→ Verify user role is 'superadmin' in users table
→ Check authentication token in browser localStorage

---

## Data Backup

### Export All Data
```javascript
// Use CSV export in UI:
// FlagshipProgrammes page → Export CSV button
```

### Backup Database
```bash
mysqldump -u user -p database_name flagship_programmes \
  flagship_import_metadata flagship_reports > backup.sql
```

---

## Key Features

✅ **Flexible Schema** - No DB changes per Excel format  
✅ **Batch Tracking** - Know exactly which upload each record came from  
✅ **Error Logging** - See what went wrong with specific rows  
✅ **Department Filter** - Organize by department  
✅ **CSV Export** - Download any filtered view  
✅ **Import History** - Audit trail for admins  
✅ **Pagination** - Handle large datasets  
✅ **Role-Based** - Delete/history only for superadmin  

---

## Performance Notes

- Tables auto-indexed on common queries
- JSON storage optimized for retrieval
- Pagination loads 10 items at a time
- Batch imports use transactions for consistency

---

## Support

### Check Logs
```
Backend: Terminal where npm start runs
Frontend: Browser Console (F12 → Console)
Database: MySQL logs
```

### Common Issues
- **Connection refused** → Backend not running
- **CORS errors** → API CORS config issue
- **Character encoding** → Database charset must be utf8mb4

---

## Next Steps After Setup

1. ✅ Create database tables
2. ✅ Restart backend
3. ✅ Test navigation to /flagship-programmes
4. ✅ Upload test Excel file
5. ✅ Verify data appears in UI
6. ✅ Check Dashboard budget cards
7. ✅ Test CSV export
8. ✅ Test department filter

---

**Implementation Complete!** 🎉

The system is ready for use. Start by setting up the database, then test with sample Excel files.
