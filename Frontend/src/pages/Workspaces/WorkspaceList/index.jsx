import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import WorkspaceService from '../../../api/services/workspace.service';
import { useToast } from '../../../contexts/ToastContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import Loader from '../../../components/common/Loader/Loader';
import styles from './WorkspaceList.module.scss';

const WorkspaceList = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState([]);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedWorkspaces, setSelectedWorkspaces] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  // Fetch workspaces with pagination
  const fetchWorkspaces = useCallback(async (page = 1, search = '') => {
    try {
      setLoading(true);
      setError(null);
      const result = await WorkspaceService.getMyWorkspacesPaginated({
        page,
        limit: itemsPerPage,
        search
      });

      if (result.ok) {
        setWorkspaces(result.items || []);
        if (result.pagination) {
          setTotalPages(result.pagination.totalPages || 0);
          setTotalItems(result.pagination.total || 0);
        }
      } else {
        // Check for forbidden access
        if (result.code === 'FORBIDDEN') {
          showToast(t('forbidden_access') || 'You do not have permission to access this workspace.', 'error');
          navigate('/403');
          return;
        }
        setError(result.error || t('failed_load_workspaces') || 'Failed to load workspaces');
        setWorkspaces([]);
      }
    } catch (err) {
      console.error('[WorkspaceList] Error fetching workspaces:', err);
      // Check for 403 error
      if (err.response?.status === 403) {
        showToast(t('forbidden_access') || 'You do not have permission to access this workspace.', 'error');
        navigate('/403');
        return;
      }
      setError(err.message || t('failed_load_workspaces') || 'Failed to load workspaces');
      setWorkspaces([]);
    } finally {
      setLoading(false);
    }
  }, [navigate, showToast, itemsPerPage, t]);

  useEffect(() => {
    fetchWorkspaces(currentPage, searchTerm);
  }, [fetchWorkspaces, currentPage, searchTerm]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchWorkspaces(1, searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, fetchWorkspaces]);

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
      showToast(t('workspace_name_required') || 'Workspace name is required', 'error');
      return;
    }

    try {
      setCreating(true);
      const result = await WorkspaceService.createWorkspace({
        name: formData.name.trim(),
        description: formData.description.trim()
      });

      if (result.ok) {
        showToast(t('workspace_created_success') || 'Workspace created successfully', 'success');
        handleCloseModal();
        await fetchWorkspaces(); // Refresh list
      } else {
        showToast(result.error || t('failed_create_workspace') || 'Failed to create workspace', 'error');
      }
    } catch (err) {
      console.error('[WorkspaceList] Error creating workspace:', err);
      showToast(err.response?.data?.message || t('failed_create_workspace') || 'Failed to create workspace', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenWorkspace = (workspaceId) => {
    navigate(`/workspaces/${workspaceId}`);
  };

  // Selection handlers
  const handleWorkspaceSelect = (workspaceId, isSelected) => {
    const newSelected = new Set(selectedWorkspaces);
    if (isSelected) {
      newSelected.add(workspaceId);
    } else {
      newSelected.delete(workspaceId);
    }
    setSelectedWorkspaces(newSelected);
    setSelectAll(newSelected.size === workspaces.length);
  };

  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      const allIds = new Set(workspaces.map(ws => ws.id));
      setSelectedWorkspaces(allIds);
    } else {
      setSelectedWorkspaces(new Set());
    }
    setSelectAll(isSelected);
  };

  // Delete handlers
  const handleDeleteSelected = async () => {
    const selectedCount = selectedWorkspaces.size;
    if (selectedCount === 0) {
      showToast(t('select_workspaces_delete') || 'Please select workspaces to delete', 'error');
      return;
    }

    if (!window.confirm(t('delete_workspaces_confirm', { count: selectedCount }) || `Are you sure you want to delete ${selectedCount} workspace(s)?`)) {
      return;
    }

    try {
      setDeleting(true);
      const workspaceIds = Array.from(selectedWorkspaces);
      const result = await WorkspaceService.deleteMultipleWorkspaces(workspaceIds);

      if (result.ok) {
        showToast(t('workspaces_deleted_success', { count: result.deletedCount }) || `Successfully deleted ${result.deletedCount} workspace(s)`, 'success');
        setSelectedWorkspaces(new Set());
        setSelectAll(false);
        await fetchWorkspaces(currentPage, searchTerm);
      } else {
        showToast(result.error || t('failed_delete_workspaces') || 'Failed to delete workspaces', 'error');
      }
    } catch (error) {
      console.error('[WorkspaceList] Error deleting workspaces:', error);
      showToast(error.response?.data?.message || t('failed_delete_workspaces') || 'Failed to delete workspaces', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Pagination handlers
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Search handler
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className={styles.workspaceContainer}>
      <div className={styles.header}>
        <h1>{t('workspaces')}</h1>
        <div className={styles.headerActions}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder={t('search_workspaces') || "Search workspaces..."}
              value={searchTerm}
              onChange={handleSearchChange}
              className={styles.searchInput}
            />
          </div>
          <button className={styles.createButton} onClick={handleCreateClick}>
            {t('create_workspace')}
          </button>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {workspaces.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📦</div>
          <p>{t('no_workspaces_found') || "No workspaces found."}</p>
          <button className={styles.createButton} onClick={handleCreateClick} style={{ marginTop: '1rem' }}>
            {t('create_first_workspace') || "Create your first workspace"}
          </button>
        </div>
      ) : (
        <>
          {/* Bulk Actions */}
          <div className={styles.bulkActions}>
            <div className={styles.selectActions}>
              <label className={styles.selectAllLabel}>
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
                {t('select_all')} ({workspaces.length})
              </label>
              {selectedWorkspaces.size > 0 && (
                <span className={styles.selectedInfo}>
                  {selectedWorkspaces.size} {t('selected')}
                </span>
              )}
            </div>
            {selectedWorkspaces.size > 0 && (
              <div className={styles.bulkActionButtons}>
                <button
                  className={styles.deleteButton}
                  onClick={handleDeleteSelected}
                  disabled={deleting}
                >
                  {deleting ? t('deleting') : `${t('delete_selected')} (${selectedWorkspaces.size})`}
                </button>
              </div>
            )}
          </div>

          <div className={styles.workspaceList}>
            {workspaces.map(workspace => (
              <div
                key={workspace.id}
                className={`${styles.workspaceCard} ${selectedWorkspaces.has(workspace.id) ? styles.selected : ''}`}
              >
                <div className={styles.workspaceCardHeader}>
                  <input
                    type="checkbox"
                    checked={selectedWorkspaces.has(workspace.id)}
                    onChange={(e) => handleWorkspaceSelect(workspace.id, e.target.checked)}
                    className={styles.workspaceCheckbox}
                  />
                  <h3 className={styles.workspaceName}>{workspace.name}</h3>
                </div>
                {workspace.description && (
                  <p className={styles.workspaceDescription}>{workspace.description}</p>
                )}
                <div className={styles.workspaceMetadata}>
                  {workspace.owner_id && (
                    <span className={styles.ownerInfo}>{t('owner')}: User #{workspace.owner_id}</span>
                  )}
                  {workspace.created_at && (
                    <span className={styles.workspaceDate}>
                      {t('created')} {new Date(workspace.created_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <button
                  className={styles.openButton}
                  onClick={() => handleOpenWorkspace(workspace.id)}
                >
                  {t('open') || "Open"}
                </button>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <div className={styles.paginationInfo}>
                {t('showing')} {((currentPage - 1) * itemsPerPage) + 1} {t('to')} {Math.min(currentPage * itemsPerPage, totalItems)} {t('of')} {totalItems} {t('workspaces')}
              </div>
              <div className={styles.paginationControls}>
                <button
                  className={styles.pageButton}
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  {t('previous') || "Previous"}
                </button>

                {[...Array(totalPages)].map((_, index) => {
                  const pageNumber = index + 1;
                  const isCurrentPage = pageNumber === currentPage;
                  const showPage = pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 2 && pageNumber <= currentPage + 2);

                  if (!showPage) {
                    if (pageNumber === currentPage - 3 || pageNumber === currentPage + 3) {
                      return <span key={pageNumber} className={styles.pageDots}>...</span>;
                    }
                    return null;
                  }

                  return (
                    <button
                      key={pageNumber}
                      className={`${styles.pageButton} ${isCurrentPage ? styles.active : ''}`}
                      onClick={() => handlePageChange(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  );
                })}

                <button
                  className={styles.pageButton}
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  {t('next') || "Next"}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{t('create_workspace')}</h2>
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
                <label htmlFor="name">{t('workspace_name')}</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder={t('enter_workspace_name') || "Enter workspace name"}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="description">{t('description')} ({t('optional') || "optional"})</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder={t('enter_workspace_desc') || "Enter workspace description"}
                />
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={handleCloseModal}
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={creating}
                >
                  {creating ? t('creating') : t('create_workspace')}
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
