// src/hooks/useRealTimeNotifications.js

import { useEffect, useCallback, useRef } from 'react';
import socketService from '../api/services/socket.service';
import NotificationService from '../api/services/notification.service';

/**
 * Hook for managing real-time notifications
 * @param {Function} onNewNotification - Callback when new notification arrives
 * @param {Function} onUnreadCountUpdate - Callback when unread count changes
 */
export const useRealTimeNotifications = (onNewNotification, onUnreadCountUpdate) => {
  const unsubscribeRef = useRef(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    // Initialize socket connection
    socketService.init();

    // Listen for new notifications
    unsubscribeRef.current = socketService.on('notificationNew', async (notificationData) => {
      console.log('[useRealTimeNotifications] New notification received:', notificationData);

      // Update UI with new notification
      if (onNewNotification) {
        onNewNotification(notificationData);
      }

      // Update unread count
      if (onUnreadCountUpdate) {
        const result = await NotificationService.getUnreadCount();
        if (result.ok) {
          onUnreadCountUpdate(result.count);
        }
      }
    });

    // Fallback: If socket is not available, use polling
    const pollInterval = setInterval(async () => {
      if (!socketService.isConnected) {
        const result = await NotificationService.getUnreadCount();
        if (result.ok && onUnreadCountUpdate) {
          onUnreadCountUpdate(result.count);
        }
      }
    }, 30000); // Poll every 30 seconds if socket is not connected

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      clearInterval(pollInterval);
    };
  }, [onNewNotification, onUnreadCountUpdate]);
};

export default useRealTimeNotifications;
