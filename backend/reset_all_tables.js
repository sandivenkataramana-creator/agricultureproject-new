const mysql = require('mysql2/promise');

async function resetAllTables() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hod_management2'
  });

  console.log('Connected to database...\n');

  try {
    // Disable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // ============================================
    // 1. RESET CATEGORIES TABLE
    // ============================================
    console.log('1. Resetting Categories table...');
    await connection.query('TRUNCATE TABLE categories');
    
    const categoriesSQL = `
      INSERT INTO categories (id, name, description, status) VALUES
      (1, 'Secretariat', 'Administrative and Secretariat departments', 'active'),
      (2, 'Directorate', 'Directorate level departments', 'active'),
      (3, 'University', 'Agricultural and Horticulture Universities', 'active'),
      (4, 'Training', 'Training and Extension institutes', 'active'),
      (5, 'Marketing', 'Marketing and Federation bodies', 'active'),
      (6, 'Development Corporation', 'State Development Corporations', 'active'),
      (7, 'Cooperative', 'Cooperative organizations and federations', 'active'),
      (8, 'Certification', 'Certification and Quality control bodies', 'active')
    `;
    await connection.query(categoriesSQL);
    console.log('   ✓ 8 categories inserted');

    // ============================================
    // 2. RESET HODs TABLE WITH DUMMY NAMES
    // ============================================
    console.log('2. Resetting HODs table with dummy names...');
    await connection.query('TRUNCATE TABLE hods');
    
    const hodsSQL = `
      INSERT INTO hods (name, department, category_id, email, phone, status) VALUES
      ('Dr. Ramesh Kumar', 'A&C Secretariat', 1, 'ramesh.kumar@agri.gov.in', '9876543201', 'active'),
      ('Sri. Venkatesh Reddy', 'Director of Agriculture', 2, 'venkatesh.reddy@agri.gov.in', '9876543202', 'active'),
      ('Smt. Lakshmi Devi', 'Horticulture and Sericulture', 2, 'lakshmi.devi@agri.gov.in', '9876543203', 'active'),
      ('Sri. Suresh Babu', 'Agricultural Marketing', 5, 'suresh.babu@agri.gov.in', '9876543204', 'active'),
      ('Dr. Prasad Rao', 'Cooperation', 7, 'prasad.rao@agri.gov.in', '9876543205', 'active'),
      ('Prof. Jayashankar Rao', 'PJTAU', 3, 'jayashankar.rao@agri.gov.in', '9876543206', 'active'),
      ('Prof. Konda Laxman', 'SKLTSHU', 3, 'konda.laxman@agri.gov.in', '9876543207', 'active'),
      ('Dr. Anand Kumar', 'SAMETI', 4, 'anand.kumar@agri.gov.in', '9876543208', 'active'),
      ('Sri. Nagaraju Goud', 'TG MARKFED', 5, 'nagaraju.goud@agri.gov.in', '9876543209', 'active'),
      ('Smt. Padma Kumari', 'TGSDCL', 6, 'padma.kumari@agri.gov.in', '9876543210', 'active'),
      ('Dr. Srinivas Murthy', 'TGSOCA', 8, 'srinivas.murthy@agri.gov.in', '9876543211', 'active'),
      ('Sri. Ganesh Prasad', 'TGAGROS', 6, 'ganesh.prasad@agri.gov.in', '9876543212', 'active'),
      ('Smt. Kavitha Rani', 'TGOILFED', 7, 'kavitha.rani@agri.gov.in', '9876543213', 'active'),
      ('Sri. Bharath Singh', 'TGWC', 6, 'bharath.singh@agri.gov.in', '9876543214', 'active'),
      ('Dr. Mohammed Imran', 'HACA', 7, 'mohammed.imran@agri.gov.in', '9876543215', 'active'),
      ('Smt. Swathi Reddy', 'TGHDCL', 6, 'swathi.reddy@agri.gov.in', '9876543216', 'active'),
      ('Sri. Kiran Kumar', 'TGRIC', 7, 'kiran.kumar@agri.gov.in', '9876543217', 'active'),
      ('Dr. Sunitha Rao', 'TGCU', 7, 'sunitha.rao@agri.gov.in', '9876543218', 'active'),
      ('Sri. Mahesh Chandra', 'TG HOUSEFED', 7, 'mahesh.chandra@agri.gov.in', '9876543219', 'active'),
      ('Smt. Rekha Varma', 'Agriculture Market Committee', 5, 'rekha.varma@agri.gov.in', '9876543220', 'active')
    `;
    await connection.query(hodsSQL);
    console.log('   ✓ 20 HODs inserted with dummy names');

    // ============================================
    // 3. RESET STAFF TABLE
    // ============================================
    console.log('3. Resetting Staff table...');
    await connection.query('TRUNCATE TABLE staff');
    
    const staffSQL = `
      INSERT INTO staff (name, employee_id, designation, department, category_id, hod_id, email, phone, joining_date, status) VALUES
      ('Ajay Kumar', 'EMP001', 'Assistant Secretary', 'A&C Secretariat', 1, 1, 'ajay.kumar@agri.gov.in', '9000000001', '2020-01-15', 'active'),
      ('Priya Sharma', 'EMP002', 'Deputy Director', 'Director of Agriculture', 2, 2, 'priya.sharma@agri.gov.in', '9000000002', '2019-06-20', 'active'),
      ('Ravi Teja', 'EMP003', 'Horticulture Officer', 'Horticulture and Sericulture', 2, 3, 'ravi.teja@agri.gov.in', '9000000003', '2018-03-10', 'active'),
      ('Meena Kumari', 'EMP004', 'Marketing Officer', 'Agricultural Marketing', 5, 4, 'meena.kumari@agri.gov.in', '9000000004', '2021-02-28', 'active'),
      ('Sanjay Reddy', 'EMP005', 'Cooperation Inspector', 'Cooperation', 7, 5, 'sanjay.reddy@agri.gov.in', '9000000005', '2020-07-15', 'active'),
      ('Deepika Rao', 'EMP006', 'Research Associate', 'PJTAU', 3, 6, 'deepika.rao@agri.gov.in', '9000000006', '2019-11-01', 'active'),
      ('Arun Prasad', 'EMP007', 'Lecturer', 'SKLTSHU', 3, 7, 'arun.prasad@agri.gov.in', '9000000007', '2018-09-15', 'active'),
      ('Neha Singh', 'EMP008', 'Training Coordinator', 'SAMETI', 4, 8, 'neha.singh@agri.gov.in', '9000000008', '2021-04-20', 'active'),
      ('Vinod Kumar', 'EMP009', 'Marketing Executive', 'TG MARKFED', 5, 9, 'vinod.kumar@agri.gov.in', '9000000009', '2020-08-10', 'active'),
      ('Anjali Devi', 'EMP010', 'Seed Officer', 'TGSDCL', 6, 10, 'anjali.devi@agri.gov.in', '9000000010', '2019-05-25', 'active'),
      ('Rajesh Naidu', 'EMP011', 'Certification Officer', 'TGSOCA', 8, 11, 'rajesh.naidu@agri.gov.in', '9000000011', '2018-12-01', 'active'),
      ('Pooja Reddy', 'EMP012', 'Industry Liaison', 'TGAGROS', 6, 12, 'pooja.reddy@agri.gov.in', '9000000012', '2021-01-10', 'active'),
      ('Sunil Goud', 'EMP013', 'Oil Federation Officer', 'TGOILFED', 7, 13, 'sunil.goud@agri.gov.in', '9000000013', '2020-03-18', 'active'),
      ('Lavanya Kumari', 'EMP014', 'Warehouse Manager', 'TGWC', 6, 14, 'lavanya.kumari@agri.gov.in', '9000000014', '2019-09-05', 'active'),
      ('Harish Varma', 'EMP015', 'Cooperative Officer', 'HACA', 7, 15, 'harish.varma@agri.gov.in', '9000000015', '2018-06-22', 'active'),
      ('Divya Rao', 'EMP016', 'Horticulture Officer', 'TGHDCL', 6, 16, 'divya.rao@agri.gov.in', '9000000016', '2021-05-30', 'active'),
      ('Ramana Reddy', 'EMP017', 'Irrigation Officer', 'TGRIC', 7, 17, 'ramana.reddy@agri.gov.in', '9000000017', '2020-10-12', 'active'),
      ('Shilpa Devi', 'EMP018', 'Union Coordinator', 'TGCU', 7, 18, 'shilpa.devi@agri.gov.in', '9000000018', '2019-02-14', 'active'),
      ('Praveen Kumar', 'EMP019', 'Housing Officer', 'TG HOUSEFED', 7, 19, 'praveen.kumar@agri.gov.in', '9000000019', '2018-08-08', 'active')
    `;
    await connection.query(staffSQL);
    console.log('   ✓ 19 Staff members inserted');

    // ============================================
    // 4. RESET SCHEMES TABLE
    // ============================================
    console.log('4. Resetting Schemes table...');
    await connection.query('TRUNCATE TABLE schemes');
    
    const schemesSQL = `
      INSERT INTO schemes (name, hod_id, scheme_description, scheme_objective, scheme_benefits_desc, scheme_benefits_person, total_budget, start_date, end_date, status, scheme_category, category_id) VALUES
      ('Rythu Bandhu', 1, 'Investment support scheme for farmers providing Rs.10,000 per acre per season', 'To provide investment support for agriculture and horticulture crops', 'Direct benefit transfer to farmer bank accounts twice a year', 580000, 75000000.00, '2024-01-01', '2025-12-31', 'ACTIVE', 'Farmer Support', 1),
      ('PM-KISAN', 2, 'Direct income support of Rs.6000 per year to land-holding farmers', 'To supplement financial needs of small and marginal farmers', 'Three equal installments of Rs.2000 directly to bank accounts', 450000, 60000000.00, '2024-01-01', '2025-12-31', 'ACTIVE', 'Farmer Support', 2),
      ('Horticulture Development', 3, 'Promotion of horticulture crops and sericulture activities', 'To increase production of fruits, vegetables and silk', 'Subsidy on planting material, drip irrigation, poly houses', 120000, 35000000.00, '2024-01-01', '2025-12-31', 'ACTIVE', 'Horticulture', 2),
      ('Agricultural Marketing Support', 4, 'Support for marketing of agricultural produce', 'To ensure fair prices for farmers produce', 'Market infrastructure, price support, e-NAM integration', 200000, 25000000.00, '2024-01-01', '2025-12-31', 'ACTIVE', 'Marketing', 5),
      ('Cooperative Development', 5, 'Strengthening of cooperative societies', 'To promote cooperative movement in agriculture', 'Training, infrastructure support for cooperatives', 85000, 18000000.00, '2024-01-01', '2025-12-31', 'ACTIVE', 'Cooperative', 7),
      ('Agricultural Education', 6, 'Scholarships and research grants for agriculture students', 'To promote agricultural education and research', 'Scholarships, research funding, lab equipment', 15000, 22000000.00, '2024-01-01', '2025-12-31', 'ACTIVE', 'Education', 3),
      ('Horticulture Training', 7, 'Training programs for horticulture farmers', 'To enhance skills of horticulture farmers', 'Free training, demonstration plots, study tours', 25000, 15000000.00, '2024-01-01', '2025-12-31', 'ACTIVE', 'Training', 3),
      ('Extension Training', 8, 'Capacity building of extension workers', 'To improve agricultural extension services', 'Training modules, field visits, certification', 5000, 12000000.00, '2024-01-01', '2025-12-31', 'ACTIVE', 'Training', 4),
      ('Market Federation Support', 9, 'Support to marketing federations', 'To strengthen agricultural marketing infrastructure', 'Godown construction, processing units, cold storage', 150000, 45000000.00, '2024-01-01', '2025-12-31', 'ACTIVE', 'Marketing', 5),
      ('Seed Development Program', 10, 'Production and distribution of quality seeds', 'To ensure availability of certified seeds', 'Seed production, processing, distribution subsidy', 300000, 30000000.00, '2024-01-01', '2025-12-31', 'ACTIVE', 'Seeds', 6),
      ('Organic Certification', 11, 'Promotion of organic farming certification', 'To increase organic farming area', 'Free certification, organic inputs subsidy', 45000, 20000000.00, '2024-01-01', '2025-12-31', 'ACTIVE', 'Certification', 8),
      ('Agro Industries Development', 12, 'Support for agro-based industries', 'To promote value addition in agriculture', 'Machinery subsidy, infrastructure support', 8000, 40000000.00, '2024-01-01', '2025-12-31', 'ACTIVE', 'Industry', 6),
      ('Oil Seeds Mission', 13, 'Promotion of oil seeds cultivation', 'To increase domestic oil production', 'Seeds, demonstrations, procurement support', 180000, 28000000.00, '2024-01-01', '2025-12-31', 'ACTIVE', 'Oilseeds', 7),
      ('Warehousing Scheme', 14, 'Construction and modernization of warehouses', 'To reduce post-harvest losses', 'Warehouse construction subsidy, equipment', 500, 55000000.00, '2024-01-01', '2025-12-31', 'ACTIVE', 'Storage', 6),
      ('Cooperative Credit', 15, 'Credit support through cooperatives', 'To provide affordable credit to farmers', 'Low interest loans, crop loans', 250000, 80000000.00, '2024-01-01', '2025-12-31', 'ACTIVE', 'Credit', 7),
      ('Horticulture Infrastructure', 16, 'Development of horticulture infrastructure', 'To create post-harvest infrastructure', 'Pack houses, ripening chambers, cold chains', 1200, 38000000.00, '2024-01-01', '2025-12-31', 'ACTIVE', 'Infrastructure', 6),
      ('Rural Irrigation', 17, 'Micro irrigation and water conservation', 'To improve water use efficiency', 'Drip, sprinkler systems, farm ponds', 95000, 42000000.00, '2024-01-01', '2025-12-31', 'ACTIVE', 'Irrigation', 7),
      ('Cooperative Union Support', 18, 'Strengthening cooperative unions', 'To federate primary cooperatives', 'Administrative support, training, auditing', 2500, 15000000.00, '2024-01-01', '2025-12-31', 'ACTIVE', 'Cooperative', 7),
      ('Housing for Farmers', 19, 'Housing support for agricultural workers', 'To provide housing to farm workers', 'Housing subsidy, construction assistance', 10000, 50000000.00, '2024-01-01', '2025-12-31', 'ACTIVE', 'Housing', 7),
      ('Market Committee Development', 20, 'Modernization of agricultural markets', 'To create world-class market infrastructure', 'Market yards, auction platforms, grading', 350, 65000000.00, '2024-01-01', '2025-12-31', 'ACTIVE', 'Marketing', 5)
    `;
    await connection.query(schemesSQL);
    console.log('   ✓ 20 Schemes inserted');

    // ============================================
    // 5. RESET BUDGET TABLE
    // ============================================
    console.log('5. Resetting Budget table...');
    await connection.query('TRUNCATE TABLE budget');
    
    const budgetSQL = `
      INSERT INTO budget (hod_id, scheme_id, financial_year, allocated_amount, utilized_amount, category, description, state_id, district_id) VALUES
      (1, 1, '2024-25', 75000000.00, 52000000.00, 'Farmer Support', 'Rythu Bandhu scheme budget', 1, 2),
      (2, 2, '2024-25', 60000000.00, 45000000.00, 'Farmer Support', 'PM-KISAN budget allocation', 1, 3),
      (3, 3, '2024-25', 35000000.00, 24000000.00, 'Horticulture', 'Horticulture Development budget', 1, 4),
      (4, 4, '2024-25', 25000000.00, 18000000.00, 'Marketing', 'Agricultural Marketing budget', 1, 5),
      (5, 5, '2024-25', 18000000.00, 12000000.00, 'Cooperative', 'Cooperative Development budget', 1, 6),
      (6, 6, '2024-25', 22000000.00, 15000000.00, 'Education', 'Agricultural Education budget', 1, 7),
      (7, 7, '2024-25', 15000000.00, 10000000.00, 'Training', 'Horticulture Training budget', 1, 8),
      (8, 8, '2024-25', 12000000.00, 8500000.00, 'Training', 'Extension Training budget', 1, 9),
      (9, 9, '2024-25', 45000000.00, 32000000.00, 'Marketing', 'Market Federation budget', 1, 10),
      (10, 10, '2024-25', 30000000.00, 22000000.00, 'Seeds', 'Seed Development budget', 1, 2),
      (11, 11, '2024-25', 20000000.00, 14000000.00, 'Certification', 'Organic Certification budget', 1, 3),
      (12, 12, '2024-25', 40000000.00, 28000000.00, 'Industry', 'Agro Industries budget', 1, 4),
      (13, 13, '2024-25', 28000000.00, 19000000.00, 'Oilseeds', 'Oil Seeds Mission budget', 1, 5),
      (14, 14, '2024-25', 55000000.00, 38000000.00, 'Storage', 'Warehousing Scheme budget', 1, 6),
      (15, 15, '2024-25', 80000000.00, 58000000.00, 'Credit', 'Cooperative Credit budget', 1, 7),
      (16, 16, '2024-25', 38000000.00, 26000000.00, 'Infrastructure', 'Horticulture Infrastructure budget', 1, 8),
      (17, 17, '2024-25', 42000000.00, 30000000.00, 'Irrigation', 'Rural Irrigation budget', 1, 9),
      (18, 18, '2024-25', 15000000.00, 10000000.00, 'Cooperative', 'Cooperative Union budget', 1, 10),
      (19, 19, '2024-25', 50000000.00, 35000000.00, 'Housing', 'Housing for Farmers budget', 1, 2),
      (20, 20, '2024-25', 65000000.00, 45000000.00, 'Marketing', 'Market Committee budget', 1, 3)
    `;
    await connection.query(budgetSQL);
    console.log('   ✓ 20 Budget records inserted');

    // ============================================
    // 6. RESET REVENUE TABLE
    // ============================================
    console.log('6. Resetting Revenue table...');
    await connection.query('TRUNCATE TABLE revenue');
    
    const revenueSQL = `
      INSERT INTO revenue (hod_id, scheme_id, amount, source, category, date, description) VALUES
      (1, 1, 25000000.00, 'State Government Grant', 'Farmer Support', '2024-12-01', 'Rythu Bandhu Q4 allocation'),
      (2, 2, 20000000.00, 'Central Government Fund', 'Farmer Support', '2024-12-01', 'PM-KISAN funds'),
      (3, 3, 12000000.00, 'State Budget', 'Horticulture', '2024-12-01', 'Horticulture development funds'),
      (4, 4, 8000000.00, 'Market Cess', 'Marketing', '2024-12-01', 'Marketing infrastructure funds'),
      (5, 5, 6000000.00, 'NABARD', 'Cooperative', '2024-12-01', 'Cooperative development funds'),
      (6, 6, 7500000.00, 'ICAR Grant', 'Education', '2024-11-15', 'Research and education funds'),
      (7, 7, 5000000.00, 'State Budget', 'Training', '2024-11-20', 'Training program funds'),
      (8, 8, 4000000.00, 'Central Scheme', 'Training', '2024-12-01', 'Extension training funds'),
      (9, 9, 15000000.00, 'Federation Surplus', 'Marketing', '2024-11-25', 'Market federation funds'),
      (10, 10, 10000000.00, 'Seed Revolving Fund', 'Seeds', '2024-12-05', 'Seed development funds'),
      (11, 11, 7000000.00, 'Organic Mission', 'Certification', '2024-12-01', 'Organic certification funds'),
      (12, 12, 14000000.00, 'Industry Department', 'Industry', '2024-11-30', 'Agro industries funds'),
      (13, 13, 9500000.00, 'NMOOP Fund', 'Oilseeds', '2024-12-01', 'Oil seeds mission funds'),
      (14, 14, 18000000.00, 'Central Pool', 'Storage', '2024-12-01', 'Warehousing scheme funds'),
      (15, 15, 25000000.00, 'RBI Fund', 'Credit', '2024-11-20', 'Cooperative credit funds'),
      (16, 16, 13000000.00, 'MIDH Fund', 'Infrastructure', '2024-12-01', 'Horticulture infrastructure funds'),
      (17, 17, 14000000.00, 'PMKSY Fund', 'Irrigation', '2024-12-01', 'Micro irrigation funds'),
      (18, 18, 5000000.00, 'Cooperative Fund', 'Cooperative', '2024-11-25', 'Union support funds'),
      (19, 19, 17000000.00, 'PMAY Rural', 'Housing', '2024-12-01', 'Farmer housing funds'),
      (20, 20, 22000000.00, 'Market Development', 'Marketing', '2024-12-05', 'Market committee funds')
    `;
    await connection.query(revenueSQL);
    console.log('   ✓ 20 Revenue records inserted');

    // ============================================
    // 7. RESET KPIs TABLE
    // ============================================
    console.log('7. Resetting KPIs table...');
    await connection.query('TRUNCATE TABLE kpis');
    
    const kpisSQL = `
      INSERT INTO kpis (hod_id, kpi_name, target_value, achieved_value, unit, period, status) VALUES
      (1, 'Farmers Benefited - Rythu Bandhu', 600000.00, 450000.00, 'Count', 'Yearly', 'on_track'),
      (2, 'PM-KISAN Beneficiaries', 500000.00, 380000.00, 'Count', 'Yearly', 'on_track'),
      (3, 'Horticulture Area Coverage', 50000.00, 35000.00, 'Hectares', 'Yearly', 'on_track'),
      (4, 'Markets Modernized', 25.00, 18.00, 'Count', 'Yearly', 'on_track'),
      (5, 'Cooperatives Strengthened', 500.00, 350.00, 'Count', 'Yearly', 'at_risk'),
      (6, 'Students Supported', 5000.00, 3800.00, 'Count', 'Yearly', 'on_track'),
      (7, 'Farmers Trained', 25000.00, 18000.00, 'Count', 'Yearly', 'on_track'),
      (8, 'Extension Workers Trained', 2000.00, 1500.00, 'Count', 'Yearly', 'on_track'),
      (9, 'Market Transactions Value', 500.00, 380.00, 'Crores', 'Yearly', 'on_track'),
      (10, 'Certified Seeds Distributed', 100000.00, 72000.00, 'Quintals', 'Yearly', 'on_track'),
      (11, 'Organic Farms Certified', 10000.00, 6500.00, 'Count', 'Yearly', 'at_risk'),
      (12, 'Agro Units Established', 100.00, 65.00, 'Count', 'Yearly', 'at_risk'),
      (13, 'Oilseed Production', 200000.00, 150000.00, 'Tonnes', 'Yearly', 'on_track'),
      (14, 'Storage Capacity Added', 50000.00, 35000.00, 'MT', 'Yearly', 'on_track'),
      (15, 'Loans Disbursed', 200.00, 145.00, 'Crores', 'Yearly', 'on_track'),
      (16, 'Post-Harvest Units Built', 50.00, 32.00, 'Count', 'Yearly', 'at_risk'),
      (17, 'Irrigation Coverage', 75000.00, 55000.00, 'Hectares', 'Yearly', 'on_track'),
      (18, 'Unions Federated', 100.00, 75.00, 'Count', 'Yearly', 'on_track'),
      (19, 'Houses Constructed', 10000.00, 7200.00, 'Count', 'Yearly', 'on_track'),
      (20, 'Market Infrastructure Projects', 30.00, 22.00, 'Count', 'Yearly', 'on_track')
    `;
    await connection.query(kpisSQL);
    console.log('   ✓ 20 KPIs inserted');

    // ============================================
    // 8. RESET NODAL OFFICERS TABLE
    // ============================================
    console.log('8. Resetting Nodal Officers table...');
    await connection.query('TRUNCATE TABLE nodal_officers');
    
    const nodalSQL = `
      INSERT INTO nodal_officers (name, designation, department, scheme_id, email, phone, status) VALUES
      ('Anil Kumar', 'Nodal Officer', 'A&C Secretariat', 1, 'anil.kumar@agri.gov.in', '9800000001', 'active'),
      ('Bhavani Devi', 'Nodal Officer', 'Director of Agriculture', 2, 'bhavani.devi@agri.gov.in', '9800000002', 'active'),
      ('Chandrasekhar', 'Nodal Officer', 'Horticulture', 3, 'chandrasekhar@agri.gov.in', '9800000003', 'active'),
      ('Durga Prasad', 'Nodal Officer', 'Agricultural Marketing', 4, 'durga.prasad@agri.gov.in', '9800000004', 'active'),
      ('Eshwar Rao', 'Nodal Officer', 'Cooperation', 5, 'eshwar.rao@agri.gov.in', '9800000005', 'active'),
      ('Fatima Begum', 'Nodal Officer', 'PJTAU', 6, 'fatima.begum@agri.gov.in', '9800000006', 'active'),
      ('Gopal Krishna', 'Nodal Officer', 'SKLTSHU', 7, 'gopal.krishna@agri.gov.in', '9800000007', 'active'),
      ('Hari Prasad', 'Nodal Officer', 'SAMETI', 8, 'hari.prasad@agri.gov.in', '9800000008', 'active'),
      ('Indira Kumari', 'Nodal Officer', 'TG MARKFED', 9, 'indira.kumari@agri.gov.in', '9800000009', 'active'),
      ('Jagadish Reddy', 'Nodal Officer', 'TGSDCL', 10, 'jagadish.reddy@agri.gov.in', '9800000010', 'active')
    `;
    await connection.query(nodalSQL);
    console.log('   ✓ 10 Nodal Officers inserted');

    // ============================================
    // 9. RESET ATTENDANCE TABLE
    // ============================================
    console.log('9. Resetting Attendance table...');
    await connection.query('TRUNCATE TABLE attendance');
    
    // Generate attendance for last 7 days
    const attendanceValues = [];
    const today = new Date();
    
    for (let day = 0; day < 7; day++) {
      const date = new Date(today);
      date.setDate(date.getDate() - day);
      const dateStr = date.toISOString().split('T')[0];
      
      for (let staffId = 1; staffId <= 19; staffId++) {
        const hodId = staffId <= 19 ? staffId : 20;
        const statuses = ['present', 'present', 'present', 'present', 'absent', 'half_day', 'leave'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        let checkIn = null, checkOut = null, remarks = null;
        if (status === 'present') {
          const hour = 9 + Math.floor(Math.random() * 2);
          const min = Math.floor(Math.random() * 60);
          checkIn = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:00`;
          checkOut = '18:00:00';
          remarks = hour >= 11 ? 'Late arrival' : 'On time';
        } else if (status === 'half_day') {
          checkIn = '09:00:00';
          checkOut = '13:00:00';
          remarks = 'Half day';
        } else if (status === 'absent') {
          remarks = 'Sick leave';
        } else {
          remarks = 'On leave';
        }
        
        attendanceValues.push(`(${staffId}, ${hodId}, '${dateStr}', '${status}', ${checkIn ? `'${checkIn}'` : 'NULL'}, ${checkOut ? `'${checkOut}'` : 'NULL'}, ${remarks ? `'${remarks}'` : 'NULL'})`);
      }
    }
    
    await connection.query(`INSERT INTO attendance (staff_id, hod_id, date, status, check_in, check_out, remarks) VALUES ${attendanceValues.join(',')}`);
    console.log(`   ✓ ${attendanceValues.length} Attendance records inserted`);

    // ============================================
    // 10. RESET SCHEME_BUDGET_ALLOCATION TABLE
    // ============================================
    console.log('10. Resetting Scheme Budget Allocation table...');
    await connection.query('TRUNCATE TABLE scheme_budget_allocation');
    
    const allocationSQL = `
      INSERT INTO scheme_budget_allocation (scheme_id, hod_id, hod_name, allocated_amount, spent_amount, financial_year) VALUES
      (1, 1, 'Dr. Ramesh Kumar', 75000000.00, 52000000.00, '2024-25'),
      (2, 2, 'Sri. Venkatesh Reddy', 60000000.00, 45000000.00, '2024-25'),
      (3, 3, 'Smt. Lakshmi Devi', 35000000.00, 24000000.00, '2024-25'),
      (4, 4, 'Sri. Suresh Babu', 25000000.00, 18000000.00, '2024-25'),
      (5, 5, 'Dr. Prasad Rao', 18000000.00, 12000000.00, '2024-25'),
      (6, 6, 'Prof. Jayashankar Rao', 22000000.00, 15000000.00, '2024-25'),
      (7, 7, 'Prof. Konda Laxman', 15000000.00, 10000000.00, '2024-25'),
      (8, 8, 'Dr. Anand Kumar', 12000000.00, 8500000.00, '2024-25'),
      (9, 9, 'Sri. Nagaraju Goud', 45000000.00, 32000000.00, '2024-25'),
      (10, 10, 'Smt. Padma Kumari', 30000000.00, 22000000.00, '2024-25')
    `;
    await connection.query(allocationSQL);
    console.log('   ✓ 10 Scheme Budget Allocations inserted');

    // ============================================
    // 11. UPDATE USERS TABLE
    // ============================================
    console.log('11. Updating Users table...');
    await connection.query('TRUNCATE TABLE users');
    
    const usersSQL = `
      INSERT INTO users (username, password, email, role, hod_id, staff_id, name, status, password_changed) VALUES
      ('admin', 'password123', 'admin@agri.gov.in', 'admin', NULL, NULL, 'System Administrator', 'active', 0),
      ('hod1', 'password123', 'ramesh.kumar@agri.gov.in', 'hod', 1, NULL, 'Dr. Ramesh Kumar', 'active', 0),
      ('hod2', 'password123', 'venkatesh.reddy@agri.gov.in', 'hod', 2, NULL, 'Sri. Venkatesh Reddy', 'active', 0),
      ('hod3', 'password123', 'lakshmi.devi@agri.gov.in', 'hod', 3, NULL, 'Smt. Lakshmi Devi', 'active', 0),
      ('staff1', 'password123', 'ajay.kumar@agri.gov.in', 'staff', 1, 1, 'Ajay Kumar', 'active', 0),
      ('staff2', 'password123', 'priya.sharma@agri.gov.in', 'staff', 2, 2, 'Priya Sharma', 'active', 0),
      ('staff3', 'password123', 'ravi.teja@agri.gov.in', 'staff', 3, 3, 'Ravi Teja', 'active', 0)
    `;
    await connection.query(usersSQL);
    console.log('   ✓ 7 Users inserted');

    // Re-enable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // ============================================
    // VERIFICATION
    // ============================================
    console.log('\n========== VERIFICATION ==========\n');

    const tables = ['categories', 'hods', 'staff', 'schemes', 'budget', 'revenue', 'kpis', 'nodal_officers', 'attendance', 'scheme_budget_allocation', 'users'];
    
    for (const table of tables) {
      const [result] = await connection.query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`${table}: ${result[0].count} records`);
    }

    console.log('\n========== ALL TABLES RESET SUCCESSFULLY ==========');

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  } finally {
    await connection.end();
  }
}

resetAllTables();
