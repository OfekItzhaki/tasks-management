import { useQuery } from '@tanstack/react-query';
import { listsService } from '../services/lists.service';
import { tasksService } from '../services/tasks.service';
import { ToDoList, Task } from '@tasks-management/frontend-services';
import { useTranslation } from 'react-i18next';
import Skeleton from '../components/Skeleton';

export default function AnalysisPage() {
  const { t } = useTranslation();

  const { data: lists = [], isLoading: listsLoading, isError: listsError, error: listsErrorObj, refetch: refetchLists } = useQuery<ToDoList[]>({
    queryKey: ['lists'],
    queryFn: () => listsService.getAllLists(),
  });

  const { data: allTasks = [], isLoading: tasksLoading, isError: tasksError, error: tasksErrorObj, refetch: refetchTasks } = useQuery<Task[]>({
    queryKey: ['all-tasks'],
    queryFn: async () => {
      const tasksPromises = lists.map((list) => tasksService.getTasksByListId(list.id));
      const tasksArrays = await Promise.all(tasksPromises);
      return tasksArrays.flat();
    },
    enabled: lists.length > 0,
  });

  const isLoading = listsLoading || tasksLoading;
  const hasError = listsError || tasksError;

  if (hasError && !isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Task Analysis</h1>
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <div className="text-sm text-red-800 dark:text-red-200 mb-3">
            {listsError
              ? `Failed to load lists: ${listsErrorObj?.message || 'Unknown error'}`
              : tasksError
              ? `Failed to load tasks: ${tasksErrorObj?.message || 'Unknown error'}`
              : 'An error occurred'}
          </div>
          <div className="flex gap-3">
            {listsError && (
              <button
                onClick={() => refetchLists()}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                Retry Lists
              </button>
            )}
            {tasksError && (
              <button
                onClick={() => refetchTasks()}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                Retry Tasks
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const completedTasks = allTasks.filter((task) => task.completed);
  const pendingTasks = allTasks.filter((task) => !task.completed);
  const completionRate = allTasks.length > 0 ? (completedTasks.length / allTasks.length) * 100 : 0;

  // Tasks with due dates
  const tasksWithDueDates = allTasks.filter((task) => task.dueDate);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekFromNow = new Date(today);
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  const overdueTasks = tasksWithDueDates.filter((task) => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    return dueDate < today && !task.completed;
  });

  const dueTodayTasks = tasksWithDueDates.filter((task) => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    return dueDate >= today && dueDate < new Date(today.getTime() + 24 * 60 * 60 * 1000) && !task.completed;
  });

  const dueThisWeekTasks = tasksWithDueDates.filter((task) => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    return dueDate >= today && dueDate < weekFromNow && !task.completed;
  });

  // Tasks with steps
  const tasksWithSteps = allTasks.filter((task) => task.steps && task.steps.length > 0);
  const totalSteps = tasksWithSteps.reduce((sum, task) => sum + (task.steps?.length || 0), 0);
  const completedSteps = tasksWithSteps.reduce(
    (sum, task) => sum + (task.steps?.filter((s) => s.completed).length || 0),
    0,
  );
  const stepsCompletionRate = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  const tasksByList = lists.map((list) => {
    const listTasks = allTasks.filter((task) => task.todoListId === list.id);
    return {
      listName: list.name,
      total: listTasks.length,
      completed: listTasks.filter((t) => t.completed).length,
      pending: listTasks.filter((t) => !t.completed).length,
    };
  });

  const tasksByType = lists.reduce((acc, list) => {
    const type = list.type;
    if (!acc[type]) {
      acc[type] = { total: 0, completed: 0, pending: 0 };
    }
    const listTasks = allTasks.filter((task) => task.todoListId === list.id);
    acc[type].total += listTasks.length;
    acc[type].completed += listTasks.filter((t) => t.completed).length;
    acc[type].pending += listTasks.filter((t) => !t.completed).length;
    return acc;
  }, {} as Record<string, { total: number; completed: number; pending: number }>);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#1f1f1f] p-6 rounded-lg shadow">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-[#1f1f1f] p-6 rounded-lg shadow">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Task Analysis</h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1f1f1f] p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Lists</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{lists.length}</p>
        </div>
        <div className="bg-white dark:bg-[#1f1f1f] p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Tasks</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{allTasks.length}</p>
        </div>
        <div className="bg-white dark:bg-[#1f1f1f] p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed</h3>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
            {completedTasks.length}
          </p>
        </div>
        <div className="bg-white dark:bg-[#1f1f1f] p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Completion Rate</h3>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
            {completionRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Due Date Statistics */}
      {tasksWithDueDates.length > 0 && (
        <div className="bg-white dark:bg-[#1f1f1f] p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Due Date Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Overdue</h3>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                {overdueTasks.length}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Due Today</h3>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                {dueTodayTasks.length}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Due This Week</h3>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                {dueThisWeekTasks.length}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">With Due Dates</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {tasksWithDueDates.length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Steps Statistics */}
      {tasksWithSteps.length > 0 && (
        <div className="bg-white dark:bg-[#1f1f1f] p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Steps Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Tasks with Steps</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {tasksWithSteps.length}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Steps Completed</h3>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {completedSteps} / {totalSteps}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Steps Completion</h3>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {stepsCompletionRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tasks by List */}
      <div className="bg-white dark:bg-[#1f1f1f] p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Tasks by List</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-[#1a1a1a]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  List Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Pending
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Progress
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#1f1f1f] divide-y divide-gray-200 dark:divide-[#2a2a2a]">
              {tasksByList.map((item, index) => {
                const progress = item.total > 0 ? (item.completed / item.total) * 100 : 0;
                return (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {item.listName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {item.total}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">
                      {item.completed}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400">
                      {item.pending}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 dark:bg-[#2a2a2a] rounded-full h-2">
                        <div
                          className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tasks by Type */}
      <div className="bg-white dark:bg-[#1f1f1f] p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Tasks by Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(tasksByType).map(([type, stats]) => {
            const progress = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
            return (
              <div key={type} className="border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize mb-2">
                  {type}
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Total:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{stats.total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Completed:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {stats.completed}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Pending:</span>
                    <span className="font-medium text-red-600 dark:text-red-400">
                      {stats.pending}
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 dark:bg-[#2a2a2a] rounded-full h-2">
                      <div
                        className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {progress.toFixed(1)}% complete
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
