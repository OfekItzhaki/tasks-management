import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAnalysisData } from '../hooks/useAnalysisData';
import { useTheme } from '../context/ThemeContext';
import { isRtlLanguage } from '@tasks-management/frontend-services';
import Skeleton from '../components/Skeleton';
import CalendarHeatmap from '../components/CalendarHeatmap';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function AnalyticsPage() {
  const { t, i18n } = useTranslation();
  const { isDark } = useTheme();
  const isRtl = isRtlLanguage(i18n.language);

  const {
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
  } = useAnalysisData();

  if (hasError && !isLoading) {
    return (
      <div
        className={`space-y-6 ${isRtl ? 'rtl' : ''}`}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div className="mb-6">
          <Link
            to="/lists"
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm font-medium"
          >
            {t('tasks.backToLists')}
          </Link>
        </div>
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary tracking-tight">
            {t('analysis.title')}
          </h1>
          <p className="mt-2 text-secondary">
            {t('analysis.insightsDescription', {
              defaultValue: 'Insights and statistics',
            })}
          </p>
        </div>
        <div className="rounded-2xl bg-accent-danger/10 border border-accent-danger/20 p-6 text-center">
          <div className="text-sm text-accent-danger mb-3">
            {listsError
              ? t('analysis.loadListsFailed')
              : t('analysis.loadTasksFailed')}
            : {listsErrorObj?.message || tasksErrorObj?.message}
          </div>
          <div className="flex gap-3">
            {listsError && (
              <button onClick={() => refetchLists()} className="premium-button">
                {t('analysis.retryLists')}
              </button>
            )}
            {tasksError && (
              <button onClick={() => refetchTasks()} className="premium-button">
                {t('analysis.retryTasks')}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <Link to="/lists" className="text-indigo-600 text-sm font-medium">
            {t('tasks.backToLists')}
          </Link>
        </div>
        <Skeleton className="h-9 w-48 mx-auto" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="premium-card p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
        <Skeleton className="h-64 w-full premium-card" />
      </div>
    );
  }

  return (
    <div
      className={`space-y-6 animate-fade-in ${isRtl ? 'rtl' : ''}`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <Link
        to="/lists"
        className={`inline-flex items-center gap-2 text-accent hover:underline font-medium ${isRtl ? 'flex-row-reverse' : ''}`}
      >
        <span className={isRtl ? 'rotate-180' : ''}>←</span>
        {t('tasks.backToLists')}
      </Link>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary tracking-tight">
          {t('analysis.title')}
        </h1>
        <p className="mt-2 text-secondary">
          {t('analysis.insightsDescription', {
            defaultValue: 'Insights and statistics',
          })}
        </p>
      </div>

      {/* Overview Cards */}
      <div
        className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-slide-up"
        style={{ animationDelay: '0.1s' }}
      >
        <StatCard
          title={t('analysis.totalLists')}
          value={lists.length}
          icon="📁"
        />
        <StatCard
          title={t('analysis.totalTasks')}
          value={allTasks.length}
          icon="📋"
        />
        <StatCard
          title={t('analysis.completed')}
          value={stats.completedTasks.length}
          colorClass="text-accent-success"
          icon="✅"
        />
        <StatCard
          title={t('analysis.completionRate')}
          value={`${stats.completionRate.toFixed(1)}%`}
          colorClass="text-primary-600 dark:text-primary-400"
          icon="📈"
        />
      </div>

      <div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up"
        style={{ animationDelay: '0.2s' }}
      >
        {/* Pie Chart */}
        <div className="premium-card p-8">
          <h2 className="premium-header-section mb-6 flex items-center gap-2">
            <span>📊</span> {t('analysis.completionStatus')}
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  {
                    name: t('analysis.completed'),
                    value: stats.completedTasks.length,
                    color: '#10b981',
                  },
                  {
                    name: t('analysis.pending'),
                    value: stats.pendingTasks.length,
                    color: '#ef4444',
                  },
                ]}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={90}
                dataKey="value"
              >
                {[{ color: '#10b981' }, { color: '#ef4444' }].map(
                  (entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  )
                )}
              </Pie>
              <Tooltip />
              <text
                x="50%"
                y="42%"
                textAnchor="middle"
                fill={isDark ? '#fff' : '#374151'}
                fontSize={13}
                fontWeight="600"
              >
                {t('analysis.dailyStreak')}
              </text>
              <text
                x="50%"
                y="52%"
                textAnchor="middle"
                fill={isDark ? '#10b981' : '#059669'}
                fontSize={28}
                fontWeight="bold"
              >
                {currentStreak}
              </text>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Heatmap */}
        <div className="premium-card p-8">
          <h2 className="premium-header-section mb-6">
            {t('analysis.dailyActivity')}
          </h2>
          <CalendarHeatmap data={dailyCompletions} days={90} />
        </div>
      </div>

      {/* Bar Chart */}
      <div className="premium-card p-8">
        <h2 className="premium-header-section mb-8">
          {t('analysis.tasksByListChart')}
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={stats.tasksByList}
            margin={{ top: 0, right: 30, left: 20, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis
              dataKey="listName"
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
              fontSize={10}
            />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar
              dataKey="completed"
              fill="#10b981"
              name={t('analysis.completed')}
            />
            <Bar
              dataKey="pending"
              fill="#ef4444"
              name={t('analysis.pending')}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Line Chart */}
      <div className="premium-card p-8">
        <h2 className="premium-header-section mb-8">
          {t('analysis.completionTrends')}
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyTrends}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis
              dataKey="label"
              fontSize={10}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="completions"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Due Date Stats */}
        <div className="premium-card p-8">
          <h2 className="premium-header-section mb-6">
            {t('analysis.dueDateOverview')}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <StatRow
              label={t('analysis.overdue')}
              value={stats.overdueTasks.length}
              color="text-red-600"
            />
            <StatRow
              label={t('analysis.dueToday')}
              value={stats.dueTodayTasks.length}
              color="text-orange-600"
            />
            <StatRow
              label={t('analysis.dueThisWeek')}
              value={stats.dueThisWeekTasks.length}
              color="text-yellow-600"
            />
            <StatRow
              label={t('analysis.withDueDates')}
              value={stats.tasksWithDueDates.length}
            />
          </div>
        </div>

        {/* Steps Stats */}
        <div className="premium-card p-8">
          <h2 className="premium-header-section mb-6">
            {t('analysis.stepsProgress')}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <StatRow
              label={t('analysis.tasksWithSteps')}
              value={stats.tasksWithSteps.length}
            />
            <StatRow
              label={t('analysis.stepsCompleted')}
              value={`${stats.completedSteps} / ${stats.totalSteps}`}
              color="text-green-600"
            />
            <StatRow
              label={t('analysis.stepsCompletion')}
              value={`${stats.stepsCompletionRate.toFixed(1)}%`}
              color="text-blue-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  colorClass = 'text-gray-900 dark:text-white',
}: {
  title: string;
  value: string | number;
  icon: string;
  colorClass?: string;
}) {
  return (
    <div className="premium-card p-6 group hover:-translate-y-1 transition-all flex flex-col items-center justify-center text-center">
      <div className="mb-3 flex flex-col items-center">
        <span className="text-3xl mb-2 group-hover:scale-110 transition-transform block">
          {icon}
        </span>
        <h3 className="text-xs font-semibold text-tertiary uppercase tracking-wider">
          {title}
        </h3>
      </div>
      <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
    </div>
  );
}

function StatRow({
  label,
  value,
  color = '',
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="bg-surface border border-border-subtle p-4 rounded-xl text-center">
      <h4 className="text-xs font-semibold text-tertiary uppercase tracking-wide mb-1">
        {label}
      </h4>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}
