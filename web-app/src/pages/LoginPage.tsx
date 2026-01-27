import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoginDto } from '@tasks-management/frontend-services';
import { extractErrorMessage } from '../utils/errorHandler';
import { useTranslation } from 'react-i18next';
import { isRtlLanguage } from '@tasks-management/frontend-services';

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const isRtl = isRtlLanguage(i18n.language);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const credentials: LoginDto = { email, password };
      await login(credentials);
      navigate('/lists');
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err, t('login.failed', { defaultValue: 'Login failed. Please try again.' }));
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-purple-600 to-pink-600 opacity-10 dark:opacity-20 animate-pulse-slow" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.1),transparent_50%)]" />
      
      <div className="max-w-md w-full space-y-8 relative z-10 animate-fade-in">
        <div className="text-center">
          <h2 className="premium-header-main text-5xl mb-2">
            {t('login.title')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Welcome back! Please sign in to continue.
          </p>
        </div>
        <form className="premium-card p-8 space-y-6 animate-slide-up" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 animate-scale-in">
              <div className="text-sm text-red-800 dark:text-red-200 font-medium">{error}</div>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t('login.emailPlaceholder')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="premium-input w-full text-gray-900 dark:text-white"
                placeholder={t('login.emailPlaceholder')}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t('login.passwordPlaceholder')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="premium-input w-full pr-12 text-gray-900 dark:text-white"
                  placeholder={t('login.passwordPlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className={`absolute inset-y-0 ${isRtl ? 'left-0' : 'right-0'} flex items-center px-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors`}
                  aria-label={
                    showPassword ? t('login.hidePassword') : t('login.showPassword')
                  }
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                    >
                      <path d="M3 3l18 18" />
                      <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
                      <path d="M9.88 5.09A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a18.29 18.29 0 0 1-3.17 4.33" />
                      <path d="M6.61 6.61A18.29 18.29 0 0 0 2 12s3 7 10 7a10.43 10.43 0 0 0 4.12-.82" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                    >
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 transition-all duration-200"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('login.signingIn')}
                </span>
              ) : (
                t('login.signIn')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
