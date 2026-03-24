const EventEmitter = require('events');
const notificationRepository = require('../repositories/notificationRepository');

class NotificationService extends EventEmitter {
    constructor() {
        super();
        // Increase max listeners since each connected client adds a listener
        this.setMaxListeners(100);
    }

    /**
     * Create a notification and immediately emit an event for SSE
     */
    async createNotification(userId, title, message, type = 'general', client = null) {
        try {
            // Can be part of a transaction if clien is passed (e.g. from requestService)
            const dbClient = client || require('../Database');
            
            const notification = await notificationRepository.create(userId, title, message, type, dbClient);
            
            // Emit an event specific to this user so SSE can catch it
            this.emit(`notification:${userId}`, notification);
            
            return notification;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }

    /**
     * Get user's unread notifications
     */
    async getUnreadNotifications(userId) {
        return await notificationRepository.getUnread(userId);
    }

    /**
     * Mark a notification as read
     */
    async markNotificationAsRead(notificationId, userId) {
        return await notificationRepository.markAsRead(notificationId, userId);
    }

    /**
     * Mark all notifications as read for a user
     */
    async markAllNotificationsAsRead(userId) {
        return await notificationRepository.markAllAsRead(userId);
    }
}

// Export a singleton instance so the EventEmitter is shared application-wide
// This is critical for SSE to work properly across the entire backend app
module.exports = new NotificationService();
