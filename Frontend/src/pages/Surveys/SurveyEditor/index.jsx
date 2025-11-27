import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SurveyService from '../../../api/services/survey.service';
import TemplateService from '../../../api/services/template.service';
import WorkspaceService from '../../../api/services/workspace.service';
import InviteService from '../../../api/services/invite.service';
import Loader from '../../../components/common/Loader/Loader';
import StatusBadge from '../../../components/UI/StatusBadge';
import SurveyAccessControl from '../../../components/SurveyAccessControl';
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
  const [workspaces, setWorkspaces] = useState([]);
  const [, setSurvey] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    template_id: '',
    start_date: '',
    end_date: '',
    status: 'draft',
    // Simple Access Control
    access_type: 'public',
    require_login: false,
    allow_anonymous: true,
    workspace_id: null,
    inviteEmails: ''
  });

  const fetchTemplates = useCallback(async () => {
    try {
      const result = await TemplateService.getAll();
      // TemplateService.getAll() returns { templates: [], pagination: null }
      const templatesData = result.templates || [];
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error fetching templates:', error);
      setTemplates([]); // Set empty array on error
      showToast('Failed to fetch templates', 'error');
    }
  }, [showToast]);

  const fetchWorkspaces = useCallback(async () => {
    try {
      const result = await WorkspaceService.getMyWorkspaces();
      // WorkspaceService returns { ok: boolean, items: [], total: number }
      const workspacesData = result.items || [];
      setWorkspaces(workspacesData);
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      setWorkspaces([]);
      // Don't show error toast for workspaces since it's optional
      console.log('Workspaces unavailable - user can still create personal surveys');
    }
  }, []);

  const fetchSurvey = useCallback(async () => {
    if (!id || id === 'new') return;

    try {
      setLoading(true);
      const data = await SurveyService.getById(id);
      setSurvey(data);
      setFormData({
        title: data.title,
        description: data.description || '',
        template_id: data.template_id || '',
        start_date: data.start_date ? data.start_date.split('T')[0] : '',
        end_date: data.end_date ? data.end_date.split('T')[0] : '',
        status: data.status,
        // Access Control  
        access_type: data.access_type || 'public',
        require_login: data.require_login || false,
        allow_anonymous: data.allow_anonymous !== undefined ? data.allow_anonymous : true,
        workspace_id: data.workspace_id || null,
      });
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to fetch survey', 'error');
      navigate('/surveys');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showToast]);

  useEffect(() => {
    fetchTemplates();
    fetchWorkspaces();
  }, [fetchTemplates, fetchWorkspaces]);

  useEffect(() => {
    if (isEditMode) {
      fetchSurvey();
    }
  }, [isEditMode, fetchSurvey]);

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
        const updatedSurvey = await SurveyService.update(id, formData);
        setSurvey(updatedSurvey);
        showToast('Survey updated successfully', 'success');
      } else {
        const newSurvey = await SurveyService.create(formData);
        setSurvey(newSurvey);

        // Send invites if private survey with emails
        if (formData.access_type === 'private' && formData.inviteEmails) {
          try {
            const emails = formData.inviteEmails
              .split('\n')
              .map(e => e.trim())
              .filter(e => e.length > 0);

            if (emails.length > 0) {
              await InviteService.createInvites(newSurvey.id, emails);
              showToast(`Survey created and ${emails.length} invites sent!`, 'success');
            } else {
              showToast('Survey created successfully', 'success');
            }
          } catch (inviteError) {
            console.error('Failed to send invites:', inviteError);
            showToast('Survey created but failed to send some invites', 'warning');
          }
        } else {
          showToast('Survey created successfully', 'success');
        }

        // Navigate to edit mode to allow access management
        navigate(`/surveys/${newSurvey.id}/edit`);
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

            {/* Survey Access Control - Integrated */}
            <div className={styles.accessControlSection}>
              <h3>🔐 Survey Access Control</h3>
              <p>Configure who can access and respond to your survey</p>

              <SurveyAccessControl
                surveyId={isEditMode ? id : null}
                value={{
                  access_type: formData.access_type,
                  require_login: formData.require_login,
                  allow_anonymous: formData.allow_anonymous,
                  workspace_id: formData.workspace_id
                }}
                onChange={(accessConfig) => {
                  setFormData(prev => ({
                    ...prev,
                    ...accessConfig
                  }));
                }}
                availableWorkspaces={workspaces}
                compact={true}
              />
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
