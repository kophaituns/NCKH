import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ResponseService from '../../../api/services/response.service';
import styles from './ResponseStats.module.scss';

/**
 * Response Statistics Page
 * Shows survey response stats (started, completed, abandoned)
 * For survey creators/admins only
 */
const ResponseStats = () => {
  const { surveyId } = useParams();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadStats();
    
    let interval = null;
    if (autoRefresh) {
      interval = setInterval(() => {
        loadStats();
      }, 10000); // Refresh every 10 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [surveyId, autoRefresh]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await ResponseService.getResponseStats(surveyId);
      if (response.ok) {
        setStats(response.data);
        setError(null);
      } else {
        setError(response.message || 'Failed to load statistics');
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      setError(error.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const getProgress = (value, total) => {
    return total > 0 ? (value / total) * 100 : 0;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Response Statistics</h1>
        <div className={styles.controls}>
          <label className={styles.refreshToggle}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh
          </label>
          <button className={styles.refreshButton} onClick={loadStats}>
            ↻ Refresh
          </button>
        </div>
      </div>

      <div className={styles.statsGrid}>
        {/* Total Responses */}
        <div className={styles.statCard}>
          <div className={styles.cardTitle}>Total Responses</div>
          <div className={styles.cardValue}>{stats.total}</div>
          <div className={styles.cardSubtitle}>All responses combined</div>
        </div>

        {/* Completed */}
        <div className={styles.statCard + ' ' + styles.completed}>
          <div className={styles.cardTitle}>✓ Completed</div>
          <div className={styles.cardValue}>{stats.completed}</div>
          <div className={styles.cardProgress}>
            <div
              className={styles.progressBar}
              style={{ width: `${getProgress(stats.completed, stats.total)}%` }}
            ></div>
          </div>
        </div>

        {/* Started */}
        <div className={styles.statCard + ' ' + styles.started}>
          <div className={styles.cardTitle}>📝 In Progress</div>
          <div className={styles.cardValue}>{stats.started}</div>
          <div className={styles.cardSubtitle}>Started but not submitted</div>
        </div>

        {/* Abandoned */}
        <div className={styles.statCard + ' ' + styles.abandoned}>
          <div className={styles.cardTitle}>⚠ Abandoned</div>
          <div className={styles.cardValue}>{stats.abandoned}</div>
          <div className={styles.cardSubtitle}>Inactive > 24 hours</div>
        </div>
      </div>

      {/* Completion Rate */}
      <div className={styles.completionCard}>
        <h3>Completion Rate</h3>
        <div className={styles.rateValue}>
          {isNaN(stats.completionRate) ? 0 : stats.completionRate}%
        </div>
        <div className={styles.rateBar}>
          <div
            className={styles.rateFill}
            style={{ width: `${isNaN(stats.completionRate) ? 0 : stats.completionRate}%` }}
          ></div>
        </div>
        <div className={styles.rateLabel}>
          {stats.completed + stats.abandoned > 0
            ? `${stats.completed} out of ${stats.completed + stats.abandoned} submitted responses`
            : 'No completed responses yet'}
        </div>
      </div>

      {/* Timeline Info */}
      <div className={styles.infoBox}>
        <h3>About Response Status</h3>
        <ul>
          <li>
            <strong>In Progress:</strong> Responses that were started but not yet submitted
          </li>
          <li>
            <strong>Completed:</strong> Responses that were successfully submitted
          </li>
          <li>
            <strong>Abandoned:</strong> Responses inactive for more than 24 hours are marked as abandoned
          </li>
          <li>
            <strong>Completion Rate:</strong> Percentage of (Completed) vs (Completed + Abandoned)
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ResponseStats;
