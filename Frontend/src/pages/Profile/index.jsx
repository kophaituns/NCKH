import React, { useEffect, useState } from 'react';
import AuthService from '../../api/services/auth.service';
import { useToast } from '../../contexts/ToastContext';
import styles from './Profile.module.scss';

const ProfilePage = () => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    role: '',
    bio: '',
    dateOfBirth: '',
    gender: '',
  });

  const [editData, setEditData] = useState({
    full_name: '',
    bio: '',
    dateOfBirth: '',
    gender: '',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await AuthService.getProfile();
        const user = res.data.user;

        const dateOfBirth = user.date_of_birth
          ? user.date_of_birth.slice(0, 10)
          : '';

        const baseProfile = {
          full_name: user.full_name || '',
          email: user.email || '',
          role: user.role || '',
          bio: user.bio || '',
          dateOfBirth,
          gender: user.gender || '',
        };

        setProfile(baseProfile);
        setEditData(baseProfile);
      } catch (error) {
        console.error(error);
        showError('Không tải được thông tin hồ sơ');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [showError]);

  const openEditModal = () => {
    setEditData(profile);
    setIsEditing(true);
  };

  const closeEditModal = () => {
    setIsEditing(false);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await AuthService.updateProfile({
        full_name: editData.full_name,
        bio: editData.bio,
        dateOfBirth: editData.dateOfBirth || null,
        gender: editData.gender || null,
      });

      setProfile(editData);
      showSuccess('Cập nhật hồ sơ thành công');
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      showError(
        error.response?.data?.message || 'Cập nhật hồ sơ thất bại'
      );
    } finally {
      setSaving(false);
    }
  };

  const initials =
    profile.full_name
      ?.split(' ')
      .filter(Boolean)
      .map((p) => p[0])
      .join('')
      .toUpperCase() || 'U';

  if (loading) {
    return (
      <div className={styles.profilePage}>
        <div className={styles.loading}>Đang tải hồ sơ...</div>
      </div>
    );
  }

  const displayGender =
    profile.gender === 'male'
      ? 'Male'
      : profile.gender === 'female'
      ? 'Female'
      : profile.gender === 'other'
      ? 'Other'
      : '--';

  return (
    <div className={styles.profilePage}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>My Profile</h1>
          <p className={styles.pageSubtitle}>
            Your account information and personal configuration.
          </p>
        </div>
      </div>

      <div className={styles.card}>
        {/* Header với avatar + info chính */}
        <div className={styles.cardHeader}>
          <div className={styles.avatarBlock}>
            <div className={styles.avatar}>{initials}</div>

            {/* Text + badge gộp chung một khối */}
            <div className={styles.textBlock}>
              <div className={styles.name}>{profile.full_name}</div>
              <div className={styles.email}>{profile.email}</div>

              <div className={styles.roleInline}>
                <span className={styles.roleBadge}>
                  {profile.role?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Grid thông tin */}
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <div className={styles.infoLabel}>Full Name</div>
            <div className={styles.infoValue}>{profile.full_name}</div>
          </div>

          <div className={styles.infoItem}>
            <div className={styles.infoLabel}>Email</div>
            <div className={styles.infoValue}>{profile.email}</div>
          </div>

          <div className={styles.infoItem}>
            <div className={styles.infoLabel}>Gender</div>
            <div className={styles.infoValue}>{displayGender}</div>
          </div>

          <div className={styles.infoItem}>
            <div className={styles.infoLabel}>Date of Birth</div>
            <div className={styles.infoValue}>
              {profile.dateOfBirth || '--'}
            </div>
          </div>

          <div className={styles.infoItemFull}>
            <div className={styles.infoLabel}>Bio</div>
            <div
              className={
                profile.bio
                  ? styles.infoValue
                  : styles.infoValuePlaceholder
              }
            >
              {profile.bio || 'Write something about yourself...'}
            </div>
          </div>
        </div>

        {/* ✅ Nút Edit Profile ở góc dưới bên phải card */}
        <div className={styles.cardActions}>
          <button
            type="button"
            className={styles.editButton}
            onClick={openEditModal}
          >
            Edit Profile
          </button>
        </div>
      </div>

      {/* Modal */}
      {isEditing && (
        <div
          className={styles.modalOverlay}
          onClick={closeEditModal}           // click nền xám để đóng
        >
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()} // chặn click bên trong
          >
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Edit Profile</h2>
              <button
                type="button"
                className={styles.modalClose}
                onClick={closeEditModal}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className={styles.form}>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="full_name"
                    value={editData.full_name}
                    onChange={handleEditChange}
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={editData.dateOfBirth || ''}
                    onChange={handleEditChange}
                  />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Gender</label>
                  <select
                    name="gender"
                    value={editData.gender || ''}
                    onChange={handleEditChange}
                  >
                    <option value="">-- Select --</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className={styles.field}>
                <label>Bio</label>
                <textarea
                  name="bio"
                  rows="4"
                  value={editData.bio}
                  onChange={handleEditChange}
                  placeholder="Write something about yourself..."
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={closeEditModal}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
