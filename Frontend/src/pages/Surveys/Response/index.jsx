import React from 'react';
import { default as SurveyResponsePageComponent } from '../../../component/Student/SurveyResponsePage.jsx';
import styles from './Response.module.scss';

function SurveyResponse() {
  return (
    <div className={styles.surveyResponse}>
      <SurveyResponsePageComponent />
    </div>
  );
}

export default SurveyResponse;
