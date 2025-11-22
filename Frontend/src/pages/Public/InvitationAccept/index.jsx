import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CollectorService from '../../../api/services/collector.service';
import styles from './InvitationAccept.module.scss';

/**
 * Invitation Acceptance Page
 * Allows users to accept survey invitations
 */
const InvitationAccept = () => {
  const { inviteToken } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [invitationData, setInvitationData] = useState(null);

  useEffect(() => {
    acceptInvitation();
  }, [inviteToken]);

  const acceptInvitation = async () => {
    try {
      setLoading(true);
      const response = await CollectorService.acceptInvitation(inviteToken);

      if (response.ok) {
        setSuccess(true);
        setInvitationData(response.data);

        // Redirect to survey after 2 seconds
        setTimeout(() => {
          if (response.data.survey_id && response.data.collector_token) {
            navigate(`/survey/${response.data.collector_token}`);
          } else {
            navigate('/');
          }
        }, 2000);
      } else {
        setError(response.message || 'Failed to accept invitation');
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      setError(error.message || 'An error occurred while accepting the invitation');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.loader}></div>
          <p>Processing your invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContent}>
          <div className={styles.errorIcon}>❌</div>
          <h2>Invalid Invitation</h2>
          <p>{error}</p>
          <div className={styles.actions}>
            <button className={styles.button} onClick={() => navigate('/')}>
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.successContent}>
          <div className={styles.successIcon}>✓</div>
          <h2>Invitation Accepted!</h2>
          <p>You have successfully accepted the survey invitation.</p>
          {invitationData?.survey_name && (
            <p className={styles.surveyName}>
              Survey: <strong>{invitationData.survey_name}</strong>
            </p>
          )}
          <p className={styles.redirect}>
            Redirecting you to the survey in a moment...
          </p>
          <div className={styles.actions}>
            <button
              className={styles.button}
              onClick={() => {
                if (invitationData?.survey_id && invitationData?.collector_token) {
                  navigate(`/survey/${invitationData.collector_token}`);
                }
              }}
            >
              Go to Survey Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default InvitationAccept;
