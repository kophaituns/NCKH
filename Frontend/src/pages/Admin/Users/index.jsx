import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../../contexts/ToastContext';
import UserService from '../../../api/services/user.service';
import Loader from '../../../components/common/Loader/Loader';
import Pagination from '../../../components/common/Pagination/Pagination';
import Modal from '../../../components/common/Modal/Modal';
import ConfirmModal from '../../../components/UI/ConfirmModal';
import styles from './UserManagement.module.scss';

const UserManagement = () => {
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'user'
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await UserService.getAll();
      // Ensure users is always an array
      const usersData = Array.isArray(response.data) ? response.data :
        (response.data?.users && Array.isArray(response.data.users)) ? response.data.users : [];
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      showError('Failed to load users');
      setUsers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const filterUsers = useCallback(() => {
    let filtered = [...users];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page on filter change
  }, [users, searchTerm, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    filterUsers();
  }, [filterUsers]);

  const handleAddUser = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      full_name: '',
      role: 'user'
    });
    setShowAddModal(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '', // Don't pre-fill password
      full_name: user.full_name,
      role: user.role
    });
    setShowEditModal(true);
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const submitAddUser = async () => {
    if (!formData.username || !formData.email || !formData.password || !formData.full_name) {
      showError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await UserService.create(formData);
      showSuccess('User created successfully');
      setShowAddModal(false);
      fetchUsers();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitEditUser = async () => {
    if (!formData.username || !formData.email || !formData.full_name) {
      showError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData = {
        username: formData.username,
        email: formData.email,
        full_name: formData.full_name,
        role: formData.role
      };

      // Only include password if it's been changed
      if (formData.password) {
        updateData.password = formData.password;
      }

      await UserService.update(selectedUser.id, updateData);
      showSuccess('User updated successfully');
      setShowEditModal(false);
      fetchUsers();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteUser = async () => {
    setIsSubmitting(true);
    try {
      await UserService.delete(selectedUser.id);
      showSuccess('User deleted successfully');
      setShowDeleteModal(false);
      fetchUsers();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to delete user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin': return styles.roleAdmin;
      case 'creator': return styles.roleCreator;
      case 'user': return styles.roleUser;
      default: return styles.roleUser;
    }
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  if (loading) {
    return <Loader fullScreen message="Loading users..." />;
  }

  return (
    <div className={styles.userManagement}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>User Management</h1>
          <p className={styles.subtitle}>Manage system users and their roles</p>
        </div>
        <button className={styles.addButton} onClick={handleAddUser}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 5v10M5 10h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
            <path d="M14 14l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, email, or username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
            style={{ paddingLeft: '4rem' }}
          />
        </div>

        <div className={styles.roleFilter}>
          <label>Role:</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className={styles.select}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="creator">Creator</option>
            <option value="user">User</option>
          </select>
        </div>

        <div className={styles.resultCount}>
          {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} found
        </div>
      </div>

      {/* Users Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Username</th>
              <th>Role</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.length === 0 ? (
              <tr>
                <td colSpan="7" className={styles.emptyState}>
                  <div className={styles.emptyIcon}>👥</div>
                  <p>No users found</p>
                </td>
              </tr>
            ) : (
              currentUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td className={styles.nameCell}>{user.full_name}</td>
                  <td>{user.email}</td>
                  <td>{user.username}</td>
                  <td>
                    <span className={`${styles.roleBadge} ${getRoleBadgeClass(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.editButton}
                        onClick={() => handleEditUser(user)}
                        title="Edit user"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M11 2l3 3-8 8H3v-3l8-8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDeleteUser(user)}
                        title="Delete user"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M3 4h10M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M6 7v4M10 7v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredUsers.length > itemsPerPage && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredUsers.length}
          itemsPerPage={itemsPerPage}
        />
      )}

      {/* Add User Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New User"
        size="medium"
      >
        <div className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label>Full Name *</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="John Doe"
              disabled={isSubmitting}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Username *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="johndoe"
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Min. 6 characters"
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                disabled={isSubmitting}
              >
                <option value="user">User</option>
                <option value="creator">Creator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div className={styles.modalActions}>
            <button
              className={styles.cancelButton}
              onClick={() => setShowAddModal(false)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              className={styles.submitButton}
              onClick={submitAddUser}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit User"
        size="medium"
      >
        <div className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label>Full Name *</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              disabled={isSubmitting}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Username *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Password (leave blank to keep current)</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter new password"
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                disabled={isSubmitting}
              >
                <option value="user">User</option>
                <option value="creator">Creator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div className={styles.modalActions}>
            <button
              className={styles.cancelButton}
              onClick={() => setShowEditModal(false)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              className={styles.submitButton}
              onClick={submitEditUser}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update User'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteUser}
        title="Delete User"
        message={`Are you sure you want to delete ${selectedUser?.full_name}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default UserManagement;
