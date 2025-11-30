import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import UserService from '../../../api/services/user.service';
import Card from '../../../components/UI/Card';
import Button from '../../../components/UI/Button';
import Input from '../../../components/UI/Input';
import Loader from '../../../components/common/Loader/Loader';
import styles from './Profile.module.scss';

const Profile = () => {
    const { state } = useAuth();
    const { showToast } = useToast();
    const { t } = useLanguage();
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState(null);

    const [formData, setFormData] = useState({
        full_name: ''
    });

    useEffect(() => {
        if (state.user) {
            setUser(state.user);
            setFormData({
                full_name: state.user.full_name || ''
            });
        }
    }, [state.user]);

    const handleChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            const response = await UserService.updateUser(user.id, formData);

            // Backend returns: { error: false, message: '...', data: { user: ... } }
            // UserService returns response.data, so 'response' here is the full object
            // We need to access response.data.user
            const updatedUserData = response.data.user;

            // Update local storage and context
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const newUser = { ...currentUser, ...updatedUserData };
            localStorage.setItem('user', JSON.stringify(newUser));

            // Force reload to update context
            window.location.reload();

            showToast(t('profile_updated'), 'success');
        } catch (error) {
            console.error('Update profile error:', error);
            showToast(error.response?.data?.message || 'Failed to update profile', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (!user) return <Loader />;

    return (
        <div className={styles.profileContainer}>
            <div className={styles.header}>
                <h1>{t('my_profile')}</h1>
                <p>{t('manage_personal_info')}</p>
            </div>

            <div className={styles.content}>
                <div className={styles.leftColumn}>
                    <Card className={styles.userCard}>
                        <div className={styles.avatar}>
                            {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <h2>{user.full_name || user.username}</h2>
                        <span className={styles.roleBadge}>{user.role}</span>
                        <p className={styles.email}>{user.email}</p>
                    </Card>
                </div>

                <div className={styles.rightColumn}>
                    <Card title={t('personal_information')}>
                        <form onSubmit={handleSubmit}>
                            <div className={styles.formGrid}>
                                <Input
                                    label={t('username')}
                                    value={user.username}
                                    disabled
                                    className={styles.readOnly}
                                />
                                <Input
                                    label={t('email')}
                                    value={user.email}
                                    disabled
                                    className={styles.readOnly}
                                />
                                <Input
                                    label={t('full_name')}
                                    value={formData.full_name}
                                    onChange={(e) => handleChange('full_name', e.target.value)}
                                    placeholder={t('full_name')}
                                />
                            </div>

                            <div className={styles.actions}>
                                <Button type="submit" disabled={saving}>
                                    {saving ? t('saving') : t('save_changes')}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Profile;
