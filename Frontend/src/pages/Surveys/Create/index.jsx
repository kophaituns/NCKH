import React from 'react';
import { default as CreateSurveyPageComponent } from '../../../component/Admin/CreateSurveyPage.jsx';
import styles from './Create.module.scss';

function CreateSurvey() {
  return (
    <div className={styles.createSurvey}>
      <CreateSurveyPageComponent />
    </div>
  );
}

export default CreateSurvey;
