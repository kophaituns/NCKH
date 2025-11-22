// src/modules/notifications/routes/notification.routes.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controller/notification.controller');
const { authenticate } = require('../../../middleware/auth.middleware');

/**
 * GET /api/modules/notifications/unread
 * Get unread notifications
 */
router.get('/unread', authenticate, notificationController.getUnreadNotifications);

/**
 * GET /api/modules/notifications/unread-count
 * Get unread count
 */
router.get('/unread-count', authenticate, notificationController.getUnreadCount);

/**
 * GET /api/modules/notifications
 * Get all notifications
 */
router.get('/', authenticate, notificationController.getNotifications);

/**
 * PUT /api/modules/notifications/:id/read
 * Mark notification as read
 */
router.put('/:id/read', authenticate, notificationController.markAsRead);

/**
 * PUT /api/modules/notifications/read-all
 * Mark all notifications as read
 */
router.put('/read-all', authenticate, notificationController.markAllAsRead);

/**
 * DELETE /api/modules/notifications/:id
 * Delete notification
 */
router.delete('/:id', authenticate, notificationController.deleteNotification);

module.exports = router;
