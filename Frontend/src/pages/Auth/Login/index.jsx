import React from 'react';
import { default as LoginPageComponent } from '../../../../components/Common/LoginPage.jsx';
import styles from './Login.module.scss';

function Login() {
  return (
    <div className={styles.login}>
      <LoginPageComponent />
    </div>
  );
}

export default Login;
