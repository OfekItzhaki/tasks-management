import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useQueuedMutation } from '../hooks/useQueuedMutation';
import { useNavigate, useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { tasksService } from '../services/tasks.service';
import { listsService } from '../services/lists.service';
import Skeleton from '../components/Skeleton';
import ShareListModal from '../components/ShareListModal';
import { useTranslation } from 'react-i18next';
import {
  Task,
  ApiError,
  CreateTaskDto,
  ToDoList,
  ListType,
  UpdateToDoListDto,
  UpdateTaskDto,
  TaskBehavior,
  CompletionPolicy,
} from '@tasks-management/frontend-services';
import { formatApiError } from '../utils/formatApiError';
import { SortableTaskItem } from '../components/SortableTaskItem';
import BulkActionsBar from '../components/task/BulkActionsBar';
import { isRtlLanguage } from '@tasks-management/frontend-services';

type ListWithSystemFlag = ToDoList & { isSystem?: boolean };

interface TasksPageProps {
  isTrashView?: boolean;
}

export default function TasksPage({ isTrashView = false }: TasksPageProps) {
  const { t, i18n } = useTranslation();
  const isRtl = isRtlLanguage(i18n.language);
  const { listId } = useParams<{ listId: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [showCreate, setShowCreate] = useState(false);
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [isEditingListName, setIsEditingListName] = useState(false);
  const [listNameDraft, setListNameDraft] = useState('');
  const [taskBehaviorDraft, setTaskBehaviorDraft] = useState<TaskBehavior>(
    TaskBehavior.ONE_OFF
  );
  const [completionPolicyDraft, setCompletionPolicyDraft] =
    useState<CompletionPolicy>(CompletionPolicy.MOVE_TO_DONE);

  // Bulk Mode State
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [isSharing, setIsSharing] = useState(false);

  // Find Trash/Done List if in specific View
  const { data: allLists = [] } = useQuery<ToDoList[]>({
    queryKey: ['lists'],
    queryFn: () => listsService.getAllLists(),
    enabled: true, // Always fetch lists to enable grouping headers in Done/Trash views and for lookup
  });

  const trashListId = useMemo(() => {
    if (!isTrashView) return null;
    return allLists.find((l) => l.type === ListType.TRASH)?.id || null;
  }, [allLists, isTrashView]);

  //

  // Use string IDs (UUIDs)
  const effectiveListId = isTrashView ? trashListId : listId;

  const { data: list } = useQuery<ListWithSystemFlag, ApiError>({
    queryKey: ['list', effectiveListId],
    enabled: !!effectiveListId,
    initialData: () => {
      const cachedLists = queryClient.getQueryData<ListWithSystemFlag[]>([
        'lists',
      ]);
      return cachedLists?.find(
        (l) => (l.id as string) === (effectiveListId as string)
      );
    },
    queryFn: () => listsService.getListById(effectiveListId!),
  });

  const {
    data: tasks = [],
    isLoading,
    isRefetching,
    isError,
    error,
  } = useQuery<Task[], ApiError>({
    queryKey: ['tasks', effectiveListId],
    enabled: effectiveListId !== null && effectiveListId !== undefined,
    // Don't show stale data - show loading state instead
    queryFn: () => tasksService.getTasksByList(effectiveListId!),
  });

  // Restore task mutation
  const restoreTaskMutation = useMutation<Task, ApiError, string>({
    mutationFn: (id) => tasksService.restoreTask(id),
    onSuccess: () => {
      toast.success(t('tasks.restored'));
      if (effectiveListId) {
        void queryClient.invalidateQueries({
          queryKey: ['tasks', effectiveListId],
        });
      }
    },
    onError: (err) => {
      toast.error(formatApiError(err, t('tasks.restoreFailed')));
    },
  });

  // Permanent delete task mutation
  const permanentDeleteTaskMutation = useMutation<Task, ApiError, string>({
    mutationFn: (id) => tasksService.permanentDeleteTask(id),
    onSuccess: () => {
      toast.success(t('tasks.deletedForever'));
      if (effectiveListId) {
        void queryClient.invalidateQueries({
          queryKey: ['tasks', effectiveListId],
        });
      }
    },
    onError: (err) => {
      toast.error(formatApiError(err, t('tasks.deleteForeverFailed')));
    },
  });

  // Sort tasks by order for display
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [tasks]);

  useEffect(() => {
    if (list) setListNameDraft(list.name);
  }, [list]);

  // Automatically set completion policy to KEEP when task behavior is RECURRING
  useEffect(() => {
    if (taskBehaviorDraft === TaskBehavior.RECURRING) {
      setCompletionPolicyDraft(CompletionPolicy.KEEP);
    }
  }, [taskBehaviorDraft]);

  const isFinishedList = list?.type === ListType.FINISHED;
  const isTrashList = list?.type === ListType.TRASH;

  // Optimistic Action Queue
  const pendingActions = useRef<
    Record<string, Array<(realId: string) => void>>
  >({});

  const handleOptimisticAction = useCallback(
    (taskId: string, action: (id: string) => void) => {
      if (taskId.startsWith('temp-')) {
        // Optimistic task: Queue the action
        if (!pendingActions.current[taskId]) {
          pendingActions.current[taskId] = [];
        }
        pendingActions.current[taskId].push(action);
      } else {
        // Real task: Execute immediately
        action(taskId);
      }
    },
    []
  );

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Mutations
  const updateListMutation = useMutation<
    ListWithSystemFlag,
    ApiError,
    { id: string; data: UpdateToDoListDto },
    { previousList?: ListWithSystemFlag; previousLists?: ListWithSystemFlag[] }
  >({
    mutationFn: ({ id, data }) => listsService.updateList(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['list', id] });
      await queryClient.cancelQueries({ queryKey: ['lists'] });

      const previousList = queryClient.getQueryData<ListWithSystemFlag>([
        'list',
        id,
      ]);
      const previousLists = queryClient.getQueryData<ListWithSystemFlag[]>([
        'lists',
      ]);

      if (previousList) {
        queryClient.setQueryData<ListWithSystemFlag>(['list', id], {
          ...previousList,
          ...data,
        });
      }

      if (previousLists) {
        queryClient.setQueryData<ListWithSystemFlag[]>(['lists'], (old = []) =>
          old.map((l) =>
            (l.id as string) === (id as string) ? { ...l, ...data } : l
          )
        );
      }

      return { previousList, previousLists };
    },
    onSuccess: () => {
      toast.success(t('common.saved', { defaultValue: 'Saved' }));
    },
    onError: (err, vars, ctx) => {
      if (ctx?.previousList) {
        queryClient.setQueryData(['list', vars.id], ctx.previousList);
      }
      if (ctx?.previousLists) {
        queryClient.setQueryData(['lists'], ctx.previousLists);
      }
      toast.error(formatApiError(err, t('tasks.listUpdateFailed')));
    },
    onSettled: async (_data, _err, vars) => {
      await queryClient.invalidateQueries({ queryKey: ['list', vars.id] });
      await queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });

  const deleteListMutation = useMutation<
    ListWithSystemFlag,
    ApiError,
    { id: string },
    { previousLists?: ListWithSystemFlag[] }
  >({
    mutationFn: ({ id }) => listsService.deleteList(id),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ['lists'] });
      const previousLists = queryClient.getQueryData<ListWithSystemFlag[]>([
        'lists',
      ]);
      queryClient.setQueryData<ListWithSystemFlag[]>(['lists'], (old = []) =>
        old.filter((l) => (l.id as string) !== (id as string))
      );
      return { previousLists };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['lists'] });
      toast.success(t('tasks.listDeleted'));
      navigate('/lists');
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previousLists) {
        queryClient.setQueryData(['lists'], ctx.previousLists);
      }
      toast.error(formatApiError(err, t('tasks.listDeleteFailed')));
    },
  });

  const createTaskMutation = useMutation<
    Task,
    ApiError,
    CreateTaskDto,
    { previousTasks?: Task[]; tempId?: string }
  >({
    mutationFn: (data) => tasksService.createTask(effectiveListId!, data),
    onMutate: async (data) => {
      if (!effectiveListId) return { previousTasks: undefined };

      // Hide the create form immediately when user submits
      setShowCreate(false);
      setNewTaskDescription('');

      await queryClient.cancelQueries({ queryKey: ['tasks', effectiveListId] });

      const previousTasks = queryClient.getQueryData<Task[]>([
        'tasks',
        effectiveListId,
      ]);

      const now = new Date().toISOString();
      const tempId = `temp-${Date.now()}`; // Generate temp ID
      const optimistic: Task = {
        id: tempId as string,
        description: data.description,
        completed: false,
        completedAt: null,
        todoListId: effectiveListId as string,
        order: Date.now(),
        dueDate: null,
        reminderDaysBefore: [],
        specificDayOfWeek: null,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        steps: [],
      };

      queryClient.setQueryData<Task[]>(
        ['tasks', effectiveListId],
        (old = []) => [optimistic, ...old]
      );

      return { previousTasks, tempId };
    },
    onError: (err, _data, ctx) => {
      if (effectiveListId && ctx?.previousTasks) {
        queryClient.setQueryData(['tasks', effectiveListId], ctx.previousTasks);
      }
      // Show the create form again on error so user can retry
      setShowCreate(true);
      toast.error(formatApiError(err, t('tasks.createFailed')));
    },
    onSuccess: (newTask, _vars, ctx) => {
      // Replace the optimistic task with the real one from the server
      if (effectiveListId) {
        queryClient.setQueryData<Task[]>(
          ['tasks', effectiveListId],
          (old = []) => {
            // Remove any temporary tasks (negative IDs) and add the real task
            const withoutTemp = old.filter(
              (task) => (task.id as string) !== (ctx.tempId as string)
            );
            return [newTask, ...withoutTemp];
          }
        );
      }

      // Process Pending Actions
      if (ctx?.tempId && pendingActions.current[ctx.tempId]) {
        const actions = pendingActions.current[ctx.tempId];
        // Execute all queued actions with the REAL ID
        actions.forEach((action) => action(newTask.id as string));
        // Cleanup
        delete pendingActions.current[ctx.tempId];
      }
    },
    onSettled: async () => {
      if (effectiveListId) {
        await queryClient.invalidateQueries({
          queryKey: ['tasks', effectiveListId],
        });
      }
    },
  });

  const updateTaskMutation = useQueuedMutation<
    Task,
    ApiError,
    { id: string; data: UpdateTaskDto },
    { previousTasks?: Task[]; previousTask?: Task }
  >({
    mutationFn: ({ id, data }) => tasksService.updateTask(id, data),
    onMutate: async ({ id, data }) => {
      const previousTasks = effectiveListId
        ? queryClient.getQueryData<Task[]>(['tasks', effectiveListId])
        : undefined;
      const previousTask = queryClient.getQueryData<Task>(['task', id]);
      const currentList = effectiveListId
        ? queryClient.getQueryData<ListWithSystemFlag>([
            'list',
            effectiveListId,
          ])
        : undefined;

      const now = new Date().toISOString();

      // Only perform optimistic updates if NOT renaming (changing description)
      if (!data.description) {
        if (effectiveListId) {
          queryClient.setQueryData<Task[]>(
            ['tasks', effectiveListId],
            (old = []) => {
              // Check if task should be removed based on completion policy
              if (
                data.completed &&
                (currentList?.completionPolicy === 'MOVE_TO_DONE' ||
                  currentList?.completionPolicy === 'AUTO_DELETE')
              ) {
                return old.filter((t) => t.id !== id);
              }
              // Otherwise update in place
              return old.map((t) =>
                (t.id as string) === (id as string)
                  ? { ...t, ...data, updatedAt: now }
                  : t
              );
            }
          );
        }

        if (previousTask) {
          queryClient.setQueryData<Task>(['task', id], {
            ...previousTask,
            ...data,
            updatedAt: now,
          });
        }
      }

      return { previousTasks, previousTask };
    },
    onError: (err, vars, ctx) => {
      if (effectiveListId && ctx?.previousTasks) {
        queryClient.setQueryData(['tasks', effectiveListId], ctx.previousTasks);
      }
      if (ctx?.previousTask) {
        queryClient.setQueryData(['task', vars.id], ctx.previousTask);
      }
      toast.error(formatApiError(err, t('taskDetails.updateTaskFailed')));
    },
    onSettled: async (_data, _err, vars) => {
      if (effectiveListId) {
        await queryClient.invalidateQueries({
          queryKey: ['tasks', effectiveListId],
        });
      }
      await queryClient.invalidateQueries({ queryKey: ['task', vars.id] });
    },
  });

  const deleteTaskMutation = useMutation<
    Task,
    ApiError,
    string,
    { previousTasks?: Task[] }
  >({
    mutationFn: (id) => tasksService.deleteTask(id),
    onMutate: async (id) => {
      if (!effectiveListId) return { previousTasks: undefined };
      const previousTasks = queryClient.getQueryData<Task[]>([
        'tasks',
        effectiveListId,
      ]);
      queryClient.setQueryData<Task[]>(['tasks', effectiveListId], (old = []) =>
        old.filter((t) => t.id !== id)
      );
      return { previousTasks };
    },
    onError: (err, _vars, ctx) => {
      if (effectiveListId && ctx?.previousTasks) {
        queryClient.setQueryData(['tasks', effectiveListId], ctx.previousTasks);
      }
      toast.error(formatApiError(err, t('tasks.deleteFailed')));
    },
    onSuccess: () => {
      toast.success(t('tasks.taskDeleted'));
    },
    onSettled: async () => {
      if (effectiveListId) {
        await queryClient.invalidateQueries({
          queryKey: ['tasks', effectiveListId],
        });
      }
    },
  });

  // Reorder Mutation
  const reorderMutation = useMutation({
    mutationFn: (reorderedTasks: { id: string; order: number }[]) =>
      tasksService.reorderTasks(reorderedTasks),
    onSuccess: () => {
      if (effectiveListId) {
        queryClient.invalidateQueries({ queryKey: ['tasks', effectiveListId] });
      }
    },
  });

  // Bulk Mutations
  const bulkUpdateMutation = useMutation({
    mutationFn: ({ ids, data }: { ids: string[]; data: UpdateTaskDto }) =>
      tasksService.bulkUpdate(ids, data),
    onSuccess: () => {
      toast.success(t('tasks.bulk.updated', { defaultValue: 'Tasks updated' }));
      setIsBulkMode(false);
      setSelectedTasks(new Set());
      if (effectiveListId) {
        queryClient.invalidateQueries({ queryKey: ['tasks', effectiveListId] });
      }
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => tasksService.bulkDelete(ids),
    onSuccess: () => {
      toast.success(t('tasks.bulk.deleted', { defaultValue: 'Tasks deleted' }));
      setIsBulkMode(false);
      setSelectedTasks(new Set());
      if (effectiveListId) {
        queryClient.invalidateQueries({ queryKey: ['tasks', effectiveListId] });
      }
    },
  });

  // Handlers
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = sortedTasks.findIndex((t) => t.id === active.id);
      const newIndex = sortedTasks.findIndex((t) => t.id === over.id);

      const newTasks = arrayMove(sortedTasks, oldIndex, newIndex);

      // Optimistically update query data
      queryClient.setQueryData(['tasks', effectiveListId], newTasks);

      // Prepare updates for backend
      // We only strictly need to update the orders to reflect the new sequence.
      // For simplicity, we can just assign new orders based on index.
      const updates = newTasks.map((task, index) => ({
        id: task.id,
        order: index + 1,
      }));

      reorderMutation.mutate(updates);
    },
    [sortedTasks, effectiveListId, queryClient, reorderMutation]
  );

  const toggleBulkMode = () => {
    setIsBulkMode(!isBulkMode);
    setSelectedTasks(new Set());
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const toggleAllTasks = () => {
    if (selectedTasks.size === tasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(tasks.map((t) => t.id)));
    }
  };

  // Show loading skeleton ONLY during initial load (not during background refetches)
  if (isLoading) {
    return (
      <div className="animate-fade-in space-y-8">
        <Skeleton className="h-6 w-32" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-16 w-full premium-card" />
          <Skeleton className="h-16 w-full premium-card" />
          <Skeleton className="h-16 w-full premium-card" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl bg-accent-danger/10 border border-accent-danger/20 p-6 text-center">
        <p className="text-accent-danger font-bold">
          {formatApiError(error, t('tasks.loadFailed'))}
        </p>
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto pb-24 ${isRtl ? 'rtl' : 'ltr'}`}>
      {/* Subtle loading indicator during background refetches */}
      {isRefetching && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-accent/20">
          <div
            className="h-full bg-accent animate-pulse"
            style={{ width: '30%' }}
          ></div>
        </div>
      )}

      <div className="mb-8 animate-slide-up">
        <Link
          to="/lists"
          className={`inline-flex items-center gap-2 text-accent hover:text-accent/80 font-semibold text-sm transition-all ${isRtl ? 'flex-row-reverse' : ''}`}
        >
          <span className={isRtl ? 'rotate-180' : ''}>←</span>
          {t('tasks.backToLists')}
        </Link>
      </div>

      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 animate-slide-up"
        style={{ animationDelay: '0.1s' }}
      >
        <div className="min-w-0 flex-1">
          {isEditingListName ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!list || !listNameDraft.trim()) return;
                setIsEditingListName(false); // Close immediately (Optimistic)
                updateListMutation.mutate({
                  id: list.id,
                  data: {
                    name: listNameDraft.trim(),
                    taskBehavior: taskBehaviorDraft,
                    completionPolicy: completionPolicyDraft,
                  },
                });
              }}
              className="flex flex-col gap-4 premium-card p-6"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label
                    htmlFor="list-name-input"
                    className="block text-xs font-semibold uppercase tracking-wide text-tertiary mb-2"
                  >
                    {t('lists.form.nameLabel')}
                  </label>
                  <input
                    id="list-name-input"
                    aria-label="List Name"
                    value={listNameDraft}
                    onChange={(e) => setListNameDraft(e.target.value)}
                    autoFocus
                    className="w-full text-2xl font-bold bg-transparent border-b-2 border-accent focus:outline-none text-primary"
                  />
                </div>
                <div className="sm:w-48">
                  <label
                    htmlFor="list-behavior-select"
                    className="block text-xs font-semibold uppercase tracking-wide text-tertiary mb-2"
                  >
                    {t('lists.form.behaviorLabel')}
                  </label>
                  <select
                    id="list-behavior-select"
                    aria-label="Task Behavior"
                    value={taskBehaviorDraft}
                    onChange={(e) =>
                      setTaskBehaviorDraft(e.target.value as TaskBehavior)
                    }
                    className="premium-input w-full text-sm"
                  >
                    <option value={TaskBehavior.RECURRING}>
                      {t('lists.form.behaviorRecurring')}
                    </option>
                    <option value={TaskBehavior.ONE_OFF}>
                      {t('lists.form.behaviorOneOff')}
                    </option>
                  </select>
                </div>
                <div className="sm:w-48">
                  <label
                    htmlFor="list-policy-select"
                    className="block text-xs font-semibold uppercase tracking-wide text-tertiary mb-2"
                  >
                    {t('lists.form.policyLabel')}
                  </label>
                  <select
                    id="list-policy-select"
                    aria-label="Completion Policy"
                    value={completionPolicyDraft}
                    onChange={(e) =>
                      setCompletionPolicyDraft(
                        e.target.value as CompletionPolicy
                      )
                    }
                    disabled={taskBehaviorDraft === TaskBehavior.RECURRING}
                    className="premium-input w-full text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    title={
                      taskBehaviorDraft === TaskBehavior.RECURRING
                        ? 'Recurring tasks must use "Keep tasks" policy'
                        : ''
                    }
                  >
                    <option value={CompletionPolicy.MOVE_TO_DONE}>
                      {t('lists.form.policyMoveToDone', {
                        defaultValue: 'Move to Done',
                      })}
                    </option>
                    <option value={CompletionPolicy.KEEP}>
                      {t('lists.form.policyKeep')}
                    </option>
                    <option value={CompletionPolicy.AUTO_DELETE}>
                      {t('lists.form.policyDelete')}
                    </option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingListName(false)}
                  className="px-6 py-2.5 bg-hover border border-border-subtle text-primary rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-surface transition-all active:scale-95"
                >
                  {t('common.cancel')}
                </button>
                <button type="submit" className="premium-button px-8">
                  {t('common.save')}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center gap-4">
              <h1
                className="text-4xl font-bold text-primary cursor-pointer hover:text-accent transition-colors flex items-center gap-3 break-words whitespace-normal leading-snug pb-2"
                onClick={() => {
                  if (!list?.isSystem) {
                    setListNameDraft(list?.name || '');
                    setTaskBehaviorDraft(
                      list?.taskBehavior || TaskBehavior.ONE_OFF
                    );
                    setCompletionPolicyDraft(
                      list?.completionPolicy || CompletionPolicy.MOVE_TO_DONE
                    );
                    setIsEditingListName(true);
                  }
                }}
              >
                {list?.name ?? t('tasks.defaultTitle')}

                {!list?.isSystem && (
                  <svg
                    className="w-5 h-5 opacity-20"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                )}
              </h1>

              {!isTrashView && list && !list.isSystem && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSharing(true);
                  }}
                  className="p-2 rounded-xl bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 transition-all flex items-center gap-2 text-sm font-bold uppercase tracking-wide"
                  title={t('sharing.title')}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                  </svg>
                  <span className="hidden sm:inline">
                    {t('sharing.shareButton')}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleBulkMode}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isBulkMode ? 'bg-accent text-white' : 'bg-hover text-primary hover:bg-accent/10'}`}
          >
            {isBulkMode
              ? t('common.cancel')
              : t('tasks.bulk.mode', { defaultValue: 'Bulk Actions' })}
          </button>

          {list && !list.isSystem && !isBulkMode && (
            <button
              onClick={() => {
                if (
                  window.confirm(
                    t('tasks.deleteListConfirm', { name: list.name })
                  )
                ) {
                  deleteListMutation.mutate({ id: list.id });
                }
              }}
              className="p-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
              title={t('tasks.deleteList')}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {isBulkMode && (
        <div className="animate-slide-down">
          <BulkActionsBar
            isRtl={isRtl}
            selectedCount={selectedTasks.size}
            allTasks={tasks}
            selectedTasks={selectedTasks}
            onToggleSelectAll={toggleAllTasks}
            onMarkComplete={() =>
              bulkUpdateMutation.mutate({
                ids: Array.from(selectedTasks),
                data: { completed: true },
              })
            }
            onMarkIncomplete={() =>
              bulkUpdateMutation.mutate({
                ids: Array.from(selectedTasks),
                data: { completed: false },
              })
            }
            onDeleteSelected={() =>
              bulkDeleteMutation.mutate(Array.from(selectedTasks))
            }
            isFinishedList={isFinishedList}
          />
        </div>
      )}

      {showCreate &&
        !isBulkMode &&
        !isTrashView &&
        !isTrashList &&
        !isFinishedList && (
          <div className="premium-card p-6 mb-8 animate-scale-in">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newTaskDescription.trim() && effectiveListId) {
                  createTaskMutation.mutate({
                    description: newTaskDescription.trim(),
                  });
                }
              }}
            >
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  autoFocus
                  aria-label="new-task-input"
                  className="premium-input flex-1"
                  placeholder={t('tasks.placeholder', {
                    defaultValue: 'What needs to be done?',
                  })}
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={
                      createTaskMutation.isPending || !newTaskDescription.trim()
                    }
                    className="px-6 py-3 bg-accent text-white rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {t('common.create')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="px-6 py-3 bg-gray-100 dark:bg-[#2a2a2a] text-gray-900 dark:text-white rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div
          className="space-y-4 animate-slide-up"
          style={{ animationDelay: '0.2s' }}
        >
          {/* Add Task Button - Always First */}
          {!showCreate &&
            !isBulkMode &&
            !isFinishedList &&
            !isTrashList &&
            !isTrashView && (
              <button
                onClick={() => setShowCreate(true)}
                aria-label="create-task-button"
                className="w-full h-16 rounded-2xl border-2 border-dashed border-border-subtle hover:border-accent hover:bg-accent/5 flex items-center justify-center gap-3 transition-all duration-200 group"
              >
                <div className="w-8 h-8 rounded-full bg-hover group-hover:bg-accent group-hover:text-white flex items-center justify-center transition-all">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <span className="text-sm font-semibold uppercase tracking-wider text-tertiary group-hover:text-accent transition-colors">
                  {t('common.createTask', { defaultValue: 'New Task' })}
                </span>
              </button>
            )}
          <SortableContext
            items={sortedTasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {/* Grouping Logic for Trash and Done Lists */}
            {isTrashView || isFinishedList
              ? Object.entries(
                  sortedTasks.reduce(
                    (groups, task) => {
                      // For Done list, group by originalListId. for Trash, group by todoListId
                      const sourceListId = isFinishedList
                        ? task.originalListId || 'unknown'
                        : task.todoListId;

                      const listName =
                        allLists.find((l) => l.id === sourceListId)?.name ||
                        (sourceListId === 'unknown'
                          ? t('tasks.unknownList', {
                              defaultValue: 'Unknown List',
                            })
                          : sourceListId); // Show ID if name not found

                      if (!groups[listName]) {
                        groups[listName] = { oneOff: [], recurring: [] };
                      }

                      // Get the source list to check task behavior
                      const sourceList = allLists.find(
                        (l) => l.id === sourceListId
                      );
                      const isRecurring =
                        sourceList?.taskBehavior === 'RECURRING';

                      if (isRecurring) {
                        groups[listName].recurring.push(task);
                      } else {
                        groups[listName].oneOff.push(task);
                      }
                      return groups;
                    },
                    {} as Record<string, { oneOff: Task[]; recurring: Task[] }>
                  )
                ).map(([listName, groupTasks]) => (
                  <div key={listName} className="mb-8 animate-slide-up">
                    <h3 className="text-sm font-bold text-tertiary uppercase tracking-wider mb-4 px-1">
                      {listName}
                    </h3>

                    {/* One-off Tasks Section */}
                    {groupTasks.oneOff.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2 px-1 opacity-70">
                          {t('tasks.oneOffTasks')}
                        </h4>
                        <div className="space-y-2">
                          {groupTasks.oneOff.map((task) => (
                            <SortableTaskItem
                              key={task.id}
                              task={task}
                              isBulkMode={isBulkMode}
                              isSelected={selectedTasks.has(task.id)}
                              isFinishedList={isFinishedList}
                              isRtl={isRtl}
                              isOptimistic={task.id.startsWith('temp-')}
                              onToggleSelect={() =>
                                toggleTaskSelection(task.id)
                              }
                              onToggleComplete={() =>
                                handleOptimisticAction(task.id, (id) =>
                                  updateTaskMutation.mutate({
                                    id,
                                    data: { completed: !task.completed },
                                  })
                                )
                              }
                              onDelete={() =>
                                handleOptimisticAction(task.id, (id) =>
                                  deleteTaskMutation.mutate(id)
                                )
                              }
                              onRestore={() =>
                                handleOptimisticAction(task.id, (id) =>
                                  restoreTaskMutation.mutate(id)
                                )
                              }
                              onPermanentDelete={() => {
                                if (
                                  window.confirm(
                                    t('tasks.deleteForeverConfirm', {
                                      description: task.description,
                                    })
                                  )
                                ) {
                                  handleOptimisticAction(task.id, (id) =>
                                    permanentDeleteTaskMutation.mutate(id)
                                  );
                                }
                              }}
                              onClick={() => {
                                // Prevent navigation for optimistic tasks
                                if (task.id.startsWith('temp-')) {
                                  return;
                                }
                                navigate(`/tasks/${task.id}`);
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recurring Tasks Section */}
                    {groupTasks.recurring.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2 px-1 opacity-70">
                          {t('tasks.recurringTasks')}
                        </h4>
                        <div className="space-y-2">
                          {groupTasks.recurring.map((task) => (
                            <SortableTaskItem
                              key={task.id}
                              task={task}
                              isBulkMode={isBulkMode}
                              isSelected={selectedTasks.has(task.id)}
                              isFinishedList={isFinishedList}
                              isRtl={isRtl}
                              isOptimistic={task.id.startsWith('temp-')}
                              onToggleSelect={() =>
                                toggleTaskSelection(task.id)
                              }
                              onToggleComplete={() =>
                                handleOptimisticAction(task.id, (id) =>
                                  updateTaskMutation.mutate({
                                    id,
                                    data: { completed: !task.completed },
                                  })
                                )
                              }
                              onDelete={() =>
                                handleOptimisticAction(task.id, (id) =>
                                  deleteTaskMutation.mutate(id)
                                )
                              }
                              onRestore={() =>
                                handleOptimisticAction(task.id, (id) =>
                                  restoreTaskMutation.mutate(id)
                                )
                              }
                              onPermanentDelete={() => {
                                if (
                                  window.confirm(
                                    t('tasks.deleteForeverConfirm', {
                                      description: task.description,
                                    })
                                  )
                                ) {
                                  handleOptimisticAction(task.id, (id) =>
                                    permanentDeleteTaskMutation.mutate(id)
                                  );
                                }
                              }}
                              onClick={() => {
                                // Prevent navigation for optimistic tasks
                                if (task.id.startsWith('temp-')) {
                                  return;
                                }
                                navigate(`/tasks/${task.id}`);
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              : // Standard View (No Grouping)
                sortedTasks.map((task) => (
                  <SortableTaskItem
                    key={task.id}
                    task={task}
                    isBulkMode={isBulkMode}
                    isSelected={selectedTasks.has(task.id)}
                    isFinishedList={isFinishedList}
                    isRtl={isRtl}
                    isOptimistic={task.id.startsWith('temp-')}
                    onToggleSelect={() => toggleTaskSelection(task.id)}
                    onToggleComplete={() =>
                      handleOptimisticAction(task.id, (id) =>
                        updateTaskMutation.mutate({
                          id,
                          data: { completed: !task.completed },
                        })
                      )
                    }
                    onDelete={() =>
                      handleOptimisticAction(task.id, (id) =>
                        deleteTaskMutation.mutate(id)
                      )
                    }
                    onRestore={() =>
                      handleOptimisticAction(task.id, (id) =>
                        restoreTaskMutation.mutate(id)
                      )
                    }
                    onPermanentDelete={() => {
                      if (
                        window.confirm(
                          t('tasks.deleteForeverConfirm', {
                            description: task.description,
                          })
                        )
                      ) {
                        permanentDeleteTaskMutation.mutate(task.id);
                      }
                    }}
                    onClick={() => navigate(`/tasks/${task.id}`)}
                  />
                ))}
          </SortableContext>
        </div>
      </DndContext>

      {tasks.length === 0 && !isLoading && (
        <div className="text-center py-20 animate-fade-in">
          <div className="w-20 h-20 bg-hover rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-tertiary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-primary">
            {isTrashView
              ? t('tasks.trashEmpty', { defaultValue: 'Trash is empty' })
              : t('tasks.empty')}
          </h2>
          <p className="mt-2 text-secondary">
            {isTrashView
              ? t('tasks.trashDescription', {
                  defaultValue: 'Tasks you delete will appear here.',
                })
              : t('tasks.form.descriptionPlaceholder')}
          </p>
        </div>
      )}
      {/* Share Modal */}
      {isSharing && list && (
        <ShareListModal
          listId={list.id}
          listName={list.name}
          onClose={() => setIsSharing(false)}
        />
      )}
    </div>
  );
}
