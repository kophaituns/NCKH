import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './ManageInvitations.module.scss';
import WorkspaceService from '../../../api/services/workspace.service';

const ManageInvitations = () => {
  const { id: workspaceId } = useParams();
  const navigate = useNavigate();
  
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workspace, setWorkspace] = useState(null);

  useEffect(() => {
    fetchData();
  }, [workspaceId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get workspace info
      const workspaceResult = await WorkspaceService.getWorkspace(workspaceId);
      if (!workspaceResult.ok) {
        setError('Failed to load workspace');
        return;
      }
      setWorkspace(workspaceResult.workspace);

      // Get pending invitations
      const invitationsResult = await WorkspaceService.getPendingInvitations(workspaceId);
      if (invitationsResult.ok) {
        setInvitations(invitationsResult.invitations || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    if (!window.confirm('Are you sure you want to cancel this invitation?')) {
      return;
    }

    try {
      const result = await WorkspaceService.cancelInvitation(invitationId);
      if (result.ok) {
        setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      } else {
        alert('Failed to cancel invitation: ' + (result.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error canceling invitation:', err);
      alert('Failed to cancel invitation');
    }
  };

  const handleResendInvitation = async (invitationId) => {
    try {
      const result = await WorkspaceService.resendInvitation(invitationId);
      if (result.ok) {
        alert('Invitation resent successfully!');
      } else {
        alert('Failed to resend invitation: ' + (result.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error resending invitation:', err);
      alert('Failed to resend invitation');
    }
  };

  if (loading) {
    return <div className={styles.container}><div className={styles.loading}>Loading...</div></div>;
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
        <button onClick={() => navigate(`/workspaces/${workspaceId}`)} className={styles.backButton}>
          Back to Workspace
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => navigate(`/workspaces/${workspaceId}`)} className={styles.backButton}>
          ← Back
        </button>
        <h1>Manage Invitations</h1>
        <p className={styles.workspaceName}>{workspace?.name}</p>
      </div>

      {invitations.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No pending invitations</p>
        </div>
      ) : (
        <div className={styles.invitationsList}>
          {invitations.map(invitation => (
            <div key={invitation.id} className={styles.invitationCard}>
              <div className={styles.invitationInfo}>
                <div className={styles.email}>{invitation.invitee_email}</div>
                <div className={styles.role}>Role: <strong>{invitation.role}</strong></div>
                <div className={styles.status}>
                  Status: <span className={`${styles.statusBadge} ${styles[invitation.status]}`}>
                    {invitation.status}
                  </span>
                </div>
                <div className={styles.dates}>
                  <span className={styles.sentDate}>
                    Sent: {new Date(invitation.created_at).toLocaleDateString()}
                  </span>
                  {invitation.expires_at && (
                    <span className={styles.expiresDate}>
                      Expires: {new Date(invitation.expires_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <div className={styles.actions}>
                {invitation.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleResendInvitation(invitation.id)}
                      className={styles.resendButton}
                      title="Resend invitation email"
                    >
                      🔄 Resend
                    </button>
                    <button
                      onClick={() => handleCancelInvitation(invitation.id)}
                      className={styles.cancelButton}
                      title="Cancel this invitation"
                    >
                      ✕ Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageInvitations;
