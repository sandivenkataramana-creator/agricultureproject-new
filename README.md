# HOD Management System

A comprehensive government dashboard system for managing HODs (Heads of Departments), Schemes, Staff, Budget, KPIs, Nodal Officers, and Attendance.

## Features

Based on the dashboard design:
- **Dashboard Overview**: Summary stats, charts for schemes by category, budget by HOD, revenue distribution, and attendance
- **HODs Management**: CRUD operations for Heads of Departments
- **Schemes Management**: Track government schemes with budget allocation and utilization
- **Staff Management**: Employee directory with department assignments
- **Budget Management**: Track budget allocation and utilization by HOD/Scheme
- **KPIs Tracking**: Monitor Key Performance Indicators with progress tracking
- **Nodal Officers**: Manage scheme-wise nodal officer assignments
- **Attendance**: Track HOD-wise staff attendance

## Tech Stack

- **Frontend**: React.js, React Router, Chart.js, React Icons
- **Backend**: Node.js, Express.js
- **Database**: MySQL

## Project Structure

```
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── database/
│   │   └── schema.sql
│   ├── routes/
│   │   ├── dashboard.js
│   │   ├── hods.js
│   │   ├── schemes.js
│   │   ├── staff.js
│   │   ├── budget.js
│   │   ├── kpis.js
│   │   ├── nodalOfficers.js
│   │   ├── attendance.js
│   │   └── revenue.js
│   ├── server.js
│   ├── package.json
│   └── .env
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── Sidebar.js
    │   │   ├── Header.js
    │   │   └── Modal.js
    │   ├── pages/
    │   │   ├── Dashboard.js
    │   │   ├── HODs.js
    │   │   ├── Schemes.js
    │   │   ├── Staff.js
    │   │   ├── Budget.js
    │   │   ├── KPIs.js
    │   │   ├── NodalOfficers.js
    │   │   └── Attendance.js
    │   ├── services/
    │   │   └── api.js
    │   ├── App.js
    │   ├── index.js
    │   └── index.css
    └── package.json
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v8 or higher)

### Database Setup

1. Open MySQL and run the schema file:
```sql
source backend/database/schema.sql
```

Or manually:
```bash
mysql -u root -p < backend/database/schema.sql
```

### Backend Setup

1. Navigate to backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables in `.env`:
```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=hod_management
```

4. Start the server:
```bash
npm start
# or for development
npm run dev
```

### Frontend Setup

1. Navigate to frontend folder:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## API Endpoints

### Dashboard
- `GET /api/dashboard/stats` - Get overview statistics
- `GET /api/dashboard/schemes-by-category` - Schemes by category chart data
- `GET /api/dashboard/budget-by-hod` - Budget allocation by HOD
- `GET /api/dashboard/schemes-by-hod` - Schemes count by HOD
- `GET /api/dashboard/attendance-by-hod` - Attendance summary by HOD
- `GET /api/dashboard/revenue-by-hod` - Revenue by HOD

### HODs
- `GET /api/hods` - List all HODs
- `GET /api/hods/:id` - Get HOD by ID
- `POST /api/hods` - Create HOD
- `PUT /api/hods/:id` - Update HOD
- `DELETE /api/hods/:id` - Delete HOD

### Schemes
- `GET /api/schemes` - List all schemes
- `GET /api/schemes/:id` - Get scheme by ID
- `GET /api/schemes/hod/:hodId` - Get schemes by HOD
- `POST /api/schemes` - Create scheme
- `PUT /api/schemes/:id` - Update scheme
- `DELETE /api/schemes/:id` - Delete scheme

### Staff, Budget, KPIs, Nodal Officers, Attendance, Revenue
Similar CRUD endpoints are available for all modules.

## Screenshots

The dashboard includes:
1. **Overview Stats**: Total HODs, Schemes, Staff, Budget
2. **Widget Cards**: Summary cards with key metrics
3. **Charts**: 
   - Pie chart for schemes by category
   - Bar chart for budget allocation vs utilization
   - Doughnut chart for revenue distribution
   - Bar chart for attendance summary
4. **Tables**: 
   - Schemes (HOD Wise)
   - Budget (HOD Wise)
   - Attendance Summary (HOD Wise)

## Reference

Design inspired by: tsoildes.quixydemo.com

## License

MIT
