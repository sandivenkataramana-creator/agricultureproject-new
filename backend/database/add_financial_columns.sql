-- Add financial columns to schemes table if they don't exist
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS allocation_goi_share DECIMAL(15, 2);
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS allocation_state_share DECIMAL(15, 2);
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS allocation_total DECIMAL(15, 2);
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS slsc_goi_share DECIMAL(15, 2);
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS slsc_state_share DECIMAL(15, 2);
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS slsc_total DECIMAL(15, 2);
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS sanction_goi_share DECIMAL(15, 2);
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS sanction_state_share DECIMAL(15, 2);
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS sanction_total DECIMAL(15, 2);
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS bro_released_amount DECIMAL(15, 2);
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS dt_authorized_amount DECIMAL(15, 2);
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS bills_preferred_count INT;
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS bills_preferred_amount DECIMAL(15, 2);
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS oldest_bill_date DATE;
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS bills_cleared_count INT;
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS bills_cleared_amount DECIMAL(15, 2);
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS latest_bill_date DATE;
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS remark TEXT;
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS scheme_name VARCHAR(150);
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS hod VARCHAR(255);
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS financial_year VARCHAR(20);

-- Update status enum to include 'active' and 'inactive' if they're not already there
-- Note: This might not work directly on existing enum; you may need manual migration
ALTER TABLE schemes MODIFY COLUMN status ENUM('PLANNED', 'ACTIVE', 'COMPLETED', 'active', 'inactive') DEFAULT 'PLANNED';
