import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import Header from './components/Header/index.jsx';
import Sidebar from './components/Sidebar/index.jsx';
import styles from './DefaultLayout.module.scss';

function DefaultLayout({ children }) {
  return (
    <div className={styles.layout}>
      <Header />
      <Container fluid className={styles.container}>
        <Row className={styles.row}>
          {/* Desktop Sidebar - Hidden on mobile */}
          <Col lg={3} className={`d-none d-lg-block ${styles.sidebarCol}`}>
            <Sidebar />
          </Col>

          {/* Main Content */}
          <Col lg={9} xs={12} className={styles.mainCol}>
            <main className={styles.main}>
              {children}
            </main>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default DefaultLayout;
