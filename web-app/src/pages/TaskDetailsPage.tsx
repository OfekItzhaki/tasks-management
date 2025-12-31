import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { tasksService } from '../services/tasks.service';
import { Task } from '@tasks-management/frontend-services';

export default function TaskDetailsPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (taskId) {
      loadTask();
    }
  }, [taskId]);

  const loadTask = async () => {
    if (!taskId) return;

    try {
      setLoading(true);
      const data = await tasksService.getTaskById(parseInt(taskId));
      setTask(data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load task');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading task...</div>;
  }

  if (error || !task) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-800">{error || 'Task not found'}</div>
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
        <div className="flex items-center space-x-3 mb-4">
          <input
            type="checkbox"
            checked={task.completed}
            readOnly
            className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <h1 className="text-2xl font-bold text-gray-900">{task.description}</h1>
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
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded"
                >
                  <input
                    type="checkbox"
                    checked={step.completed}
                    readOnly
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span
                    className={step.completed ? 'line-through text-gray-500' : 'text-gray-900'}
                  >
                    {step.description}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
