import { useState, useMemo } from 'react';
import { TimesheetEntry, DeveloperPerformance, DashboardKPIs } from '../types';
import { 
  calculateDashboardKPIs, 
  calculateDeveloperPerformance,
  getUniqueWeeks,
  filterByDateRange,
  filterByDeveloper,
  filterByProject,
  filterByEnvironment,
} from '../utils/timesheetUtils';
import { formatDate } from '../utils/dateUtils';

interface TimesheetDashboardProps {
  entries: TimesheetEntry[];
  developers: { id: string; name: string; color: string }[];
  standardWeeklyHours: number;
}

export default function TimesheetDashboard({ 
  entries, 
  developers, 
  standardWeeklyHours 
}: TimesheetDashboardProps) {
  // Filter states
  const [selectedDeveloper, setSelectedDeveloper] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'all' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [selectedDeveloperDetail, setSelectedDeveloperDetail] = useState<string | null>(null);

  // Get unique values for filters
  const uniqueProjects = useMemo(() => {
    const projects = new Set(entries.map(e => e.portal).filter(p => p));
    return Array.from(projects).sort();
  }, [entries]);

  const uniqueEnvironments = useMemo(() => {
    const envs = new Set(entries.map(e => e.environment));
    return Array.from(envs).sort();
  }, [entries]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    let filtered = entries;

    // Apply date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      if (dateRange === 'thisWeek') {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        startDate = new Date(now.setDate(diff));
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
      } else if (dateRange === 'lastWeek') {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1) - 7;
        startDate = new Date(now.setDate(diff));
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
      } else if (dateRange === 'thisMonth') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      } else if (dateRange === 'lastMonth') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      } else if (dateRange === 'custom' && customStartDate && customEndDate) {
        startDate = new Date(customStartDate);
        endDate = new Date(customEndDate);
      } else {
        return filtered;
      }

      filtered = filterByDateRange(filtered, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]);
    }

    // Apply developer filter
    if (selectedDeveloper !== 'all') {
      filtered = filterByDeveloper(filtered, selectedDeveloper);
    }

    // Apply project filter
    if (selectedProject !== 'all') {
      filtered = filterByProject(filtered, selectedProject);
    }

    // Apply environment filter
    if (selectedEnvironment !== 'all') {
      filtered = filterByEnvironment(filtered, selectedEnvironment);
    }

    return filtered;
  }, [entries, dateRange, customStartDate, customEndDate, selectedDeveloper, selectedProject, selectedEnvironment]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    return calculateDashboardKPIs(filteredEntries, developers, standardWeeklyHours);
  }, [filteredEntries, developers, standardWeeklyHours]);

  // Calculate developer performance
  const developerPerformances = useMemo(() => {
    return calculateDeveloperPerformance(filteredEntries, standardWeeklyHours);
  }, [filteredEntries, standardWeeklyHours]);

  // Get unique weeks
  const uniqueWeeks = useMemo(() => {
    return getUniqueWeeks(filteredEntries);
  }, [filteredEntries]);

  // Calculate weekly trend data
  const weeklyTrendData = useMemo(() => {
    const weekMap = new Map<string, number>();
    
    filteredEntries.forEach(entry => {
      const key = `${entry.year}-W${entry.weekNumber}`;
      weekMap.set(key, (weekMap.get(key) || 0) + entry.hoursSpent);
    });

    return Array.from(weekMap.entries())
      .map(([week, hours]) => ({ week, hours }))
      .sort((a, b) => a.week.localeCompare(b.week));
  }, [filteredEntries]);

  // Get selected developer details
  const selectedDeveloperData = useMemo(() => {
    if (!selectedDeveloperDetail) return null;
    return developerPerformances.find(p => p.developerId === selectedDeveloperDetail);
  }, [selectedDeveloperDetail, developerPerformances]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <KPICard title="Total Developers" value={kpis.totalDevelopers} />
        <KPICard title="Total Hours" value={kpis.totalHours.toFixed(1)} />
        <KPICard title="Avg Hrs/Dev" value={kpis.avgHoursPerDeveloper.toFixed(1)} />
        <KPICard title="Total Tasks" value={kpis.totalTasks} />
        <KPICard title="Avg Weekly Hrs" value={kpis.avgWeeklyHours.toFixed(1)} />
        <KPICard title="Utilization" value={`${kpis.overallUtilization.toFixed(1)}%`} />
        <KPICard title="This Week" value={kpis.hoursThisWeek.toFixed(1)} />
        <KPICard title="Last Week" value={kpis.hoursLastWeek.toFixed(1)} />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Time</option>
              <option value="thisWeek">This Week</option>
              <option value="lastWeek">Last Week</option>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {dateRange === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Developer</label>
            <select
              value={selectedDeveloper}
              onChange={(e) => setSelectedDeveloper(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Developers</option>
              {developers.map(dev => (
                <option key={dev.id} value={dev.id}>{dev.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project/Portal</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Projects</option>
              {uniqueProjects.map(proj => (
                <option key={proj} value={proj}>{proj}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Environment</label>
            <select
              value={selectedEnvironment}
              onChange={(e) => setSelectedEnvironment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Environments</option>
              {uniqueEnvironments.map(env => (
                <option key={env} value={env}>{env}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Developer Performance Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Developer Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Developer</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total Hours</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Tasks</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Hrs/Task</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Utilization</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {developerPerformances.map(perf => (
                <tr key={perf.developerId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-3"
                        style={{ backgroundColor: developers.find(d => d.id === perf.developerId)?.color || '#6B7280' }}
                      ></div>
                      <div className="text-sm font-medium text-gray-900">{perf.developerName}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                    {perf.totalHours.toFixed(1)}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                    {perf.totalTasks}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                    {perf.avgHoursPerTask.toFixed(2)}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      perf.avgUtilization >= 90 && perf.avgUtilization <= 110
                        ? 'bg-green-100 text-green-800'
                        : perf.avgUtilization > 110
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {perf.avgUtilization.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                    <button
                      onClick={() => setSelectedDeveloperDetail(perf.developerId)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Weekly Trend Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Hours Trend</h3>
        <div className="space-y-2">
          {weeklyTrendData.map(({ week, hours }) => (
            <div key={week} className="flex items-center">
              <div className="w-24 text-sm text-gray-600">{week}</div>
              <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                <div 
                  className="bg-blue-600 h-full rounded-full flex items-center justify-end px-2"
                  style={{ width: `${Math.min((hours / (standardWeeklyHours * developers.length)) * 100, 100)}%` }}
                >
                  <span className="text-xs text-white font-medium">{hours.toFixed(1)}h</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Project Distribution */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Project/Portal Distribution</h3>
        <div className="space-y-3">
          {Object.entries(
            filteredEntries.reduce((acc, entry) => {
              const portal = entry.portal || 'Unknown';
              acc[portal] = (acc[portal] || 0) + entry.hoursSpent;
              return acc;
            }, {} as { [key: string]: number })
          )
            .sort((a, b) => b[1] - a[1])
            .map(([project, hours]) => (
              <div key={project} className="flex items-center">
                <div className="w-48 text-sm text-gray-900 truncate">{project}</div>
                <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden ml-4">
                  <div 
                    className="bg-green-600 h-full rounded-full flex items-center justify-end px-2"
                    style={{ width: `${(hours / kpis.totalHours) * 100}%` }}
                  >
                    <span className="text-xs text-white font-medium">{hours.toFixed(1)}h</span>
                  </div>
                </div>
                <div className="w-16 text-right text-sm text-gray-600 ml-4">
                  {((hours / kpis.totalHours) * 100).toFixed(1)}%
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Environment Distribution */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Environment Distribution</h3>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(
            filteredEntries.reduce((acc, entry) => {
              const env = entry.environment || 'Other';
              acc[env] = (acc[env] || 0) + entry.hoursSpent;
              return acc;
            }, {} as { [key: string]: number })
          )
            .sort((a, b) => b[1] - a[1])
            .map(([env, hours]) => (
              <div key={env} className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">{env}</div>
                <div className="text-2xl font-bold text-gray-900">{hours.toFixed(1)}h</div>
                <div className="text-sm text-gray-500">
                  {((hours / kpis.totalHours) * 100).toFixed(1)}% of total
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Developer Detail Modal */}
      {selectedDeveloperData && (
        <DeveloperDetailModal
          performance={selectedDeveloperData}
          onClose={() => setSelectedDeveloperDetail(null)}
        />
      )}
    </div>
  );
}

// KPI Card Component
function KPICard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="text-sm text-gray-600 mb-1">{title}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

// Developer Detail Modal Component
function DeveloperDetailModal({ 
  performance, 
  onClose 
}: { 
  performance: DeveloperPerformance;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">
            Developer Details: {performance.developerName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-blue-600 mb-1">Total Hours</div>
              <div className="text-2xl font-bold text-blue-900">{performance.totalHours.toFixed(1)}h</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-green-600 mb-1">Total Tasks</div>
              <div className="text-2xl font-bold text-green-900">{performance.totalTasks}</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-sm text-purple-600 mb-1">Avg Hrs/Task</div>
              <div className="text-2xl font-bold text-purple-900">{performance.avgHoursPerTask.toFixed(2)}h</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="text-sm text-yellow-600 mb-1">Avg Utilization</div>
              <div className="text-2xl font-bold text-yellow-900">{performance.avgUtilization.toFixed(1)}%</div>
            </div>
          </div>

          {/* Weekly Breakdown */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Weekly Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Week</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Hours</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Tasks</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Avg Hrs/Task</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Utilization</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {performance.weeks.map(week => (
                    <tr key={week.weekNumber} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-900">
                        Week {week.weekNumber} ({week.weekStartDate} to {week.weekEndDate})
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 text-center">{week.totalHours.toFixed(1)}h</td>
                      <td className="px-4 py-2 text-sm text-gray-900 text-center">{week.uniqueTasks}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 text-center">{week.avgHoursPerTask.toFixed(2)}h</td>
                      <td className="px-4 py-2 text-sm text-center">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          week.utilization >= 90 && week.utilization <= 110
                            ? 'bg-green-100 text-green-800'
                            : week.utilization > 110
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {week.utilization.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Project Distribution */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Project Distribution</h3>
            <div className="space-y-2">
              {Object.entries(performance.projectDistribution)
                .sort((a, b) => b[1] - a[1])
                .map(([project, hours]) => (
                  <div key={project} className="flex items-center">
                    <div className="w-48 text-sm text-gray-900 truncate">{project}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden ml-4">
                      <div 
                        className="bg-blue-600 h-full rounded-full flex items-center justify-end px-2"
                        style={{ width: `${(hours / performance.totalHours) * 100}%` }}
                      >
                        <span className="text-xs text-white font-medium">{hours.toFixed(1)}h</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Environment Distribution */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Environment Distribution</h3>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(performance.environmentDistribution)
                .sort((a, b) => b[1] - a[1])
                .map(([env, hours]) => (
                  <div key={env} className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">{env}</div>
                    <div className="text-2xl font-bold text-gray-900">{hours.toFixed(1)}h</div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
