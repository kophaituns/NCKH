import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SurveyService from '../../../api/services/survey.service';
import TemplateService from '../../../api/services/template.service';
import Loader from '../../../components/common/Loader/Loader';
import StatusBadge from '../../../components/UI/StatusBadge';
import { useToast } from '../../../contexts/ToastContext';
import styles from './SurveyEditor.module.scss';

const SurveyEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const isEditMode = Boolean(id && id !== 'new');

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    template_id: '',
    start_date: '',
    end_date: '',
    status: 'draft',
  });

  useEffect(() => {
    fetchTemplates();
    if (isEditMode) {
      fetchSurvey();
    }
  }, [id]);

  const fetchTemplates = async () => {
    try {
      const data = await TemplateService.getAll();
      // Ensure data is always an array
      setTemplates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      setTemplates([]); // Set empty array on error
      showToast('Failed to fetch templates', 'error');
    }
  };

  const fetchSurvey = async () => {
    try {
      setLoading(true);
      const data = await SurveyService.getById(id);
      setFormData({
        title: data.title,
        description: data.description || '',
        template_id: data.template_id || '',
        start_date: data.start_date ? data.start_date.split('T')[0] : '',
        end_date: data.end_date ? data.end_date.split('T')[0] : '',
        status: data.status,
      });
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to fetch survey', 'error');
      navigate('/surveys');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      showToast('Survey title is required', 'error');
      return;
    }
    
    if (!formData.template_id) {
      showToast('Please select a template', 'error');
      return;
    }

    try {
      setSaving(true);
      if (isEditMode) {
        await SurveyService.update(id, formData);
        showToast('Survey updated successfully', 'success');
      } else {
        await SurveyService.create(formData);
        showToast('Survey created successfully', 'success');
        navigate('/surveys');
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to save survey', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) return <Loader />;

  return (
    <div className={styles.surveyEditor}>
      <div className={styles.header}>
        <button onClick={() => navigate('/surveys')} className={styles.backButton}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Surveys
        </button>
      </div>

      <div className={styles.content}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>{isEditMode ? 'Edit Survey' : 'Create New Survey'}</h2>
              {isEditMode && <StatusBadge status={formData.status} />}
            </div>

            <div className={styles.formGroup}>
              <label>Survey Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter survey title"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter survey description"
                rows={4}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Select Template *</label>
              <select
                name="template_id"
                value={formData.template_id}
                onChange={handleChange}
                required
              >
                <option value="">Choose a template...</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.title}
                  </option>
                ))}
              </select>
              {templates.length === 0 && (
                <p className={styles.hint}>No templates available. Create a template first.</p>
              )}
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Start Date</label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label>End Date</label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  min={formData.start_date}
                />
              </div>
            </div>

            <div className={styles.actions}>
              <button 
                type="button"
                onClick={() => navigate('/surveys')}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={saving}
                className={styles.saveButton}
              >
                {saving ? 'Saving...' : isEditMode ? 'Update Survey' : 'Create Survey'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SurveyEditor;
