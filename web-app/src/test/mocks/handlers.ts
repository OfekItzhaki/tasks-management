import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post('*/api/v1/auth/login', async ({ request }) => {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };
    if (body.email === 'invalid') {
      return HttpResponse.json(
        { message: 'Invalid email address', statusCode: 400 },
        { status: 400 }
      );
    }
    if (body.email === 'fail@example.com') {
      return HttpResponse.json(
        { message: 'Invalid credentials', statusCode: 401 },
        { status: 401 }
      );
    }
    return HttpResponse.json({
      accessToken: 'mock-jwt-token',
      user: { ...mockUser, email: body.email || mockUser.email },
    });
  }),

  http.get('*/api/v1/users', () => {
    return HttpResponse.json([mockUser]);
  }),

  http.get('*/api/v1/todo-lists', () => {
    return HttpResponse.json([]);
  }),

  http.post('*/api/v1/todo-lists', async ({ request }) => {
    const body = (await request.json()) as { name?: string };
    return HttpResponse.json({
      id: '1',
      name: body.name || 'New List',
      ownerId: mockUser.id,
      order: 0,
      type: 'CUSTOM',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      tasks: [],
    });
  }),

  http.post(
    '*/api/v1/tasks/todo-list/:todoListId',
    async ({ request, params }) => {
      const body = (await request.json()) as { description?: string };
      const { todoListId } = params as { todoListId: string };
      return HttpResponse.json({
        id: '1',
        description: body.description || 'New task',
        todoListId: todoListId,
        completed: false,
        dueDate: null,
        specificDayOfWeek: null,
        reminderDaysBefore: [],
        reminderConfig: null,
        completedAt: null,
        completionCount: 0,
        originalListId: null,
        deletedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  ),
];
