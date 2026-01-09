const db = require('../config/database');

const addFinancialColumnsToSchemes = async () => {
  try {
    console.log('Starting migration: Adding financial columns to schemes table...');

    const columns = [
      { name: 'allocation_goi_share', type: 'DECIMAL(15, 2)' },
      { name: 'allocation_state_share', type: 'DECIMAL(15, 2)' },
      { name: 'allocation_total', type: 'DECIMAL(15, 2)' },
      { name: 'slsc_goi_share', type: 'DECIMAL(15, 2)' },
      { name: 'slsc_state_share', type: 'DECIMAL(15, 2)' },
      { name: 'slsc_total', type: 'DECIMAL(15, 2)' },
      { name: 'sanction_goi_share', type: 'DECIMAL(15, 2)' },
      { name: 'sanction_state_share', type: 'DECIMAL(15, 2)' },
      { name: 'sanction_total', type: 'DECIMAL(15, 2)' },
      { name: 'bro_released_amount', type: 'DECIMAL(15, 2)' },
      { name: 'dt_authorized_amount', type: 'DECIMAL(15, 2)' },
      { name: 'bills_preferred_count', type: 'INT' },
      { name: 'bills_preferred_amount', type: 'DECIMAL(15, 2)' },
      { name: 'oldest_bill_date', type: 'DATE' },
      { name: 'bills_cleared_count', type: 'INT' },
      { name: 'bills_cleared_amount', type: 'DECIMAL(15, 2)' },
      { name: 'latest_bill_date', type: 'DATE' },
      { name: 'remark', type: 'TEXT' },
      { name: 'scheme_name', type: 'VARCHAR(150)' },
      { name: 'hod', type: 'VARCHAR(255)' },
      { name: 'financial_year', type: 'VARCHAR(20)' }
    ];

    // Check which columns already exist
    const [existingColumns] = await db.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'schemes' AND TABLE_SCHEMA = DATABASE()
    `);

    const existingColumnNames = new Set(existingColumns.map(col => col.COLUMN_NAME));

    // Add missing columns
    for (const column of columns) {
      if (!existingColumnNames.has(column.name)) {
        try {
          await db.query(`ALTER TABLE schemes ADD COLUMN ${column.name} ${column.type}`);
          console.log(`✓ Added column: ${column.name}`);
        } catch (error) {
          console.warn(`⚠ Could not add column ${column.name}:`, error.message);
        }
      } else {
        console.log(`- Column ${column.name} already exists`);
      }
    }

    console.log('✓ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  }
};

addFinancialColumnsToSchemes();
