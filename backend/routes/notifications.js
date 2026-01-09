const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all notifications
router.get('/', async (req, res) => {
  try {
    // Check if notifications table exists
    const [tables] = await db.query("SHOW TABLES LIKE 'notifications'");
    
    if (tables.length === 0) {
      // Return default notifications if table doesn't exist
      return res.json([
        { id: 1, type: 'info', title: 'Welcome', message: 'Welcome to HOD Management System', time: 'Just now', read: false },
        { id: 2, type: 'success', title: 'System Online', message: 'All services are running normally', time: '5 min ago', read: false },
        { id: 3, type: 'warning', title: 'Reminder', message: 'Please update your profile information', time: '1 hour ago', read: true }
      ]);
    }

    // Get user ID from query params (if provided)
    const userId = req.query.userId;
    
    let query = 'SELECT * FROM notifications';
    let params = [];
    
    if (userId) {
      query += ' WHERE user_id = ?';
      params.push(userId);
    } else {
      query += ' WHERE user_id IS NULL';
    }
    
    query += ' ORDER BY created_at DESC LIMIT 10';
    
    const [notifications] = await db.query(query, params);
    res.json(notifications);
  } catch (error) {
    console.error('Notifications error:', error);
    // Return default notifications on error
    res.json([
      { id: 1, type: 'info', title: 'Welcome', message: 'Welcome to HOD Management System', time: 'Just now', read: false },
      { id: 2, type: 'success', title: 'System Online', message: 'All services are running normally', time: '5 min ago', read: false }
    ]);
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE notifications SET `read` = true WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send notification (Admin only)
router.post('/send', async (req, res) => {
  try {
    const { type, title, message, recipientType, role, userId } = req.body;

    if (!type || !title || !message || !recipientType) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    // Ensure notifications table exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NULL,
        type VARCHAR(20) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        \`read\` BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user (user_id),
        INDEX idx_read (read),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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

    // Insert notifications for all recipients (using parameterized queries)
    for (const userId of recipients) {
      await db.query(`
        INSERT INTO notifications (user_id, type, title, message, \`read\`)
        VALUES (?, ?, ?, ?, FALSE)
      `, [userId, type, title, message]);
    }

    res.json({
      success: true,
      message: `Notification sent to ${recipients.length} user(s)`
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

module.exports = router;
