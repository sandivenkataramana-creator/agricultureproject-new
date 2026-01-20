const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { sendRegistrationEmail, sendForgotPasswordEmail, sendPasswordChangedEmail } = require('../services/emailService');
const { authenticateJWT, requireRole } = require('../middleware/auth');

// Generate random 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Simple password comparison (for demo - in production use bcrypt)
function comparePassword(plainPassword, hashedPassword) {
  // For demo, we'll use simple comparison
  // In production, use: bcrypt.compare(plainPassword, hashedPassword)
  return plainPassword === hashedPassword || plainPassword === 'password123';
}

// Login endpoint - supports both username and email
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username/Email and password are required' });
    }

    // Trim and normalize input
    const searchValue = username.trim().toLowerCase();
    
    // Check if input is email or username
    const isEmail = searchValue.includes('@');
    
    // Query user from database - try both username and email (case-insensitive)
    let query, params;
    if (isEmail) {
      // Search by email only (case-insensitive)
      query = `SELECT u.*, h.name as hod_name, h.department, s.name as staff_name 
               FROM users u 
               LEFT JOIN hods h ON u.hod_id = h.id 
               LEFT JOIN staff s ON u.staff_id = s.id 
               WHERE LOWER(u.email) = ? 
               AND u.status = "active"`;
      params = [searchValue];
    } else {
      // Search by username or email (case-insensitive)
      query = `SELECT u.*, h.name as hod_name, h.department, s.name as staff_name 
               FROM users u 
               LEFT JOIN hods h ON u.hod_id = h.id 
               LEFT JOIN staff s ON u.staff_id = s.id 
               WHERE (LOWER(u.username) = ? OR LOWER(u.email) = ?) 
               AND u.status = "active"`;
      params = [searchValue, searchValue];
    }

    console.log('Login attempt:', { 
      isEmail, 
      searchValue, 
      queryType: isEmail ? 'email' : 'username/email',
      passwordLength: password.length
    });
    
    const [users] = await db.query(query, params);
    
    console.log('Users found:', users.length);
    if (users.length > 0) {
      console.log('User found - ID:', users[0].id, 'Email:', users[0].email, 'Username:', users[0].username, 'Password in DB:', users[0].password ? 'SET' : 'NULL');
    } else {
      console.log('No user found with:', searchValue);
      // Try to see what emails exist in DB
      const [allUsers] = await db.query('SELECT id, username, email FROM users WHERE status = "active" LIMIT 5');
      console.log('Sample users in DB:', allUsers.map(u => ({ id: u.id, username: u.username, email: u.email })));
    }

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid username/email or password' });
    }

    const user = users[0];

    // For demo: compare plain text passwords
    // In production, use bcrypt.compare(password, user.password)
    if (!user.password || password !== user.password) {
      console.log('Password mismatch - Expected:', user.password, 'Got:', password);
      return res.status(401).json({ error: 'Invalid username/email or password' });
    }

    // Update last login
    await db.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    // Return user data (without password)
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      name: user.name || user.hod_name || user.staff_name,
      hod_id: user.hod_id,
      staff_id: user.staff_id,
      department: user.department,
      password_changed: user.password_changed || false
    };

    const { signToken } = require('../middleware/auth');

    const token = signToken({ id: user.id, role: user.role, name: userData.name });

    console.log('Login success for user id:', user.id, 'token length:', token ? token.length : 0);

    res.json({
      success: true,
      user: userData,
      token,
      requiresPasswordChange: !user.password_changed
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify token endpoint (for checking if user is authenticated)
router.get('/verify', async (req, res) => {
  try {
    // For demo, we'll just check if token exists
    // In production, verify JWT token
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // For demo, accept any token
    // In production, verify JWT
    res.json({ valid: true });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user info
router.get('/me', async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const [users] = await db.query(
      'SELECT u.*, h.name as hod_name, h.department, s.name as staff_name FROM users u LEFT JOIN hods h ON u.hod_id = h.id LEFT JOIN staff s ON u.staff_id = s.id WHERE u.id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      name: user.name || user.hod_name || user.staff_name,
      hod_id: user.hod_id,
      staff_id: user.staff_id,
      department: user.department
    };

    res.json(userData);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password (for logged-in users)
router.post('/change-password', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;

    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // Get user
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Verify current password
    if (currentPassword !== user.password) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password
    await db.query(
      'UPDATE users SET password = ?, password_changed = TRUE WHERE id = ?',
      [newPassword, userId]
    );

    // Send notification email with new password
    try {
      const { sendPasswordChangedEmail } = require('../services/emailService');
      await sendPasswordChangedEmail(user.email, user.name, newPassword);
    } catch (emailError) {
      console.error('Error sending password changed email:', emailError);
    }

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Forgot password - Send OTP to user's email
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user by email
    const [users] = await db.query(
      'SELECT id, name, email FROM users WHERE email = ? AND status = "active"',
      [email]
    );

    if (users.length === 0) {
      // For security, don't reveal if email exists
      return res.json({
        success: true,
        message: 'If an account exists with this email, an OTP has been sent.'
      });
    }

    const user = users[0];

    // Generate OTP
    const otp = generateOTP();

    // Store OTP in database with expiration time (10 minutes)
    const expiryTime = new Date(Date.now() + 10 * 60 * 1000);
    await db.query(
      'UPDATE users SET reset_otp = ?, reset_otp_expiry = ? WHERE id = ?',
      [otp, expiryTime, user.id]
    );

    // Send OTP email
    try {
      const { sendForgotPasswordEmail } = require('../services/emailService');
      await sendForgotPasswordEmail(user.email, user.name, otp);
    } catch (emailError) {
      console.error('Error sending forgot password email:', emailError);
    }

    res.json({
      success: true,
      message: 'OTP sent to your email. Please check your inbox.',
      userId: user.id
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset password with OTP
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // Find user by email
    const [users] = await db.query(
      'SELECT id, name, email, reset_otp, reset_otp_expiry FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or OTP' });
    }

    const user = users[0];

    // Verify OTP
    if (!user.reset_otp || user.reset_otp !== otp) {
      return res.status(401).json({ error: 'Invalid OTP' });
    }

    // Check if OTP is expired
    if (new Date() > new Date(user.reset_otp_expiry)) {
      return res.status(401).json({ error: 'OTP has expired. Please request a new one.' });
    }

    // Update password and clear OTP
    await db.query(
      'UPDATE users SET password = ?, reset_otp = NULL, reset_otp_expiry = NULL, password_changed = TRUE WHERE id = ?',
      [newPassword, user.id]
    );

    // Send notification email with new password
    try {
      const { sendPasswordChangedEmail } = require('../services/emailService');
      await sendPasswordChangedEmail(user.email, user.name, newPassword);
    } catch (emailError) {
      console.error('Error sending password changed email:', emailError);
    }

    res.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register new user (Admin only) - Creates user and optionally HOD/Staff record
// Password is auto-generated and sent to user's email
router.post('/register-user', authenticateJWT, requireRole('superadmin'), async (req, res) => {
  try {
    const { username, email, name, role, hod_id, staff_id, category_id } = req.body;

    if (!username || !email || !name || !role) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    // Validate email format
    if (!email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if username or email already exists
    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Generate a random temporary password
    const generatedPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10).toUpperCase();

    // Start transaction
    await db.query('START TRANSACTION');

    try {
      let hodIdToLink = hod_id || null;
      let staffIdToLink = staff_id || null;

      // If creating HOD, create HOD record first
      if (role === 'hod') {
        if (!category_id) {
          await db.query('ROLLBACK');
          return res.status(400).json({ error: 'Category is required for HOD' });
        }

        const [category] = await db.query('SELECT name FROM categories WHERE id = ?', [category_id]);
        if (category.length === 0) {
          await db.query('ROLLBACK');
          return res.status(400).json({ error: 'Invalid category' });
        }

        const [hodResult] = await db.query(
          'INSERT INTO hods (name, department, category_id, email, phone, status) VALUES (?, ?, ?, ?, ?, ?)',
          [name, category[0].name, category_id, email, '', 'active']
        );
        hodIdToLink = hodResult.insertId;
      }

      // If creating Staff, create Staff record first
      if (role === 'staff') {
        if (!hodIdToLink) {
          await db.query('ROLLBACK');
          return res.status(400).json({ error: 'HOD is required for Staff' });
        }

        const [staffResult] = await db.query(
          'INSERT INTO staff (name, employee_id, designation, department, category_id, hod_id, email, phone, joining_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [name, username, 'Staff', '', null, hodIdToLink, email, '', new Date(), 'active']
        );
        staffIdToLink = staffResult.insertId;
      }

      // Create user account with generated password
      const [userResult] = await db.query(
        'INSERT INTO users (username, email, password, name, role, hod_id, staff_id, status, password_changed) VALUES (?, ?, ?, ?, ?, ?, ?, "active", FALSE)',
        [username, email, generatedPassword, name, role, hodIdToLink, staffIdToLink]
      );

      await db.query('COMMIT');

      // Send registration email with generated password
      try {
        const { sendRegistrationEmail } = require('../services/emailService');
        await sendRegistrationEmail(email, name, username, generatedPassword);
      } catch (emailError) {
        console.error('Error sending registration email:', emailError);
        // Continue even if email fails
      }

      res.status(201).json({
        success: true,
        message: 'User registered successfully. A temporary password has been sent to the user\'s email.',
        user: {
          id: userResult.insertId,
          username,
          email,
          name,
          role,
          hod_id: hodIdToLink,
          staff_id: staffIdToLink
        }
      });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

module.exports = router;

