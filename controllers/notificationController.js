const notificationService = require('../services/notificationService');

/**
 * Handle Server-Sent Events (SSE) connection for a specific user
 */
const streamNotifications = (req, res) => {
    // IDOR Fix: Use user ID from verified JWT (via authenticate middleware)
    const userId = req.user.sub;

    if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    // Set headers required for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    // Ensure CORS headers if needed
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Send an initial ping to establish connection
    res.write('data: {"type": "ping"}\n\n');

    // Define the listener function
    const notificationListener = (notification) => {
        // Send the real-time notification to the client
        res.write(`data: ${JSON.stringify(notification)}\n\n`);
    };

    // Listen to the specific user's event channel
    const eventName = `notification:${userId}`;
    notificationService.on(eventName, notificationListener);

    // When the client closes the connection, remove the listener to prevent memory leaks
    req.on('close', () => {
        notificationService.off(eventName, notificationListener);
    });
};

/**
 * Get all unread offline notifications for a user
 */
const getUnreadNotifications = async (req, res) => {
    try {
        // IDOR Fix: Use user ID from JWT
        const userId = req.user.sub;
        
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const notifications = await notificationService.getUnreadNotifications(parseInt(userId));
        res.status(200).json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

/**
 * Mark a single notification as read
 */
const markAsRead = async (req, res) => {
    try {
        // IDOR Fix: Use user ID from JWT
        const userId = req.user.sub;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const updated = await notificationService.markNotificationAsRead(parseInt(id), parseInt(userId));
        res.status(200).json(updated);
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Failed to mark as read' });
    }
};

/**
 * Mark all notifications as read
 */
const markAllAsRead = async (req, res) => {
    try {
        // IDOR Fix: Use user ID from JWT
        const userId = req.user.sub;

        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const updated = await notificationService.markAllNotificationsAsRead(parseInt(userId));
        res.status(200).json({ message: 'All marked as read', count: updated.length });
    } catch (error) {
        console.error('Error marking all as read:', error);
        res.status(500).json({ error: 'Failed to mark all as read' });
    }
};

module.exports = {
    streamNotifications,
    getUnreadNotifications,
    markAsRead,
    markAllAsRead
};
