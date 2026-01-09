const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all messages
router.get('/', async (req, res) => {
  try {
    // Check if messages table exists
    const [tables] = await db.query("SHOW TABLES LIKE 'messages'");
    
    if (tables.length === 0) {
      // Return default messages if table doesn't exist
      return res.json([
        { id: 1, from: 'System Admin', subject: 'Welcome to HOD Management', preview: 'Thank you for using our system. If you need help, please contact support.', time: 'Just now', read: false },
        { id: 2, from: 'Finance Department', subject: 'Budget Review Pending', preview: 'Please review and approve the Q4 budget allocations at your earliest convenience.', time: '2 hours ago', read: false },
        { id: 3, from: 'IT Support', subject: 'Scheduled Maintenance', preview: 'System maintenance is scheduled for this Sunday from 2 AM to 6 AM IST.', time: '1 day ago', read: true }
      ]);
    }

    // Get user ID from query params (if provided)
    const userId = req.query.userId;
    
    let query = 'SELECT m.*, u.name as from_name FROM messages m LEFT JOIN users u ON m.from_user_id = u.id';
    let params = [];
    
    if (userId) {
      query += ' WHERE m.user_id = ?';
      params.push(userId);
    } else {
      query += ' WHERE m.user_id IS NULL';
    }
    
    query += ' ORDER BY m.created_at DESC LIMIT 10';
    
    const [messages] = await db.query(query, params);
    res.json(messages);
  } catch (error) {
    console.error('Messages error:', error);
    // Return default messages on error
    res.json([
      { id: 1, from: 'System Admin', subject: 'Welcome', preview: 'Welcome to the HOD Management System.', time: 'Just now', read: false },
      { id: 2, from: 'Support', subject: 'Help Available', preview: 'Contact us if you need any assistance.', time: '1 hour ago', read: true }
    ]);
  }
});

// Mark message as read
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE messages SET `read` = true WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send message (Admin only)
router.post('/send', async (req, res) => {
  try {
    const { subject, message, recipientType, role, userId } = req.body;

    if (!subject || !message || !recipientType) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    // Ensure messages table exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NULL,
        from_user_id INT NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        \`read\` BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user (user_id),
        INDEX idx_read (read),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    let recipients = [];

    if (recipientType === 'all') {
      const [allUsers] = await db.query('SELECT id FROM users WHERE status = "active"');
      recipients = allUsers.map(u => u.id);
    } else if (recipientType === 'role') {
      if (!role) {
        return res.status(400).json({ error: 'Role is required' });
      }
      const [roleUsers] = await db.query('SELECT id FROM users WHERE role = ? AND status = "active"', [role]);
      recipients = roleUsers.map(u => u.id);
    } else if (recipientType === 'user') {
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      recipients = [userId];
    }

    if (recipients.length === 0) {
      return res.status(400).json({ error: 'No recipients found' });
    }

    // Get admin user ID (sender)
    const [adminUsers] = await db.query('SELECT id FROM users WHERE role = "admin" LIMIT 1');
    const fromUserId = adminUsers.length > 0 ? adminUsers[0].id : null;

    // Insert messages for all recipients (using parameterized queries)
    for (const userId of recipients) {
      await db.query(`
        INSERT INTO messages (user_id, from_user_id, subject, message, \`read\`)
        VALUES (?, ?, ?, ?, FALSE)
      `, [userId, fromUserId, subject, message]);
    }

    res.json({
      success: true,
      message: `Message sent to ${recipients.length} user(s)`
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

module.exports = router;
