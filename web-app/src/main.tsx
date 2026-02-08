import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'react-hot-toast';
import App from './App.tsx';
import ErrorFallback from './components/ErrorFallback';
import { registerServiceWorker } from './utils/registerServiceWorker';
import './i18n';
import './index.css';

// Inject Vite environment variables into window for frontend-services
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__VITE_API_URL__ = import.meta.env.VITE_API_URL;
}

// Register service worker for PWA features
if (import.meta.env.PROD) {
  registerServiceWorker();
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Make UI feel faster by reusing cached data briefly
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <App />
        </BrowserRouter>
      </ErrorBoundary>
      <Toaster position="top-right" />
    </QueryClientProvider>
  </StrictMode>
);
