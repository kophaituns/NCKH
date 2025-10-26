import React from 'react';
import { default as LandingPageComponent } from '../../../components/Common/LandingPage.jsx';
import styles from './Landing.module.scss';

function Landing() {
  return (
    <div className={styles.landing}>
      <LandingPageComponent />
    </div>
  );
}

export default Landing;
