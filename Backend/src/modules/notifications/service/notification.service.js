// src/modules/notifications/service/notification.service.js
const { Notification } = require('../../../models');
const { Op } = require('sequelize');
const logger = require('../../../utils/logger');

class NotificationService {
  /**
   * Get unread notifications
   */
  async getUnreadNotifications(userId, limit = 20) {
    try {
      const notifications = await Notification.findAll({
        where: {
          user_id: userId,
          is_read: false
        },
        order: [['created_at', 'DESC']],
        limit: Math.min(limit, 100)
      });

      // Debug logging
      logger.info(`[Notifications API] Fetching unread for user ${userId}: found ${notifications.length}`);
      notifications.forEach((n, idx) => {
        logger.info(`  [${idx}] ID ${n.id}: type="${n.type}", data=${n.data ? JSON.stringify(n.data) : 'null'}`);
      });

      return notifications;
    } catch (error) {
      logger.error('[NotificationService] Error getting unread notifications:', error.message);
      throw error;
    }
  }

  /**
   * Get all notifications with pagination
   */
  async getNotifications(userId, limit = 50, offset = 0) {
    try {
      const { count, rows } = await Notification.findAndCountAll({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
        limit: Math.min(limit, 100),
        offset: Math.max(0, offset)
      });

      return {
        notifications: rows,
        total: count
      };
    } catch (error) {
      logger.error('[NotificationService] Error getting notifications:', error.message);
      throw error;
    }
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId) {
    try {
      const count = await Notification.count({
        where: {
          user_id: userId,
          is_read: false
        }
      });

      return count;
    } catch (error) {
      logger.error('[NotificationService] Error getting unread count:', error.message);
      return 0;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findByPk(notificationId);

      if (!notification) {
        throw new Error('Notification not found');
      }

      if (notification.user_id !== userId) {
        throw new Error('Unauthorized: cannot access other user\'s notification');
      }

      notification.is_read = true;
      notification.read_at = new Date();
      await notification.save();

      logger.info(`[NotificationService] Marked notification ${notificationId} as read`);
      return notification;
    } catch (error) {
      logger.error('[NotificationService] Error marking as read:', error.message);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId) {
    try {
      await Notification.update(
        {
          is_read: true,
          read_at: new Date()
        },
        {
          where: {
            user_id: userId,
            is_read: false
          }
        }
      );

      logger.info(`[NotificationService] Marked all notifications as read for user ${userId}`);
    } catch (error) {
      logger.error('[NotificationService] Error marking all as read:', error.message);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId, userId) {
    try {
      const notification = await Notification.findByPk(notificationId);

      if (!notification) {
        throw new Error('Notification not found');
      }

      if (notification.user_id !== userId) {
        throw new Error('Unauthorized: cannot delete other user\'s notification');
      }

      await notification.destroy();

      logger.info(`[NotificationService] Deleted notification ${notificationId}`);
    } catch (error) {
      logger.error('[NotificationService] Error deleting notification:', error.message);
      throw error;
    }
  }

  /**
   * Create notification (called from other services)
   */
  async createNotification(data) {
    try {
      const notification = await Notification.create({
        user_id: data.user_id,
        type: data.type,
        title: data.title,
        message: data.message,
        related_type: data.related_type,
        related_id: data.related_id,
        data: data.data || null,
        is_read: false
      });

      logger.info(`[NotificationService] Created notification for user ${data.user_id}: ${data.type}`);
      return notification;
    } catch (error) {
      logger.error('[NotificationService] Error creating notification:', error.message);
      // Don't throw - notifications are non-critical
    }
  }
}

module.exports = new NotificationService();
