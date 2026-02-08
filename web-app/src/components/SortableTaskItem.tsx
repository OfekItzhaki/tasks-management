import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@tasks-management/frontend-services';
import { useTranslation } from 'react-i18next';

interface SortableTaskItemProps {
  task: Task;
  isBulkMode: boolean;
  isSelected: boolean;
  isFinishedList: boolean;
  isRtl: boolean;
  onToggleSelect: () => void;
  onToggleComplete: () => void;
  onDelete: () => void;
  onRestore: () => void;
  onPermanentDelete: () => void;
  onClick: () => void;
  isOptimistic?: boolean;
}

export function SortableTaskItem({
  task,
  isBulkMode,
  isSelected,
  isFinishedList,
  isRtl,
  onToggleSelect,
  onToggleComplete,
  onDelete,
  onRestore,
  onPermanentDelete,
  onClick,
  isOptimistic = false,
}: SortableTaskItemProps) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: isBulkMode || isFinishedList });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isCompletedRow = task.completed;
  const isDeleted = !!task.deletedAt;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group vibrant-hover-card p-5 mt-4 flex items-center gap-5 transition-all duration-300 ${isRtl ? 'flex-row-reverse' : ''} ${
        isBulkMode
          ? isSelected
            ? 'ring-2 ring-accent shadow-glow bg-accent/5'
            : 'hover:bg-hover cursor-pointer'
          : isDragging
            ? 'cursor-grabbing opacity-60 scale-[1.02] shadow-xl z-50 ring-2 ring-accent'
            : 'cursor-pointer'
      } ${isOptimistic ? 'opacity-60 pointer-events-none' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        if (isBulkMode) {
          onToggleSelect();
        } else {
          onClick();
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (isBulkMode) {
            onToggleSelect();
          } else {
            onClick();
          }
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`${isBulkMode ? (isSelected ? 'Deselect' : 'Select') + ' ' : ''}${task.description}`}
    >
      {/* Selection Checkbox (Bulk Mode) */}
      {isBulkMode && (
        <div
          className={`shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-accent border-accent shadow-lg scale-110' : 'border-border-strong bg-surface'}`}
        >
          {isSelected && (
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
      )}

      {/* Completion Checkbox (Standard Mode) */}
      {!isBulkMode && !isFinishedList && !isDeleted && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!isOptimistic) onToggleComplete();
          }}
          disabled={isOptimistic}
          className={`shrink-0 w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all ${
            isCompletedRow
              ? 'bg-accent-success border-accent-success shadow-lg'
              : 'border-border-strong hover:border-accent bg-surface hover:scale-105 active:scale-95'
          } ${isOptimistic ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
        >
          {isCompletedRow && (
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </button>
      )}

      {/* Drag Handle (Standard Mode) */}
      {!isBulkMode && !isFinishedList && !isDeleted && (
        <div
          {...attributes}
          {...listeners}
          className="shrink-0 cursor-grab active:cursor-grabbing p-1.5 hover:bg-hover rounded-lg opacity-20 group-hover:opacity-100 transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          <svg
            className="w-5 h-5 text-tertiary"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M10 4a2 2 0 110 4 2 2 0 010-4zm4 0a2 2 0 110 4 2 2 0 010-4zm-4 6a2 2 0 110 4 2 2 0 010-4zm4 0a2 2 0 110 4 2 2 0 010-4zm-4 6a2 2 0 110 4 2 2 0 010-4zm4 0a2 2 0 110 4 2 2 0 010-4z" />
          </svg>
        </div>
      )}

      {/* Task Content */}
      <div className={`flex-1 min-w-0 ${isRtl ? 'text-right' : 'text-left'}`}>
        <p
          className={`text-lg font-semibold truncate transition-all duration-300 ${isCompletedRow ? 'text-tertiary line-through' : 'text-primary'}`}
        >
          {task.description}
        </p>
        <div className="flex items-center gap-4 mt-2">
          {task.dueDate && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-accent/5 text-[10px] font-bold uppercase tracking-wider text-accent border border-accent/10">
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {new Date(task.dueDate).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </div>
          )}
          {task.steps && task.steps.length > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-surface border border-border-subtle text-[10px] font-bold uppercase tracking-wider text-secondary">
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
              {task.steps.filter((s) => s.completed).length}/{task.steps.length}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {!isBulkMode && (
        <div
          className={`flex items-center gap-2 transition-all duration-300 ${isDragging ? 'opacity-0' : 'opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {isDeleted ? (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRestore();
                }}
                aria-label="restore-button"
                className="p-2.5 text-accent hover:bg-accent/10 rounded-xl transition-all"
                title={t('tasks.restore')}
              >
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPermanentDelete();
                }}
                aria-label="permanent-delete-button"
                className="p-2.5 text-accent-danger hover:bg-accent-danger/10 rounded-xl transition-all"
                title={t('tasks.deleteForever')}
              >
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
              </button>
            </>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              aria-label="delete-button"
              className="p-2.5 text-accent-danger hover:bg-accent-danger/10 rounded-xl transition-all hover:scale-110 active:scale-95"
              title={t('tasks.delete')}
            >
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
            </button>
          )}
        </div>
      )}
    </div>
  );
}
