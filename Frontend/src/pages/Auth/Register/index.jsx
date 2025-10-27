import React from 'react';
import { default as SignUpPageComponent } from '../../../component/Common/SignUpPage.jsx';
import styles from './Register.module.scss';

function Register() {
  return (
    <div className={styles.register}>
      <SignUpPageComponent />
    </div>
  );
}

export default Register;
