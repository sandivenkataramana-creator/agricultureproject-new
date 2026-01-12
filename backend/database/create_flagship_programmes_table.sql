-- Table to store flagship programmes with flexible schema
CREATE TABLE IF NOT EXISTS `flagship_programmes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `department_id` int(11),
  `department_name` varchar(255),
  `programme_name` varchar(255),
  `import_batch_id` varchar(255),
  `data_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_by` int(11),
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_department` (`department_id`, `department_name`),
  KEY `idx_batch` (`import_batch_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table to track Excel import metadata
CREATE TABLE IF NOT EXISTS `flagship_import_metadata` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `import_batch_id` varchar(255) NOT NULL UNIQUE,
  `file_name` varchar(255),
  `file_size` bigint,
  `total_records` int(11),
  `successful_records` int(11),
  `failed_records` int(11),
  `column_mapping` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `import_type` varchar(100),
  `status` enum('pending','processing','completed','failed') DEFAULT 'pending',
  `error_log` longtext,
  `created_by` int(11),
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_batch` (`import_batch_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table to store reports
CREATE TABLE IF NOT EXISTS `flagship_reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `department_id` int(11),
  `department_name` varchar(255),
  `report_name` varchar(255),
  `report_date` date,
  `import_batch_id` varchar(255),
  `data_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_by` int(11),
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_department` (`department_id`, `department_name`),
  KEY `idx_batch` (`import_batch_id`),
  KEY `idx_date` (`report_date`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
