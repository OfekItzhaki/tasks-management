import { describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { render } from '../test/utils';
import ListsPage from './ListsPage';
import { TokenStorage } from '@tasks-management/frontend-services';
import { server } from '../test/mocks/server';
import { http, HttpResponse } from 'msw';

describe('ListsPage (integration)', () => {
  beforeEach(() => {
    TokenStorage.setToken('mock-jwt-token');
  });

  it('loads lists and shows create FAB', async () => {
    server.use(
      http.get('*/api/v1/users', () => {
        return HttpResponse.json([
          { id: 1, email: 'test@example.com', name: 'Test User' },
        ]);
      }),
      http.get('*/api/v1/todo-lists', () => {
        return HttpResponse.json([
          {
            id: 101,
            title: 'My List',
            iconId: 'list',
            colorId: 'blue',
            tasks: [],
          },
        ]);
      })
    );

    render(<ListsPage />);
    await waitFor(
      () => {
        expect(
          screen.getByRole('button', { name: /Create new list/i })
        ).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it('creates a new list when form is submitted', async () => {
    server.use(
      http.get('*/api/v1/users', () => {
        return HttpResponse.json([
          { id: 1, email: 'test@example.com', name: 'Test User' },
        ]);
      }),
      http.get('*/api/v1/todo-lists', () => {
        return HttpResponse.json([
          {
            id: 101,
            title: 'My List',
            iconId: 'list',
            colorId: 'blue',
            tasks: [],
          },
        ]);
      }),
      http.post('*/api/v1/todo-lists', () => {
        return HttpResponse.json({
          id: 102,
          title: 'My Test List',
          iconId: 'list',
          colorId: 'blue',
          tasks: [],
        });
      })
    );
    const user = userEvent.setup();
    render(<ListsPage />);
    await waitFor(
      () => {
        expect(
          screen.getByRole('button', { name: /Create new list/i })
        ).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
    await user.click(screen.getByRole('button', { name: /Create new list/i }));
    const nameInput = await screen.findByPlaceholderText(
      /e\.g\. Groceries|name/i
    );
    await user.type(nameInput, 'My Test List');
    const submitButton = screen.getByRole('button', { name: /^Create$/ });
    await user.click(submitButton);
    // After submit, create form closes (name input disappears); mutation is sent to MSW
    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText(/e\.g\. Groceries/i)
      ).not.toBeInTheDocument();
    });
  });
});
