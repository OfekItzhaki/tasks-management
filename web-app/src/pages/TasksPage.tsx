import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { tasksService } from '../services/tasks.service';
import { Task, ApiError, CreateTaskDto } from '@tasks-management/frontend-services';
import { formatApiError } from '../utils/formatApiError';

export default function TasksPage() {
  const { listId } = useParams<{ listId: string }>();
  const queryClient = useQueryClient();
  const [newTaskDescription, setNewTaskDescription] = useState('');

  const numericListId = listId ? Number(listId) : null;

  const {
    data: tasks = [],
    isLoading,
    isError,
    error,
  } = useQuery<Task[], ApiError>({
    queryKey: ['tasks', numericListId],
    enabled: typeof numericListId === 'number' && !Number.isNaN(numericListId),
    queryFn: () => tasksService.getTasksByList(numericListId as number),
  });

  const createTaskMutation = useMutation<Task, ApiError, CreateTaskDto>({
    mutationFn: (data) =>
      tasksService.createTask(numericListId as number, data),
    onSuccess: async () => {
      setNewTaskDescription('');
      await queryClient.invalidateQueries({ queryKey: ['tasks', numericListId] });
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading tasks...</div>;
  }

  if (isError) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-800">
          {formatApiError(error, 'Failed to load tasks')}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          to="/lists"
          className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
        >
          ← Back to Lists
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tasks</h1>

      <form
        className="bg-white rounded-lg shadow p-4 mb-6 flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          if (!newTaskDescription.trim() || !numericListId) return;
          createTaskMutation.mutate({ description: newTaskDescription.trim() });
        }}
      >
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">
            New task
          </label>
          <input
            value={newTaskDescription}
            onChange={(e) => setNewTaskDescription(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g. Buy milk"
          />
        </div>
        <button
          type="submit"
          disabled={
            createTaskMutation.isPending ||
            !numericListId ||
            !newTaskDescription.trim()
          }
          className="inline-flex justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {createTaskMutation.isPending ? 'Adding...' : 'Add task'}
        </button>
      </form>

      {createTaskMutation.isError && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <div className="text-sm text-red-800">
            {formatApiError(createTaskMutation.error, 'Failed to create task')}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {tasks.map((task) => (
          <Link
            key={task.id}
            to={`/tasks/${task.id}`}
            className="block p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={task.completed}
                  readOnly
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span
                  className={task.completed ? 'line-through text-gray-500' : 'text-gray-900'}
                >
                  {task.description}
                </span>
              </div>
              {task.dueDate && (
                <span className="text-sm text-gray-500">
                  {new Date(task.dueDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {tasks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No tasks found.</p>
        </div>
      )}
    </div>
  );
}
