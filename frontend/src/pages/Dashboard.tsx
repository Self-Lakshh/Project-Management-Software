import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { api } from '../lib/api';
import { DependencyGraph } from '../components/graph/DependencyGraph';
import { AnalyticsView } from './AnalyticsView';
import { DocsView } from './DocsView';
import { 
  Compass, 
  GitFork, 
  Activity, 
  BookOpen, 
  LogOut, 
  Plus, 
  Calendar, 
  ChevronDown,
  CheckSquare,
  Clock,
  Users,
  Bell,
  Send
} from 'lucide-react';
import logo from '../assets/branding/logo-primary.svg';

export const Dashboard: React.FC = () => {
  const { user, workspaces, activeWorkspace, logout, switchWorkspace } = useAuth();
  const { onlineUsers, typingUsers, taskUpdates, joinTask, leaveTask, sendTyping } = useSocket();

  const [activeTab, setActiveTab] = useState<'overview' | 'board' | 'roadmap' | 'graph' | 'analytics' | 'docs'>('overview');
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Modals state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showProjModal, setShowProjModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null); // For detail view

  // Form states
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskProj, setNewTaskProj] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [newTaskType, setNewTaskType] = useState('task');
  const [newTaskPoints, setNewTaskPoints] = useState(2);
  const [newTaskAssignee, setNewTaskAssignee] = useState('');

  const [newProjName, setNewProjName] = useState('');
  const [newProjKey, setNewProjKey] = useState('');

  // Comment state
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<any[]>([]);

  // Fetch workspace-wide details
  const fetchWorkspaceData = async () => {
    if (!activeWorkspace) return;
    try {
      const tasksList = await api.get<any[]>(`/workspaces/${activeWorkspace._id}/tasks`);
      setTasks(tasksList);

      const projectsList = await api.get<any[]>(`/workspaces/${activeWorkspace._id}/projects`);
      setProjects(projectsList);

      const membersList = await api.get<any[]>(`/workspaces/${activeWorkspace._id}/members`);
      setMembers(membersList);

      const activityList = await api.get<any[]>(`/workspaces/${activeWorkspace._id}/activity`);
      setActivity(activityList);

      const notifs = await api.get<any[]>('/notifications');
      setNotifications(notifs);
    } catch (err) {
      console.error('Failed to load workspace data', err);
    }
  };

  useEffect(() => {
    fetchWorkspaceData();
  }, [activeWorkspace]);

  // Sync state if other client emits realtime task updates
  useEffect(() => {
    if (taskUpdates && activeWorkspace) {
      fetchWorkspaceData();
    }
  }, [taskUpdates]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace) return;
    try {
      await api.post(`/workspaces/${activeWorkspace._id}/projects`, {
        name: newProjName,
        key: newProjKey,
      });
      setNewProjName('');
      setNewProjKey('');
      setShowProjModal(false);
      fetchWorkspaceData();
    } catch (err) {
      alert('Error creating project');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace) return;
    try {
      await api.post(`/workspaces/${activeWorkspace._id}/tasks`, {
        title: newTaskTitle,
        description: newTaskDesc,
        projectId: newTaskProj,
        priority: newTaskPriority,
        type: newTaskType,
        storyPoints: newTaskPoints,
        assignees: newTaskAssignee ? [newTaskAssignee] : [],
      });
      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskProj('');
      setNewTaskPriority('medium');
      setNewTaskType('task');
      setNewTaskPoints(2);
      setNewTaskAssignee('');
      setShowTaskModal(false);
      fetchWorkspaceData();
    } catch (err) {
      alert('Error creating task');
    }
  };

  // Select Task for Detail Modal
  const handleOpenTaskDetails = async (task: any) => {
    setSelectedTask(task);
    joinTask(task._id);
    setCommentText('');
    try {
      const list = await api.get<any[]>(`/tasks/${task._id}/comments`);
      setComments(list);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCloseTaskDetails = () => {
    if (selectedTask) {
      leaveTask(selectedTask._id);
      setSelectedTask(null);
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !commentText.trim()) return;

    try {
      await api.post(`/tasks/${selectedTask._id}/comments`, {
        content: commentText,
      });
      setCommentText('');
      sendTyping(selectedTask._id, false);
      const list = await api.get<any[]>(`/tasks/${selectedTask._id}/comments`);
      setComments(list);
      fetchWorkspaceData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      fetchWorkspaceData();
      if (selectedTask && selectedTask._id === taskId) {
        setSelectedTask({ ...selectedTask, status: newStatus });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearNotifications = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications([]);
    } catch (err) {
      console.error(err);
    }
  };

  const getPriorityColor = (p: string) => {
    if (p === 'urgent') return 'bg-pastel-rose text-charcoal border-pastel-rose/40';
    if (p === 'high') return 'bg-pastel-peach text-charcoal border-pastel-peach/40';
    if (p === 'medium') return 'bg-pastel-sky text-charcoal border-pastel-sky/40';
    return 'bg-pastel-mint text-charcoal border-pastel-mint/40';
  };

  return (
    <div className="h-screen w-screen bg-background text-charcoal flex font-sans overflow-hidden antialiased">
      
      {/* Sidebar navigation */}
      <aside className="w-64 bg-background-bone border-r border-pastel-lilac/25 flex flex-col shrink-0">
        {/* Branding header */}
        <div className="p-6 border-b border-pastel-lilac/15 flex items-center justify-between">
          <img src={logo} alt="PMS Logo" className="h-8" />
        </div>

        {/* Workspace Switcher */}
        {activeWorkspace && (
          <div className="px-6 py-4 border-b border-pastel-lilac/15">
            <label className="text-[9px] font-bold text-slateMuted uppercase tracking-wider block mb-1.5">Workspace</label>
            <div className="relative group">
              <select
                value={activeWorkspace._id}
                onChange={(e) => switchWorkspace(e.target.value)}
                className="w-full pl-3 pr-8 py-2 rounded-xl border border-pastel-lilac/30 bg-background-cream text-xs font-semibold focus:outline-none appearance-none cursor-pointer"
              >
                {workspaces.map((w) => (
                  <option key={w._id} value={w._id}>{w.name}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slateMuted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Navigation lists */}
        <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5 overflow-y-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-3 transition-smooth ${
              activeTab === 'overview' ? 'bg-pastel-sky text-charcoal shadow-sm' : 'hover:bg-background/50 text-graphite'
            }`}
          >
            <Compass className="w-4.5 h-4.5" />
            Workspace Overview
          </button>
          
          <button
            onClick={() => setActiveTab('board')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-3 transition-smooth ${
              activeTab === 'board' ? 'bg-pastel-sky text-charcoal shadow-sm' : 'hover:bg-background/50 text-graphite'
            }`}
          >
            <CheckSquare className="w-4.5 h-4.5" />
            Kanban Board
          </button>

          <button
            onClick={() => setActiveTab('roadmap')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-3 transition-smooth ${
              activeTab === 'roadmap' ? 'bg-pastel-sky text-charcoal shadow-sm' : 'hover:bg-background/50 text-graphite'
            }`}
          >
            <Calendar className="w-4.5 h-4.5" />
            Roadmaps & Projects
          </button>

          <button
            onClick={() => setActiveTab('graph')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-3 transition-smooth ${
              activeTab === 'graph' ? 'bg-pastel-sky text-charcoal shadow-sm' : 'hover:bg-background/50 text-graphite'
            }`}
          >
            <GitFork className="w-4.5 h-4.5" />
            Dependency Graph
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-3 transition-smooth ${
              activeTab === 'analytics' ? 'bg-pastel-sky text-charcoal shadow-sm' : 'hover:bg-background/50 text-graphite'
            }`}
          >
            <Activity className="w-4.5 h-4.5" />
            Sprint Analytics
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-3 transition-smooth ${
              activeTab === 'docs' ? 'bg-pastel-sky text-charcoal shadow-sm' : 'hover:bg-background/50 text-graphite'
            }`}
          >
            <BookOpen className="w-4.5 h-4.5" />
            Documentation Portal
          </button>
        </nav>

        {/* Live presence sidebar module */}
        {activeWorkspace && (
          <div className="px-6 py-4 border-t border-pastel-lilac/15">
            <span className="text-[9px] font-bold text-slateMuted uppercase tracking-wider block mb-2">Live Presence</span>
            <div className="flex flex-wrap gap-1.5">
              {onlineUsers.map((ou) => (
                <div 
                  key={ou.userId} 
                  className="w-7 h-7 rounded-full bg-pastel-lilac border border-background-bone flex items-center justify-center text-[10px] font-bold text-charcoal relative cursor-help"
                  title={`${ou.name} is online`}
                >
                  {ou.name.slice(0,2).toUpperCase()}
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-pastel-mint border border-background-bone" />
                </div>
              ))}
              {onlineUsers.length === 0 && (
                <span className="text-[10px] text-slateMuted">No other users online</span>
              )}
            </div>
          </div>
        )}

        {/* Footer profile menu */}
        <div className="p-4 border-t border-pastel-lilac/15 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-pastel-lilac flex items-center justify-center text-xs font-bold text-charcoal">
              {user?.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-charcoal max-w-[110px] truncate">{user?.name}</span>
              <span className="text-[9px] text-slateMuted max-w-[110px] truncate">{user?.email}</span>
            </div>
          </div>
          <button 
            onClick={logout}
            className="p-1.5 rounded-lg hover:bg-pastel-rose/30 text-slateMuted hover:text-charcoal transition-smooth"
            title="Log Out"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Workspace Top Header Bar */}
        <header className="h-16 border-b border-pastel-lilac/25 px-8 flex items-center justify-between shrink-0 bg-background-cream/35">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-charcoal capitalize">{activeTab}</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-xl border border-pastel-lilac/30 hover:bg-pastel-lilac/20 transition-smooth relative"
              >
                <Bell className="w-4 h-4 text-graphite" />
                {notifications.filter((n) => !n.read).length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-pastel-rose border border-background" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 glass-panel border border-pastel-lilac/30 rounded-2xl shadow-xl z-50 p-4">
                  <div className="flex items-center justify-between border-b border-pastel-lilac/15 pb-2.5 mb-2.5">
                    <span className="text-xs font-bold">Notifications</span>
                    {notifications.length > 0 && (
                      <button onClick={handleClearNotifications} className="text-[10px] font-bold text-slateMuted hover:text-charcoal underline">
                        Clear all
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                    {notifications.map((n) => (
                      <div key={n._id} className="p-2.5 rounded-lg bg-background-bone/50 border border-pastel-lilac/10 text-xs">
                        <div className="font-semibold text-charcoal">{n.title}</div>
                        <div className="text-[11px] text-graphite mt-0.5">{n.content}</div>
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <span className="text-xs text-center text-slateMuted py-4">No unread notifications</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick action: Create Task */}
            <button
              onClick={() => {
                if (projects.length === 0) {
                  alert('Please create a project first before creating a task.');
                  return;
                }
                setNewTaskProj(projects[0]._id);
                setShowTaskModal(true);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold bg-charcoal text-background hover:bg-charcoal/90 px-3.5 py-2 rounded-xl shadow-sm transition-smooth"
            >
              <Plus className="w-4 h-4" />
              New Task
            </button>
          </div>
        </header>

        {/* Workspace Tab Contents */}
        <div className="flex-1 overflow-hidden flex flex-col">
          
          {/* Sub-view: Workspace Overview */}
          {activeTab === 'overview' && (
            <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8 max-w-5xl mx-auto w-full">
              {/* Welcome Banner */}
              <div className="glass-panel p-8 rounded-3xl border border-pastel-lilac/25 shadow-sm relative overflow-hidden flex flex-col gap-1">
                <div className="absolute top-0 right-0 translate-x-12 -translate-y-12 w-48 h-48 rounded-full bg-pastel-lilac/35 blur-3xl -z-10" />
                <span className="text-[9px] font-bold text-slateMuted uppercase tracking-wider">WORKSPACE COMPILER</span>
                <h2 className="font-outfit text-2xl font-extrabold text-charcoal">Welcome back, {user?.name}!</h2>
                <p className="text-xs text-graphite max-w-md mt-1 leading-relaxed">
                  Manage tasks, projects, and live updates here. Check your kanban board or visual graph views to build dependency maps.
                </p>
              </div>

              {/* Projects, Tasks, and Activity split grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                {/* Active Projects List */}
                <div className="glass-panel p-6 rounded-3xl border border-pastel-lilac/25 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-outfit font-bold text-sm">Active Projects</h3>
                    <button 
                      onClick={() => setShowProjModal(true)} 
                      className="p-1 rounded-lg border border-pastel-lilac/30 hover:bg-pastel-lilac/20 transition-smooth"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {projects.map((p) => (
                      <div key={p._id} className="p-3.5 rounded-xl border border-pastel-lilac/15 bg-background-cream/40 flex items-center justify-between text-xs hover:border-pastel-lilac/45 transition-smooth">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-charcoal">{p.name}</span>
                          <span className="text-[10px] text-slateMuted">Key: {p.key}</span>
                        </div>
                        <span className="text-[10px] capitalize px-2 py-0.5 rounded bg-pastel-sky font-semibold">{p.status}</span>
                      </div>
                    ))}
                    {projects.length === 0 && (
                      <span className="text-xs text-center text-slateMuted py-6">No projects created yet.</span>
                    )}
                  </div>
                </div>

                {/* Assigned Tasks Summary */}
                <div className="glass-panel p-6 rounded-3xl border border-pastel-lilac/25 shadow-sm flex flex-col gap-4">
                  <h3 className="font-outfit font-bold text-sm">My Assigned Tasks</h3>
                  <div className="flex flex-col gap-2">
                    {tasks.filter((t) => t.assignees.some((a: any) => a._id === user?.userId)).map((t) => (
                      <div 
                        key={t._id} 
                        onClick={() => handleOpenTaskDetails(t)}
                        className="p-3.5 rounded-xl border border-pastel-lilac/15 bg-background-cream/40 flex flex-col gap-1 text-xs hover:border-pastel-lilac/45 transition-smooth cursor-pointer"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-bold text-slateMuted">{t.key}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded border capitalize ${getPriorityColor(t.priority)}`}>{t.priority}</span>
                        </div>
                        <span className="font-semibold text-charcoal mt-1 line-clamp-1">{t.title}</span>
                      </div>
                    ))}
                    {tasks.filter((t) => t.assignees.some((a: any) => a._id === user?.userId)).length === 0 && (
                      <span className="text-xs text-center text-slateMuted py-6">No tasks assigned to you.</span>
                    )}
                  </div>
                </div>

                {/* Workspace Activity log */}
                <div className="glass-panel p-6 rounded-3xl border border-pastel-lilac/25 shadow-sm flex flex-col gap-4">
                  <h3 className="font-outfit font-bold text-sm">Activity Feed</h3>
                  <div className="flex flex-col gap-3 max-h-80 overflow-y-auto pr-1">
                    {activity.map((act) => (
                      <div key={act._id} className="text-xs flex gap-2 items-start border-l-2 border-pastel-lilac/30 pl-3.5 py-0.5">
                        <div className="flex flex-col">
                          <span className="font-bold text-charcoal">{act.userId?.name || 'User'}</span>
                          <span className="text-slateMuted text-[10px]">
                            {act.action === 'create' && 'created task'}
                            {act.action === 'update' && 'modified task'}
                            {act.action === 'comment' && 'commented on'}
                            {act.action === 'delete' && 'deleted task'}
                          </span>
                        </div>
                      </div>
                    ))}
                    {activity.length === 0 && (
                      <span className="text-xs text-center text-slateMuted py-6">No workspace logs recorded.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-view: Kanban Board */}
          {activeTab === 'board' && (
            <div className="flex-1 overflow-x-auto p-8 flex gap-6 items-start h-full bg-[#FAF7F2]">
              {['todo', 'in_progress', 'in_review', 'done'].map((status) => {
                const colTasks = tasks.filter((t) => t.status === status);
                return (
                  <div key={status} className="w-72 shrink-0 flex flex-col max-h-full glass-panel p-4 rounded-3xl border border-pastel-lilac/20 bg-background/45">
                    <div className="flex items-center justify-between mb-4 border-b border-pastel-lilac/10 pb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-graphite flex items-center gap-1.5">
                        <div className={`w-2.5 h-2.5 rounded-full ${
                          status === 'todo' ? 'bg-pastel-peach' :
                          status === 'in_progress' ? 'bg-pastel-sky' :
                          status === 'in_review' ? 'bg-pastel-lilac' : 'bg-pastel-mint'
                        }`} />
                        {status === 'in_progress' ? 'In Progress' : status === 'in_review' ? 'In Review' : status}
                      </span>
                      <span className="text-xs bg-black/5 text-graphite font-bold px-2 py-0.5 rounded-full">{colTasks.length}</span>
                    </div>

                    <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
                      {colTasks.map((t) => (
                        <div
                          key={t._id}
                          onClick={() => handleOpenTaskDetails(t)}
                          className="glass-card p-4 rounded-2xl shadow-sm hover:shadow-md border border-pastel-lilac/15 flex flex-col gap-2 cursor-pointer transition-smooth bg-background-cream/80"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slateMuted">{t.key}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded border capitalize ${getPriorityColor(t.priority)}`}>{t.priority}</span>
                          </div>
                          <span className="font-semibold text-xs text-charcoal">{t.title}</span>
                          {t.assignees && t.assignees.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-pastel-lilac/10">
                              <div className="w-5 h-5 rounded-full bg-pastel-lilac flex items-center justify-center text-[9px] font-bold text-charcoal">
                                {t.assignees[0].name.slice(0, 2).toUpperCase()}
                              </div>
                              <span className="text-[10px] text-slateMuted truncate">{t.assignees[0].name}</span>
                            </div>
                          )}
                        </div>
                      ))}
                      {colTasks.length === 0 && (
                        <span className="text-xs text-center text-slateMuted/60 py-10">Empty column</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Sub-view: Roadmap View */}
          {activeTab === 'roadmap' && (
            <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 max-w-4xl mx-auto w-full">
              <div className="flex items-center justify-between border-b border-pastel-lilac/15 pb-4">
                <div>
                  <h3 className="font-outfit font-extrabold text-xl">Project Roadmap timelines</h3>
                  <p className="text-xs text-slateMuted">Overview of workspace goals, milestones, and project horizons</p>
                </div>
                <button 
                  onClick={() => setShowProjModal(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold bg-charcoal text-background px-3.5 py-2 rounded-xl shadow-sm transition-smooth"
                >
                  <Plus className="w-4 h-4" />
                  Add Project
                </button>
              </div>

              <div className="flex flex-col gap-6">
                {projects.map((p) => {
                  const projTasks = tasks.filter((t) => t.projectId?._id === p._id);
                  const completed = projTasks.filter((t) => t.status === 'done').length;
                  const rate = projTasks.length > 0 ? Math.round((completed / projTasks.length) * 100) : 0;
                  
                  return (
                    <div key={p._id} className="glass-panel p-6 rounded-3xl border border-pastel-lilac/25 shadow-sm flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-bold text-slateMuted uppercase tracking-wider">{p.key}</span>
                          <h4 className="font-outfit font-bold text-base text-charcoal">{p.name}</h4>
                        </div>
                        <span className="text-[10px] capitalize px-2 py-0.5 rounded bg-pastel-mint border border-pastel-mint/30 font-semibold">{p.status}</span>
                      </div>

                      <div className="flex flex-col gap-1.5 text-xs text-graphite">
                        <div className="flex justify-between">
                          <span>Completion rate:</span>
                          <span className="font-bold">{rate}% ({completed}/{projTasks.length} tasks)</span>
                        </div>
                        <div className="h-2 w-full bg-pastel-lilac/25 rounded-full overflow-hidden">
                          <div className="h-full bg-pastel-lilac rounded-full" style={{ width: `${rate}%` }} />
                        </div>
                      </div>

                      <div className="flex items-center gap-6 mt-2 pt-2 border-t border-pastel-lilac/10 text-xs text-slateMuted">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          <span>Timeline: Dec 2025 - Mar 2026</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4" />
                          <span>Team: {p.teamId?.name || 'Workspace general'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sub-view: Flagship dependency graph (React Flow) */}
          {activeTab === 'graph' && activeWorkspace && (
            <div className="flex-1 p-8 h-full flex flex-col">
              <DependencyGraph 
                tasks={tasks} 
                onRefresh={fetchWorkspaceData} 
              />
            </div>
          )}

          {/* Sub-view: Sprint analytics dashboard (Recharts) */}
          {activeTab === 'analytics' && activeWorkspace && (
            <AnalyticsView workspaceId={activeWorkspace._id} />
          )}

          {/* Sub-view: Documentation portal */}
          {activeTab === 'docs' && (
            <DocsView />
          )}

        </div>
      </main>

      {/* MODAL: Create Project */}
      {showProjModal && (
        <div className="fixed inset-0 bg-black/35 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="w-full max-w-md glass-panel p-8 rounded-3xl shadow-xl border border-pastel-lilac/30">
            <h3 className="font-outfit font-extrabold text-lg mb-6">Create New Project</h3>
            <form onSubmit={handleCreateProject} className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-graphite">Project Name</label>
                <input 
                  type="text" 
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  placeholder="E.g., Mobile Redesign" 
                  className="w-full px-4 py-3 rounded-xl border border-pastel-lilac/30 bg-background-cream focus:outline-none focus:border-pastel-lilac text-sm"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-graphite">Project Key</label>
                <input 
                  type="text" 
                  value={newProjKey}
                  onChange={(e) => setNewProjKey(e.target.value)}
                  placeholder="E.g., MOB (used to prefix task keys)" 
                  className="w-full px-4 py-3 rounded-xl border border-pastel-lilac/30 bg-background-cream focus:outline-none focus:border-pastel-lilac text-sm"
                  maxLength={5}
                  required
                />
              </div>

              <div className="flex gap-4 mt-4">
                <button 
                  type="button" 
                  onClick={() => setShowProjModal(false)}
                  className="flex-1 py-3 border border-pastel-lilac/30 rounded-xl hover:bg-pastel-lilac/10 font-bold transition-smooth"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-charcoal text-background rounded-xl font-bold transition-smooth"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Create Task */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/35 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="w-full max-w-lg glass-panel p-8 rounded-3xl shadow-xl border border-pastel-lilac/30">
            <h3 className="font-outfit font-extrabold text-lg mb-6">Create New Task</h3>
            <form onSubmit={handleCreateTask} className="flex flex-col gap-4 text-xs">
              
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-graphite">Task Title</label>
                <input 
                  type="text" 
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Task summary" 
                  className="w-full px-4 py-3 rounded-xl border border-pastel-lilac/30 bg-background-cream focus:outline-none focus:border-pastel-lilac text-sm"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-graphite">Description</label>
                <textarea 
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="Details of the task" 
                  className="w-full px-4 py-3 rounded-xl border border-pastel-lilac/30 bg-background-cream focus:outline-none focus:border-pastel-lilac text-sm min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-graphite">Project</label>
                  <select 
                    value={newTaskProj}
                    onChange={(e) => setNewTaskProj(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-pastel-lilac/30 bg-background-cream focus:outline-none text-xs"
                    required
                  >
                    {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-graphite">Assignee</label>
                  <select 
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-pastel-lilac/30 bg-background-cream focus:outline-none text-xs"
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => <option key={m.userId} value={m.userId}>{m.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-graphite">Priority</label>
                  <select 
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-pastel-lilac/30 bg-background-cream focus:outline-none text-xs"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-graphite">Type</label>
                  <select 
                    value={newTaskType}
                    onChange={(e) => setNewTaskType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-pastel-lilac/30 bg-background-cream focus:outline-none text-xs"
                  >
                    <option value="task">Task</option>
                    <option value="bug">Bug</option>
                    <option value="feature">Feature</option>
                    <option value="epic">Epic</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-graphite">Story Points</label>
                  <input 
                    type="number" 
                    value={newTaskPoints}
                    onChange={(e) => setNewTaskPoints(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 rounded-xl border border-pastel-lilac/30 bg-background-cream focus:outline-none focus:border-pastel-lilac text-xs"
                    min={0}
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-4">
                <button 
                  type="button" 
                  onClick={() => setShowTaskModal(false)}
                  className="flex-1 py-3 border border-pastel-lilac/30 rounded-xl hover:bg-pastel-lilac/10 font-bold transition-smooth"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-charcoal text-background rounded-xl font-bold transition-smooth"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OVERLAY: Task Details and Live Commentary */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-[500px] h-full bg-[#FAF7F2] border-l border-pastel-lilac/25 shadow-2xl flex flex-col p-8 overflow-hidden relative">
            <button 
              onClick={handleCloseTaskDetails}
              className="absolute top-6 left-6 text-xs font-semibold text-slateMuted hover:text-charcoal transition-smooth"
            >
              Close
            </button>

            {/* Task header info */}
            <div className="mt-8 flex flex-col gap-2 shrink-0">
              <span className="text-[10px] font-bold text-slateMuted tracking-wider">{selectedTask.key}</span>
              <h3 className="font-outfit font-extrabold text-xl text-charcoal">{selectedTask.title}</h3>
              
              <div className="flex gap-2 items-center mt-2 flex-wrap">
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full border capitalize font-semibold ${getPriorityColor(selectedTask.priority)}`}>
                  {selectedTask.priority}
                </span>
                <span className="text-[10px] bg-pastel-lilac text-charcoal font-semibold px-2.5 py-0.5 rounded-full uppercase">
                  {selectedTask.type}
                </span>
                <span className="text-[10px] bg-black/5 text-graphite font-semibold px-2.5 py-0.5 rounded-full">
                  {selectedTask.storyPoints || 0} story points
                </span>
              </div>
            </div>

            {/* Task parameters settings */}
            <div className="grid grid-cols-2 gap-4 border-y border-pastel-lilac/15 py-4 my-6 shrink-0 text-xs text-graphite">
              <div className="flex flex-col gap-1.5">
                <span className="font-bold text-slateMuted">Status</span>
                <select
                  value={selectedTask.status}
                  onChange={(e) => handleUpdateTaskStatus(selectedTask._id, e.target.value)}
                  className="px-2 py-1.5 rounded-lg border border-pastel-lilac/30 bg-background focus:outline-none"
                >
                  <option value="todo">todo</option>
                  <option value="in_progress">in_progress</option>
                  <option value="in_review">in_review</option>
                  <option value="done">done</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="font-bold text-slateMuted">Assignee</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-6 h-6 rounded-full bg-pastel-lilac flex items-center justify-center text-[10px] font-bold text-charcoal">
                    {selectedTask.assignees && selectedTask.assignees.length > 0 
                      ? selectedTask.assignees[0].name.slice(0, 2).toUpperCase() 
                      : 'UN'}
                  </div>
                  <span className="font-semibold text-charcoal">
                    {selectedTask.assignees && selectedTask.assignees.length > 0 
                      ? selectedTask.assignees[0].name 
                      : 'Unassigned'}
                  </span>
                </div>
              </div>
            </div>

            {/* Description view */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-6 pr-1">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-slateMuted uppercase tracking-wider">Description</span>
                <p className="text-xs text-graphite leading-relaxed whitespace-pre-wrap">
                  {selectedTask.description || 'No description provided.'}
                </p>
              </div>

              {/* Threaded Commentary */}
              <div className="flex flex-col gap-3 pt-6 border-t border-pastel-lilac/15">
                <span className="text-[10px] font-bold text-slateMuted uppercase tracking-wider flex items-center justify-between">
                  <span>Task Discussion</span>
                  {Object.keys(typingUsers).length > 0 && (
                    <span className="text-[9px] text-pastel-lilac font-semibold animate-pulse italic">
                      {Object.values(typingUsers).join(', ')} typing...
                    </span>
                  )}
                </span>
                
                {/* Comments listing */}
                <div className="flex flex-col gap-3 max-h-48 overflow-y-auto pr-1">
                  {comments.map((c) => (
                    <div key={c._id} className="p-3 rounded-xl bg-background-bone/45 border border-pastel-lilac/10 text-xs flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-pastel-lilac shrink-0 flex items-center justify-center text-[10px] font-bold text-charcoal">
                        {c.userId?.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-charcoal">{c.userId?.name}</span>
                        <p className="text-graphite">{c.content}</p>
                      </div>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <span className="text-[11px] text-slateMuted py-4 text-center">No comments posted yet.</span>
                  )}
                </div>

                {/* Comment box */}
                <form onSubmit={handleSendComment} className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => {
                      setCommentText(e.target.value);
                      sendTyping(selectedTask._id, e.target.value.length > 0);
                    }}
                    placeholder="Ask a question or mention someone with @..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-pastel-lilac/30 bg-background text-xs focus:outline-none focus:border-pastel-lilac"
                  />
                  <button type="submit" className="p-2.5 bg-charcoal text-background rounded-xl hover:bg-charcoal/90 transition-smooth">
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
