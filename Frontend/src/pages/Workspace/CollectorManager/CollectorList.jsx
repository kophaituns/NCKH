import React, { useState } from 'react';
import styles from './CollectorList.module.scss';

const CollectorList = ({ collectors, onDelete }) => {
  const [copiedLink, setCopiedLink] = useState(null);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(text);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const getCollectorIcon = (type) => {
    switch (type) {
      case 'public':
        return '🔗';
      case 'workspace':
        return '👥';
      case 'invited':
        return '📧';
      default:
        return '📋';
    }
  };

  const getCollectorTypeLabel = (type) => {
    switch (type) {
      case 'public':
        return 'Public Link';
      case 'workspace':
        return 'Workspace Members';
      case 'invited':
        return 'Invited Users';
      default:
        return 'Unknown';
    }
  };

  const getAccessLevelLabel = (level) => {
    switch (level) {
      case 'public':
        return 'Anyone';
      case 'authenticated':
        return 'Logged In';
      case 'workspace_members':
        return 'Workspace Only';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className={styles.collectorList}>
      <div className={styles.listHeader}>
        <h3>Active Collectors ({collectors.length})</h3>
      </div>

      <div className={styles.collectors}>
        {collectors.map(collector => (
          <div key={collector.id} className={styles.collectorCard}>
            <div className={styles.cardHeader}>
              <div className={styles.titleBlock}>
                <span className={styles.icon}>
                  {getCollectorIcon(collector.type)}
                </span>
                <div>
                  <h4>{collector.name}</h4>
                  <p className={styles.type}>
                    {getCollectorTypeLabel(collector.type)}
                  </p>
                </div>
              </div>
              <div className={styles.status}>
                <span className={collector.is_active ? styles.active : styles.inactive}>
                  {collector.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {collector.description && (
              <p className={styles.description}>{collector.description}</p>
            )}

            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.label}>Responses:</span>
                <span className={styles.value}>{collector.response_count || 0}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.label}>Access Level:</span>
                <span className={styles.value}>
                  {getAccessLevelLabel(collector.access_level)}
                </span>
              </div>
              {collector.expires_at && (
                <div className={styles.stat}>
                  <span className={styles.label}>Expires:</span>
                  <span className={styles.value}>
                    {new Date(collector.expires_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {collector.token && (
              <div className={styles.linkSection}>
                <label>Collector Link:</label>
                <div className={styles.linkBox}>
                  <input
                    type="text"
                    value={`${window.location.origin}/survey/${collector.token}`}
                    readOnly
                    className={styles.linkInput}
                  />
                  <button
                    className={styles.copyButton}
                    onClick={() =>
                      copyToClipboard(
                        `${window.location.origin}/survey/${collector.token}`
                      )
                    }
                  >
                    {copiedLink ===
                    `${window.location.origin}/survey/${collector.token}`
                      ? '✓ Copied'
                      : 'Copy'}
                  </button>
                </div>
              </div>
            )}

            {collector.type === 'invited' && collector.target_user_ids && (
              <div className={styles.invitedUsers}>
                <label>Invited Users: {collector.target_user_ids.length}</label>
                <div className={styles.userList}>
                  {collector.target_user_ids.map(userId => (
                    <span key={userId} className={styles.userBadge}>
                      User #{userId}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.cardActions}>
              <button className={styles.editButton}>Edit</button>
              <button
                className={styles.deleteButton}
                onClick={() => onDelete(collector.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CollectorList;
