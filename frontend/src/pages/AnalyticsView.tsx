import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { api } from '../lib/api';
import { Loader2, Activity, ShieldAlert, Award } from 'lucide-react';

interface AnalyticsViewProps {
  workspaceId: string;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ workspaceId }) => {
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<any>(null);
  const [workload, setWorkload] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [velocity, setVelocity] = useState<any[]>([]);
  const [sprints, setSprints] = useState<any[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<string>('');
  const [burndown, setBurndown] = useState<any>(null);

  // Fetch initial telemetry data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const healthRes = await api.get<any>(`/workspaces/${workspaceId}/analytics/health`);
        setHealth(healthRes);

        const workloadRes = await api.get<any[]>(`/workspaces/${workspaceId}/analytics/workload`);
        setWorkload(workloadRes);

        const projectsRes = await api.get<any[]>(`/workspaces/${workspaceId}/projects`);
        setProjects(projectsRes);

        if (projectsRes.length > 0) {
          const firstProjId = projectsRes[0]._id;
          setSelectedProjectId(firstProjId);

          // Get sprints for this project
          const sprintsRes = await api.get<any[]>(`/projects/${firstProjId}/sprints`);
          setSprints(sprintsRes);
          if (sprintsRes.length > 0) {
            setSelectedSprintId(sprintsRes[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [workspaceId]);

  // Fetch project-specific velocity
  useEffect(() => {
    if (!selectedProjectId) return;
    const fetchVelocity = async () => {
      try {
        const vel = await api.get<any[]>(`/projects/${selectedProjectId}/analytics/velocity`);
        setVelocity(vel);
        
        // Also sync sprints for selected project
        const spr = await api.get<any[]>(`/projects/${selectedProjectId}/sprints`);
        setSprints(spr);
        if (spr.length > 0) {
          setSelectedSprintId(spr[0]._id);
        } else {
          setSelectedSprintId('');
          setBurndown(null);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchVelocity();
  }, [selectedProjectId]);

  // Fetch sprint-specific burndown
  useEffect(() => {
    if (!selectedSprintId) return;
    const fetchBurndown = async () => {
      try {
        const burn = await api.get<any>(`/sprints/${selectedSprintId}/analytics/burndown`);
        setBurndown(burn);
      } catch (err) {
        console.error(err);
      }
    };
    fetchBurndown();
  }, [selectedSprintId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pastel-lilac" />
      </div>
    );
  }

  const PIE_COLORS = ['#FAF7F2', '#F5F1EA', '#E5EEF8', '#D9D1E8', '#C7D7C4'];

  return (
    <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8 max-w-6xl mx-auto">
      {/* Top Metric Cards */}
      {health && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-pastel-lilac/25 shadow-sm flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slateMuted uppercase tracking-wider">Total Backlog Scope</span>
            <span className="text-3xl font-outfit font-extrabold">{health.totalTasks}</span>
            <span className="text-xs text-graphite flex items-center gap-1 mt-2">
              <Activity className="w-3.5 h-3.5 text-pastel-lilac" />
              Active Workspace Tasks
            </span>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-pastel-lilac/25 shadow-sm flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slateMuted uppercase tracking-wider">Completed Tasks</span>
            <span className="text-3xl font-outfit font-extrabold text-graphite">{health.completedTasks}</span>
            <span className="text-xs text-graphite flex items-center gap-1 mt-2">
              <Award className="w-3.5 h-3.5 text-pastel-sage" />
              Tasks marked done
            </span>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-pastel-lilac/25 shadow-sm flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slateMuted uppercase tracking-wider">Completion Velocity</span>
            <span className="text-3xl font-outfit font-extrabold">{health.completionRate}%</span>
            <div className="h-1.5 w-full bg-pastel-lilac/20 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-pastel-lilac rounded-full" style={{ width: `${health.completionRate}%` }} />
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-pastel-lilac/25 shadow-sm flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slateMuted uppercase tracking-wider">Bugs & Regressions</span>
            <span className="text-3xl font-outfit font-extrabold text-charcoal">
              {health.typeDistribution.find((t: any) => t.type === 'bug')?.count || 0}
            </span>
            <span className="text-xs text-graphite flex items-center gap-1 mt-2">
              <ShieldAlert className="w-3.5 h-3.5 text-pastel-rose" />
              Urgent issues filed
            </span>
          </div>
        </div>
      )}

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Sprint Burndown */}
        <div className="glass-panel p-6 rounded-3xl border border-pastel-lilac/25 shadow-sm flex flex-col min-h-[350px]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-outfit font-bold text-base">Sprint Burndown</h3>
              <p className="text-xs text-slateMuted">Burn rate tracking remaining points vs ideal progress</p>
            </div>
            {projects.length > 0 && (
              <div className="flex gap-2">
                <select 
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-pastel-lilac/30 bg-background-cream text-xs focus:outline-none"
                >
                  {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>

                {sprints.length > 0 && (
                  <select 
                    value={selectedSprintId}
                    onChange={(e) => setSelectedSprintId(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-pastel-lilac/30 bg-background-cream text-xs focus:outline-none"
                  >
                    {sprints.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                )}
              </div>
            )}
          </div>

          <div className="flex-1">
            {burndown && burndown.data && burndown.data.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={burndown.data}>
                  <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#CFC5E6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#CFC5E6" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(207, 197, 230, 0.15)" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="#63666A" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#63666A" />
                  <Tooltip contentStyle={{ background: '#FAF7F2', borderRadius: '12px', border: '1px solid rgba(207,197,230,0.3)', fontSize: '11px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Area name="Ideal Burndown" type="monotone" dataKey="ideal" stroke="#63666A" strokeDasharray="5 5" fill="none" />
                  <Area name="Actual Remaining" type="monotone" dataKey="actual" stroke="#CFC5E6" fillOpacity={1} fill="url(#colorActual)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slateMuted">
                No active sprint data selected or found for project.
              </div>
            )}
          </div>
        </div>

        {/* Project Velocity */}
        <div className="glass-panel p-6 rounded-3xl border border-pastel-lilac/25 shadow-sm flex flex-col min-h-[350px]">
          <div className="mb-6">
            <h3 className="font-outfit font-bold text-base">Project Velocity</h3>
            <p className="text-xs text-slateMuted">Story points target vs completed across sprints</p>
          </div>

          <div className="flex-1">
            {velocity.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={velocity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(207, 197, 230, 0.15)" />
                  <XAxis dataKey="sprintName" tick={{ fontSize: 9 }} stroke="#63666A" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#63666A" />
                  <Tooltip contentStyle={{ background: '#FAF7F2', borderRadius: '12px', border: '1px solid rgba(207,197,230,0.3)', fontSize: '11px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar name="Sprint Target" dataKey="target" fill="#D6E4F0" radius={[4, 4, 0, 0]} />
                  <Bar name="Actual Completed" dataKey="completed" fill="#CFC5E6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slateMuted">
                Select a project with completed sprints to view velocity.
              </div>
            )}
          </div>
        </div>

        {/* Team Workload Distribution */}
        <div className="glass-panel p-6 rounded-3xl border border-pastel-lilac/25 shadow-sm flex flex-col min-h-[350px]">
          <div className="mb-6">
            <h3 className="font-outfit font-bold text-base">Team Workload Balance</h3>
            <p className="text-xs text-slateMuted">Story point loading and task allocation per team member</p>
          </div>

          <div className="flex-1">
            {workload.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={workload} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(207, 197, 230, 0.15)" />
                  <XAxis type="number" tick={{ fontSize: 10 }} stroke="#63666A" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} stroke="#63666A" />
                  <Tooltip contentStyle={{ background: '#FAF7F2', borderRadius: '12px', border: '1px solid rgba(207,197,230,0.3)', fontSize: '11px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar name="Story Points assigned" dataKey="storyPoints" fill="#CFC5E6" radius={[0, 4, 4, 0]} />
                  <Bar name="Task Count" dataKey="taskCount" fill="#C7D7C4" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slateMuted">
                Assign tasks to workspace members to see workload balances.
              </div>
            )}
          </div>
        </div>

        {/* Task Priority Distribution */}
        <div className="glass-panel p-6 rounded-3xl border border-pastel-lilac/25 shadow-sm flex flex-col min-h-[350px]">
          <div className="mb-6">
            <h3 className="font-outfit font-bold text-base">Task Priorities</h3>
            <p className="text-xs text-slateMuted">Priority levels distribution across all tasks</p>
          </div>

          <div className="flex-1 flex items-center justify-center">
            {health && health.priorityDistribution.length > 0 ? (
              <div className="flex flex-col md:flex-row items-center gap-8 w-full">
                <div className="w-1/2 h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={health.priorityDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="priority"
                      >
                        {health.priorityDistribution.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#FAF7F2', borderRadius: '12px', border: '1px solid rgba(207,197,230,0.3)', fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-2.5">
                  {health.priorityDistribution.map((entry: any, index: number) => (
                    <div key={entry.priority} className="flex items-center gap-2 text-xs">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                      <span className="capitalize font-medium text-graphite">{entry.priority}:</span>
                      <span className="font-bold text-charcoal">{entry.count} tasks</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slateMuted">
                No priorities logged.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
