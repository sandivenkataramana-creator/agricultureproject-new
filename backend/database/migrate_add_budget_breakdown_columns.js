const db = require('../config/database');

const migrateAddBudgetBreakdownColumns = async () => {
  try {
    console.log('Starting migration: Adding budget breakdown columns to budget table...');

    const columns = [
      { name: 'dao_id', type: 'INT NULL' },
      { name: 'section', type: 'VARCHAR(255) NULL' },
      { name: 'budget_estimation_state', type: 'DECIMAL(15, 2) NULL' },
      { name: 'budget_estimation_central', type: 'DECIMAL(15, 2) NULL' },
      { name: 'budget_sanction_state', type: 'DECIMAL(15, 2) NULL' },
      { name: 'budget_sanction_central', type: 'DECIMAL(15, 2) NULL' },
      { name: 'budget_remaining_state', type: 'DECIMAL(15, 2) NULL' },
      { name: 'budget_remaining_central', type: 'DECIMAL(15, 2) NULL' },
      { name: 'budget_pending_state', type: 'DECIMAL(15, 2) NULL' },
      { name: 'budget_pending_central', type: 'DECIMAL(15, 2) NULL' },
    ];

    const [existingColumns] = await db.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'budget' AND TABLE_SCHEMA = DATABASE()
    `);

    const existingColumnNames = new Set(existingColumns.map(col => col.COLUMN_NAME));

    for (const column of columns) {
      if (!existingColumnNames.has(column.name)) {
        try {
          await db.query(`ALTER TABLE budget ADD COLUMN ${column.name} ${column.type}`);
          console.log(`✓ Added column: ${column.name}`);
        } catch (error) {
          console.warn(`⚠ Could not add column ${column.name}:`, error.message);
        }
      } else {
        console.log(`- Column ${column.name} already exists`);
      }
    }

    // Try to add DAO foreign key if possible (optional)
    try {
      const [daoTable] = await db.query(`
        SELECT COUNT(*) as c
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_NAME = 'dao' AND TABLE_SCHEMA = DATABASE()
      `);

      if ((daoTable[0] && daoTable[0].c) || (daoTable[0] && daoTable[0]['c'])) {
        console.log('- DAO table detected; skipping automatic FK add (manual if needed)');
      }
    } catch (e) {
      // ignore
    }

    console.log('✓ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  }
};

migrateAddBudgetBreakdownColumns();
