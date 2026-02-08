import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { listsService } from '../services/lists.service';
import { tasksService } from '../services/tasks.service';
import {
  ToDoList,
  ApiError,
  ListType,
  TaskBehavior,
  CompletionPolicy,
} from '@tasks-management/frontend-services';
import { formatApiError } from '../utils/formatApiError';
import Skeleton from '../components/Skeleton';
import { useTranslation } from 'react-i18next';

export default function ListsPage() {
  const [newListName, setNewListName] = useState('');
  const [taskBehavior, setTaskBehavior] = useState<TaskBehavior>(
    TaskBehavior.ONE_OFF
  );
  const [completionPolicy, setCompletionPolicy] = useState<CompletionPolicy>(
    CompletionPolicy.MOVE_TO_DONE
  );
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const {
    data: lists = [],
    isLoading,
    isError,
    error,
  } = useQuery<ToDoList[], ApiError>({
    queryKey: ['lists'],
    queryFn: () => listsService.getAllLists(),
  });

  const createListMutation = useMutation<
    ToDoList,
    ApiError,
    {
      name: string;
      taskBehavior: TaskBehavior;
      completionPolicy: CompletionPolicy;
    },
    { previousLists?: ToDoList[] }
  >({
    mutationFn: (data) => listsService.createList(data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['lists'] });

      const previousLists = queryClient.getQueryData<ToDoList[]>(['lists']);
      const now = new Date().toISOString();
      const tempId = -Date.now();

      const optimistic: ToDoList = {
        id: tempId,
        name: data.name,
        taskBehavior: data.taskBehavior,
        completionPolicy: data.completionPolicy,
        ownerId: 0,
        order: Date.now(),
        type: ListType.CUSTOM,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        tasks: [],
      };

      queryClient.setQueryData<ToDoList[]>(['lists'], (old = []) => [
        optimistic,
        ...old,
      ]);

      return { previousLists };
    },
    onError: (err, _data, ctx) => {
      if (ctx?.previousLists) {
        queryClient.setQueryData(['lists'], ctx.previousLists);
      }
      toast.error(formatApiError(err, t('lists.createFailed')));
    },
    onSuccess: () => {
      setNewListName('');
      setTaskBehavior(TaskBehavior.ONE_OFF);
      setCompletionPolicy(CompletionPolicy.MOVE_TO_DONE);
      setShowCreate(false);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-center">
          <Skeleton className="h-10 w-48 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-40 rounded-2xl bg-surface border border-border-subtle animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl bg-accent-danger/10 border border-accent-danger/20 p-6 text-center">
        <p className="text-accent-danger font-semibold mb-1">
          Error Loading Lists
        </p>
        <div className="text-sm text-accent-danger/80">
          {formatApiError(error, t('lists.loadFailed'))}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary tracking-tight">
          {t('lists.title')}
        </h1>
        <p className="mt-2 text-secondary">Organize your tasks into lists</p>
      </div>

      {/* Create List Form */}
      {showCreate && (
        <div className="mb-6 animate-slide-down">
          <form
            className="premium-card p-6"
            onSubmit={(e) => {
              e.preventDefault();
              if (!newListName.trim()) return;
              createListMutation.mutate({
                name: newListName.trim(),
                taskBehavior,
                completionPolicy,
              });
            }}
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold uppercase tracking-wide text-tertiary mb-2">
                  {t('lists.form.nameLabel')}
                </label>
                <input
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  autoFocus
                  className="premium-input w-full"
                  placeholder={t('lists.form.namePlaceholder')}
                />
              </div>
              <div className="sm:w-48">
                <label className="block text-xs font-semibold uppercase tracking-wide text-tertiary mb-2">
                  {t('lists.form.behaviorLabel')}
                </label>
                <select
                  value={taskBehavior}
                  onChange={(e) =>
                    setTaskBehavior(e.target.value as TaskBehavior)
                  }
                  className="premium-input w-full"
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
                <label className="block text-xs font-semibold uppercase tracking-wide text-tertiary mb-2">
                  {t('lists.form.policyLabel')}
                </label>
                <select
                  value={completionPolicy}
                  onChange={(e) =>
                    setCompletionPolicy(e.target.value as CompletionPolicy)
                  }
                  className="premium-input w-full"
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
              <div className="flex gap-2 sm:items-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreate(false);
                    setNewListName('');
                  }}
                  className="px-4 py-3 rounded-xl bg-hover border border-border-subtle text-secondary font-medium text-sm hover:bg-surface transition-all"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={createListMutation.isPending || !newListName.trim()}
                  className="premium-button"
                >
                  {createListMutation.isPending
                    ? t('common.loading')
                    : t('common.create')}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Lists Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Add List Card - Always First */}
        {!showCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="group h-40 rounded-2xl border-2 border-dashed border-border-subtle hover:border-accent hover:bg-accent/5 flex flex-col items-center justify-center transition-all duration-200 animate-slide-up"
            style={{ animationDelay: '0s' }}
          >
            <div className="w-12 h-12 rounded-full bg-hover group-hover:bg-accent group-hover:text-white flex items-center justify-center transition-all mb-3">
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <span className="text-sm font-semibold uppercase tracking-wider text-tertiary group-hover:text-accent transition-colors">
              {t('common.createList', { defaultValue: 'New List' })}
            </span>
          </button>
        )}
        {lists
          .filter(
            (l) =>
              !l.type ||
              l.type === ListType.CUSTOM ||
              l.type === ListType.DAILY ||
              l.type === ListType.WEEKLY ||
              l.type === ListType.MONTHLY ||
              l.type === ListType.YEARLY
          )
          .map((list, index) => (
            <Link
              key={list.id}
              to={`/lists/${list.id}/tasks`}
              onMouseEnter={() => {
                void queryClient.prefetchQuery({
                  queryKey: ['tasks', list.id],
                  queryFn: () => tasksService.getTasksByList(list.id),
                });
                void queryClient.prefetchQuery({
                  queryKey: ['list', list.id],
                  queryFn: () => listsService.getListById(list.id),
                });
              }}
              className="group relative p-6 h-40 rounded-2xl border-2 border-border-subtle bg-surface hover:border-accent hover:shadow-lg transition-all duration-200 flex flex-col justify-between animate-slide-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* List Content */}
              <div>
                <h3 className="text-xl font-bold text-primary group-hover:text-accent transition-colors line-clamp-2 break-words">
                  {list.name}
                </h3>
              </div>

              {/* Footer with Arrow */}
              <div className="flex justify-between items-center">
                <div className="w-8 h-8 rounded-lg bg-hover group-hover:bg-accent group-hover:text-white flex items-center justify-center transition-all">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
              {/* Accent Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
      </div>

      {/* System Lists Section */}
      {lists.some(
        (l) => l.type === ListType.TRASH || l.type === ListType.FINISHED
      ) && (
        <div
          className="mt-12 animate-slide-up"
          style={{ animationDelay: '0.2s' }}
        >
          <h2 className="text-sm font-bold text-tertiary uppercase tracking-wider mb-4 px-1">
            {t('lists.system', { defaultValue: 'System Lists' })}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lists
              .filter(
                (l) => l.type === ListType.TRASH || l.type === ListType.FINISHED
              )
              .map((list) => (
                <Link
                  key={list.id}
                  to={`/lists/${list.id}/tasks?isTrashView=${list.type === ListType.TRASH}`}
                  className="group relative p-6 h-24 rounded-2xl border border-border-subtle bg-surface hover:border-accent/50 hover:bg-accent/5 transition-all duration-200 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        list.type === ListType.TRASH
                          ? 'bg-red-100 text-red-600 dark:bg-red-900/20'
                          : 'bg-green-100 text-green-600 dark:bg-green-900/20'
                      }`}
                    >
                      {list.type === ListType.TRASH ? (
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      ) : (
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-primary group-hover:text-accent transition-colors">
                      {list.name}
                    </h3>
                  </div>
                  <svg
                    className="w-5 h-5 text-tertiary group-hover:text-accent transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {lists.length === 0 && !showCreate && (
        <div className="text-center py-16">
          <p className="text-lg text-tertiary">{t('lists.empty')}</p>
        </div>
      )}
    </div>
  );
}
