# Flagship Programmes - Visual Reference Guide

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          USER JOURNEY                           │
└─────────────────────────────────────────────────────────────────┘

                           Dashboard
                              ↓
                    ┌──────────────────┐
                    │ Click "Flagship   │
                    │ Programmes" Tile  │
                    └──────────────────┘
                              ↓
                    ┌──────────────────────────────────────┐
                    │  /flagship-programmes Route Loads    │
                    └──────────────────────────────────────┘
                              ↓
          ┌───────────────────┴───────────────────┐
          ↓                                       ↓
    ┌──────────────────┐            ┌──────────────────┐
    │   Programmes Tab │            │   Reports Tab    │
    │ (default view)   │            │   (optional)     │
    └──────────────────┘            └──────────────────┘
          ↓                               ↓
    List programmes              List reports
    with pagination              with pagination
          ↓
    User Actions Available:
    • Filter by department
    • Export to CSV
    • Upload new file (shows modal)
    • View (click row)
    • Delete (admin only)

                    Upload Excel Workflow
                              ↓
                    ┌──────────────────┐
                    │ Click "Upload"   │
                    │ Button           │
                    └──────────────────┘
                              ↓
                    ┌──────────────────────────────────────┐
                    │  Upload Modal Appears                │
                    │  - File selector                     │
                    │  - Import type: Programme/Report     │
                    │  - Department dropdown               │
                    │  - Upload button                     │
                    └──────────────────────────────────────┘
                              ↓
                    ┌──────────────────┐
                    │ Select Excel File│
                    │ & Options        │
                    └──────────────────┘
                              ↓
                    ┌──────────────────────────────────────┐
                    │ Click Upload Button                  │
                    │ Frontend: XLSX.read() parses file    │
                    │ → Converts to JSON array             │
                    └──────────────────────────────────────┘
                              ↓
                    ┌──────────────────────────────────────┐
                    │ POST /api/flagship-programmes/upload │
                    │ Request body:                        │
                    │ {                                    │
                    │   file_data: [...rows...],          │
                    │   file_name: "...",                 │
                    │   import_type: "programme",         │
                    │   department_name: "..."            │
                    │ }                                    │
                    └──────────────────────────────────────┘
                              ↓
                    ┌──────────────────────────────────────┐
                    │ Backend Processing:                  │
                    │ 1. Generate Batch ID                │
                    │ 2. Start transaction                │
                    │ 3. For each row:                    │
                    │    - INSERT with JSON data          │
                    │    - Capture columns                │
                    │ 4. Insert metadata                  │
                    │ 5. Commit transaction               │
                    └──────────────────────────────────────┘
                              ↓
                    ┌──────────────────────────────────────┐
                    │ Return Response:                     │
                    │ {                                    │
                    │   success: true,                    │
                    │   batchId: "BATCH_...",             │
                    │   totalRecords: 100,                │
                    │   successfulRecords: 98,            │
                    │   failedRecords: 2,                 │
                    │   errors: [...]                     │
                    │ }                                    │
                    └──────────────────────────────────────┘
                              ↓
                    ┌──────────────────────────────────────┐
                    │ Frontend: Display Success Message    │
                    │ & Refresh Data from GET /api/...     │
                    └──────────────────────────────────────┘
                              ↓
                    ┌──────────────────┐
                    │ Data appears in  │
                    │ table immediately│
                    │ (paginated)      │
                    └──────────────────┘
```

---

## Database Table Relationships

```
┌──────────────────────────────────────────────────┐
│      flagship_import_metadata                    │
│  (tracks each upload/batch)                      │
│                                                  │
│  ┌──────────────────────────────┐               │
│  │ import_batch_id (UNIQUE) ──┐ │               │
│  │ file_name                   │ │               │
│  │ total_records               │ │               │
│  │ successful_records          │ │               │
│  │ failed_records              │ │               │
│  │ column_mapping (JSON)       │ │               │
│  │ error_log                   │ │               │
│  └──────────────────────────────┘ │               │
│                                    │               │
│  References:                      ↓               │
│     └─ To many records in ──────┐                │
│                                 ↓                │
│      ┌─────────────────────────────────────┐    │
│      │   flagship_programmes               │    │
│      │   (stores programme records)         │    │
│      │                                     │    │
│      │ ┌─────────────────────────────────┐│    │
│      │ │ import_batch_id (Foreign Key) ││    │
│      │ │ programme_name                 ││    │
│      │ │ department_name                ││    │
│      │ │ data_json (entire row as JSON) ││    │
│      │ │ status (active/inactive)       ││    │
│      │ │ created_by, created_at         ││    │
│      │ └─────────────────────────────────┘│    │
│      │                                     │    │
│      └─────────────────────────────────────┘    │
│                                                  │
│  Also contains:                                 │
│     └─ flagship_reports                        │
│        (parallel table for reports)             │
│        Same structure + report_date field       │
└──────────────────────────────────────────────────┘
```

---

## Data Flow in Database

```
Excel File Input
      ↓
┌─────────────────────────────────┐
│ Row 1: {name: "...",            │
│        dept: "...",             │
│        fund: "...",             │
│        ...50 more fields...}    │
│ Row 2: {...}                    │
│ Row 3: {...}                    │
│ ... 97 more rows                │
└─────────────────────────────────┘
      ↓
  XLSX Parsing
      ↓
┌─────────────────────────────────────────────┐
│ JSON Array                                  │
│ [                                           │
│   {full_row_data},                         │
│   {full_row_data},                         │
│   {full_row_data},                         │
│   ... 97 more objects                      │
│ ]                                           │
└─────────────────────────────────────────────┘
      ↓
 Send to Backend
      ↓
 Database Insert
      ↓
┌──────────────────────────────────┐
│ flagship_programmes TABLE        │
│  ID │ Dept      │ data_json      │
├────┼───────────┼────────────────┤
│ 1  │ Agri      │ {...entire     │
│    │           │   row as       │
│    │           │   JSON}        │
│ 2  │ Horticult │ {...}          │
│ 3  │ Animal    │ {...}          │
│... │ ...       │ ...            │
└──────────────────────────────────┘
           ↓ Also Insert ↓
┌──────────────────────────────────┐
│ flagship_import_metadata TABLE   │
│  batch_id   │ success │ failed   │
├─────────────┼─────────┼──────────┤
│ BATCH_...   │ 98      │ 2        │
└──────────────────────────────────┘
      ↓
 Retrieval (GET request)
      ↓
┌──────────────────────────────────┐
│ Parse JSON back to object        │
│ {                                │
│   id: 1,                         │
│   dept: "Agriculture",           │
│   data: {full_row_object},       │
│   created_at: "2025-01-15T..."   │
│ }                                │
└──────────────────────────────────┘
      ↓
 Send to Frontend
      ↓
 Display in Table
```

---

## UI Component Structure

```
┌─────────────────────────────────────────────────────────┐
│                    FlagshipProgrammes                   │
│         (Main React Component)                          │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │            Header Section                         │  │
│  │ ┌────────────────┐  ┌──────────────────┐         │  │
│  │ │ Upload Button  │  │ Department Filter│         │  │
│  │ └────────────────┘  └──────────────────┘         │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │        Tab Navigation                            │  │
│  │ ┌────────────────┬─────────────┐                 │  │
│  │ │ Programmes (5) │ Reports (3) │                 │  │
│  │ └────────────────┴─────────────┘                 │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │        Data Table (Active Tab)                   │  │
│  │ ┌────┬──────────┬──────────┬──────────────────┐ │  │
│  │ │ #  │ Name     │ Dept     │ Data Preview     │ │  │
│  │ ├────┼──────────┼──────────┼──────────────────┤ │  │
│  │ │ 1  │ Prog A   │ Agri     │ {"key1":"val"... │ │  │
│  │ │ 2  │ Prog B   │ Horticul │ {"key2":"val"... │ │  │
│  │ │ 3  │ Prog C   │ Animal   │ {"key3":"val"... │ │  │
│  │ │ 4  │ Prog D   │ Fishery  │ {"key4":"val"... │ │  │
│  │ │ 5  │ Prog E   │ Agri     │ {"key5":"val"... │ │  │
│  │ │ 6  │ Prog F   │ Horticul │ {"key6":"val"... │ │  │
│  │ │ 7  │ Prog G   │ Animal   │ {"key7":"val"... │ │  │
│  │ │ 8  │ Prog H   │ Fishery  │ {"key8":"val"... │ │  │
│  │ │ 9  │ Prog I   │ Agri     │ {"key9":"val"... │ │  │
│  │ │10  │ Prog J   │ Horticul │ {"key10":"val".. │ │  │
│  │ └────┴──────────┴──────────┴──────────────────┘ │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │        Pagination                                │  │
│  │  Page 1 of 5  [< Prev] [1 2 3 4 5] [Next >]    │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │        Export Section                            │  │
│  │ [Download CSV] for filtered results              │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  If User is Admin:                               │  │
│  │  ┌────────────────────────────────────────────┐ │  │
│  │  │ Import History Tab                         │ │  │
│  │  │ ┌──────────┬────────┬────────────────────┐ │ │  │
│  │  │ │ Batch    │ Count  │ Error Messages     │ │ │  │
│  │  │ │ BATCH_.. │ 98/100 │ Row 15: invalid... │ │ │  │
│  │  │ │ BATCH_.. │ 150/150│ (none)             │ │ │  │
│  │  │ └──────────┴────────┴────────────────────┘ │ │  │
│  │  └────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Upload Modal Flow

```
Click "Upload Excel" Button
            ↓
┌─────────────────────────────────────┐
│ Upload Modal Opens                  │
│                                     │
│ ┌─────────────────────────────────┐│
│ │ Step 1: Select File             ││
│ │ [Choose File] (accepts .xlsx)   ││
│ │ Or drag & drop area              ││
│ │                                 ││
│ │ Step 2: Choose Type             ││
│ │ ○ Programme  ◉ Report           ││
│ │                                 ││
│ │ Step 3: Department              ││
│ │ [Dropdown: Select Department]   ││
│ │ - Agriculture                   ││
│ │ - Horticulture                  ││
│ │ - Animal Husbandry              ││
│ │ - Fisheries                     ││
│ │                                 ││
│ │ Step 4: Actions                 ││
│ │ [Cancel]  [Upload]              ││
│ └─────────────────────────────────┘│
└─────────────────────────────────────┘
            ↓
        User selects
        file & options
            ↓
       Click Upload
            ↓
    Show "Uploading..." spinner
            ↓
    POST to /api/flagship-programmes/upload
            ↓
    Backend processes:
    • Parse rows
    • Generate batch ID
    • Insert in transaction
    • Track success/failed
    • Insert metadata
            ↓
    Response received with:
    ✓ 98 successful
    ✗ 2 failed (errors listed)
            ↓
┌─────────────────────────────────────┐
│ Show Success Message:               │
│ "Uploaded 98 records successfully"  │
│ (with option to view error details) │
└─────────────────────────────────────┘
            ↓
        Modal closes
            ↓
    Data table refreshes
            ↓
    New records visible immediately
```

---

## State Management

```
FlagshipProgrammes Component State:

┌─────────────────────────────────────┐
│ Data State                          │
├─────────────────────────────────────┤
│ programmes: Array                   │ ← From GET /
│ reports: Array                      │ ← From GET /
│ importHistory: Array                │ ← From GET /import-history
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ UI State                            │
├─────────────────────────────────────┤
│ activeTab: 'programmes' | 'reports' │
│ selectedDepartment: String          │
│ currentPage: Number (0-based)       │
│ loading: Boolean                    │
│ uploading: Boolean                  │
│ showUploadModal: Boolean            │
│ importType: 'programme' | 'report'  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Effects (useEffect hooks)           │
├─────────────────────────────────────┤
│ On mount:                           │
│   - Fetch programmes                │
│   - Fetch import history (admin)    │
│                                     │
│ On selectedDepartment change:       │
│   - Refetch programmes with filter  │
│                                     │
│ On activeTab change:                │
│   - Show appropriate content        │
└─────────────────────────────────────┘
```

---

## Admin Dashboard View

```
┌──────────────────────────────────────────────────┐
│  Admin-Only Features                            │
│                                                 │
│  ┌────────────────────────────────────────────┐ │
│  │ Import History Tab                         │ │
│  │ Shows all uploads from all users           │ │
│  │                                            │ │
│  │ Batch: BATCH_1673784500000_xyz             │ │
│  │ File: programmes_agri.xlsx                 │ │
│  │ Date: 2025-01-15 10:30:00                  │ │
│  │ Type: Programme                            │ │
│  │ Total: 100 | Success: 98 | Failed: 2       │ │
│  │ Errors:                                    │ │
│  │  - Row 15: "Invalid department"            │ │
│  │  - Row 42: "Missing programme name"        │ │
│  │                                            │ │
│  │ [View Details] [Delete Batch] [Export]    │ │
│  │                                            │ │
│  ├────────────────────────────────────────────┤ │
│  │ Batch: BATCH_1673784200000_abc             │ │
│  │ File: reports_all_depts.xlsx               │ │
│  │ Date: 2025-01-14 15:45:00                  │ │
│  │ Type: Report                               │ │
│  │ Total: 150 | Success: 150 | Failed: 0      │ │
│  │ Status: ✓ Successful                       │ │
│  │                                            │ │
│  │ [View Details] [Delete Batch] [Export]    │ │
│  └────────────────────────────────────────────┘ │
│                                                 │
│  ┌────────────────────────────────────────────┐ │
│  │ Delete Individual Records                  │ │
│  │ (Shown in main table for admins)           │ │
│  │                                            │ │
│  │ Each row has:                              │ │
│  │ [View] [Edit] [Delete] [Audit Trail]      │ │
│  │                                            │ │
│  │ On Delete:                                 │ │
│  │ - Confirmation prompt                     │ │
│  │ - Audit log entry created                 │ │
│  │ - Record removed from display              │ │
│  └────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

---

## Error Handling Flow

```
User Uploads File
        ↓
┌─────────────────────────────┐
│ Frontend Validation:        │
│ - File selected?            │
│ - Valid format? (.xlsx)     │
└─────────────────────────────┘
        ↓
Parse with XLSX.read()
        ↓
┌─────────────────────────────┐
│ Parsing Error?              │
│ - Corrupted file?           │
│ - Invalid format?           │
└─────────────────────────────┘
        ↓
Show error: "Unable to parse file"
        ↓
POST to backend
        ↓
┌─────────────────────────────┐
│ Backend Validation:         │
│ - file_data array exists?   │
│ - import_type valid?        │
│ - Records not empty?        │
└─────────────────────────────┘
        ↓
For each record:
        ↓
Try INSERT into database
        ↓
┌──────────────────────────────┐
│ Success?                     │
│ YES → Record inserted        │
│ NO → Add to error array:     │
│    {                         │
│      rowNumber: 15,          │
│      error: "DuplicateEntry",│
│      message: "..."          │
│    }                         │
└──────────────────────────────┘
        ↓
All records processed
        ↓
Insert metadata with:
- Successful count
- Failed count  
- Error details
- Column mapping
        ↓
Return response to frontend
        ↓
┌──────────────────────────────┐
│ Display Result:              │
│ ✓ 98 records imported        │
│ ✗ 2 records failed           │
│                              │
│ [View Error Details] button  │
└──────────────────────────────┘
        ↓
If admin, error also in Import History
```

---

## Performance Metrics

```
Operation             Expected Time    Status
────────────────────────────────────────────────
Upload 100 rows       < 2 seconds      ✅ Good
Upload 1000 rows      < 5 seconds      ✅ Good
List 1000 records     < 1 second       ✅ Good
Filter by dept        < 500ms          ✅ Good
Export 100 CSV        < 2 seconds      ✅ Good
Load import history   < 1 second       ✅ Good
Delete record         < 500ms          ✅ Good
```

---

## Key Differentiators

### Traditional Database Approach ❌
```
Upload Excel with columns: A, B, C
  ↓
Alter table to add columns A, B, C
  ↓
Insert data
  ↓
Upload Excel with columns: A, B, C, D, E, F
  ↓
Alter table to add columns D, E, F
  ↓
Schema constantly changing
❌ Migration hell
❌ Downtime risk
❌ Complex rollbacks
```

### Flagship Programmes Approach ✅
```
Upload Excel with columns: A, B, C
  ↓
Store as JSON: {"A": val, "B": val, "C": val}
  ↓
Upload Excel with columns: A, B, C, D, E, F
  ↓
Store as JSON: {"A": val, "B": val, "C": val, "D": val, "E": val, "F": val}
  ↓
Same table structure
✅ No schema changes
✅ No migrations
✅ No downtime
✅ Infinite flexibility
```

---

This visual guide provides complete understanding of the system's architecture, data flow, and user experience.

