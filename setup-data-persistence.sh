#!/bin/bash

# Data Persistence Fix - Setup Script
# This script applies all necessary fixes to enable data persistence in the Financial Progress Report

echo "=========================================="
echo "Financial Progress Report - Data Persistence Fix"
echo "=========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✓ Node.js found"
echo ""

# Navigate to backend directory
cd backend

# Check if database config exists
if [ ! -f "config/database.js" ]; then
    echo "❌ Database config not found at config/database.js"
    echo "Please ensure you're in the correct project directory"
    exit 1
fi

echo "✓ Database configuration found"
echo ""

# Run the migration
echo "Running database migration..."
echo "This will add financial columns to the schemes table..."
echo ""

node database/migrate_add_financial_columns.js

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✓ Setup completed successfully!"
    echo "=========================================="
    echo ""
    echo "Next steps:"
    echo "1. Start your backend server (if not already running)"
    echo "2. Start your frontend development server"
    echo "3. Open the Schemes page in your browser"
    echo "4. Test by creating a new scheme with financial data"
    echo "5. Refresh the page to verify data persistence"
    echo ""
    echo "For more details, see DATA_PERSISTENCE_FIX.md"
else
    echo ""
    echo "=========================================="
    echo "❌ Migration failed"
    echo "=========================================="
    echo ""
    echo "Troubleshooting:"
    echo "1. Ensure MySQL server is running"
    echo "2. Check that database credentials in config/database.js are correct"
    echo "3. Verify the database 'hod_management' exists"
    echo ""
    echo "You can also manually run the SQL migration:"
    echo "  mysql -u username -p hod_management < database/add_financial_columns.sql"
    exit 1
fi
