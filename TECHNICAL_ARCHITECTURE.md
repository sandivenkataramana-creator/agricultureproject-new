# Flagship Programmes System - Technical Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  FlagshipProgrammes Component                       │   │
│  │  - Excel Upload (XLSX parsing)                      │   │
│  │  - Tabs (Programmes/Reports)                        │   │
│  │  - Department Filter                                │   │
│  │  - Pagination (10 items/page)                       │   │
│  │  - CSV Export                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                          ↓                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  API Service Layer (Axios)                          │   │
│  │  - getFlagshipProgrammes()                          │   │
│  │  - uploadFlagshipData()                             │   │
│  │  - getImportHistory()                               │   │
│  │  - exportFlagshipProgrammesCSV()                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
              HTTP/REST API (JSON)
┌─────────────────────────────────────────────────────────────┐
│                   Backend (Node.js/Express)                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Route Handler: /api/flagship-programmes/*          │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │ GET  / - List programmes                   │   │   │
│  │  │ GET  /:id - Get single programme           │   │   │
│  │  │ POST /upload - Upload Excel file           │   │   │
│  │  │ GET  /import-history - Import tracking     │   │   │
│  │  │ GET  /batch/:id - Batch details            │   │   │
│  │  │ DELETE /:id - Delete record (admin)        │   │   │
│  │  │ GET  /export/csv - Export to CSV           │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │                      ↓                               │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │ Business Logic Layer                         │   │   │
│  │  │ - Excel parsing (XLSX)                       │   │   │
│  │  │ - Batch ID generation                        │   │   │
│  │  │ - Error handling & logging                   │   │   │
│  │  │ - Transaction management                     │   │   │
│  │  │ - JSON serialization                         │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │                      ↓                               │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │ Database Access Layer (MySQL2/promise)      │   │   │
│  │  │ - Connection pooling                         │   │   │
│  │  │ - Query execution                            │   │   │
│  │  │ - Transaction support                        │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                  Database Connection
┌─────────────────────────────────────────────────────────────┐
│              MariaDB/MySQL Database                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────┐ │
│  │ flagship_        │  │ flagship_import_ │  │ flagship_ │ │
│  │ programmes       │  │ metadata         │  │ reports   │ │
│  │                  │  │                  │  │           │ │
│  │ id (PK)          │  │ id (PK)          │  │ id (PK)   │ │
│  │ dept_name        │  │ batch_id (UQ)    │  │ dept_name │ │
│  │ prog_name        │  │ file_name        │  │ report_   │ │
│  │ import_batch_id  │  │ total_records    │  │ name      │ │
│  │ data_json (JSON) │  │ success_records  │  │ report_   │ │
│  │ status           │  │ error_log        │  │ date      │ │
│  │ created_by       │  │ column_mapping   │  │ data_json │ │
│  │ created_at       │  │ created_by       │  │ created_  │ │
│  │ updated_at       │  │ created_at       │  │ by        │ │
│  │                  │  │                  │  │ created_at│ │
│  │ KEY: batch_id    │  │ KEY: batch_id    │  │ KEY:      │ │
│  │ KEY: dept_id     │  │ KEY: status      │  │ batch_id  │ │
│  │ KEY: status      │  │ KEY: created_at  │  │ KEY:      │ │
│  │ KEY: created_at  │  │                  │  │ created_at│ │
│  └──────────────────┘  └──────────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### Excel Upload Flow
```
User selects Excel file
        ↓
Frontend: FileReader parses Excel
        ↓
XLSX.read() → sheet_to_json() → Array of objects
        ↓
POST /api/flagship-programmes/upload
  {
    file_data: [{col1: val1, col2: val2, ...}, ...],
    file_name: "programmes.xlsx",
    import_type: "programme",
    department_name: "Agriculture"
  }
        ↓
Backend: generateBatchId()
        ↓
Backend: START TRANSACTION
        ↓
For each row in file_data:
  - INSERT into flagship_programmes
    (data_json: JSON.stringify(row))
  - Capture column names from Object.keys(row)
  - Handle errors per row
        ↓
INSERT into flagship_import_metadata
  (batch_id, total_records, successful_records, 
   failed_records, column_mapping, error_log)
        ↓
COMMIT TRANSACTION
        ↓
Return success response with counts
        ↓
Frontend: Display success message
        ↓
Frontend: Refresh data from GET /
        ↓
Display in table with pagination
```

### Data Retrieval Flow
```
GET /api/flagship-programmes?department=Agriculture
        ↓
Query: SELECT * FROM flagship_programmes 
       WHERE department_name = ? AND status = 'active'
        ↓
Database returns rows with data_json as string
        ↓
Backend: Parse JSON data for each row
        ↓
Return JSON response:
  [{
    id: 1,
    department_name: "Agriculture",
    programme_name: "Crop Insurance",
    data: {col1: val1, col2: val2, ...},  // Parsed JSON
    created_at: "2025-01-15T10:30:00Z"
  }, ...]
        ↓
Frontend: Display in table
        ↓
Pagination: Show 10 items per page
        ↓
User can filter, export, or delete
```

---

## Database Schema Design

### JSON Storage Strategy
```
Column: data_json (LONGTEXT, utf8mb4)
Value: {"programme_name": "Crop Insurance", 
        "department": "Agriculture", 
        "fund_allocated": "50000",
        "status": "Active",
        ...any_other_columns...}

Benefits:
✓ No schema migration per Excel format
✓ Unlimited columns
✓ Any column names
✓ Preserves all data types
✓ Easy to query specific fields via JSON functions
```

### Metadata Storage Strategy
```
Column: column_mapping (LONGTEXT, JSON)
Value: ["programme_name", "department", "fund_allocated", 
        "status", "focus_area", "contact_person"]

Benefits:
✓ Tracks actual columns in uploaded file
✓ Enables future analysis of data variations
✓ Helps with data validation and transformation
```

---

## Authentication & Authorization

### JWT Middleware
```
Request → authenticateJWT middleware
          ↓
          Verify JWT token from Authorization header
          ↓
          Extract user info (id, role)
          ↓
          Attach to req.user
          ↓
          Pass to route handler
```

### Role-Based Access Control
```
For sensitive operations:
↓
requireRole('superadmin') middleware
↓
Checks if req.user.role === 'superadmin'
↓
If yes → Allow operation
If no → Return 403 Forbidden
```

### Protected Endpoints
```
DELETE /api/flagship-programmes/:id        → Superadmin only
GET /api/flagship-programmes/import-history → Superadmin only
GET /api/flagship-programmes/batch/:id      → Superadmin only
```

---

## Error Handling Strategy

### Frontend Error Handling
```
try {
  const response = await uploadFlagshipData({...})
} catch (error) {
  if (error.response?.status === 400) {
    // Validation error - show message to user
    setError('Invalid file format')
  } else if (error.response?.status === 401) {
    // Unauthorized - redirect to login
    navigateToLogin()
  } else if (error.response?.status === 403) {
    // Forbidden - show permission error
    setError('You do not have permission')
  } else {
    // Network or other error
    setError('Upload failed: ' + error.message)
  }
}
```

### Backend Error Handling
```
POST /upload → try/catch block
  ↓
  try:
    - Parse request data
    - Validate file_data array
    - Start transaction
    - Insert records
    - Update metadata
    - Commit transaction
  ↓
  catch (error):
    - Rollback transaction
    - Log error details
    - Track which row failed
    - Return error response with details
```

### Database Error Handling
```
Query execution → Error occurred
  ↓
Catch block captures:
  - Error code (e.g., ER_DUP_ENTRY)
  - Error message
  - Row number that failed
  ↓
Log to error_log in metadata
  ↓
Return to frontend in response
```

---

## Performance Optimization

### Database Level
```
Indexes on:
✓ department_id, department_name (filtering)
✓ import_batch_id (batch queries)
✓ status (filter by active/inactive)
✓ created_at (sorting by date)

Connection pooling:
✓ Reuses connections from pool
✓ Reduces connection overhead
✓ Handles concurrent requests
```

### Frontend Level
```
Pagination:
✓ Load 10 items at a time
✓ Reduces DOM elements
✓ Faster rendering

Memoization:
✓ useMemo for expensive calculations
✓ useCallback for function references
✓ Prevents unnecessary re-renders

State management:
✓ Only re-render affected components
✓ Separate state for each feature (programmes, reports)
✓ Lazy load import history for admins
```

### Backend Level
```
Transactions:
✓ Batch operations for consistency
✓ Atomic all-or-nothing inserts

Query optimization:
✓ SELECT specific columns needed
✓ Use indexes effectively
✓ Avoid N+1 queries

Caching:
✓ API response caching possible
✓ Batch results cached in metadata
```

---

## Scalability Considerations

### Current Design Supports
```
✓ Millions of records (indexed queries)
✓ Hundreds of concurrent uploads (connection pool)
✓ Files with 100+ columns (JSON storage)
✓ Multiple simultaneous users (transactions)
✓ Various file formats (.xlsx, .csv, etc.)
```

### Future Enhancement Points
```
1. Elasticsearch for full-text search in JSON data
2. Redis caching for frequently accessed batches
3. Message queue for async bulk imports
4. Data transformation pipeline for data cleaning
5. API rate limiting per user/department
6. Advanced analytics on data_json field
7. Automated data validation rules
8. Scheduled batch imports from external sources
```

---

## Security Measures

### Input Validation
```
✓ Validate file_data array is present
✓ Check file extension (.xlsx, .csv)
✓ Limit file size (e.g., 5MB)
✓ Validate import_type (programme/report)
✓ Trim and validate department_name
```

### SQL Injection Prevention
```
✓ Parameterized queries (mysql2/promise)
✓ No string concatenation in queries
✓ Prepared statements used
```

### Authentication/Authorization
```
✓ JWT token validation
✓ Role-based access control
✓ Superadmin required for admin operations
✓ User ID logged for audit trail
```

### Data Protection
```
✓ HTTPS for data in transit
✓ Character set utf8mb4 for data at rest
✓ Transaction support for consistency
✓ Audit trail with created_by and created_at
```

---

## Deployment Checklist

### Database
```
[ ] Create tables using provided SQL script
[ ] Verify character encoding: utf8mb4
[ ] Create indexes for performance
[ ] Enable transaction support
[ ] Set up automated backups
```

### Backend
```
[ ] Install dependencies: npm install
[ ] Configure database connection
[ ] Set JWT secret in environment
[ ] Test all endpoints
[ ] Enable error logging
[ ] Monitor server logs
```

### Frontend
```
[ ] Install dependencies: npm install
[ ] Build production bundle: npm run build
[ ] Configure API endpoint
[ ] Test all features
[ ] Enable error tracking
[ ] Monitor browser console
```

### Operations
```
[ ] Set up database backups
[ ] Monitor disk space
[ ] Monitor memory usage
[ ] Set up error alerting
[ ] Document recovery procedures
[ ] Train support staff
```

---

## Monitoring & Maintenance

### Key Metrics to Monitor
```
✓ Upload success rate (target: >99%)
✓ Average upload time (target: <5 sec per 1000 rows)
✓ Database query time (target: <500ms)
✓ API response time (target: <1s)
✓ Error rate (target: <1%)
```

### Health Checks
```
Daily:
  - Database connectivity
  - API endpoints responding
  - File upload working
  
Weekly:
  - Database disk usage
  - Error log review
  - Performance metrics
  
Monthly:
  - Database backup verification
  - Security audit
  - User feedback review
```

---

This architecture provides a robust, scalable foundation for managing dynamic Excel-based data imports while maintaining data integrity and security.

