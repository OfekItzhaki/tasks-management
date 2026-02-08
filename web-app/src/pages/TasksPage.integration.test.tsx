import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../test/utils';
import TasksPage from './TasksPage';
import { TokenStorage } from '@tasks-management/frontend-services';
import { server } from '../test/mocks/server';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';

describe('TasksPage (integration)', () => {
  beforeEach(() => {
    TokenStorage.setToken('mock-jwt-token');

    // Mock user for AuthProvider
    server.use(
      http.get('*/api/v1/users/me', () =>
        HttpResponse.json({
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
        })
      )
    );
  });

  const mockList = {
    id: 'l-101',
    name: 'My List',
    type: 'CUSTOM',
    iconId: 'list',
    colorId: 'blue',
    isSystem: false,
    taskBehavior: 'ONE_OFF',
    completionPolicy: 'KEEP',
  };

  const mockTasks = [
    {
      id: 't-1',
      description: 'Existing Task',
      completed: false,
      todoListId: 'l-101',
      order: 1,
    },
  ];

  it('renders tasks and allows creating a new task with optimistic disabled state and recovery on failure', async () => {
    let tasks = [...mockTasks];
    server.use(
      http.get('*/api/v1/todo-lists/l-101', () => HttpResponse.json(mockList)),
      http.get('*/api/v1/todo-lists', () => HttpResponse.json([mockList])),
      http.get('*/api/v1/tasks', () => HttpResponse.json(tasks)),
      http.post('*/api/v1/tasks/todo-list/:listId', async ({ request }) => {
        const body = (await request.json()) as { description: string };
        if (body.description === 'FAIL_ME') {
          await new Promise((resolve) => setTimeout(resolve, 200));
          return new HttpResponse(null, { status: 500 });
        }
        const newTask = {
          id: 't-new',
          description: body.description,
          completed: false,
          todoListId: 'l-101',
          order: 100,
        };
        tasks.push(newTask);
        await new Promise((resolve) => setTimeout(resolve, 200));
        return HttpResponse.json(newTask);
      })
    );

    const user = userEvent.setup();
    render(
      <Routes>
        <Route path="/lists/:listId/tasks" element={<TasksPage />} />
      </Routes>,
      { route: '/lists/l-101/tasks' }
    );

    await waitFor(() =>
      expect(screen.getByText('Existing Task')).toBeInTheDocument()
    );

    // 1. Success Case
    const createButton = screen.getByRole('button', {
      name: 'create-task-button',
    });
    await user.click(createButton);

    const input = screen.getByLabelText('new-task-input');
    const submitBtn = screen.getByRole('button', { name: /^CREATE$/i });

    // Verify button disabled for empty description
    expect(submitBtn).toBeDisabled();

    await user.type(input, 'New Optimistic Task');
    expect(submitBtn).not.toBeDisabled();
    await user.click(submitBtn);

    // Verify Optimistic State
    const optimisticTask = await screen.findByText('New Optimistic Task', {
      selector: 'p',
    });
    const row = optimisticTask.closest('[role="button"]');
    expect(row).toHaveClass('opacity-60');

    // Wait for resolution
    await waitFor(
      () => {
        const settledTask = screen.getByText('New Optimistic Task', {
          selector: 'p',
        });
        const settledRow = settledTask.closest('[role="button"]');
        expect(settledRow).not.toHaveClass('opacity-60');
      },
      { timeout: 2000 }
    );

    // 2. Failure Case
    await user.click(
      screen.getByRole('button', { name: 'create-task-button' })
    );
    const input2 = screen.getByLabelText('new-task-input');
    const submitBtn2 = screen.getByRole('button', { name: /^CREATE$/i });
    await user.type(input2, 'FAIL_ME');
    await user.click(submitBtn2);

    // Should appear optimistically
    expect(await screen.findByText('FAIL_ME')).toBeInTheDocument();

    // Should disappear on failure
    await waitFor(
      () => {
        expect(screen.queryByText('FAIL_ME')).not.toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('optimistically removes task when deleted and handles failure', async () => {
    let tasks = [...mockTasks];
    server.use(
      http.get('*/api/v1/todo-lists/l-101', () => HttpResponse.json(mockList)),
      http.get('*/api/v1/todo-lists', () => HttpResponse.json([mockList])),
      http.get('*/api/v1/tasks', () => HttpResponse.json(tasks)),
      http.delete('*/api/v1/tasks/:id', async ({ params }) => {
        if (params.id === 'fail-id')
          return new HttpResponse(null, { status: 500 });
        tasks = tasks.filter((t) => t.id !== params.id);
        return HttpResponse.json(mockTasks[0]);
      })
    );

    const user = userEvent.setup();
    render(
      <Routes>
        <Route path="/lists/:listId/tasks" element={<TasksPage />} />
      </Routes>,
      { route: '/lists/l-101/tasks' }
    );

    await waitFor(() =>
      expect(screen.getByText('Existing Task')).toBeInTheDocument()
    );

    const taskRow = screen
      .getByText('Existing Task')
      .closest('[role="button"]');
    if (!taskRow) throw new Error('Task row not found');

    const deleteButton = within(taskRow as HTMLElement).getByRole('button', {
      name: 'delete-button',
    });
    await user.click(deleteButton);

    // Verify Removal (Optimistic)
    expect(screen.queryByText('Existing Task')).not.toBeInTheDocument();
  });

  it('handles list rename failure by reverting UI', async () => {
    server.use(
      http.get('*/api/v1/todo-lists/l-101', () => HttpResponse.json(mockList)),
      http.get('*/api/v1/todo-lists', () => HttpResponse.json([mockList])),
      http.get('*/api/v1/tasks', () => HttpResponse.json(mockTasks)),
      http.patch('*/api/v1/todo-lists/l-101', async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return new HttpResponse(null, { status: 500 });
      })
    );

    const user = userEvent.setup();
    render(
      <Routes>
        <Route path="/lists/:listId/tasks" element={<TasksPage />} />
      </Routes>,
      { route: '/lists/l-101/tasks' }
    );

    await waitFor(() =>
      expect(screen.getByText('My List')).toBeInTheDocument()
    );

    // Rename
    await user.click(screen.getByText('My List'));
    const input = screen.getByLabelText('List Name');
    await user.clear(input);
    await user.type(input, 'Failed Rename');
    await user.click(screen.getByText(/SAVE/i));

    // Optimistically updated
    await waitFor(
      () => {
        expect(screen.getByText('Failed Rename')).toBeInTheDocument();
      },
      { timeout: 1000 }
    );

    // Should revert on failure
    await waitFor(
      () => {
        expect(screen.getByText('My List')).toBeInTheDocument();
        expect(screen.queryByText('Failed Rename')).not.toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('allows editing list settings (behavior and policy)', async () => {
    server.use(
      http.get('*/api/v1/todo-lists/l-101', () => HttpResponse.json(mockList)),
      http.get('*/api/v1/todo-lists', () => HttpResponse.json([mockList])),
      http.get('*/api/v1/tasks', () => HttpResponse.json(mockTasks)),
      http.patch('*/api/v1/todo-lists/l-101', async ({ request }) => {
        const body = (await request.json()) as {
          name?: string;
          taskBehavior?: string;
          completionPolicy?: string;
        };
        return HttpResponse.json({ ...mockList, ...body });
      })
    );

    const user = userEvent.setup();
    render(
      <Routes>
        <Route path="/lists/:listId/tasks" element={<TasksPage />} />
      </Routes>,
      { route: '/lists/l-101/tasks' }
    );

    await waitFor(() =>
      expect(screen.getByText('My List')).toBeInTheDocument()
    );

    // Open edit form
    await user.click(screen.getByText('My List'));

    // Change settings
    const behaviorSelect = screen.getByLabelText('Task Behavior');
    const policySelect = screen.getByLabelText('Completion Policy');

    await user.selectOptions(behaviorSelect, 'RECURRING');
    await user.selectOptions(policySelect, 'AUTO_DELETE');

    // Save
    await user.click(screen.getByText(/SAVE/i));

    // Form should close
    await waitFor(() => {
      expect(screen.queryByLabelText('List Name')).not.toBeInTheDocument();
    });
  });

  it('optimistically removes task when completed in MOVE_TO_DONE list', async () => {
    const donePolicyList = { ...mockList, completionPolicy: 'MOVE_TO_DONE' };

    server.use(
      http.get('*/api/v1/todo-lists/l-101', () =>
        HttpResponse.json(donePolicyList)
      ),
      http.get('*/api/v1/todo-lists', () =>
        HttpResponse.json([donePolicyList])
      ),
      http.get('*/api/v1/tasks', () => HttpResponse.json(mockTasks)),
      http.patch('*/api/v1/tasks/t-1', async ({ request }) => {
        const body = (await request.json()) as { completed?: boolean };
        await new Promise((resolve) => setTimeout(resolve, 200));
        return HttpResponse.json({
          ...mockTasks[0],
          ...body,
          todoListId: body.completed ? 'done-list-id' : 'l-101',
        });
      })
    );

    const user = userEvent.setup();
    render(
      <Routes>
        <Route path="/lists/:listId/tasks" element={<TasksPage />} />
      </Routes>,
      { route: '/lists/l-101/tasks' }
    );

    await waitFor(() =>
      expect(screen.getByText('Existing Task')).toBeInTheDocument()
    );

    const taskRow = screen
      .getByText('Existing Task')
      .closest('[role="button"]');
    if (!taskRow) throw new Error('Task row not found');
    const completeButton = within(taskRow as HTMLElement).getAllByRole(
      'button'
    )[0];

    await user.click(completeButton);

    // Verify Removal (Optimistic)
    await waitFor(
      () => {
        expect(screen.queryByText('Existing Task')).not.toBeInTheDocument();
      },
      { timeout: 500 }
    );
  });
});
