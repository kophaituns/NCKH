// src/components/UI/NotificationBell/index.jsx
import React, { useState, useEffect, useRef } from 'react';
import styles from './NotificationBell.module.scss';
import NotificationService from '../../../api/services/notification.service';
import useRealTimeNotifications from '../../../hooks/useRealTimeNotifications';
import NotificationPanel from '../NotificationPanel';

const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const [loading, setLoading] = useState(false);

  const bellRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    fetchUnreadCount();
  }, []);

  useRealTimeNotifications(
    () => fetchUnreadCount(),
    (count) => setUnreadCount(count),
  );

  // Đóng panel khi click ra ngoài
  useEffect(() => {
    if (!showPanel) return;

    const handleClickOutside = (event) => {
      const bellEl = bellRef.current;
      const panelEl = panelRef.current;

      if (
        bellEl &&
        !bellEl.contains(event.target) &&
        panelEl &&
        !panelEl.contains(event.target)
      ) {
        setShowPanel(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPanel]);

  const fetchUnreadCount = async () => {
    if (loading) return;
    try {
      setLoading(true);
      const result = await NotificationService.getUnreadCount();
      if (result.ok) {
        setUnreadCount(result.count || 0);
      }
    } catch (error) {
      console.error('[NotificationBell] Failed to fetch unread count:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBellClick = () => {
    setShowPanel((prev) => !prev);
  };

  return (
    <div className={styles.notificationBell}>
      <button
        ref={bellRef}
        className={styles.bellButton}
        onClick={handleBellClick}
        title="Notifications"
        aria-label="Notifications"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>

        {/* 🔴 Chấm đỏ báo có thông báo chưa đọc */}
        {unreadCount > 0 && (
          <span className={styles.dotIndicator} />
        )}
      </button>

      {showPanel && (
        <div ref={panelRef}>
          <NotificationPanel
            key={showPanel ? 'open' : 'closed'}
            onClose={() => setShowPanel(false)}
            onNotificationRead={fetchUnreadCount}
          />
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
