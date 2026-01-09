# Complete Setup Guide: Filter-Based Scheme Management System

## ✅ What Has Been Implemented

### Frontend (React - `Schemes.js`)
- ✅ Filter dropdown with three options:
  - Central Sponsored Scheme
  - State Scheme  
  - Revenue
- ✅ Three independent table structures with correct formatting
- ✅ Dynamic Add Scheme modal that shows different fields based on selected filter
- ✅ Year selector (Financial Year dropdown)
- ✅ Import/Export buttons for each filter type
- ✅ Form submission that routes data to correct API endpoint based on filter type
- ✅ Form reset after successful submission

### Backend (Express - `routes/schemes.js`)
- ✅ API endpoints for State Schemes:
  - `GET /api/schemes/state-schemes/all` - fetch all state schemes
  - `POST /api/schemes/state-schemes` - create new state scheme
  - `PUT /api/schemes/state-schemes/:id` - update state scheme
  - `DELETE /api/schemes/state-schemes/:id` - delete state scheme

- ✅ API endpoints for Revenue:
  - `GET /api/schemes/revenue/all` - fetch all revenue entries
  - `POST /api/schemes/revenue` - create new revenue entry
  - `PUT /api/schemes/revenue/:id` - update revenue entry
  - `DELETE /api/schemes/revenue/:id` - delete revenue entry

- ✅ Proper error handling with try-catch blocks
- ✅ Detailed console logging for debugging

### Database Tables
The following tables need to be created (run the initialization script):

**state_scheme_financials**
- id (Primary Key, Auto-increment)
- state_scheme_name (VARCHAR)
- hod (VARCHAR)
- budget_estimates (DECIMAL)
- bro_released_amount (DECIMAL)
- bills_preferred_count, bills_preferred_amount, oldest_bill_date
- bills_cleared_count, bills_cleared_amount, latest_clearance_date
- pending_bills_count, pending_bills_amount
- financial_year (VARCHAR)
- status (ENUM: active/inactive)
- created_at, updated_at (TIMESTAMPS)

**revenue_financials**
- id (Primary Key, Auto-increment)
- cooperative_name (VARCHAR)
- loans (DECIMAL)
- revenue (DECIMAL)
- financial_year (VARCHAR)
- status (ENUM: active/inactive)
- created_at, updated_at (TIMESTAMPS)

---

## 🚀 How to Get Started

### Step 1: Initialize Database Tables
Run this command in the `backend` folder:

```bash
cd backend
node initialize-tables.js
```

This will:
- Create `state_scheme_financials` table
- Create `revenue_financials` table
- Verify table structures
- Display existing data counts

### Step 2: Start the Backend Server
```bash
npm start
```

You should see:
```
✓ Server running on http://localhost:5000
✓ Database connected
```

### Step 3: Start the Frontend (in another terminal)
```bash
cd frontend
npm start
```

The app should open at `http://localhost:3000`

---

## 📋 How the System Works

### When Adding a Scheme (Central Sponsored Scheme)
1. User selects filter: "Central Sponsored Scheme"
2. Clicks "Add Scheme" button
3. Modal opens with Central Scheme fields
4. User fills form and clicks "Submit"
5. Data is sent to: `POST /api/schemes` (existing endpoint)
6. Data saved to `schemes` table
7. Form resets and data refreshes

### When Adding State Scheme
1. User selects filter: "State Scheme"
2. Clicks "Add Scheme" button
3. Modal opens with State Scheme fields:
   - Scheme Name
   - HOD (Head of Department)
   - Budget Estimates
   - BRO Released Amount
   - Bills information (Preferred/Cleared)
4. User fills form and clicks "Submit"
5. Data is sent to: `POST /api/schemes/state-schemes`
6. **Data saved ONLY to `state_scheme_financials` table** (NOT to central schemes)
7. Form resets and State Scheme data refreshes

### When Adding Revenue
1. User selects filter: "Revenue"
2. Clicks "Add Scheme" button
3. Modal opens with Revenue fields:
   - Cooperative Name
   - Loans
   - Revenue
4. User fills form and clicks "Submit"
5. Data is sent to: `POST /api/schemes/revenue`
6. **Data saved ONLY to `revenue_financials` table** (NOT to other tables)
7. Form resets and Revenue data refreshes

---

## 🔍 Data Isolation Explanation

### Key Point: Each Filter Has Its Own Table
```
Filter Selected        → Data Saved To Table      → API Endpoint
─────────────────────────────────────────────────────────────────
Central Sponsored      → schemes                  → /api/schemes
State Scheme          → state_scheme_financials   → /api/schemes/state-schemes
Revenue               → revenue_financials        → /api/schemes/revenue
```

**This means:**
- When you add a State Scheme, it ONLY appears in the State Scheme tab
- When you add Revenue, it ONLY appears in the Revenue tab
- When you add Central Scheme, it ONLY appears in the Central Sponsored Scheme tab
- Switching filters shows different data from different tables

---

## 🐛 Debugging Checklist

If data is not saving, check these in order:

### 1. Backend Server Running?
```bash
# In backend folder, check if running on port 5000
curl http://localhost:5000/api/schemes
```

### 2. Database Tables Exist?
```bash
# In MySQL, verify tables exist
SHOW TABLES;
SELECT COUNT(*) FROM state_scheme_financials;
SELECT COUNT(*) FROM revenue_financials;
```

### 3. Check Browser Console Logs
- Open DevTools (F12) → Console tab
- Look for errors when submitting form
- Check the network tab to see if API calls are being made

### 4. Check Backend Server Logs
- Look at terminal where backend is running
- You should see console.log statements like:
  ```
  POST /state-schemes payload: {...}
  State scheme created successfully: {id: 1, name: "..."}
  ```

### 5. Verify API Response
The POST endpoints should return:
```json
{
  "id": 1,
  "message": "State scheme created successfully"
}
```

or

```json
{
  "id": 1,
  "message": "Revenue entry created successfully"
}
```

---

## 📱 Form Field Mappings

### Central Sponsored Scheme Fields → schemes table
- scheme_name
- central_scheme_name
- hod
- financial_year
- status
- (Plus all budget allocation fields)

### State Scheme Fields → state_scheme_financials table
```javascript
{
  "name" → "state_scheme_name",
  "hod" → "hod",
  "budgetEstimates" → "budget_estimates",
  "broReleased" → "bro_released_amount",
  "billsPreferredNo" → "bills_preferred_count",
  "billsPreferredAmount" → "bills_preferred_amount",
  "billsPreferredOldestDate" → "oldest_bill_date",
  "billsClearedNo" → "bills_cleared_count",
  "billsClearedAmount" → "bills_cleared_amount",
  "billsClearedLatestDate" → "latest_clearance_date",
  "pendingNo" → "pending_bills_count",
  "pendingAmount" → "pending_bills_amount",
  "financial_year" → "financial_year",
  "status" → "status"
}
```

### Revenue Fields → revenue_financials table
```javascript
{
  "name" → "cooperative_name",
  "loans" → "loans",
  "revenue" → "revenue",
  "financial_year" → "financial_year",
  "status" → "status"
}
```

---

## ✨ Features Included

- [x] Form automatically resets after successful submission
- [x] Success message displayed to user
- [x] Error handling with user-friendly messages
- [x] Data refresh from database after submission
- [x] Financial year selector works for all filters
- [x] Import/Export buttons visible for all filter types
- [x] Console logging for debugging
- [x] Proper CORS configuration on backend
- [x] RESTful API endpoints

---

## 📞 Next Steps

1. **Run initialization script** to create tables
2. **Start backend server** and verify it's running
3. **Start frontend** application
4. **Test adding data** to each filter type
5. **Verify data appears** in correct tables only

If you encounter any issues, check the debugging checklist above or review the console logs in both the browser and backend terminal.
