// src/components/SurveyAccessControl/index.jsx
import React, { useState, useEffect, useCallback } from 'react';
import styles from './SurveyAccessControl.module.scss';

const SurveyAccessControl = ({
  surveyId,
  value = { access_type: 'public', require_login: false, allow_anonymous: true, workspace_id: null },
  onChange,
  availableWorkspaces = [],
  compact = false
}) => {
  const [accessConfig, setAccessConfig] = useState(value);
  const [inviteEmails, setInviteEmails] = useState('');
  const [sentInvites, setSentInvites] = useState([]);
  const [loadingInvites, setLoadingInvites] = useState(false);

  useEffect(() => {
    setAccessConfig(value);
  }, [value]);

  const fetchInvites = useCallback(async () => {
    try {
      setLoadingInvites(true);
      // Dynamic import to avoid circular dependency if any
      const InviteService = (await import('../../api/services/invite.service')).default;
      const invites = await InviteService.getInvites(surveyId);
      setSentInvites(invites);
    } catch (error) {
      console.error('Error fetching invites:', error);
    } finally {
      setLoadingInvites(false);
    }
  }, [surveyId]);

  // Fetch existing invites when surveyId changes or access type is private
  useEffect(() => {
    if (surveyId && accessConfig.access_type === 'private') {
      fetchInvites();
    }
  }, [surveyId, accessConfig.access_type, fetchInvites]);

  const handleResendInvite = async (email) => {
    try {
      const InviteService = (await import('../../api/services/invite.service')).default;
      await InviteService.createInvites(surveyId, [email]);
      // Refresh list
      fetchInvites();
      alert(`Invitation resent to ${email}`);
    } catch (error) {
      console.error('Error resending invite:', error);
      alert('Failed to resend invitation');
    }
  };

  const handleAccessTypeChange = (newAccessType) => {
    let newConfig = {
      ...accessConfig,
      access_type: newAccessType
    };

    // Auto-configure based on access type
    switch (newAccessType) {
      case 'public':
        newConfig = {
          ...newConfig,
          require_login: false,
          allow_anonymous: true
        };
        break;
      case 'public_with_login':
        newConfig = {
          ...newConfig,
          require_login: true,
          allow_anonymous: false
        };
        break;
      case 'private':
        newConfig = {
          ...newConfig,
          require_login: true,
          allow_anonymous: false
        };
        break;
      case 'internal':
        newConfig = {
          ...newConfig,
          require_login: true,
          allow_anonymous: false
        };
        break;
      default:
        break;
    }

    setAccessConfig(newConfig);
    onChange({ ...newConfig, inviteEmails });
  };

  const handleInviteEmailsChange = (emails) => {
    setInviteEmails(emails);
    onChange({ ...accessConfig, inviteEmails: emails });
  };

  const handleWorkspaceChange = (workspaceId) => {
    const newConfig = {
      ...accessConfig,
      workspace_id: workspaceId ? parseInt(workspaceId) : null
    };

    // If workspace is removed and access_type is internal, change to public
    if (!workspaceId && accessConfig.access_type === 'internal') {
      newConfig.access_type = 'public';
      newConfig.require_login = false;
      newConfig.allow_anonymous = true;
    }

    setAccessConfig(newConfig);
    onChange({ ...newConfig, inviteEmails });
  };

  const getAccessTypeDescription = (type) => {
    switch (type) {
      case 'public':
        return 'Anyone can respond anonymously without login';
      case 'public_with_login':
        return 'Anyone can respond but must login first';
      case 'private':
        return 'Only invited people can respond';
      case 'internal':
        return 'Only workspace/organization members can respond';
      default:
        return '';
    }
  };

  const getAccessTypeIcon = (type) => {
    switch (type) {
      case 'public':
        return '🌐';
      case 'public_with_login':
        return '🔒';
      case 'private':
        return '📧';
      case 'internal':
        return '🏢';
      default:
        return '';
    }
  };

  return (
    <div className={`${styles.surveyAccessControl} ${compact ? styles.compact : ''}`}>
      {!compact && (
        <div className={styles.header}>
          <h3>Survey Access Control</h3>
          <p>Choose who can access and respond to your survey</p>
        </div>
      )}

      {/* Workspace Selection */}
      <div className={styles.formGroup}>
        <label>📁 Assign to Workspace (Optional)</label>
        <select
          value={accessConfig.workspace_id || ''}
          onChange={(e) => handleWorkspaceChange(e.target.value)}
          className={styles.workspaceSelect}
        >
          <option value="">No Workspace (Personal Survey)</option>
          {availableWorkspaces.map(workspace => (
            <option key={workspace.id} value={workspace.id}>
              {workspace.name}
            </option>
          ))}
        </select>
        <small className={styles.hint}>
          Assigning to a workspace enables the "Internal" access option
        </small>
      </div>

      <div className={styles.accessTypes}>
        {[
          {
            type: 'public',
            title: 'Public',
            subtitle: 'Open to everyone',
            recommended: true
          },
          {
            type: 'public_with_login',
            title: 'Public with Login',
            subtitle: 'Open but requires account'
          },
          {
            type: 'private',
            title: 'Private',
            subtitle: 'Invitation only'
          },
          {
            type: 'internal',
            title: 'Internal',
            subtitle: 'Workspace members only',
            disabled: !accessConfig.workspace_id
          }
        ].map((option) => (
          <div
            key={option.type}
            className={`${styles.accessTypeCard} ${accessConfig.access_type === option.type ? styles.selected : ''
              } ${option.disabled ? styles.disabled : ''}`}
            onClick={() => !option.disabled && handleAccessTypeChange(option.type)}
          >
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                {getAccessTypeIcon(option.type)}
              </div>
              <div className={styles.cardTitle}>
                <h4>
                  {option.title}
                  {option.recommended && <span className={styles.recommended}>Recommended</span>}
                  {option.disabled && <span className={styles.disabled}>Unavailable</span>}
                </h4>
                <p>{option.subtitle}</p>
              </div>
            </div>
            <div className={styles.cardDescription}>
              {getAccessTypeDescription(option.type)}
            </div>
          </div>
        ))}
      </div>

      {/* Private Survey Invite Section */}
      {accessConfig.access_type === 'private' && (
        <div className={styles.inviteSection}>
          <h4>Invite People</h4>
          <p>Enter email addresses (one per line) to invite to this survey:</p>
          <textarea
            className={styles.inviteTextarea}
            value={inviteEmails}
            onChange={(e) => handleInviteEmailsChange(e.target.value)}
            placeholder="email1@example.com&#10;email2@example.com&#10;email3@example.com"
            rows="4"
          />
          <small className={styles.hint}>
            💡 Registered users will receive a notification. Invitations will be sent after saving the survey.
          </small>

          {/* List of sent invites */}
          {surveyId && (
            <div className={styles.sentInvitesList}>
              <h5>Sent Invitations ({sentInvites.length})</h5>
              {loadingInvites ? (
                <div>Loading invites...</div>
              ) : sentInvites.length > 0 ? (
                <div className={styles.inviteTable}>
                  <table>
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Sent Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sentInvites.map(invite => (
                        <tr key={invite.id}>
                          <td>{invite.email}</td>
                          <td>
                            <span className={`${styles.statusBadge} ${styles[invite.status]}`}>
                              {invite.status}
                            </span>
                          </td>
                          <td>{new Date(invite.created_at).toLocaleDateString()}</td>
                          <td>
                            <button
                              type="button"
                              className={styles.resendButton}
                              onClick={() => handleResendInvite(invite.email)}
                              title="Resend Invitation"
                            >
                              Resend
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className={styles.noInvites}>No invitations sent yet.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Internal Survey Workspace Info */}
      {accessConfig.access_type === 'internal' && accessConfig.workspace_id && (
        <div className={styles.internalInfo}>
          <div className={styles.infoBox}>
            <h4>🏢 Workspace Access</h4>
            <p>This survey will only be accessible to members of your selected workspace.</p>
            <small>Workspace: {availableWorkspaces.find(w => w.id === accessConfig.workspace_id)?.name}</small>
          </div>
        </div>
      )}

      {/* Access Summary */}
      <div className={styles.summary}>
        <h4>Access Summary</h4>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <span className={styles.label}>Access Type:</span>
            <span className={styles.value}>
              {getAccessTypeIcon(accessConfig.access_type)} {accessConfig.access_type.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.label}>Login Required:</span>
            <span className={styles.value}>
              {accessConfig.require_login ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.label}>Anonymous Allowed:</span>
            <span className={styles.value}>
              {accessConfig.allow_anonymous ? '✅ Yes' : '❌ No'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyAccessControl;