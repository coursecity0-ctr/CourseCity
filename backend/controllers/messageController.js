const db = require('../config/database');

// Submit a new contact message (Public)
exports.submitMessage = async (req, res, next) => {
    try {
        const { name, email, phone, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({ error: 'All fields except phone are required' });
        }

        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRe.test(email)) {
            return res.status(400).json({ error: 'Invalid email address' });
        }

        await db.query(
            `INSERT INTO messages (name, email, phone, subject, message)
             VALUES ($1, $2, $3, $4, $5)`,
            [name, email, phone || null, subject, message]
        );

        res.status(201).json({
            success: true,
            message: 'Your message has been sent successfully. We will get back to you soon.'
        });
    } catch (error) {
        next(error);
    }
};

// Get all messages (Admin Only)
exports.getAllMessages = async (req, res, next) => {
    try {
        const result = await db.query(
            'SELECT * FROM messages ORDER BY created_at DESC'
        );

        res.json({
            success: true,
            messages: result.rows
        });
    } catch (error) {
        next(error);
    }
};

// Get message by ID (Admin Only)
exports.getMessage = async (req, res, next) => {
    try {
        const result = await db.query(
            'SELECT * FROM messages WHERE id = $1',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Message not found' });
        }

        res.json({
            success: true,
            message: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

// Update message status (Admin Only)
exports.updateMessageStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const allowedStatuses = ['unread', 'read', 'replied', 'archived'];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const result = await db.query(
            'UPDATE messages SET status = $1 WHERE id = $2',
            [status, req.params.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Message not found' });
        }

        res.json({
            success: true,
            message: 'Message status updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Delete message (Admin Only)
exports.deleteMessage = async (req, res, next) => {
    try {
        const result = await db.query(
            'DELETE FROM messages WHERE id = $1',
            [req.params.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Message not found' });
        }

        res.json({
            success: true,
            message: 'Message deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};
