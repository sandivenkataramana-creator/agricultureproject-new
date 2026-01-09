#!/usr/bin/env node

/**
 * Initialize all required database tables for the agricultural system
 * Run this once when setting up the application
 */

const db = require('./config/database');

async function initializeTables() {
  try {
    console.log('🔄 Starting database initialization...\n');

    // ============ STATE SCHEME TABLE ============
    console.log('📋 Creating state_scheme_financials table...');
    const stateSchemeSQL = `
      CREATE TABLE IF NOT EXISTS state_scheme_financials (
          id INT AUTO_INCREMENT PRIMARY KEY,
          state_scheme_name VARCHAR(255) NOT NULL,
          hod VARCHAR(150) NOT NULL,
          budget_estimates DECIMAL(14,2) DEFAULT NULL,
          bro_released_amount DECIMAL(14,2) DEFAULT NULL,
          bills_preferred_count INT DEFAULT 0,
          bills_preferred_amount DECIMAL(14,2) DEFAULT NULL,
          oldest_bill_date DATE DEFAULT NULL,
          bills_cleared_count INT DEFAULT 0,
          bills_cleared_amount DECIMAL(14,2) DEFAULT NULL,
          latest_clearance_date DATE DEFAULT NULL,
          pending_bills_count INT DEFAULT 0,
          pending_bills_amount DECIMAL(14,2) DEFAULT NULL,
          financial_year VARCHAR(9) NOT NULL,
          status ENUM('active','inactive') DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_financial_year (financial_year),
          INDEX idx_status (status)
      )
    `;
    
    await db.query(stateSchemeSQL);
    console.log('✅ state_scheme_financials table created/verified');

    // ============ REVENUE TABLE ============
    console.log('📋 Creating revenue_financials table...');
    const revenueSQL = `
      CREATE TABLE IF NOT EXISTS revenue_financials (
          id INT AUTO_INCREMENT PRIMARY KEY,
          cooperative_name VARCHAR(255) NOT NULL,
          loans DECIMAL(14,2) DEFAULT NULL,
          revenue DECIMAL(14,2) DEFAULT NULL,
          financial_year VARCHAR(9) NOT NULL,
          status ENUM('active','inactive') DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_financial_year (financial_year),
          INDEX idx_status (status)
      )
    `;
    
    await db.query(revenueSQL);
    console.log('✅ revenue_financials table created/verified');

    // ============ VERIFY TABLES ============
    console.log('\n📊 Verifying table structures...');
    
    const [stateSchemeInfo] = await db.query('DESCRIBE state_scheme_financials');
    console.log(`✓ state_scheme_financials: ${stateSchemeInfo.length} columns`);
    
    const [revenueInfo] = await db.query('DESCRIBE revenue_financials');
    console.log(`✓ revenue_financials: ${revenueInfo.length} columns`);

    // ============ CHECK DATA ============
    console.log('\n📈 Checking existing data...');
    
    const [stateSchemeCount] = await db.query('SELECT COUNT(*) as count FROM state_scheme_financials');
    console.log(`✓ state_scheme_financials: ${stateSchemeCount[0].count} records`);
    
    const [revenueCount] = await db.query('SELECT COUNT(*) as count FROM revenue_financials');
    console.log(`✓ revenue_financials: ${revenueCount[0].count} records`);

    console.log('\n✨ Database initialization completed successfully!');
    console.log('You can now start the server with: npm start\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database initialization failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

// Run initialization
initializeTables();
