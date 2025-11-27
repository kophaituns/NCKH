// src/components/SurveyAccess/index.jsx - Survey Access Management Component
import React, { useState, useEffect } from 'react';
import { SurveyAccessService, UserService } from '../../api/services';
import { useToast } from '../../contexts/ToastContext';
import styles from './SurveyAccess.module.scss';

const SurveyAccess = ({ surveyId, isOwner = false }) => {
  const [accessGrants, setAccessGrants] = useState([]);
  const [users, setUsers] = useState([]);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [grantForm, setGrantForm] = useState({
    user_id: '',
    access_type: 'respond',
    expires_at: '',
    notes: ''
  });
  
  const { showToast } = useToast();

  useEffect(() => {
    if (surveyId && isOwner) {
      fetchAccessGrants();
      fetchUsers();
    }
  }, [surveyId, isOwner]);

  const fetchAccessGrants = async () => {
    try {
      setLoading(true);
      const grants = await SurveyAccessService.getSurveyAccessGrants(surveyId);
      setAccessGrants(grants);
    } catch (error) {
      showToast('Error fetching access grants', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const allUsers = await UserService.getAllUsers();
      setUsers(allUsers.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleGrantAccess = async (e) => {
    e.preventDefault();
    
    if (!grantForm.user_id) {
      showToast('Please select a user', 'error');
      return;
    }

    try {
      setLoading(true);
      await SurveyAccessService.grantAccess(surveyId, grantForm);
      showToast('Access granted successfully', 'success');
      
      setShowGrantModal(false);
      setGrantForm({
        user_id: '',
        access_type: 'respond',
        expires_at: '',
        notes: ''
      });
      
      await fetchAccessGrants();
    } catch (error) {
      showToast(error.response?.data?.message || 'Error granting access', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAccess = async (userId) => {
    if (!window.confirm('Are you sure you want to revoke this access?')) {
      return;
    }

    try {
      setLoading(true);
      await SurveyAccessService.revokeAccess(surveyId, userId);
      showToast('Access revoked successfully', 'success');
      await fetchAccessGrants();
    } catch (error) {
      showToast(error.response?.data?.message || 'Error revoking access', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getAccessTypeLabel = (accessType) => {
    const labels = {
      'full': 'Full Access',
      'view': 'View Results',
      'respond': 'Respond Only'
    };
    return labels[accessType] || accessType;
  };

  const getAccessTypeBadgeClass = (accessType) => {
    const classes = {
      'full': styles.badgeFull,
      'view': styles.badgeView,
      'respond': styles.badgeRespond
    };
    return `${styles.badge} ${classes[accessType] || ''}`;
  };

  if (!isOwner) {
    return (
      <div className={styles.noAccess}>
        <p>You don't have permission to manage access for this survey.</p>
      </div>
    );
  }

  return (
    <div className={styles.surveyAccess}>
      <div className={styles.header}>
        <h3>Survey Access Management</h3>
        <button 
          className={styles.grantButton}
          onClick={() => setShowGrantModal(true)}
          disabled={loading}
        >
          Grant Access
        </button>
      </div>

      {loading && <div className={styles.loading}>Loading...</div>}

      <div className={styles.accessList}>
        {accessGrants.length === 0 ? (
          <p className={styles.noGrants}>No access grants found.</p>
        ) : (
          accessGrants.map((grant) => (
            <div key={grant.id} className={styles.accessItem}>
              <div className={styles.userInfo}>
                <strong>{grant.user.full_name}</strong>
                <span className={styles.username}>({grant.user.username})</span>
              </div>
              
              <div className={styles.accessDetails}>
                <span className={getAccessTypeBadgeClass(grant.access_type)}>
                  {getAccessTypeLabel(grant.access_type)}
                </span>
                
                {grant.expires_at && (
                  <span className={styles.expires}>
                    Expires: {new Date(grant.expires_at).toLocaleDateString()}
                  </span>
                )}
              </div>

              <button
                className={styles.revokeButton}
                onClick={() => handleRevokeAccess(grant.user_id)}
                disabled={loading}
              >
                Revoke
              </button>
            </div>
          ))
        )}
      </div>

      {/* Grant Access Modal */}
      {showGrantModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h4>Grant Survey Access</h4>
              <button 
                className={styles.closeButton}
                onClick={() => setShowGrantModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleGrantAccess} className={styles.grantForm}>
              <div className={styles.formGroup}>
                <label htmlFor="user_id">Select User:</label>
                <select
                  id="user_id"
                  value={grantForm.user_id}
                  onChange={(e) => setGrantForm({...grantForm, user_id: e.target.value})}
                  required
                >
                  <option value="">Choose a user...</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.full_name} ({user.username})
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="access_type">Access Type:</label>
                <select
                  id="access_type"
                  value={grantForm.access_type}
                  onChange={(e) => setGrantForm({...grantForm, access_type: e.target.value})}
                >
                  <option value="respond">Respond Only</option>
                  <option value="view">View Results</option>
                  <option value="full">Full Access</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="expires_at">Expiration Date (optional):</label>
                <input
                  type="datetime-local"
                  id="expires_at"
                  value={grantForm.expires_at}
                  onChange={(e) => setGrantForm({...grantForm, expires_at: e.target.value})}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="notes">Notes (optional):</label>
                <textarea
                  id="notes"
                  value={grantForm.notes}
                  onChange={(e) => setGrantForm({...grantForm, notes: e.target.value})}
                  placeholder="Additional notes about this access grant..."
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setShowGrantModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={loading}
                >
                  {loading ? 'Granting...' : 'Grant Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SurveyAccess;