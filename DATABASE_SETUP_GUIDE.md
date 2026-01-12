# Flagship Programmes Database Setup Guide

## Prerequisites
- MariaDB/MySQL running and accessible
- Database credentials configured in `backend/config/database.js`
- Command line access to MySQL

---

## Setup Instructions

### Step 1: Locate the Schema File
```
backend/database/create_flagship_programmes_table.sql
```

### Step 2: Create Tables

#### Option A: Using MySQL CLI
```bash
# Navigate to backend directory
cd backend/database

# Run the SQL file
mysql -u your_username -p your_database_name < create_flagship_programmes_table.sql

# Enter password when prompted
```

#### Option B: Using a MySQL GUI (e.g., Workbench, phpMyAdmin)
1. Open your MySQL client
2. Copy entire contents of `create_flagship_programmes_table.sql`
3. Execute the query
4. Verify three new tables appear in your database

#### Option C: Using Node.js Script
Create `backend/run_flagship_setup.js`:
```javascript
const db = require('./config/database');
const fs = require('fs');
const path = require('path');

const setupFlagship = async () => {
  try {
    const sqlFile = fs.readFileSync(
      path.join(__dirname, 'database/create_flagship_programmes_table.sql'),
      'utf8'
    );
    
    const statements = sqlFile.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await db.query(statement);
        console.log('✓ Executed:', statement.substring(0, 50) + '...');
      }
    }
    
    console.log('✓ All tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Setup failed:', error.message);
    process.exit(1);
  }
};

setupFlagship();
```

Then run:
```bash
node backend/run_flagship_setup.js
```

---

## Verify Installation

### Check Tables Were Created:
```sql
-- Check table exists
SHOW TABLES LIKE 'flagship_%';

-- Expected output:
-- flagship_programmes
-- flagship_import_metadata
-- flagship_reports
```

### Verify Table Structure:
```sql
-- Check flagship_programmes
DESCRIBE flagship_programmes;

-- Check flagship_import_metadata
DESCRIBE flagship_import_metadata;

-- Check flagship_reports
DESCRIBE flagship_reports;
```

### All columns should match the schema file:
- `flagship_programmes` should have 11 columns
- `flagship_import_metadata` should have 12 columns
- `flagship_reports` should have 11 columns

---

## Testing

### Test 1: Insert Sample Programme
```sql
INSERT INTO flagship_programmes 
(department_name, programme_name, import_batch_id, data_json, status, created_by)
VALUES (
  'Agriculture',
  'Crop Insurance',
  'BATCH_TEST_001',
  '{"programme_name":"Crop Insurance","department":"Agriculture","fund":"50000"}',
  'active',
  1
);
```

### Test 2: Verify Data Retrieval
```javascript
// In Node.js after running backend server
const response = await fetch('http://localhost:5000/api/flagship-programmes');
const data = await response.json();
console.log(data);
// Should return the inserted record with parsed data
```

### Test 3: Check Import Metadata
```sql
SELECT * FROM flagship_import_metadata;
-- Should be empty initially, populated after first Excel upload
```

---

## Troubleshooting

### Issue: "Table already exists"
**Solution:** Tables already created, no action needed. Or drop and recreate:
```sql
DROP TABLE IF EXISTS flagship_programmes;
DROP TABLE IF EXISTS flagship_import_metadata;
DROP TABLE IF EXISTS flagship_reports;

-- Then rerun the setup
```

### Issue: "Character set utf8mb4 not available"
**Solution:** Ensure MariaDB version is 5.5.3+. Run:
```sql
ALTER TABLE flagship_programmes CONVERT TO CHARACTER SET utf8mb4;
ALTER TABLE flagship_import_metadata CONVERT TO CHARACTER SET utf8mb4;
ALTER TABLE flagship_reports CONVERT TO CHARACTER SET utf8mb4;
```

### Issue: "Permission denied"
**Solution:** Ensure your database user has CREATE and ALTER privileges:
```sql
GRANT CREATE, ALTER, INSERT, UPDATE, DELETE, SELECT ON database_name.* TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
```

### Issue: JSON data not retrieving correctly
**Solution:** Verify character set for data_json column:
```sql
SELECT COLUMN_NAME, COLUMN_TYPE, CHARACTER_SET_NAME, COLLATION_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'flagship_programmes' AND COLUMN_NAME = 'data_json';
```

Should show: `CHARACTER SET = utf8mb4`, `COLLATION = utf8mb4_bin`

---

## Data Persistence

### Backup Data
```bash
# Backup all flagship tables
mysqldump -u user -p database_name flagship_programmes flagship_import_metadata flagship_reports > flagship_backup.sql
```

### Restore from Backup
```bash
# Restore data
mysql -u user -p database_name < flagship_backup.sql
```

---

## Column Definitions Reference

### flagship_programmes
| Column | Type | Purpose |
|---|---|---|
| id | int | Primary key |
| department_id | int | Reference to department |
| department_name | varchar | Department name |
| programme_name | varchar | Programme identifier |
| import_batch_id | varchar | Tracks which import batch |
| data_json | longtext | Complete row data as JSON |
| status | enum | active/inactive |
| created_by | int | User who created record |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update time |

### flagship_import_metadata
| Column | Type | Purpose |
|---|---|---|
| id | int | Primary key |
| import_batch_id | varchar | Unique batch identifier |
| file_name | varchar | Original Excel file name |
| file_size | bigint | File size in bytes |
| total_records | int | Total rows in file |
| successful_records | int | Successfully inserted |
| failed_records | int | Failed inserts |
| column_mapping | longtext | Array of column names |
| import_type | varchar | 'programme' or 'report' |
| status | enum | pending/processing/completed/failed |
| error_log | longtext | Error details |
| created_by | int | User who uploaded |
| created_at | timestamp | Upload time |

### flagship_reports
| Column | Type | Purpose |
|---|---|---|
| id | int | Primary key |
| department_id | int | Reference to department |
| department_name | varchar | Department name |
| report_name | varchar | Report identifier |
| report_date | date | Date of report |
| import_batch_id | varchar | Tracks which import batch |
| data_json | longtext | Complete row data as JSON |
| status | enum | active/inactive |
| created_by | int | User who created record |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update time |

---

## Post-Setup Checklist

- [ ] Database tables created successfully
- [ ] Tables appear in `SHOW TABLES LIKE 'flagship_%'`
- [ ] Schema matches provided SQL file
- [ ] Sample data inserts successfully
- [ ] API endpoint `/api/flagship-programmes` responds
- [ ] Frontend page loads at `/flagship-programmes`
- [ ] Excel upload dialog appears
- [ ] Import history accessible to superadmin users

---

## Next Steps

1. **Create Tables** - Run setup using one of the options above
2. **Test API** - Try fetching `/api/flagship-programmes`
3. **Test Frontend** - Navigate to Flagship Programmes page
4. **Upload Test File** - Use sample Excel to test import
5. **Verify Dashboard** - Check budget breakdown cards appear

For issues, check:
- Backend logs: `backend/server.js` output
- Browser console: F12 → Console tab
- Network tab: F12 → Network tab
- Database: Run SELECT queries directly

