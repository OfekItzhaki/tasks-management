import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { BUILD_INFO } from '../utils/buildInfo';
import { isRtlLanguage } from '@tasks-management/frontend-services/i18n';
import { usersService } from '@tasks-management/frontend-services';
import { authService } from '../services/auth.service';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const { t, i18n } = useTranslation();
  const isRtl = isRtlLanguage(i18n.language);
  const [isEditingPicture, setIsEditingPicture] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState(user?.profilePicture || '');
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('url');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Update profilePictureUrl when user changes
  useEffect(() => {
    if (user?.profilePicture !== profilePictureUrl && !isEditingPicture) {
      setProfilePictureUrl(user?.profilePicture || '');
    }
  }, [user?.profilePicture, isEditingPicture]);

  const updateProfilePictureMutation = useMutation({
    mutationFn: async ({ url, file }: { url?: string; file?: File }) => {
      if (!user) throw new Error('User not found');
      if (file) {
        return usersService.uploadAvatar(user.id, file);
      } else {
        return usersService.update(user.id, { profilePicture: url || null });
      }
    },
    onSuccess: async (updatedUser) => {
      toast.success(t('profile.pictureUpdated'));
      setIsEditingPicture(false);
      setSelectedFile(null);
      setFilePreview(null);
      setUploadMethod('url');
      // Refresh the page to update AuthContext user
      setTimeout(() => window.location.reload(), 500);
    },
    onError: (error: Error) => {
      toast.error(error.message || t('profile.pictureUpdateFailed'));
    },
  });

  if (loading) {
    return <div className="text-gray-900 dark:text-white">{t('common.loading')}</div>;
  }

  if (!user) {
    return <div className="text-sm text-gray-600 dark:text-gray-400">{t('profile.notAuthenticated')}</div>;
  }

  const handleSavePicture = () => {
    if (uploadMethod === 'file' && selectedFile) {
      updateProfilePictureMutation.mutate({ file: selectedFile });
    } else {
      updateProfilePictureMutation.mutate({ url: profilePictureUrl });
    }
  };

  const handleCancelPicture = () => {
    setProfilePictureUrl(user?.profilePicture || '');
    setSelectedFile(null);
    setFilePreview(null);
    setUploadMethod('url');
    setIsEditingPicture(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Invalid file type. Please select an image file (JPEG, PNG, GIF, or WebP).');
        return;
      }

      // Validate file size (5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('File too large. Maximum size is 5MB.');
        return;
      }

      setSelectedFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('profile.title')}</h1>

      <div className="bg-white dark:bg-[#1f1f1f] rounded-lg shadow p-6">
        <div className="space-y-4">
          {/* Profile Picture */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('profile.profilePicture')}
            </label>
            <div className={`flex ${isRtl ? 'flex-row-reverse' : ''} items-center gap-4`}>
              {(filePreview || user.profilePicture) ? (
                <img
                  src={filePreview || user.profilePicture || undefined}
                  alt={t('profile.profilePicture')}
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-300 dark:border-[#2a2a2a]"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-[#2a2a2a] flex items-center justify-center border-2 border-gray-300 dark:border-[#2a2a2a]">
                  <span className="text-2xl text-gray-400 dark:text-gray-500">
                    {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                  </span>
                </div>
              )}
              {isEditingPicture ? (
                <div className="flex-1 space-y-3">
                  {/* Upload Method Toggle */}
                  <div className={`flex ${isRtl ? 'flex-row-reverse' : ''} gap-2`}>
                    <button
                      type="button"
                      onClick={() => setUploadMethod('url')}
                      className={`px-3 py-1 text-xs font-medium rounded ${
                        uploadMethod === 'url'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      From URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadMethod('file')}
                      className={`px-3 py-1 text-xs font-medium rounded ${
                        uploadMethod === 'file'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Upload File
                    </button>
                  </div>

                  {/* File Preview */}
                  {(filePreview || selectedFile) && (
                    <div className="mt-2">
                      <img
                        src={filePreview || undefined}
                        alt="Preview"
                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-300 dark:border-[#2a2a2a]"
                      />
                    </div>
                  )}

                  {/* URL Input */}
                  {uploadMethod === 'url' && (
                    <input
                      type="url"
                      value={profilePictureUrl}
                      onChange={(e) => setProfilePictureUrl(e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                      className="w-full rounded-md border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  )}

                  {/* File Input */}
                  {uploadMethod === 'file' && (
                    <div>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handleFileSelect}
                        className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 dark:file:bg-[#2a2a2a] file:text-indigo-700 dark:file:text-indigo-400 hover:file:bg-indigo-100 dark:hover:file:bg-[#333333] cursor-pointer"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Max file size: 5MB. Allowed: JPEG, PNG, GIF, WebP
                      </p>
                    </div>
                  )}

                  <div className={`flex ${isRtl ? 'flex-row-reverse' : ''} gap-2`}>
                    <button
                      type="button"
                      onClick={handleSavePicture}
                      disabled={
                        updateProfilePictureMutation.isPending ||
                        (uploadMethod === 'url' && !profilePictureUrl.trim()) ||
                        (uploadMethod === 'file' && !selectedFile)
                      }
                      className="inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('common.save')}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelPicture}
                      className="inline-flex justify-center rounded-md bg-gray-100 dark:bg-[#2a2a2a] px-3 py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-[#333333]"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingPicture(true);
                    setProfilePictureUrl(user.profilePicture || '');
                  }}
                  className="inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  {user.profilePicture ? t('profile.changePicture') : t('profile.addPicture')}
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('profile.email')}</label>
            <p className="mt-1 text-sm text-gray-900 dark:text-white">{user.email}</p>
          </div>

          {user.name && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('profile.name')}</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{user.name}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('profile.emailVerified')}
            </label>
            <div className={`mt-1 flex ${isRtl ? 'flex-row-reverse' : ''} items-center gap-2`}>
              <p className="text-sm text-gray-900 dark:text-white">
                {user.emailVerified ? t('profile.yes') : t('profile.no')}
              </p>
              {!user.emailVerified && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await authService.resendVerification(user.email);
                      toast.success(t('profile.verificationEmailSent'));
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : t('profile.verificationEmailSent'));
                    }
                  }}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                >
                  {t('profile.resendVerification')}
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('profile.memberSince')}
            </label>
            <p className="mt-1 text-sm text-gray-900 dark:text-white">
              {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1f1f1f] rounded-lg shadow p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('profile.about')}</h2>
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-600 dark:text-gray-400">{t('profile.version')}</span>
            <span className="font-mono text-gray-900 dark:text-white">{BUILD_INFO.version}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-600 dark:text-gray-400">{t('profile.credits')}</span>
            <span className="text-gray-900 dark:text-white">{t('profile.creditsValue')}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-600 dark:text-gray-400">{t('profile.sourceCode')}</span>
            <a
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
              href="https://github.com/OfekItzhaki/TasksManagement"
              target="_blank"
              rel="noreferrer"
            >
              {t('profile.openRepo')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
