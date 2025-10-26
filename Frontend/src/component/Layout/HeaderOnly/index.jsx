import React from 'react';
import { Container } from 'react-bootstrap';
import styles from './HeaderOnly.module.scss';

function HeaderOnly({ children }) {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <Container className={styles.headerContent}>
          <div className={styles.brand}>AllMTags</div>
        </Container>
      </header>

      <main className={styles.main}>
        {children}
      </main>

      <footer className={styles.footer}>
        <Container>
          <p className={styles.copyright}>
            &copy; 2025 AllMTags. All rights reserved.
          </p>
        </Container>
      </footer>
    </div>
  );
}

export default HeaderOnly;
