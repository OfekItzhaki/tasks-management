import { configure } from '@tasks-management/frontend-services';

// Ensure API base URL matches MSW handlers (http://localhost:3000)
configure({
  baseURL: 'http://localhost:3000',
  turnstileSiteKey: '1x00000000000000000000AA',
});

import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { server } from './mocks/server';

// Mock the TurnstileWidget component for all tests
vi.mock('../components/TurnstileWidget', async () => {
  const mockModule = await import('./mocks/TurnstileWidget');
  return { default: mockModule.default };
});

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());
