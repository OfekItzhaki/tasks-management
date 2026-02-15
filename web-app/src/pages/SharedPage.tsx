import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    TaskShare,
    ApiError,
    taskSharingService,
    sharingService,
    ToDoList,
} from '@tasks-management/frontend-services';

export default function SharedPage() {
    const { user } = useAuth();

    const { data: sharedTasks = [], isLoading: isLoadingTasks } = useQuery<TaskShare[], ApiError>({
        queryKey: ['sharedTasks'],
        queryFn: () => taskSharingService.getTasksSharedWithMe(),
    });

    const { data: sharedLists = [], isLoading: isLoadingLists } = useQuery<ToDoList[], ApiError>({
        queryKey: ['sharedLists', user?.id],
        queryFn: () => user ? sharingService.getSharedLists(user.id) : Promise.resolve([]),
        enabled: !!user,
    });

    const isLoading = isLoadingTasks || isLoadingLists;

    // Filter tasks that are NOT part of a shared list (orphans)
    const sharedListIds = new Set(sharedLists.map(l => l.id));
    const orphanTasks = sharedTasks.filter(share => !sharedListIds.has(share.task?.todoListId || ''));

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                </div>
            </div>
        );
    }

    if (sharedTasks.length === 0 && sharedLists.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center py-16">
                    <h2 className="text-2xl font-bold text-primary mb-4">No Shared Content</h2>
                    <p className="text-tertiary">
                        Tasks shared with you will appear here.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-4xl font-black mb-12 bg-gradient-to-r from-accent to-accent/60 bg-clip-text text-transparent">
                Shared with Me
            </h1>

            {/* Shared Tasks Section */}
            <div>
                <h2 className="text-sm font-bold text-tertiary uppercase tracking-wider mb-4 px-1">
                    Shared Lists & Tasks
                </h2>
                <div className="space-y-6">
                    {/* Shared Tasks Virtual List Card - Only show if there are orphan tasks */}
                    {orphanTasks.length > 0 && (
                        <div className="premium-card p-6">
                            <Link
                                to="/lists/shared/tasks"
                                className="block group"
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-primary group-hover:text-accent transition-colors">
                                        Shared Tasks
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-tertiary">
                                            {orphanTasks.length} tasks
                                        </span>
                                        <span className="text-xs text-secondary bg-surface px-2 py-1 rounded border border-border-subtle group-hover:border-accent transition-colors">
                                            View All
                                        </span>
                                    </div>
                                </div>
                                <p className="text-sm text-tertiary mt-2">
                                    View individual tasks shared with you.
                                </p>
                            </Link>
                        </div>
                    )}

                    {Object.entries(
                        sharedTasks
                            .filter((share) => share.task && share.task.todoList)
                            .reduce((acc, share) => {
                                const listName = share.task!.todoList!.name;
                                if (!acc[listName]) acc[listName] = [];
                                acc[listName].push(share);
                                return acc;
                            }, {} as Record<string, TaskShare[]>)
                    ).map(([listName, tasks]) => {
                        // Assuming all tasks in this group belong to the same list. 
                        // Note: Ideally we should have a list object here. 
                        // Since we are grouping by name, we take the first task's list ID.
                        const listId = tasks[0]?.task?.todoListId;

                        return (
                            <div key={listName} className="premium-card p-6">
                                <Link
                                    to={`/lists/${listId}/tasks`}
                                    className="block group"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-primary group-hover:text-accent transition-colors">
                                            {listName}
                                        </h3>
                                        <span className="text-xs text-secondary bg-surface px-2 py-1 rounded border border-border-subtle group-hover:border-accent transition-colors">
                                            View List
                                        </span>
                                    </div>
                                </Link>

                                <div className="space-y-2">
                                    {tasks.map((share) => (
                                        <Link
                                            key={share.task!.id}
                                            to={`/lists/${share.task!.todoListId}/tasks?taskId=${share.task!.id}`} // Optional: Highlight task
                                            className="block p-3 rounded-lg bg-hover border border-border-subtle hover:border-accent transition-all cursor-pointer"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-primary">{share.task!.description}</span>
                                                <span className="text-xs text-tertiary uppercase px-2 py-1 bg-surface rounded">
                                                    {share.role}
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
