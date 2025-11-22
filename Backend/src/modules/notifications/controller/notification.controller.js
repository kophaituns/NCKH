// src/modules/notifications/controller/notification.controller.js
const notificationService = require('../service/notification.service');
const logger = require('../../../utils/logger');

class NotificationController {
  /**
   * GET /api/modules/notifications/unread
   * Get unread notifications for current user
   */
  async getUnreadNotifications(req, res) {
    try {
      const { limit = 20 } = req.query;

      const notifications = await notificationService.getUnreadNotifications(
        req.user.id,
        parseInt(limit)
      );

      res.status(200).json({
        ok: true,
        notifications
      });
    } catch (error) {
      logger.error('Get unread notifications error:', error);
      res.status(500).json({
        ok: false,
        message: error.message || 'Error fetching notifications'
      });
    }
  }

  /**
   * GET /api/modules/notifications
   * Get all notifications for current user with pagination
   */
  async getNotifications(req, res) {
    try {
      const { limit = 50, offset = 0 } = req.query;

      const { notifications, total } = await notificationService.getNotifications(
        req.user.id,
        parseInt(limit),
        parseInt(offset)
      );

      res.status(200).json({
        ok: true,
        notifications,
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    } catch (error) {
      logger.error('Get notifications error:', error);
      res.status(500).json({
        ok: false,
        message: error.message || 'Error fetching notifications'
      });
    }
  }

  /**
   * GET /api/modules/notifications/unread-count
   * Get count of unread notifications
   */
  async getUnreadCount(req, res) {
    try {
      const count = await notificationService.getUnreadCount(req.user.id);

      res.status(200).json({
        ok: true,
        count
      });
    } catch (error) {
      logger.error('Get unread count error:', error);
      res.status(500).json({
        ok: false,
        count: 0
      });
    }
  }

  /**
   * PUT /api/modules/notifications/:id/read
   * Mark notification as read
   */
  async markAsRead(req, res) {
    try {
      const { id } = req.params;

      const notification = await notificationService.markAsRead(id, req.user.id);

      res.status(200).json({
        ok: true,
        notification
      });
    } catch (error) {
      logger.error('Mark as read error:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          ok: false,
          message: error.message
        });
      }

      res.status(500).json({
        ok: false,
        message: error.message || 'Error marking notification as read'
      });
    }
  }

  /**
   * PUT /api/modules/notifications/read-all
   * Mark all notifications as read
   */
  async markAllAsRead(req, res) {
    try {
      await notificationService.markAllAsRead(req.user.id);

      res.status(200).json({
        ok: true,
        message: 'All notifications marked as read'
      });
    } catch (error) {
      logger.error('Mark all as read error:', error);
      res.status(500).json({
        ok: false,
        message: error.message || 'Error marking notifications as read'
      });
    }
  }

  /**
   * DELETE /api/modules/notifications/:id
   * Delete notification
   */
  async deleteNotification(req, res) {
    try {
      const { id } = req.params;

      await notificationService.deleteNotification(id, req.user.id);

      res.status(200).json({
        ok: true,
        message: 'Notification deleted'
      });
    } catch (error) {
      logger.error('Delete notification error:', error);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          ok: false,
          message: error.message
        });
      }

      res.status(500).json({
        ok: false,
        message: error.message || 'Error deleting notification'
      });
    }
  }
}

module.exports = new NotificationController();
