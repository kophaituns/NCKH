import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import WorkspaceService from '../../../api/services/workspace.service';
import { useToast } from '../../../contexts/ToastContext';
import Loader from '../../../components/common/Loader/Loader';
import styles from './WorkspaceList.module.scss';

const WorkspaceList = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState([]);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  // Fetch workspaces on mount
  const fetchWorkspaces = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await WorkspaceService.getMyWorkspaces();
      
      if (result.ok) {
        setWorkspaces(result.items || []);
      } else {
        // Check for forbidden access
        if (result.code === 'FORBIDDEN') {
          showToast('You do not have permission to access this workspace.', 'error');
          navigate('/403');
          return;
        }
        setError(result.error || 'Failed to load workspaces');
        setWorkspaces([]);
      }
    } catch (err) {
      console.error('[WorkspaceList] Error fetching workspaces:', err);
      // Check for 403 error
      if (err.response?.status === 403) {
        showToast('You do not have permission to access this workspace.', 'error');
        navigate('/403');
        return;
      }
      setError(err.message || 'Failed to load workspaces');
      setWorkspaces([]);
    } finally {
      setLoading(false);
    }
  }, [navigate, showToast]);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const handleCreateClick = () => {
    setFormData({ name: '', description: '' });
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setFormData({ name: '', description: '' });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showToast('Workspace name is required', 'error');
      return;
    }

    try {
      setCreating(true);
      const result = await WorkspaceService.createWorkspace({
        name: formData.name.trim(),
        description: formData.description.trim()
      });

      if (result.ok) {
        showToast('Workspace created successfully', 'success');
        handleCloseModal();
        await fetchWorkspaces(); // Refresh list
      } else {
        showToast(result.error || 'Failed to create workspace', 'error');
      }
    } catch (err) {
      console.error('[WorkspaceList] Error creating workspace:', err);
      showToast(err.response?.data?.message || 'Failed to create workspace', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenWorkspace = (workspaceId) => {
    navigate(`/workspaces/${workspaceId}`);
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className={styles.workspaceContainer}>
      <div className={styles.header}>
        <h1>Workspaces</h1>
        <button className={styles.createButton} onClick={handleCreateClick}>
          Create workspace
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {workspaces.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📦</div>
          <p>No workspaces found.</p>
          <button className={styles.createButton} onClick={handleCreateClick} style={{ marginTop: '1rem' }}>
            Create your first workspace
          </button>
        </div>
      ) : (
        <div className={styles.workspaceList}>
          {workspaces.map(workspace => (
            <div key={workspace.id} className={styles.workspaceCard}>
              <h3 className={styles.workspaceName}>{workspace.name}</h3>
              {workspace.description && (
                <p className={styles.workspaceDescription}>{workspace.description}</p>
              )}
              <div className={styles.workspaceMetadata}>
                {workspace.owner_id && (
                  <span className={styles.ownerInfo}>Owner: User #{workspace.owner_id}</span>
                )}
                {workspace.created_at && (
                  <span className={styles.workspaceDate}>
                    Created {new Date(workspace.created_at).toLocaleDateString()}
                  </span>
                )}
              </div>
              <button 
                className={styles.openButton}
                onClick={() => handleOpenWorkspace(workspace.id)}
              >
                Open
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Create workspace</h2>
              <button 
                className={styles.closeButton}
                onClick={handleCloseModal}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateWorkspace}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Workspace name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="Enter workspace name"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="description">Description (optional)</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Enter workspace description"
                />
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Create workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceList;
