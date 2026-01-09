const fs = require('fs');
const path = require('path');

// Create a simple CSV template that can be opened in Excel
const headers = [
  'Scheme Name',
  'HOD ID',
  'Description',
  'Objective',
  'Benefits Description',
  'Beneficiaries',
  'Total Budget',
  'Start Date',
  'End Date',
  'Allocation GOI Share',
  'Allocation State Share',
  'Allocation Total',
  'SLSC GOI Share',
  'SLSC State Share',
  'SLSC Total',
  'Sanction GOI Share',
  'Sanction State Share',
  'Sanction Total',
  'BRO Released',
  'DT Authorization',
  'Bills Preferred Count',
  'Bills Preferred Amount',
  'Oldest Bill Date',
  'Bills Cleared Count',
  'Bills Cleared Amount',
  'Latest Bill Date',
  'Remark'
];

// Create sample data rows
const sampleRows = [
  {
    'Scheme Name': 'Sample Scheme 1',
    'HOD ID': '1',
    'Description': 'Enter scheme description here',
    'Objective': 'Enter scheme objective here',
    'Benefits Description': 'Benefits description',
    'Beneficiaries': '100',
    'Total Budget': '500000',
    'Start Date': '2025-04-01',
    'End Date': '2026-03-31',
    'Allocation GOI Share': '250000',
    'Allocation State Share': '250000',
    'Allocation Total': '500000',
    'SLSC GOI Share': '',
    'SLSC State Share': '',
    'SLSC Total': '',
    'Sanction GOI Share': '',
    'Sanction State Share': '',
    'Sanction Total': '',
    'BRO Released': '',
    'DT Authorization': '',
    'Bills Preferred Count': '',
    'Bills Preferred Amount': '',
    'Oldest Bill Date': '',
    'Bills Cleared Count': '',
    'Bills Cleared Amount': '',
    'Latest Bill Date': '',
    'Remark': 'Sample remark'
  },
  {
    'Scheme Name': '',
    'HOD ID': '',
    'Description': '',
    'Objective': '',
    'Benefits Description': '',
    'Beneficiaries': '',
    'Total Budget': '',
    'Start Date': '',
    'End Date': '',
    'Allocation GOI Share': '',
    'Allocation State Share': '',
    'Allocation Total': '',
    'SLSC GOI Share': '',
    'SLSC State Share': '',
    'SLSC Total': '',
    'Sanction GOI Share': '',
    'Sanction State Share': '',
    'Sanction Total': '',
    'BRO Released': '',
    'DT Authorization': '',
    'Bills Preferred Count': '',
    'Bills Preferred Amount': '',
    'Oldest Bill Date': '',
    'Bills Cleared Count': '',
    'Bills Cleared Amount': '',
    'Latest Bill Date': '',
    'Remark': ''
  }
];

// Create CSV content
let csvContent = headers.join(',') + '\n';
sampleRows.forEach(row => {
  const rowValues = headers.map(header => {
    const value = row[header] || '';
    // Escape quotes and wrap in quotes if contains comma
    if (value.includes(',') || value.includes('"')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  });
  csvContent += rowValues.join(',') + '\n';
});

// Write CSV file
const csvPath = path.join(__dirname, 'Financial_Progress_Template.csv');
fs.writeFileSync(csvPath, csvContent, 'utf8');

// Also create instructions file
const instructions = `FINANCIAL PROGRESS REPORT - EXCEL IMPORT TEMPLATE
================================================

INSTRUCTIONS FOR USING THIS TEMPLATE:

1. REQUIRED FIELDS (must be filled):
   - Scheme Name: Name of the scheme
   - HOD ID: ID of the Head of Department (must be a valid HOD ID from the system)

2. OPTIONAL FINANCIAL FIELDS:
   - Allocation GOI Share: GOI allocation share (in Crores)
   - Allocation State Share: State allocation share (in Crores)
   - Allocation Total: Total allocation (in Crores)
   - SLSC GOI Share: SLSC GOI share (in Crores)
   - SLSC State Share: SLSC State share (in Crores)
   - SLSC Total: SLSC Total (in Crores)
   - Sanction GOI Share: Sanction GOI share (in Crores)
   - Sanction State Share: Sanction State share (in Crores)
   - Sanction Total: Sanction Total (in Crores)
   - BRO Released: BRO released amount (in Crores)
   - DT Authorization: DT authorization amount (in Crores)
   - Bills Preferred Count: Number of preferred bills
   - Bills Preferred Amount: Preferred bills amount (in Crores)
   - Oldest Bill Date: Date in YYYY-MM-DD format
   - Bills Cleared Count: Number of cleared bills
   - Bills Cleared Amount: Cleared bills amount (in Crores)
   - Latest Bill Date: Date in YYYY-MM-DD format

3. BASIC INFORMATION FIELDS (optional):
   - Description: Scheme description
   - Objective: Scheme objective
   - Benefits Description: Description of scheme benefits
   - Beneficiaries: Number of people benefited
   - Total Budget: Total budget amount
   - Start Date: Project start date (YYYY-MM-DD)
   - End Date: Project end date (YYYY-MM-DD)
   - Remark: Any additional remarks

4. DATE FORMAT:
   - Use YYYY-MM-DD format for all dates (e.g., 2025-04-01)

5. NUMBER FORMAT:
   - Use numbers without commas (e.g., 1000000 not 10,00,000)
   - Use decimal points for decimals (e.g., 1234.56)

6. COLUMN HEADERS:
   - Do NOT change the header names in the first row
   - The import will fail if headers are modified

7. HOD ID REFERENCE:
   - Make sure the HOD ID values match existing HODs in the system
   - HOD IDs are typically: 1, 2, 3, etc.

8. SAVING THE FILE:
   - Save as Excel format (.xlsx) before importing
   - The template is provided as CSV - open in Excel and save as .xlsx

EXAMPLE DATA:
See the "Sample Scheme 1" row for a complete example of how to fill the template.

IMPORT PROCESS:
1. Fill in your data following the guidelines above
2. Save the file as Excel (.xlsx) format
3. Go to the Financial Progress Report page in the application
4. Click "Import Excel" button
5. Select your file
6. The system will validate and import the data
`;

const instructionsPath = path.join(__dirname, 'EXCEL_IMPORT_INSTRUCTIONS.txt');
fs.writeFileSync(instructionsPath, instructions, 'utf8');

console.log('✅ Excel template files created successfully!');
console.log(`📄 CSV Template: ${csvPath}`);
console.log(`📋 Instructions: ${instructionsPath}`);
console.log('\nINSTRUCTIONS:');
console.log('1. Open Financial_Progress_Template.csv with Microsoft Excel');
console.log('2. Add your data to the rows (keep headers as is)');
console.log('3. Save as Excel format (.xlsx)');
console.log('4. Use the "Import Excel" button in the app to upload');
