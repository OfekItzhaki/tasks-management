import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { listsService } from '../services/lists.service';
import { ToDoList, ApiError, ListType } from '@tasks-management/frontend-services';
import { formatApiError } from '../utils/formatApiError';
import FloatingActionButton from '../components/FloatingActionButton';

export default function ListsPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListType, setNewListType] = useState<ListType>(ListType.CUSTOM);

  const listTypeOptions = useMemo(
    () =>
      (Object.values(ListType) as ListType[]).filter(
        (t) => t !== ListType.FINISHED,
      ),
    [],
  );

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
    { name: string; type: ListType }
  >({
    mutationFn: (data) => listsService.createList(data),
    onSuccess: async () => {
      setNewListName('');
      setShowCreate(false);
      await queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
    onError: (err) => {
      toast.error(formatApiError(err, 'Failed to create list'));
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading lists...</div>;
  }

  if (isError) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-800">
          {formatApiError(error, 'Failed to load lists')}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Todo Lists</h1>
      </div>

      {showCreate && (
        <form
          className="bg-white rounded-lg border p-4 mb-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (!newListName.trim()) return;
            createListMutation.mutate({
              name: newListName.trim(),
              type: newListType,
            });
          }}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-end">
            <div className="sm:col-span-7">
              <label className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g. Groceries"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700">
                Type
              </label>
              <select
                value={newListType}
                onChange={(e) => setNewListType(e.target.value as ListType)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {listTypeOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <button
                type="submit"
                disabled={createListMutation.isPending || !newListName.trim()}
                className="inline-flex flex-1 justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createListMutation.isPending ? 'Creating...' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false);
                  setNewListName('');
                  setNewListType(ListType.CUSTOM);
                }}
                className="inline-flex justify-center rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Tip: system “Finished” list is managed automatically.
          </p>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lists.map((list) => (
          <Link
            key={list.id}
            to={`/lists/${list.id}/tasks`}
            className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-900">{list.name}</h3>
          </Link>
        ))}
      </div>

      {lists.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No lists found. Create your first list!</p>
        </div>
      )}

      <FloatingActionButton
        ariaLabel="Create new list"
        onClick={() => setShowCreate(true)}
      />
    </div>
  );
}
