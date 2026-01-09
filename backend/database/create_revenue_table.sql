-- Create revenue_financials table for tracking cooperative and revenue data
CREATE TABLE IF NOT EXISTS revenue_financials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    cooperative_name VARCHAR(255) NOT NULL,
    
    loans DECIMAL(14,2) DEFAULT NULL,
    revenue DECIMAL(14,2) DEFAULT NULL,
    
    financial_year VARCHAR(9) NOT NULL, -- e.g. 2025-26
    status ENUM('active','inactive') DEFAULT 'active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_financial_year (financial_year),
    INDEX idx_status (status)
);
