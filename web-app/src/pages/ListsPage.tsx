import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { listsService } from '../services/lists.service';
import { tasksService } from '../services/tasks.service';
import { ToDoList, ApiError, ListType } from '@tasks-management/frontend-services';
import { handleApiError, extractErrorMessage } from '../utils/errorHandler';
import FloatingActionButton from '../components/FloatingActionButton';
import Skeleton from '../components/Skeleton';
import { useTranslation } from 'react-i18next';
import { useKeyboardShortcuts } from '../utils/useKeyboardShortcuts';
import { isRtlLanguage } from '@tasks-management/frontend-services';

export default function ListsPage() {
  const { t, i18n } = useTranslation();
  const isRtl = isRtlLanguage(i18n.language);
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newListName, setNewListName] = useState('');

  const {
    data: lists = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<ToDoList[], ApiError>({
    queryKey: ['lists'],
    queryFn: () => listsService.getAllLists(),
    staleTime: 5 * 60 * 1000, // 5 minutes - lists don't change often
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache longer
  });

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'n',
      handler: () => {
        if (!showCreate) {
          setShowCreate(true);
        }
      },
      description: 'Create new list',
    },
    {
      key: 'Escape',
      handler: () => {
        if (showCreate) {
          setShowCreate(false);
          setNewListName('');
        }
      },
      description: 'Cancel creating list',
    },
  ]);

  const createListMutation = useMutation<
    ToDoList,
    ApiError,
    { name: string },
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
        ownerId: 0,
        order: Date.now(),
        // User-created lists are always CUSTOM (type is an internal backend detail).
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
      handleApiError(err, t('lists.createFailed', { defaultValue: 'Failed to create list. Please try again.' }));
    },
    onSuccess: () => {
      setNewListName('');
      setShowCreate(false);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });

  // Consolidated prefetch handler - prevents duplicate API calls
  const handlePrefetch = useCallback(
    (listId: number) => {
      // Only prefetch if not already in cache or stale
      const tasksQuery = queryClient.getQueryState(['tasks', listId]);
      const listQuery = queryClient.getQueryState(['list', listId]);

      if (!tasksQuery?.data || tasksQuery.isStale) {
        void queryClient.prefetchQuery({
          queryKey: ['tasks', listId],
          queryFn: () => tasksService.getTasksByList(listId),
          staleTime: 2 * 60 * 1000, // 2 minutes
        });
      }

      if (!listQuery?.data || listQuery.isStale) {
        void queryClient.prefetchQuery({
          queryKey: ['list', listId],
          queryFn: () => listsService.getListById(listId),
          staleTime: 5 * 60 * 1000, // 5 minutes
        });
      }
    },
    [queryClient],
  );

  // Memoize keyboard shortcuts to prevent recreation
  const keyboardShortcuts = useMemo(
    () => [
      {
        key: 'n',
        handler: () => {
          if (!showCreate) {
            setShowCreate(true);
          }
        },
        description: 'Create new list',
      },
      {
        key: 'Escape',
        handler: () => {
          if (showCreate) {
            setShowCreate(false);
            setNewListName('');
          }
        },
        description: 'Cancel creating list',
      },
    ],
    [showCreate],
  );

  useKeyboardShortcuts(keyboardShortcuts);

  if (isLoading) {
    return (
      <div>
        <div className={`flex ${isRtl ? 'flex-row-reverse' : ''} justify-between items-center mb-8 gap-3`}>
          <Skeleton className="h-10 w-56 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="premium-card p-6 animate-pulse">
              <Skeleton className="h-6 w-40 rounded-lg" />
              <Skeleton className="mt-4 h-4 w-24 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
        <div className="text-sm text-red-800 dark:text-red-200 mb-3">
          {extractErrorMessage(error, t('lists.loadFailed', { defaultValue: 'Failed to load lists. Please try again.' }))}
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
        >
          {t('common.retry') || 'Retry'}
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8 gap-3">
        <h1 className="text-4xl font-bold gradient-text">{t('lists.title')}</h1>
      </div>

      {showCreate && (
        <form
          className="premium-card p-6 mb-8 animate-slide-down"
          onSubmit={(e) => {
            e.preventDefault();
            if (!newListName.trim()) return;
            createListMutation.mutate({
              name: newListName.trim(),
            });
          }}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-12 sm:items-end">
            <div className="sm:col-span-10">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t('lists.form.nameLabel')}
              </label>
              <input
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                className="premium-input w-full text-gray-900 dark:text-white"
                placeholder={t('lists.form.namePlaceholder')}
                autoFocus
              />
            </div>
            <div className={`sm:col-span-2 flex ${isRtl ? 'flex-row-reverse' : ''} gap-2`}>
              <button
                type="submit"
                disabled={createListMutation.isPending || !newListName.trim()}
                className="inline-flex flex-1 justify-center rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:from-primary-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 transition-all duration-200"
              >
                {createListMutation.isPending ? t('common.loading') : t('common.create')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false);
                  setNewListName('');
                }}
                className="inline-flex justify-center rounded-xl glass-card px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-200"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            {t('lists.form.tip')}
          </p>
        </form>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {lists.map((list, index) => (
          <Link
            key={list.id}
            to={`/lists/${list.id}/tasks`}
            onMouseEnter={() => handlePrefetch(list.id)}
            onFocus={() => handlePrefetch(list.id)}
            className="premium-card p-6 group animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
                {list.name}
              </h3>
              <svg
                className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transform group-hover:translate-x-1 transition-all duration-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            {list.tasks && list.tasks.length > 0 && (
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                {list.tasks.length} {list.tasks.length === 1 ? 'task' : 'tasks'}
              </p>
            )}
          </Link>
        ))}
      </div>

      {lists.length === 0 && (
        <div className="text-center py-16">
          <div className="premium-card p-12 max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-500/20 to-purple-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-lg">{t('lists.empty')}</p>
          </div>
        </div>
      )}

      <FloatingActionButton
        ariaLabel={t('lists.createFab')}
        onClick={() => setShowCreate(true)}
      />
    </div>
  );
}
