import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useMemo, useCallback } from 'react';
import { supportedLanguages } from '../i18n';
import { isRtlLanguage } from '@tasks-management/frontend-services';

export default function Layout() {
  const { user, logout } = useAuth();
  const { themeMode, setThemeMode } = useTheme();
  const { t, i18n } = useTranslation();
  
  // Memoize RTL calculation to prevent recalculation on every render
  const isRtl = useMemo(() => isRtlLanguage(i18n.language), [i18n.language]);

  // Memoize logout handler to prevent recreation
  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  // Memoize language options to prevent recreation
  const languageOptions = useMemo(
    () =>
      supportedLanguages.map((lng) => (
        <option key={lng} value={lng}>
          {t(`languageNames.${lng}`, { defaultValue: String(lng).toUpperCase() })}
        </option>
      )),
    [t, supportedLanguages],
  );

  // Memoize current language value
  const currentLanguage = useMemo(
    () => (i18n.resolvedLanguage ?? i18n.language).split('-')[0],
    [i18n.resolvedLanguage, i18n.language],
  );

  return (
    <div className="min-h-screen transition-colors">
      <nav className="glass-card border-b border-white/20 dark:border-gray-700/30 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex justify-between h-16 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center ${isRtl ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
              <Link
                to="/lists"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all duration-200"
              >
                {t('nav.lists')}
              </Link>
              <Link
                to="/analysis"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all duration-200"
              >
                {t('nav.analysis')}
              </Link>
            </div>
            <div className={`flex items-center ${isRtl ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
              {/* Theme Toggle */}
              <div className={`flex items-center ${isRtl ? 'space-x-reverse space-x-1' : 'space-x-1'} glass-card rounded-xl p-1`}>
                <button
                  onClick={() => setThemeMode('light')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                    themeMode === 'light'
                      ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  {t('nav.theme.light')}
                </button>
                <button
                  onClick={() => setThemeMode('dark')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                    themeMode === 'dark'
                      ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  {t('nav.theme.dark')}
                </button>
                <button
                  onClick={() => setThemeMode('auto')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                    themeMode === 'auto'
                      ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  {t('nav.theme.auto')}
                </button>
              </div>
              <select
                aria-label={t('nav.language')}
                value={currentLanguage}
                onChange={(e) => void i18n.changeLanguage(e.target.value)}
                className="glass-card rounded-xl border-0 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all duration-200 cursor-pointer"
              >
                {languageOptions}
              </select>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 px-3 py-2 glass-card rounded-xl">
                {user?.email || (
                  <span className="inline-block w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                )}
              </span>
              <Link
                to="/profile"
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all duration-200"
              >
                {t('nav.profile')}
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
              >
                {t('nav.logout')}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        <Outlet />
      </main>
    </div>
  );
}
