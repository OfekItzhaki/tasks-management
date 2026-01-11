import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { tasksService } from '../services/tasks.service';
import { stepsService } from '../services/steps.service';
import {
  Task,
  ApiError,
  Step,
  UpdateTaskDto,
  UpdateStepDto,
} from '@tasks-management/frontend-services';
import { formatApiError } from '../utils/formatApiError';

export default function TaskDetailsPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const queryClient = useQueryClient();

  const numericTaskId = taskId ? Number(taskId) : null;
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [taskDescriptionDraft, setTaskDescriptionDraft] = useState('');
  const [editingStepId, setEditingStepId] = useState<number | null>(null);
  const [stepDescriptionDraft, setStepDescriptionDraft] = useState('');

  const {
    data: task,
    isLoading,
    isError,
    error,
  } = useQuery<Task, ApiError>({
    queryKey: ['task', numericTaskId],
    enabled: typeof numericTaskId === 'number' && !Number.isNaN(numericTaskId),
    queryFn: () => tasksService.getTaskById(numericTaskId as number),
  });

  useEffect(() => {
    if (task) setTaskDescriptionDraft(task.description);
  }, [task]);

  const invalidateTask = async (t: Task) => {
    await queryClient.invalidateQueries({ queryKey: ['task', t.id] });
    await queryClient.invalidateQueries({ queryKey: ['tasks', t.todoListId] });
  };

  const updateTaskMutation = useMutation<
    Task,
    ApiError,
    { id: number; data: UpdateTaskDto }
  >({
    mutationFn: ({ id, data }) =>
      tasksService.updateTask(id, data),
    onSuccess: async (updated) => {
      await invalidateTask(updated);
    },
    onError: (err) => {
      toast.error(formatApiError(err, 'Failed to update task'));
    },
  });

  const updateStepMutation = useMutation<
    Step,
    ApiError,
    { task: Task; stepId: number; data: UpdateStepDto }
  >({
    mutationFn: ({ stepId, data }) => stepsService.updateStep(stepId, data),
    onSuccess: async (_updatedStep, vars) => {
      await invalidateTask(vars.task);
    },
    onError: (err) => {
      toast.error(formatApiError(err, 'Failed to update step'));
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading task...</div>;
  }

  if (isError || !task) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-800">
          {isError ? formatApiError(error, 'Failed to load task') : 'Task not found'}
        </div>
        <Link
          to="/lists"
          className="mt-4 inline-block text-indigo-600 hover:text-indigo-700 text-sm font-medium"
        >
          ← Back to Lists
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          to={task.todoListId ? `/lists/${task.todoListId}/tasks` : '/lists'}
          className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
        >
          ← Back to Tasks
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => {
              updateTaskMutation.mutate({
                id: task.id,
                data: { completed: !task.completed },
              });
            }}
            className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
            {isEditingTask ? (
              <div className="flex flex-col gap-2">
                <input
                  value={taskDescriptionDraft}
                  onChange={(e) => setTaskDescriptionDraft(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={updateTaskMutation.isPending || !taskDescriptionDraft.trim()}
                    onClick={() => {
                      updateTaskMutation.mutate(
                        {
                          id: task.id,
                          data: { description: taskDescriptionDraft.trim() },
                        },
                        {
                          onSuccess: () => {
                            toast.success('Task updated');
                            setIsEditingTask(false);
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
                      setIsEditingTask(false);
                      setTaskDescriptionDraft(task.description);
                    }}
                    className="inline-flex justify-center rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <h1 className="text-2xl font-bold text-gray-900">{task.description}</h1>
            )}
          </div>
          {!isEditingTask && (
            <button
              type="button"
              onClick={() => {
                setIsEditingTask(true);
                setTaskDescriptionDraft(task.description);
              }}
              className="inline-flex justify-center rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200"
            >
              Edit
            </button>
          )}
        </div>

        {task.dueDate && (
          <div className="mb-4">
            <span className="text-sm font-medium text-gray-700">Due Date: </span>
            <span className="text-sm text-gray-500">
              {new Date(task.dueDate).toLocaleDateString()}
            </span>
          </div>
        )}

        {task.steps && task.steps.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Steps</h2>
            <ul className="space-y-2">
              {task.steps.map((step) => (
                <li
                  key={step.id}
                  className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={step.completed}
                      onChange={() => {
                        updateStepMutation.mutate({
                          task,
                          stepId: step.id,
                          data: { completed: !step.completed },
                        });
                      }}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    {editingStepId === step.id ? (
                      <input
                        value={stepDescriptionDraft}
                        onChange={(e) => setStepDescriptionDraft(e.target.value)}
                        className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    ) : (
                      <span
                        className={
                          step.completed
                            ? 'line-through text-gray-500 truncate'
                            : 'text-gray-900 truncate'
                        }
                      >
                        {step.description}
                      </span>
                    )}
                  </div>

                  {editingStepId === step.id ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={updateStepMutation.isPending || !stepDescriptionDraft.trim()}
                        onClick={() => {
                          updateStepMutation.mutate(
                            {
                              task,
                              stepId: step.id,
                              data: { description: stepDescriptionDraft.trim() },
                            },
                            {
                              onSuccess: () => {
                                toast.success('Step updated');
                                setEditingStepId(null);
                                setStepDescriptionDraft('');
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
                          setEditingStepId(null);
                          setStepDescriptionDraft('');
                        }}
                        className="inline-flex justify-center rounded-md bg-gray-200 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingStepId(step.id);
                        setStepDescriptionDraft(step.description);
                      }}
                      className="inline-flex justify-center rounded-md bg-gray-200 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-300"
                    >
                      Edit
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
