import React from 'react';
import { default as SurveyManagementComponent } from '../../../../components/Common/SurveyManagement.jsx';
import styles from './List.module.scss';

function SurveysList() {
  return (
    <div className={styles.surveysList}>
      <SurveyManagementComponent />
    </div>
  );
}

export default SurveysList;
