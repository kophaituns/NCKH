import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import CollectorForm from './CollectorForm';
import CollectorList from './CollectorList';
import ConfirmModal from '../../../components/UI/ConfirmModal';
import styles from './CollectorManager.module.scss';

const CollectorManager = () => {
  const { surveyId } = useParams();
  const [survey, setSurvey] = useState(null);
  const [collectors, setCollectors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Delete collector modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [collectorToDelete, setCollectorToDelete] = useState(null);

  useEffect(() => {
    loadSurveyAndCollectors();
  }, [surveyId]);

  const loadSurveyAndCollectors = async () => {
    try {
      setLoading(true);
      // Load survey
      // const surveyResponse = await SurveyService.getSurvey(surveyId);
      // setSurvey(surveyResponse.data);

      // Load collectors
      // const collectorsResponse = await CollectorService.getCollectors(surveyId);
      // setCollectors(collectorsResponse.data);
    } catch (error) {
      setError(error.message || 'Failed to load survey or collectors');
    } finally {
      setLoading(false);
    }
  };

  const handleCollectorCreated = () => {
    setShowForm(false);
    loadSurveyAndCollectors();
  };

  const handleDeleteCollector = (collectorId) => {
    setCollectorToDelete(collectorId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!collectorToDelete) return;

    try {
      // await CollectorService.deleteCollector(collectorToDelete);
      setCollectors(collectors.filter(c => c.id !== collectorToDelete));
    } catch (error) {
      setError(error.message || 'Failed to delete collector');
    } finally {
      setShowDeleteModal(false);
      setCollectorToDelete(null);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!survey) {
    return (
      <div className={styles.error}>
        Survey not found
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Survey Collectors</h1>
        <p>Manage how people access and respond to your survey</p>
      </div>

      {error && <div className={styles.errorAlert}>{error}</div>}

      <div className={styles.content}>
        {showForm ? (
          <>
            <CollectorForm
              survey={survey}
              onSuccess={handleCollectorCreated}
              onCancel={() => setShowForm(false)}
            />
          </>
        ) : (
          <>
            <div className={styles.actionsBar}>
              <button
                className={styles.createButton}
                onClick={() => setShowForm(true)}
              >
                + Create New Collector
              </button>
            </div>

            {collectors.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📋</div>
                <h2>No collectors yet</h2>
                <p>Create your first collector to share this survey</p>
                <button
                  className={styles.createButton}
                  onClick={() => setShowForm(true)}
                >
                  Create Collector
                </button>
              </div>
            ) : (
              <CollectorList
                collectors={collectors}
                onDelete={handleDeleteCollector}
              />
            )}
          </>
        )}

        <ConfirmModal
          isOpen={showDeleteModal}
          title="Delete Collector"
          message="Are you sure you want to delete this collector?"
          confirmText="Delete"
          cancelText="Cancel"
          isDangerous
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setCollectorToDelete(null);
          }}
        />
      </div>
    </div>
  );
};

export default CollectorManager;
