// src/api/services/notification.service.js
import http from '../http';

class NotificationService {
  /**
   * Get unread notifications for user
   */
  async getUnreadNotifications(limit = 20) {
    try {
      const response = await http.get(`/modules/notifications/unread`, {
        params: { limit }
      });
      return response.data || { ok: false, notifications: [] };
    } catch (error) {
      console.error('[NotificationService.getUnreadNotifications] ERROR:', error);
      return {
        ok: false,
        message: error.response?.data?.message || error.message,
        notifications: []
      };
    }
  }

  /**
   * Get all notifications
   */
  async getNotifications(limit = 50, offset = 0) {
    try {
      const response = await http.get(`/modules/notifications`, {
        params: { limit, offset }
      });
      return response.data || { ok: false, notifications: [] };
    } catch (error) {
      console.error('[NotificationService.getNotifications] ERROR:', error);
      return {
        ok: false,
        message: error.response?.data?.message || error.message,
        notifications: []
      };
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId) {
    try {
      const response = await http.put(`/modules/notifications/${notificationId}/read`);
      return response.data || { ok: false };
    } catch (error) {
      console.error('[NotificationService.markAsRead] ERROR:', error);
      return {
        ok: false,
        message: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    try {
      const response = await http.put(`/modules/notifications/read-all`);
      return response.data || { ok: false };
    } catch (error) {
      console.error('[NotificationService.markAllAsRead] ERROR:', error);
      return {
        ok: false,
        message: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId) {
    try {
      const response = await http.delete(`/modules/notifications/${notificationId}`);
      return response.data || { ok: false };
    } catch (error) {
      console.error('[NotificationService.deleteNotification] ERROR:', error);
      return {
        ok: false,
        message: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Get notification count
   */
  async getUnreadCount() {
    try {
      const response = await http.get(`/modules/notifications/unread-count`);
      return response.data || { ok: false, count: 0 };
    } catch (error) {
      console.error('[NotificationService.getUnreadCount] ERROR:', error);
      return { ok: false, count: 0 };
    }
  }
}

export default new NotificationService();
