import React from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { default as DashboardRouterComponent } from '../../component/Common/DashboardRouter.jsx';
import styles from './Dashboard.module.scss';

function Dashboard() {
  const { state } = useAuth();

  return (
    <div className={styles.dashboard}>
      <DashboardRouterComponent />
    </div>
  );
}

export default Dashboard;
