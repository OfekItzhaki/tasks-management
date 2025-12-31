import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listsService } from '../services/lists.service';
import { ToDoList } from '@tasks-management/frontend-services';

export default function ListsPage() {
  const [lists, setLists] = useState<ToDoList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    try {
      setLoading(true);
      const data = await listsService.getAllLists();
      setLists(data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load lists');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading lists...</div>;
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-800">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Todo Lists</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lists.map((list) => (
          <Link
            key={list.id}
            to={`/lists/${list.id}/tasks`}
            className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-900">{list.name}</h3>
            <p className="mt-2 text-sm text-gray-500">Type: {list.type}</p>
          </Link>
        ))}
      </div>

      {lists.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No lists found. Create your first list!</p>
        </div>
      )}
    </div>
  );
}
