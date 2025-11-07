
import { default as ManageUsersPageComponent } from '../../../components/pages/ManageUsersPage.jsx';
import styles from './ManageUsers.module.scss';

function ManageUsers() {
  return (
    <div className={styles.manageUsers}>
      <ManageUsersPageComponent />
    </div>
  );
}

export default ManageUsers;
