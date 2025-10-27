import React from 'react';
import Header from './components/Header/index.jsx';
import Sidebar from './components/Sidebar/index.jsx';
import styles from './DefaultLayout.module.scss';

function DefaultLayout({ children }) {
  return (
    <div className={styles.layout}>
      <Header />
      <div className={styles.container}>
        <div className={styles.row}>
          {/* Desktop Sidebar - Hidden on mobile */}
          <div className={`${styles.sidebarCol}`}>
            <Sidebar />
          </div>

          {/* Main Content */}
          <div className={styles.mainCol}>
            <main className={styles.main}>
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DefaultLayout;
