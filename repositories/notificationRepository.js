const db = require('../Database');

class NotificationRepository {
    /**
     * Create a new notification
     */
    async create(userId, title, message, type = 'general', client = db) {
        const query = `
            INSERT INTO Notifications (user_id, title, message, type)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const result = await client.query(query, [userId, title, message, type]);
        return result.rows[0];
    }

    /**
     * Get unread notifications for a user
     */
    async getUnread(userId) {
        const query = `
            SELECT * FROM Notifications
            WHERE user_id = $1 AND is_read = FALSE
            ORDER BY created_at DESC
        `;
        const result = await db.query(query, [userId]);
        return result.rows;
    }

    /**
     * Mark a specific notification as read
     */
    async markAsRead(notificationId, userId) {
        const query = `
            UPDATE Notifications
            SET is_read = TRUE
            WHERE id = $1 AND user_id = $2
            RETURNING *
        `;
        const result = await db.query(query, [notificationId, userId]);
        return result.rows[0];
    }

    /**
     * Mark all unread notifications as read for a user
     */
    async markAllAsRead(userId) {
        const query = `
            UPDATE Notifications
            SET is_read = TRUE
            WHERE user_id = $1 AND is_read = FALSE
            RETURNING *
        `;
        const result = await db.query(query, [userId]);
        return result.rows;
    }
}

module.exports = new NotificationRepository();
