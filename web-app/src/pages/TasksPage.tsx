import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { tasksService } from '../services/tasks.service';
import { listsService } from '../services/lists.service';
import FloatingActionButton from '../components/FloatingActionButton';
import {
  Task,
  ApiError,
  CreateTaskDto,
  ToDoList,
  UpdateToDoListDto,
} from '@tasks-management/frontend-services';
import { formatApiError } from '../utils/formatApiError';

type ListWithSystemFlag = ToDoList & { isSystem?: boolean };

export default function TasksPage() {
  const { listId } = useParams<{ listId: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [isEditingListName, setIsEditingListName] = useState(false);
  const [listNameDraft, setListNameDraft] = useState('');

  const numericListId = listId ? Number(listId) : null;

  const { data: list } = useQuery<ListWithSystemFlag, ApiError>({
    queryKey: ['list', numericListId],
    enabled: typeof numericListId === 'number' && !Number.isNaN(numericListId),
    queryFn: () => listsService.getListById(numericListId as number),
  });

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

  useEffect(() => {
    if (list) setListNameDraft(list.name);
  }, [list]);

  const updateListMutation = useMutation<
    ListWithSystemFlag,
    ApiError,
    { id: number; data: UpdateToDoListDto }
  >({
    mutationFn: ({ id, data }) => listsService.updateList(id, data),
    onSuccess: async (updated) => {
      await queryClient.invalidateQueries({ queryKey: ['list', updated.id] });
      await queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
    onError: (err) => {
      toast.error(formatApiError(err, 'Failed to update list'));
    },
  });

  const deleteListMutation = useMutation<ListWithSystemFlag, ApiError, { id: number }>({
    mutationFn: ({ id }) => listsService.deleteList(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['lists'] });
      toast.success('List deleted');
      navigate('/lists');
    },
    onError: (err) => {
      toast.error(formatApiError(err, 'Failed to delete list'));
    },
  });

  const createTaskMutation = useMutation<Task, ApiError, CreateTaskDto>({
    mutationFn: (data) =>
      tasksService.createTask(numericListId as number, data),
    onSuccess: async () => {
      setNewTaskDescription('');
      setShowCreate(false);
      await queryClient.invalidateQueries({ queryKey: ['tasks', numericListId] });
    },
    onError: (err) => {
      toast.error(formatApiError(err, 'Failed to create task'));
    },
  });

  const deleteTaskMutation = useMutation<Task, ApiError, { id: number }>({
    mutationFn: ({ id }) => tasksService.deleteTask(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tasks', numericListId] });
      toast.success('Task deleted');
    },
    onError: (err) => {
      toast.error(formatApiError(err, 'Failed to delete task'));
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

      <div className="flex items-center justify-between mb-6 gap-3">
        <div className="min-w-0 flex-1">
          {isEditingListName ? (
            <div className="flex flex-col gap-2">
              <input
                value={listNameDraft}
                onChange={(e) => setListNameDraft(e.target.value)}
                className="w-full max-w-xl rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={
                    updateListMutation.isPending || !list || !listNameDraft.trim()
                  }
                  onClick={() => {
                    if (!list) return;
                    updateListMutation.mutate(
                      { id: list.id, data: { name: listNameDraft.trim() } },
                      {
                        onSuccess: () => {
                          toast.success('List updated');
                          setIsEditingListName(false);
                        },
                      },
                    );
                  }}
                  className="inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingListName(false);
                    setListNameDraft(list?.name ?? '');
                  }}
                  className="inline-flex justify-center rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <h1
              className="text-2xl font-bold text-gray-900 truncate cursor-text"
              title="Click to rename"
              onClick={() => {
                if (!list) return;
                if (list.isSystem) return;
                setIsEditingListName(true);
                setListNameDraft(list.name);
              }}
            >
              {list?.name ?? 'Tasks'}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-2">
          {list && !list.isSystem && (
            <button
              type="button"
              disabled={deleteListMutation.isPending}
              onClick={() => {
                const ok = window.confirm(
                  `Delete list "${list.name}"? This will delete all tasks in this list.`,
                );
                if (!ok) return;
                deleteListMutation.mutate({ id: list.id });
              }}
              className="inline-flex justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete list
            </button>
          )}
        </div>
      </div>

      {showCreate && (
        <form
          className="bg-white rounded-lg border p-4 mb-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (!newTaskDescription.trim() || !numericListId) return;
            createTaskMutation.mutate({ description: newTaskDescription.trim() });
          }}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-end">
            <div className="sm:col-span-10">
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <input
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g. Buy milk"
              />
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <button
                type="submit"
                disabled={
                  createTaskMutation.isPending ||
                  !numericListId ||
                  !newTaskDescription.trim()
                }
                className="inline-flex flex-1 justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createTaskMutation.isPending ? 'Adding...' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false);
                  setNewTaskDescription('');
                }}
                className="inline-flex justify-center rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            role="button"
            tabIndex={0}
            onClick={() => navigate(`/tasks/${task.id}`)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate(`/tasks/${task.id}`);
              }
            }}
            className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <input
                  type="checkbox"
                  checked={task.completed}
                  readOnly
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span
                  className={
                    task.completed
                      ? 'line-through text-gray-500 truncate'
                      : 'text-gray-900 truncate'
                  }
                >
                  {task.description}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {task.dueDate && (
                  <span className="text-sm text-gray-500">
                    {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const ok = window.confirm(`Delete task "${task.description}"?`);
                    if (!ok) return;
                    deleteTaskMutation.mutate({ id: task.id });
                  }}
                  disabled={deleteTaskMutation.isPending}
                  className="inline-flex justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {tasks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No tasks found.</p>
        </div>
      )}

      <FloatingActionButton
        ariaLabel="Create new task"
        disabled={!numericListId}
        onClick={() => setShowCreate(true)}
      />
    </div>
  );
}
