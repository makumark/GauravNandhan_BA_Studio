"use client";

import { useState, useEffect } from "react";
import { LayoutDashboard, CheckCircle2, Clock, PlayCircle, ShieldAlert, XCircle, MessageSquare, AlertCircle } from "lucide-react";

export function KanbanBoard({ projectId }: { projectId: string }) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [feedback, setFeedback] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const [isSprintPlanningOpen, setIsSprintPlanningOpen] = useState(false);
  const [developers, setDevelopers] = useState<any[]>([]);
  const [planningTasks, setPlanningTasks] = useState<any[]>([]);
  const [isSavingPlan, setIsSavingPlan] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchTasks();
      fetchDevelopers();
    }
  }, [projectId]);

  const fetchDevelopers = async () => {
    try {
      const res = await fetch('/api/organization/developers');
      if (res.ok) setDevelopers(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tasks?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenSprintPlanning = () => {
    setIsSprintPlanningOpen(true);
    setPlanningTasks(tasks.filter(t => t.status === "TODO").map(t => ({
      taskId: t.id,
      assigneeId: t.assigneeId || "",
      storyPoints: t.storyPoints || 0,
      priority: t.priority || "MEDIUM",
      title: t.title
    })));
  };

  const updatePlanningTask = (taskId: string, field: string, value: any) => {
    setPlanningTasks(prev => prev.map(t => t.taskId === taskId ? { ...t, [field]: value } : t));
  };

  const handleSaveSprintPlan = async () => {
    setIsSavingPlan(true);
    try {
      const res = await fetch('/api/sprints/plan', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: planningTasks })
      });
      if (res.ok) {
        setIsSprintPlanningOpen(false);
        fetchTasks();
      } else {
        alert("Failed to save sprint plan");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving sprint plan");
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleUpdateStatus = async (taskId: string, status: string) => {
    setIsUpdating(true);
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));

    try {
      const res = await fetch(`/api/tasks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, status, feedback: status === "NEEDS_REVISION" ? feedback : undefined })
      });
      if (res.ok) {
        setSelectedTask(null);
        setFeedback("");
        // No need to fetch again immediately if optimistic update worked, but good for sync
        fetchTasks();
      } else {
        // Revert on failure
        fetchTasks();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const columns = [
    { id: "TODO", title: "To Do", icon: Clock, color: "text-slate-400" },
    { id: "IN_PROGRESS", title: "In Progress", icon: PlayCircle, color: "text-blue-400" },
    { id: "REVIEW", title: "In Review", icon: ShieldAlert, color: "text-amber-400" },
    { id: "NEEDS_REVISION", title: "Needs Revision", icon: XCircle, color: "text-red-400" },
    { id: "DONE", title: "Done", icon: CheckCircle2, color: "text-green-400" },
  ];

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading project board...</div>;
  }

  return (
    <div className="h-full flex flex-col bg-[#0f172a] text-slate-200 p-6 overflow-hidden relative">
      
      {/* Feedback Modal */}
      {selectedTask && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Review Task: {selectedTask.title}</h3>
            <p className="text-sm text-slate-400 mb-6">Review the AI-generated document linked to this task. If it needs rework, provide feedback for the BA.</p>
            
            <textarea
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 focus:outline-none focus:border-red-500/50 min-h-[120px] mb-6"
              placeholder="E.g., The payment gateway edge cases are missing from the FRD..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => { setSelectedTask(null); setFeedback(""); }}
                className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-colors"
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button 
                onClick={() => handleUpdateStatus(selectedTask.id, "NEEDS_REVISION")}
                disabled={isUpdating || !feedback.trim()}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
              >
                {isUpdating ? "Updating..." : "Reject & Request Revision"}
              </button>
              <button 
                onClick={() => handleUpdateStatus(selectedTask.id, "DONE")}
                disabled={isUpdating}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50"
              >
                {isUpdating ? "Updating..." : "Approve & Sync"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sprint Planning Modal */}
      {isSprintPlanningOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl p-6 shadow-2xl flex flex-col max-h-[80vh]">
            <h3 className="text-xl font-bold text-white mb-2">Smart Sprint Planning</h3>
            <p className="text-sm text-slate-400 mb-6">Review AI-estimated Story Points and Priorities, assign developers, and start the sprint.</p>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
              {planningTasks.length === 0 ? (
                <div className="text-slate-500 text-center py-8">No tasks in TODO list.</div>
              ) : (
                planningTasks.map(pt => (
                  <div key={pt.taskId} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{pt.title}</p>
                    </div>
                    
                    <select 
                      value={pt.priority} 
                      onChange={(e) => updatePlanningTask(pt.taskId, 'priority', e.target.value)}
                      className={`bg-slate-900 border rounded-lg px-3 py-1.5 text-xs font-bold outline-none ${pt.priority === 'HIGH' ? 'border-red-500/50 text-red-400' : pt.priority === 'MEDIUM' ? 'border-yellow-500/50 text-yellow-400' : 'border-slate-700 text-slate-400'}`}
                    >
                      <option value="HIGH">High Priority</option>
                      <option value="MEDIUM">Med Priority</option>
                      <option value="LOW">Low Priority</option>
                    </select>

                    <select
                      value={pt.storyPoints}
                      onChange={(e) => updatePlanningTask(pt.taskId, 'storyPoints', parseInt(e.target.value))}
                      className="bg-slate-900 border border-blue-500/30 rounded-lg px-3 py-1.5 text-xs font-bold text-blue-400 outline-none w-24"
                    >
                      <option value={0}>0 pts</option>
                      <option value={1}>1 pt</option>
                      <option value={2}>2 pts</option>
                      <option value={3}>3 pts</option>
                      <option value={5}>5 pts</option>
                      <option value={8}>8 pts</option>
                      <option value={13}>13 pts</option>
                      <option value={21}>21 pts</option>
                    </select>

                    <select
                      value={pt.assigneeId}
                      onChange={(e) => updatePlanningTask(pt.taskId, 'assigneeId', e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 outline-none w-40"
                    >
                      <option value="">Unassigned</option>
                      {developers.map(d => (
                        <option key={d.id} value={d.id}>{d.name || d.email}</option>
                      ))}
                    </select>
                  </div>
                ))
              )}
            </div>
            
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800">
              <div className="text-sm text-slate-400">
                Total Estimated Sprint Effort: <span className="font-bold text-blue-400">{planningTasks.reduce((acc, t) => acc + (t.storyPoints || 0), 0)} pts</span>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsSprintPlanningOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-colors"
                  disabled={isSavingPlan}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveSprintPlan}
                  disabled={isSavingPlan || planningTasks.length === 0}
                  className="px-6 py-2 rounded-lg text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50"
                >
                  {isSavingPlan ? "Saving..." : "Save Sprint Plan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <LayoutDashboard className="w-6 h-6 text-blue-500" />
          Native Kanban Board
        </h2>
        <div className="flex gap-2">
          <button onClick={handleOpenSprintPlanning} className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm transition-colors border border-slate-700">
            Sprint Planning
          </button>
          <button className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
            New Task
          </button>
        </div>
      </div>

      <div className="flex gap-6 h-full overflow-x-auto pb-4 custom-scrollbar">
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          return (
            <div key={col.id} className="min-w-[300px] w-[300px] bg-slate-900/50 border border-slate-800 rounded-xl flex flex-col">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold">
                  <col.icon className={`w-4 h-4 ${col.color}`} />
                  {col.title}
                </div>
                <span className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded-full">
                  {colTasks.length}
                </span>
              </div>
              
              <div 
                className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar"
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-slate-800/30'); }}
                onDragLeave={(e) => { e.currentTarget.classList.remove('bg-slate-800/30'); }}
                onDrop={(e) => { 
                  e.preventDefault(); 
                  e.currentTarget.classList.remove('bg-slate-800/30');
                  const taskId = e.dataTransfer.getData('taskId'); 
                  if (taskId) handleUpdateStatus(taskId, col.id); 
                }}
              >
                {colTasks.length === 0 ? (
                  <div className="text-center p-4 text-xs text-slate-600 border border-dashed border-slate-800 rounded-lg">
                    Drop tasks here
                  </div>
                ) : (
                  colTasks.map(task => (
                    <div 
                      key={task.id} 
                      draggable
                      onDragStart={(e) => { e.dataTransfer.setData('taskId', task.id); }}
                      onClick={() => setSelectedTask(task)}
                      className="bg-slate-800 border border-slate-700 p-4 rounded-lg shadow-sm hover:border-blue-500/50 cursor-grab active:cursor-grabbing transition-colors group"
                    >
                      <div className="text-sm font-medium text-slate-200 mb-2">{task.title}</div>
                      {task.description && (
                        <div className="text-xs text-slate-400 mb-3 line-clamp-2">{task.description}</div>
                      )}
                      {task.comments && task.comments.length > 0 && (
                        <div className="text-[10px] text-amber-400 flex items-center gap-1 mb-3 bg-amber-500/10 px-2 py-1 rounded w-fit border border-amber-500/20">
                          <MessageSquare className="w-3 h-3" />
                          Has Feedback
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-2">
                          {task.assigneeId ? (
                            <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-bold border border-blue-500/30" title="Assigned Developer">
                              {developers.find(d => d.id === task.assigneeId)?.name?.charAt(0) || 'D'}
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-500 border border-slate-700 px-2 py-1 rounded-full">Unassigned</div>
                          )}
                          {task.priority && (
                            <div className={`w-2 h-2 rounded-full ${task.priority === 'HIGH' ? 'bg-red-500' : task.priority === 'MEDIUM' ? 'bg-yellow-500' : 'bg-slate-600'}`} title={`${task.priority} Priority`} />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {typeof task.storyPoints === 'number' && task.storyPoints > 0 && (
                            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded border border-indigo-500/20 font-bold">
                              {task.storyPoints} pts
                            </span>
                          )}
                          {task.jiraIssueId && (
                            <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20">
                              {task.jiraIssueId}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
