import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TemplateService from '../../../api/services/template.service';
import Loader from '../../../components/common/Loader/Loader';
import Pagination from '../../../components/common/Pagination/Pagination';
import ConfirmModal from '../../../components/UI/ConfirmModal';
import { useToast } from '../../../contexts/ToastContext';
import styles from './TemplateList.module.scss';

const TemplateList = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await TemplateService.getAll();
      // Ensure data is always an array
      setTemplates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      setTemplates([]); // Set empty array on error
      showToast(error.response?.data?.message || 'Failed to fetch templates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;

    try {
      await TemplateService.delete(templateToDelete.id);
      showToast('Template deleted successfully', 'success');
      setShowDeleteModal(false);
      setTemplateToDelete(null);
      fetchTemplates();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete template', 'error');
    }
  };

  const openDeleteModal = (template) => {
    setTemplateToDelete(template);
    setShowDeleteModal(true);
  };

  const filteredTemplates = templates.filter(
    (template) =>
      template.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTemplates = filteredTemplates.slice(startIndex, startIndex + itemsPerPage);

  if (loading) return <Loader />;

  return (
    <div className={styles.templateList}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Survey Templates</h1>
          <p className={styles.subtitle}>Create and manage reusable survey templates</p>
        </div>
        <button 
          className={styles.createButton}
          onClick={() => navigate('/templates/new')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create Template
        </button>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className={styles.searchInput}
          />
        </div>
        <span className={styles.resultCount}>
          {filteredTemplates.length} {filteredTemplates.length === 1 ? 'template' : 'templates'} found
        </span>
      </div>

      {currentTemplates.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📋</div>
          <h3>No templates found</h3>
          <p>Create your first survey template to get started</p>
          <button 
            className={styles.emptyButton}
            onClick={() => navigate('/templates/new')}
          >
            Create Template
          </button>
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            {currentTemplates.map((template) => (
              <div key={template.id} className={styles.templateCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>{template.title}</h3>
                  <div className={styles.cardActions}>
                    <button
                      onClick={() => navigate(`/templates/${template.id}/edit`)}
                      className={styles.editButton}
                      title="Edit template"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => openDeleteModal(template)}
                      className={styles.deleteButton}
                      title="Delete template"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <p className={styles.cardDescription}>
                  {template.description || 'No description provided'}
                </p>
                
                <div className={styles.cardFooter}>
                  <span className={styles.questionCount}>
                    📝 {template.question_count || 0} questions
                  </span>
                  <span className={styles.createdDate}>
                    {new Date(template.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className={styles.paginationWrapper}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setTemplateToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Delete Template"
        message={`Are you sure you want to delete "${templateToDelete?.title}"? This action cannot be undone and will delete all associated questions.`}
        confirmText="Delete"
        confirmColor="danger"
      />
    </div>
  );
};

export default TemplateList;
