import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { listsService } from '../services/lists.service';
import { tasksService } from '../services/tasks.service';
import { ToDoList, Task } from '@tasks-management/frontend-services';
import {
  calculateDailyCompletions,
  calculateStreak,
  calculateTrendData,
  calculateStats,
} from '../utils/analysis-utils';

const EMPTY_LISTS: ToDoList[] = [];
const EMPTY_TASKS: Task[] = [];

export function useAnalysisData() {
  const { i18n } = useTranslation();

  const {
    data: allLists = EMPTY_LISTS,
    isLoading: listsLoading,
    isError: listsError,
    error: listsErrorObj,
    refetch: refetchLists,
  } = useQuery<ToDoList[]>({
    queryKey: ['lists'],
    queryFn: () => listsService.getAllLists(),
  });

  // Filter out system lists that shouldn't be in analytics (Trash, Done)
  const lists = useMemo(() => {
    return allLists.filter((l) => l.type !== 'TRASH' && l.type !== 'FINISHED');
  }, [allLists]);

  const {
    data: allTasks = EMPTY_TASKS,
    isLoading: tasksLoading,
    isError: tasksError,
    error: tasksErrorObj,
    refetch: refetchTasks,
  } = useQuery<Task[]>({
    queryKey: ['all-tasks'],
    queryFn: async () => {
      const tasksPromises = lists.map((list) =>
        tasksService.getTasksByList(list.id)
      );
      const tasksArrays = await Promise.all(tasksPromises);
      return tasksArrays.flat();
    },
    enabled: lists.length > 0,
  });

  const isLoading = listsLoading || tasksLoading;
  const hasError = listsError || tasksError;

  const stats = useMemo(
    () => calculateStats(allTasks, lists),
    [allTasks, lists]
  );
  const dailyCompletions = useMemo(
    () => calculateDailyCompletions(allTasks),
    [allTasks]
  );
  const dailyTrends = useMemo(
    () => calculateTrendData(allTasks, i18n.language),
    [allTasks, i18n.language]
  );

  const currentStreak = useMemo(() => {
    const dailyList = lists.find((list) => list.type === 'DAILY');
    const dailyTasks = dailyList
      ? allTasks.filter((task) => task.todoListId === dailyList.id)
      : [];
    return calculateStreak(dailyTasks);
  }, [lists, allTasks]);

  return {
    lists,
    allTasks,
    isLoading,
    hasError,
    listsError,
    tasksError,
    listsErrorObj,
    tasksErrorObj,
    refetchLists,
    refetchTasks,
    stats,
    dailyCompletions,
    dailyTrends,
    currentStreak,
  };
}
