import React, { useState, useEffect } from 'react';
import styles from './CollectorForm.module.scss';

/**
 * Collector Form Component
 * Supports creating collectors for multiple sources: public, workspace, invited
 */
const CollectorForm = ({ survey, onSuccess, onCancel }) => {
  const [collectorType, setCollectorType] = useState('public'); // public | workspace | invited
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    accessLevel: 'public', // public | authenticated | workspace_members
    permissionMode: 'view_only', // view_only | can_respond
    expiresAt: '',
    metadata: {}
  });
  
  const [invitedUsers, setInvitedUsers] = useState([]);
  const [emailList, setEmailList] = useState('');
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load workspace members if needed
  useEffect(() => {
    if (collectorType === 'workspace' || collectorType === 'invited') {
      loadWorkspaceMembers();
    }
  }, [collectorType]);

  const loadWorkspaceMembers = async () => {
    // This would call your API to get workspace members
    // For now, using placeholder
    try {
      // const response = await WorkspaceService.getMembers(survey.workspace_id);
      // setWorkspaceMembers(response.data);
    } catch (error) {
      console.error('Error loading workspace members:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleMemberToggle = (userId) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== userId));
    } else {
      setSelectedMembers([...selectedMembers, userId]);
    }
  };

  const parseEmails = (text) => {
    return text
      .split(/[,\n]/)
      .map(email => email.trim())
      .filter(email => email && email.includes('@'));
  };

  const handleAddEmails = () => {
    const emails = parseEmails(emailList);
    setInvitedUsers([...invitedUsers, ...emails]);
    setEmailList('');
  };

  const removeInvitedUser = (email) => {
    setInvitedUsers(invitedUsers.filter(e => e !== email));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let payload = {
        survey_id: survey.id,
        name: formData.name,
        description: formData.description,
        type: collectorType,
        is_active: true,
        metadata: formData.metadata
      };

      if (collectorType === 'public') {
        payload.access_level = 'public';
      } else if (collectorType === 'workspace') {
        payload.access_level = 'workspace_members';
        payload.workspace_id = survey.workspace_id;
      } else if (collectorType === 'invited') {
        payload.access_level = 'authenticated';
        payload.permission_mode = 'view_only';
        payload.target_user_ids = selectedMembers;
      }

      // Call API to create collector
      // const response = await CollectorService.createCollector(payload);

      setSuccess('Collector created successfully!');
      setFormData({
        name: '',
        description: '',
        accessLevel: 'public',
        permissionMode: 'view_only',
        expiresAt: '',
        metadata: {}
      });
      setSelectedMembers([]);
      setInvitedUsers([]);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      setError(error.message || 'Failed to create collector');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.collectorForm}>
      <h2>Create Survey Collector</h2>
      
      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <fieldset>
          <legend>Basic Information</legend>
          
          <div className={styles.formGroup}>
            <label>Collector Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Email Campaign Q4"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe how this collector will be used"
              rows={3}
            />
          </div>
        </fieldset>

        {/* Collector Type */}
        <fieldset>
          <legend>Collector Type</legend>
          
          <div className={styles.typeSelector}>
            <label className={styles.typeOption}>
              <input
                type="radio"
                value="public"
                checked={collectorType === 'public'}
                onChange={(e) => setCollectorType(e.target.value)}
              />
              <span>
                <strong>Public Link</strong>
                <p>Share via link - anyone can respond</p>
              </span>
            </label>

            <label className={styles.typeOption}>
              <input
                type="radio"
                value="workspace"
                checked={collectorType === 'workspace'}
                onChange={(e) => setCollectorType(e.target.value)}
              />
              <span>
                <strong>Workspace Members</strong>
                <p>Restrict to your workspace members</p>
              </span>
            </label>

            <label className={styles.typeOption}>
              <input
                type="radio"
                value="invited"
                checked={collectorType === 'invited'}
                onChange={(e) => setCollectorType(e.target.value)}
              />
              <span>
                <strong>Invited Users</strong>
                <p>Invite specific people via email</p>
              </span>
            </label>
          </div>
        </fieldset>

        {/* Workspace Members */}
        {collectorType === 'workspace' && (
          <fieldset>
            <legend>Workspace Members</legend>
            <div className={styles.membersList}>
              {workspaceMembers.length === 0 ? (
                <p>No workspace members available</p>
              ) : (
                workspaceMembers.map(member => (
                  <label key={member.id} className={styles.memberItem}>
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(member.id)}
                      onChange={() => handleMemberToggle(member.id)}
                    />
                    <span>{member.name} ({member.email})</span>
                  </label>
                ))
              )}
            </div>
          </fieldset>
        )}

        {/* Invited Users */}
        {collectorType === 'invited' && (
          <fieldset>
            <legend>Invite Users</legend>
            
            <div className={styles.formGroup}>
              <label>Paste Emails (comma or newline separated)</label>
              <textarea
                value={emailList}
                onChange={(e) => setEmailList(e.target.value)}
                placeholder="user1@example.com, user2@example.com"
                rows={4}
              />
              <button
                type="button"
                onClick={handleAddEmails}
                className={styles.addButton}
              >
                Add Emails
              </button>
            </div>

            {invitedUsers.length > 0 && (
              <div className={styles.invitedList}>
                <h4>Invited Users ({invitedUsers.length})</h4>
                {invitedUsers.map(email => (
                  <div key={email} className={styles.invitedItem}>
                    <span>{email}</span>
                    <button
                      type="button"
                      onClick={() => removeInvitedUser(email)}
                      className={styles.removeButton}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {collectorType === 'invited' && invitedUsers.length === 0 && (
              <div className={styles.warning}>
                Add at least one email address to create an invited collector
              </div>
            )}
          </fieldset>
        )}

        {/* Expiration */}
        <fieldset>
          <legend>Expiration (Optional)</legend>
          <div className={styles.formGroup}>
            <label>Expires At</label>
            <input
              type="datetime-local"
              name="expiresAt"
              value={formData.expiresAt}
              onChange={handleInputChange}
            />
            <small>Leave empty for no expiration</small>
          </div>
        </fieldset>

        {/* Form Actions */}
        <div className={styles.formActions}>
          <button
            type="submit"
            disabled={
              loading ||
              !formData.name ||
              (collectorType === 'invited' && invitedUsers.length === 0)
            }
            className={styles.submitButton}
          >
            {loading ? 'Creating...' : 'Create Collector'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className={styles.cancelButton}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CollectorForm;
