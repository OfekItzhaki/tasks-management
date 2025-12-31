import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { tasksService } from '../services/tasks.service';
import { Task } from '@tasks-management/frontend-services';

export default function TasksPage() {
  const { listId } = useParams<{ listId: string }>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (listId) {
      loadTasks();
    }
  }, [listId]);

  const loadTasks = async () => {
    if (!listId) return;

    try {
      setLoading(true);
      const data = await tasksService.getTasksByList(parseInt(listId));
      setTasks(data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading tasks...</div>;
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
      <div className="mb-6">
        <Link
          to="/lists"
          className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
        >
          ← Back to Lists
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tasks</h1>

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
