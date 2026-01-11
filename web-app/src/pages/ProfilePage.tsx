import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  if (loading) {
    return <div>{t('common.loading')}</div>;
  }

  if (!user) {
    return <div className="text-sm text-gray-600">{t('profile.notAuthenticated')}</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('profile.title')}</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('profile.email')}</label>
            <p className="mt-1 text-sm text-gray-900">{user.email}</p>
          </div>

          {user.name && (
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('profile.name')}</label>
              <p className="mt-1 text-sm text-gray-900">{user.name}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('profile.emailVerified')}
            </label>
            <p className="mt-1 text-sm text-gray-900">
              {user.emailVerified ? t('profile.yes') : t('profile.no')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('profile.memberSince')}
            </label>
            <p className="mt-1 text-sm text-gray-900">
              {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
