import React from 'react';
import { default as CreateSurveyPageComponent } from '../../../../components/Admin/CreateSurveyPage.jsx';
import styles from './Create.module.scss';

function CreateSurvey() {
  return (
    <div className={styles.createSurvey}>
      <CreateSurveyPageComponent />
    </div>
  );
}

export default CreateSurvey;
