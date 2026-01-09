-- Create programs table for managing government programs
CREATE TABLE IF NOT EXISTS `programs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `budget` decimal(15,2) DEFAULT 0.00,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `status` enum('active','inactive','completed') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_dates` (`start_date`, `end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample programs
INSERT INTO `programs` (`name`, `description`, `budget`, `start_date`, `end_date`, `status`) VALUES
('PM-KISAN', 'Pradhan Mantri Kisan Samman Nidhi - Direct income support to farmers', 7500000.00, '2024-01-01', '2024-12-31', 'active'),
('Kisan Credit Card', 'Credit facility for farmers to meet agricultural needs', 5000000.00, '2024-01-01', '2024-12-31', 'active'),
('Soil Health Card Scheme', 'Providing soil health cards to farmers for better crop management', 2500000.00, '2024-01-01', '2024-12-31', 'active'),
('National Food Security Mission', 'Enhancing production of rice, wheat, and pulses', 8000000.00, '2024-01-01', '2025-03-31', 'active'),
('Paramparagat Krishi Vikas Yojana', 'Promotion of organic farming', 3500000.00, '2024-01-01', '2024-12-31', 'active');
