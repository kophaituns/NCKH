import React from 'react';
import { default as AnalyticsPageComponent } from '../../component/Teacher/AnalyticsPage.jsx';
import styles from './Analytics.module.scss';

function Analytics() {
  return (
    <div className={styles.analytics}>
      <AnalyticsPageComponent />
    </div>
  );
}

export default Analytics;
