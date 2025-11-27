// src/components/Survey/SurveyAccessManager.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import UserService from '../../api/services/user.service';
import SurveyAccessService from '../../api/services/surveyAccess.service';
import { useToast } from '../../contexts/ToastContext';
import styles from './SurveyAccessManager.module.scss';

const SurveyAccessManager = ({ surveyId, onAccessChange }) => {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [grantingAccess, setGrantingAccess] = useState(false);
  const [accessForm, setAccessForm] = useState({
    user_id: '',
    access_type: 'respond',
    expires_at: '',
    notes: ''
  });
  const [currentAccess, setCurrentAccess] = useState([]);

  // Fetch users for access granting
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const result = await UserService.getAllUsers();
      setUsers(result.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch current survey access
  const fetchSurveyAccess = async () => {
    if (!surveyId) return;
    
    try {
      const access = await SurveyAccessService.getSurveyAccess(surveyId);
      setCurrentAccess(access);
    } catch (error) {
      console.error('Error fetching survey access:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchSurveyAccess();
  }, [surveyId]);

  const handleGrantAccess = async (e) => {
    e.preventDefault();
    
    if (!accessForm.user_id) {
      showToast('Please select a user', 'error');
      return;
    }

    try {
      setGrantingAccess(true);
      await SurveyAccessService.grantAccess(surveyId, accessForm.user_id, {
        access_type: accessForm.access_type,
        expires_at: accessForm.expires_at || null,
        notes: accessForm.notes
      });
      
      showToast('Access granted successfully', 'success');
      setAccessForm({
        user_id: '',
        access_type: 'respond',
        expires_at: '',
        notes: ''
      });
      
      fetchSurveyAccess();
      if (onAccessChange) onAccessChange();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to grant access', 'error');
    } finally {
      setGrantingAccess(false);
    }
  };

  const handleRevokeAccess = async (userId) => {
    try {
      await SurveyAccessService.revokeAccess(surveyId, userId);
      showToast('Access revoked successfully', 'success');
      fetchSurveyAccess();
      if (onAccessChange) onAccessChange();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to revoke access', 'error');
    }
  };

  if (!surveyId || surveyId === 'new') {
    return (
      <div className={styles.accessManager}>
        <h3>Survey Access Management</h3>
        <div className={styles.notice}>
          <h4>📝 Access Control</h4>
          <p>After creating this survey, you'll be able to:</p>
          <ul>
            <li>✅ Grant specific users access to view the survey</li>
            <li>✅ Allow users to respond to the survey</li>
            <li>✅ Set different access levels (View, Edit, Manage)</li>
            <li>✅ Set expiration dates for access</li>
            <li>✅ Add notes for each access grant</li>
          </ul>
          <p><strong>Create the survey first to unlock these features!</strong></p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.accessManager}>
      <h3>Survey Access Management</h3>
      
      {/* Grant Access Form */}
      <div className={styles.grantSection}>
        <h4>Grant Access to Users</h4>
        <form onSubmit={handleGrantAccess} className={styles.accessForm}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>User</label>
              <select 
                value={accessForm.user_id}
                onChange={(e) => setAccessForm({...accessForm, user_id: e.target.value})}
                required
              >
                <option value="">Select a user...</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.full_name || user.username} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Access Type</label>
              <select 
                value={accessForm.access_type}
                onChange={(e) => setAccessForm({...accessForm, access_type: e.target.value})}
              >
                <option value="respond">Respond Only</option>
                <option value="view">View Only</option>
                <option value="edit">View & Edit</option>
                <option value="manage">Full Management</option>
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Expires At (Optional)</label>
              <input
                type="datetime-local"
                value={accessForm.expires_at}
                onChange={(e) => setAccessForm({...accessForm, expires_at: e.target.value})}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Notes (Optional)</label>
              <input
                type="text"
                placeholder="Access notes..."
                value={accessForm.notes}
                onChange={(e) => setAccessForm({...accessForm, notes: e.target.value})}
              />
            </div>
          </div>

          <button type="submit" disabled={grantingAccess} className={styles.grantButton}>
            {grantingAccess ? 'Granting...' : 'Grant Access'}
          </button>
        </form>
      </div>

      {/* Current Access List */}
      <div className={styles.currentAccess}>
        <h4>Current Access Permissions</h4>
        {currentAccess.length === 0 ? (
          <p className={styles.noAccess}>No specific access granted. Survey creator has full access.</p>
        ) : (
          <div className={styles.accessList}>
            {currentAccess.map(access => (
              <div key={access.id} className={styles.accessItem}>
                <div className={styles.accessInfo}>
                  <div className={styles.userName}>
                    {access.User?.full_name || access.User?.username}
                  </div>
                  <div className={styles.accessDetails}>
                    <span className={`${styles.accessType} ${styles[access.access_type]}`}>
                      {access.access_type}
                    </span>
                    {access.expires_at && (
                      <span className={styles.expires}>
                        Expires: {new Date(access.expires_at).toLocaleDateString()}
                      </span>
                    )}
                    {access.notes && (
                      <span className={styles.notes}>{access.notes}</span>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => handleRevokeAccess(access.user_id)}
                  className={styles.revokeButton}
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

SurveyAccessManager.propTypes = {
  surveyId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onAccessChange: PropTypes.func
};

export default SurveyAccessManager;