import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Skeleton from './components/Skeleton';

// Lazy load pages for code splitting - faster initial load
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ListsPage = lazy(() => import('./pages/ListsPage'));
const TasksPage = lazy(() => import('./pages/TasksPage'));
const TaskDetailsPage = lazy(() => import('./pages/TaskDetailsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AnalysisPage = lazy(() => import('./pages/AnalysisPage'));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] p-8">
    <div className="max-w-7xl mx-auto">
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-6 bg-white dark:bg-[#1f1f1f] rounded-lg shadow">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-3 h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/lists" replace />} />
              <Route path="lists" element={<ListsPage />} />
              <Route path="lists/:listId/tasks" element={<TasksPage />} />
              <Route path="tasks/:taskId" element={<TaskDetailsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="analysis" element={<AnalysisPage />} />
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
