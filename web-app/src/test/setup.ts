// Ensure API base URL matches MSW handlers (http://localhost:3000)
if (typeof process !== 'undefined' && process.env) {
  process.env.API_BASE_URL = 'http://localhost:3000';
}

import { afterEach, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { server } from './mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());
